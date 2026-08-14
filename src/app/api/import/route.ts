import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { nanoid } from 'nanoid';
import { fingerprint, parseSalary } from '@/lib/utils';
import type { Job, SearchLane, WorkArrangement } from '@/lib/types';
import { enrichAndVerifyListing } from '@/lib/listing-enrichment';
import { basicEligibility, evidenceBasedAnalysis, validateHighScore } from '@/lib/ai/matching';
import { specializedDomainMismatch } from '@/lib/domain-guard';
import { applyApplicationPriority } from '@/lib/priority-context';
import { contactsFromState } from '@/lib/network';
import { getState, updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';

function arrangement(text: string): WorkArrangement {
  const t = text.toLowerCase();
  if (t.includes('hybrid')) return 'HYBRID';
  if (t.includes('remote')) return 'REMOTE';
  if (/on[- ]?site|in[- ]?office/.test(t)) return 'ONSITE';
  return 'UNKNOWN';
}

function lane(title: string): SearchLane {
  const t = title.toLowerCase();
  if (/scrum|agile/.test(t)) return 'AGILE';
  if (/product owner/.test(t)) return 'PRODUCT';
  if (/director|principal|senior director|transformation/.test(t)) return 'EXECUTIVE';
  return 'PROGRAM_PROJECT';
}

function parseJobPosting(html: string, url: string): Partial<Job> {
  const $ = cheerio.load(html);
  let data: any;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const list = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
      data = list.find((x: any) => x?.['@type'] === 'JobPosting') ?? data;
    } catch { /* ignore unreadable embedded job data */ }
  });
  const title = String(data?.title ?? $('h1').first().text() ?? '').trim();
  const company = String(data?.hiringOrganization?.name ?? $('meta[property="og:site_name"]').attr('content') ?? '').trim();
  const descHtml = String(data?.description ?? $('main').text() ?? $('body').text());
  const description = cheerio.load(descHtml).text().replace(/\s+/g, ' ').trim();
  const location = data?.jobLocation?.address ? [data.jobLocation.address.addressLocality, data.jobLocation.address.addressRegion].filter(Boolean).join(', ') : String(data?.applicantLocationRequirements?.name ?? '');
  const salaryText = JSON.stringify(data?.baseSalary ?? '') + ' ' + description;
  const salary = parseSalary(salaryText);
  const emp = String(data?.employmentType ?? '').toLowerCase();
  return {
    title,
    company,
    applicationUrl: url,
    sourceUrl: url,
    description,
    descriptionCompleteness: description.length >= 3000 ? 'FULL' : description.length >= 1200 ? 'MOSTLY_COMPLETE' : 'PARTIAL',
    location: location || (arrangement(description) === 'REMOTE' ? 'Remote' : 'Unknown'),
    workArrangement: arrangement(`${location} ${description}`),
    employmentType: /full/.test(emp) || /full[- ]?time/.test(description.toLowerCase()) ? 'FULL_TIME' : /contract/.test(emp) ? 'CONTRACT' : 'UNKNOWN',
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.min || salary.max ? 'USD' : undefined,
    datePosted: data?.datePosted ? String(data.datePosted) : undefined,
    employerDatePosted: data?.datePosted ? String(data.datePosted) : undefined,
    externalId: data?.identifier?.value ? String(data.identifier.value) : undefined,
    requisitionNumber: data?.identifier?.value ? String(data.identifier.value) : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let partial: Partial<Job> = {};
    let source = 'Added manually';
    if (body.url) {
      const res = await fetch(String(body.url), { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 JackDeeJobSearch/1.0' }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error('The employer page could not be opened. Paste the job details into the form and try again.');
      partial = parseJobPosting(await res.text(), String(body.url));
      source = new URL(String(body.url)).hostname;
    }
    partial = { ...partial, ...Object.fromEntries(Object.entries({ title: body.title, company: body.company, description: body.description, location: body.location, applicationUrl: body.url }).filter(([,v]) => v)) };
    if (!partial.title || !partial.company || !partial.description || !partial.applicationUrl) throw new Error('The app still needs the job title, company, job description, and employer link. Add the missing details and try again.');
    const job: Job = {
      id: nanoid(), title: partial.title, company: partial.company, applicationUrl: partial.applicationUrl,
      sourceUrl: partial.sourceUrl ?? partial.applicationUrl, description: partial.description,
      descriptionCompleteness: partial.descriptionCompleteness ?? (partial.description.length >= 3000 ? 'FULL' : partial.description.length >= 1200 ? 'MOSTLY_COMPLETE' : 'PARTIAL'),
      location: partial.location ?? 'Unknown',
      workArrangement: partial.workArrangement ?? arrangement(`${partial.location ?? ''} ${partial.description}`),
      employmentType: partial.employmentType ?? 'UNKNOWN', salaryMin: partial.salaryMin, salaryMax: partial.salaryMax, salaryCurrency: partial.salaryCurrency,
      datePosted: partial.datePosted, employerDatePosted: partial.employerDatePosted, dateDiscovered: new Date().toISOString(), externalId: partial.externalId,
      requisitionNumber: partial.requisitionNumber, source,
      searchLane: lane(partial.title), verificationStatus: 'STATUS_UNCERTAIN', repost: false, resultStatus: 'NEW',
      duplicateFingerprint: fingerprint([partial.company, partial.title, partial.location, partial.externalId, partial.requisitionNumber, partial.applicationUrl]), active: true,
    };
    const verified = await enrichAndVerifyListing(job);
    const state = await getState();
    const eligibility = basicEligibility(verified, state.settings);
    if (!eligibility.pass) return NextResponse.json({ job: verified, excluded: true, reasons: eligibility.reasons });
    if (!state.careerProfile) return NextResponse.json({ job: verified, excluded: true, reasons: ['Your Career Profile needs to be refreshed before this job can be scored.'] });

    const domainGuard = specializedDomainMismatch(verified, state.careerProfile);
    if (domainGuard.mismatch) return NextResponse.json({ job: verified, excluded: true, reasons: domainGuard.reasons });

    let analysis = await evidenceBasedAnalysis(verified, state.careerProfile, state.settings);
    analysis = await validateHighScore(verified, state.careerProfile, analysis);
    analysis = applyApplicationPriority(analysis, verified, state.settings, contactsFromState(state));
    const qualifies = !analysis.disqualified && (analysis.overallFitScore >= state.settings.fitThreshold || (state.settings.showStretchRoles && analysis.overallFitScore >= 70));

    await updateState(current => {
      if (!current.jobs.some(j => j.duplicateFingerprint === verified.duplicateFingerprint)) current.jobs.push(verified);
      current.analyses.push(analysis);
      current.searchRuns.unshift({ id: nanoid(), startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), trigger: 'IMPORT', discovered: 1, qualified: qualifies ? 1 : 0, excluded: qualifies ? 0 : 1, inactive: 0, duplicates: 0, errors: [] });
    });

    if (!qualifies) return NextResponse.json({ job: verified, analysis, excluded: true, reasons: analysis.disqualificationReasons?.length ? analysis.disqualificationReasons : analysis.gaps });
    return NextResponse.json({ job: verified, analysis });
  } catch (error) {
    const userMessage = plainUserError('The job could not be added right now. Check the employer link and any information you entered, then try again.', error);
    await logAppIssue({ area: 'Add a job', action: 'Add and review a job posting', severity: 'ERROR', userMessage, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: '/api/import', statusCode: 500, resolved: false });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
