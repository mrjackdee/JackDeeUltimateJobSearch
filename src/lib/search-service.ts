import 'server-only';
import { nanoid } from 'nanoid';
import { discoverAll, verifyListing } from './job-sources';
import { deterministicAnalysis, passesHardFilters } from './scoring';
import { interpretAnalysis } from './ai';
import { getState, updateState } from './storage/state';
import type { Analysis, Job, SearchRun } from './types';
import { daysOld, fingerprint, normalizeText } from './utils';

function semanticKey(job: Job) {
  return `${normalizeText(job.company)}|${normalizeText(job.title)}|${normalizeText(job.location)}`;
}

function chooseCanonical(a: Job, b: Job): Job {
  const employerish = (j: Job) => /workday|greenhouse|lever|careers|jobs\./i.test(j.applicationUrl) ? 2 : /serpapi/i.test(j.source) ? 1 : 0;
  return employerish(b) > employerish(a) ? b : a;
}

export async function runSearch(trigger: SearchRun['trigger']): Promise<SearchRun> {
  const run: SearchRun = { id: nanoid(), startedAt: new Date().toISOString(), trigger, discovered: 0, qualified: 0, excluded: 0, inactive: 0, duplicates: 0, errors: [] };
  const { jobs: discovered, errors } = await discoverAll();
  run.errors.push(...errors);
  run.discovered = discovered.length;

  const state = await getState();
  const existingByFingerprint = new Map(state.jobs.map(j => [j.duplicateFingerprint, j]));
  const existingBySemantic = new Map(state.jobs.map(j => [semanticKey(j), j]));
  const candidateMap = new Map<string, Job>();

  for (const raw of discovered) {
    if (daysOld(raw.datePosted) > state.settings.lookbackDays && raw.datePosted) { run.excluded++; continue; }
    const job = { ...raw, duplicateFingerprint: raw.duplicateFingerprint || fingerprint([raw.company, raw.title, raw.location, raw.externalId]) };
    const existing = existingByFingerprint.get(job.duplicateFingerprint);
    if (existing) { run.duplicates++; continue; }
    const semanticExisting = existingBySemantic.get(semanticKey(job));
    if (semanticExisting && semanticExisting.active) { run.duplicates++; continue; }
    if (semanticExisting && !semanticExisting.active && semanticExisting.externalId !== job.externalId) job.repost = true;
    const key = semanticKey(job);
    const current = candidateMap.get(key);
    if (current) { candidateMap.set(key, chooseCanonical(current, job)); run.duplicates++; }
    else candidateMap.set(key, job);
  }

  const hardFiltered: Job[] = [];
  for (const job of candidateMap.values()) {
    const hard = passesHardFilters(job, state.settings.salaryFloor, state.settings.radiusMiles);
    // Defer active verification, but enforce all other hard constraints.
    const nonActiveReasons = hard.reasons.filter(r => r !== 'Listing is inactive');
    if (nonActiveReasons.length) { run.excluded++; continue; }
    hardFiltered.push(job);
  }

  const verified: Job[] = [];
  const batchSize = 6;
  for (let i = 0; i < hardFiltered.length; i += batchSize) {
    const batch = await Promise.all(hardFiltered.slice(i, i + batchSize).map(verifyListing));
    for (const job of batch) {
      if (job.verificationStatus === 'INACTIVE') { run.inactive++; continue; }
      verified.push(job);
    }
  }

  const analyses: Analysis[] = [];
  if (state.careerProfile) {
    for (const job of verified) {
      let analysis = deterministicAnalysis(job, state.careerProfile);
      if (analysis.overallFitScore >= state.settings.fitThreshold) {
        try { analysis = await interpretAnalysis(job, state.careerProfile, analysis); } catch (error) { run.errors.push(`AI interpretation ${job.company}/${job.title}: ${error instanceof Error ? error.message : 'failed'}`); }
        analyses.push(analysis);
        run.qualified++;
      } else {
        run.excluded++;
      }
    }
  } else {
    run.errors.push('Career Evidence Profile is not configured; jobs were discovered but cannot be fit-ranked yet.');
  }

  run.completedAt = new Date().toISOString();
  await updateState(current => {
    current.jobs.push(...verified);
    current.analyses.push(...analyses);
    current.searchRuns.unshift(run);
    current.searchRuns = current.searchRuns.slice(0, 100);
  });
  return run;
}
