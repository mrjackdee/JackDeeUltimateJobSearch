import 'server-only';
import { nanoid } from 'nanoid';
import { discoverAll } from './job-sources';
import { enrichAndVerifyListing } from './listing-enrichment';
import { basicEligibility, evidenceBasedAnalysis, validateHighScore } from './ai/matching';
import { specializedDomainMismatch } from './domain-guard';
import { getState, updateState } from './storage/state';
import type { Analysis, Job, SearchRun } from './types';
import { daysOld, fingerprint, normalizeText } from './utils';
import { notifySearchSummary } from './notifications';
import { logAppIssue } from './issues';

function semanticKey(job: Job) {
  return `${normalizeText(job.company)}|${normalizeText(job.title)}|${normalizeText(job.location)}|${normalizeText(job.requisitionNumber ?? '')}`;
}

function descriptionSimilarity(a: string, b: string): number {
  const words = (value: string) => new Set(normalizeText(value).split(' ').filter(x => x.length > 4));
  const aa = words(a);
  const bb = words(b);
  if (!aa.size || !bb.size) return 0;
  let hits = 0;
  for (const word of aa) if (bb.has(word)) hits++;
  return hits / Math.min(aa.size, bb.size);
}

function chooseCanonical(a: Job, b: Job): Job {
  const employerish = (j: Job) => /workday|greenhouse|lever|careers|jobs\./i.test(j.applicationUrl) ? 3 : /serpapi|indeed|linkedin|ziprecruiter/i.test(j.source) ? 1 : 2;
  if (employerish(b) !== employerish(a)) return employerish(b) > employerish(a) ? b : a;
  const aLength = a.description?.length ?? 0;
  const bLength = b.description?.length ?? 0;
  return bLength > aLength ? b : a;
}

function qualifiesForDisplay(analysis: Analysis, fitThreshold: number, showStretchRoles: boolean): boolean {
  if (analysis.disqualified) return false;
  if (analysis.overallFitScore >= fitThreshold) return true;
  return Boolean(showStretchRoles && analysis.overallFitScore >= 70);
}

export async function runSearch(trigger: SearchRun['trigger']): Promise<SearchRun> {
  const run: SearchRun = { id: nanoid(), startedAt: new Date().toISOString(), trigger, discovered: 0, qualified: 0, excluded: 0, inactive: 0, duplicates: 0, errors: [] };
  const state = await getState();
  const { jobs: discovered, errors } = await discoverAll(state.settings.targetCompanies ?? []);
  run.errors.push(...errors);
  run.discovered = discovered.length;

  const existingByFingerprint = new Map(state.jobs.map(j => [j.duplicateFingerprint, j]));
  const existingBySemantic = new Map(state.jobs.map(j => [semanticKey(j), j]));
  const candidateMap = new Map<string, Job>();

  for (const raw of discovered) {
    const employerDate = raw.employerDatePosted || raw.datePosted;
    if (daysOld(employerDate) > state.settings.lookbackDays && employerDate) { run.excluded++; continue; }
    const job: Job = {
      ...raw,
      resultStatus: 'NEW',
      duplicateFingerprint: raw.duplicateFingerprint || fingerprint([raw.company, raw.title, raw.location, raw.externalId, raw.requisitionNumber]),
    };

    const existing = existingByFingerprint.get(job.duplicateFingerprint);
    if (existing) { run.duplicates++; continue; }

    const semanticExisting = existingBySemantic.get(semanticKey(job));
    if (semanticExisting && semanticExisting.active) {
      const changed = descriptionSimilarity(semanticExisting.description, job.description) < 0.82;
      if (!changed) { run.duplicates++; continue; }
      job.resultStatus = 'UPDATED';
    }
    if (semanticExisting && !semanticExisting.active && semanticExisting.externalId !== job.externalId) {
      job.repost = true;
      job.resultStatus = 'UPDATED';
    }

    const key = semanticKey(job);
    const current = candidateMap.get(key);
    if (current) {
      candidateMap.set(key, chooseCanonical(current, job));
      run.duplicates++;
      continue;
    }

    const nearDuplicate = [...candidateMap.entries()].find(([, candidate]) =>
      normalizeText(candidate.company) === normalizeText(job.company) &&
      normalizeText(candidate.title) === normalizeText(job.title) &&
      descriptionSimilarity(candidate.description, job.description) >= 0.88
    );
    if (nearDuplicate) {
      candidateMap.set(nearDuplicate[0], chooseCanonical(nearDuplicate[1], job));
      run.duplicates++;
      continue;
    }
    candidateMap.set(key, job);
  }

  const verified: Job[] = [];
  const batchSize = 5;
  const candidates = [...candidateMap.values()];
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = await Promise.all(candidates.slice(i, i + batchSize).map(enrichAndVerifyListing));
    for (const job of batch) {
      if (job.verificationStatus === 'INACTIVE' || !job.active) { run.inactive++; continue; }
      const employerDate = job.employerDatePosted || job.datePosted;
      if (employerDate && daysOld(employerDate) > state.settings.lookbackDays) { run.excluded++; continue; }
      const eligibility = basicEligibility(job, state.settings);
      if (!eligibility.pass) { run.excluded++; continue; }
      verified.push(job);
    }
  }

  const analyses: Analysis[] = [];
  if (state.careerProfile) {
    for (const job of verified) {
      try {
        const domainGuard = specializedDomainMismatch(job, state.careerProfile);
        if (domainGuard.mismatch) {
          run.excluded++;
          continue;
        }
        let analysis = await evidenceBasedAnalysis(job, state.careerProfile, state.settings);
        analysis = await validateHighScore(job, state.careerProfile, analysis);
        if (qualifiesForDisplay(analysis, state.settings.fitThreshold, Boolean(state.settings.showStretchRoles))) {
          analyses.push(analysis);
          run.qualified++;
        } else {
          run.excluded++;
        }
      } catch (error) {
        run.errors.push(`Evidence review ${job.company}/${job.title}: ${error instanceof Error ? error.message : 'failed'}`);
        run.excluded++;
      }
    }
  } else {
    run.errors.push('Career Profile is not ready; jobs were found but could not be ranked yet.');
  }

  run.completedAt = new Date().toISOString();
  await updateState(current => {
    const existingJobs = new Map(current.jobs.map(j => [j.id, j]));
    for (const job of verified) existingJobs.set(job.id, job);
    current.jobs = [...existingJobs.values()];
    current.analyses.push(...analyses);
    current.searchRuns.unshift(run);
    current.searchRuns = current.searchRuns.slice(0, 100);
  });

  if (run.errors.length) {
    await logAppIssue({
      area: trigger === 'MANUAL' ? 'Job search' : 'Scheduled search',
      action: trigger === 'MANUAL' ? 'Search for matching jobs' : 'Run an automatic job search',
      severity: 'WARNING',
      userMessage: 'The search finished, but part of the process needed attention. Some job sources or review steps may have been skipped.',
      technicalMessage: run.errors.join('\n'),
      route: trigger === 'MANUAL' ? '/api/search' : '/api/cron/search',
      resolved: false,
    });
  }

  if (state.notificationsEnabled !== false) {
    try {
      const qualifiedJobs = verified
        .filter(j => analyses.some(a => a.jobId === j.id))
        .sort((a,b) => {
          const aa = analyses.find(x=>x.jobId===a.id);
          const bb = analyses.find(x=>x.jobId===b.id);
          return (bb?.priorityScore ?? 0) - (aa?.priorityScore ?? 0) || (bb?.overallFitScore ?? 0) - (aa?.overallFitScore ?? 0);
        });
      await notifySearchSummary(run, qualifiedJobs);
    } catch (error) {
      console.warn('Search notification failed', error instanceof Error ? error.message : error);
      await logAppIssue({ area:'Email updates', action:'Send the job-search summary email', severity:'WARNING', userMessage:'The job search finished, but the summary email could not be sent.', technicalMessage:error instanceof Error ? error.stack ?? error.message : String(error), route: trigger === 'MANUAL' ? '/api/search' : '/api/cron/search', resolved:false });
    }
  }
  return run;
}
