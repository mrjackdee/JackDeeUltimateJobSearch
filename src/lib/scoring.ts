import type { Analysis, CareerEvidenceProfile, Job, QualificationBreakdown, PriorityLabel } from './types';
import { clamp, daysOld, normalizeText, unique } from './utils';
import { inferMetro, remoteEligibleForGeorgiaOrTexas } from './geo';
import { nanoid } from 'nanoid';

const stop = new Set('a an the and or for of to in on with by from as at is are be this that will you your our we us they their have has required preferred minimum years year experience role position work team teams ability skills including across using'.split(' '));

function tokens(text: string): string[] {
  return unique(normalizeText(text).split(' ').filter(w => w.length > 2 && !stop.has(w)));
}

function overlapScore(jobText: string, evidenceText: string): { score: number; hits: string[]; misses: string[] } {
  const j = tokens(jobText);
  const e = new Set(tokens(evidenceText));
  const hits = j.filter(t => e.has(t));
  const score = j.length ? hits.length / j.length : 0;
  return { score, hits: hits.slice(0, 50), misses: j.filter(t => !e.has(t)).slice(0, 30) };
}

export function passesHardFilters(job: Job, salaryFloor: number, radiusMiles: number): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (job.employmentType !== 'FULL_TIME') reasons.push('Not confirmed full-time permanent employment');
  if (job.salaryMax && job.salaryMax < salaryFloor) reasons.push(`Disclosed compensation is below $${salaryFloor.toLocaleString()}`);
  if (job.salaryMin && !job.salaryMax && job.salaryMin < salaryFloor) reasons.push(`Disclosed compensation is below $${salaryFloor.toLocaleString()}`);

  const combined = `${job.location} ${job.description}`;
  if (job.workArrangement === 'REMOTE') {
    if (!remoteEligibleForGeorgiaOrTexas(combined)) reasons.push('Remote eligibility excludes both Georgia and Texas');
  } else {
    const metro = inferMetro(job.location, radiusMiles);
    if (!metro) reasons.push(`On-site/hybrid location is outside the ${radiusMiles}-mile Atlanta/Dallas target area`);
  }
  if (!job.active || job.verificationStatus === 'INACTIVE') reasons.push('Listing is inactive');
  return { pass: reasons.length === 0, reasons };
}

function recencyPoints(job: Job): number {
  const d = daysOld(job.datePosted);
  if (d <= 1) return 5;
  if (d <= 2) return 4;
  if (d <= 3) return 3;
  if (d <= 7) return 2;
  return 0;
}

function priorityLabel(score: number, overqualificationRisk: 'LOW' | 'MEDIUM' | 'HIGH', lane: Job['searchLane']): PriorityLabel {
  if (score >= 95 && overqualificationRisk !== 'HIGH') return 'APPLY_NOW';
  if (score >= 90) return 'HIGH_PRIORITY';
  if (lane === 'PROGRAM_PROJECT' && score >= 82) return 'BRIDGE_ROLE';
  if (score >= 85) return 'STRATEGIC';
  if (score >= 80) return 'STRETCH';
  return 'SKIP';
}

export function deterministicAnalysis(job: Job, profile: CareerEvidenceProfile): Analysis {
  const evidenceText = [profile.headline, ...profile.skills, ...profile.technologies, ...profile.certifications, ...profile.education, ...profile.domains, ...profile.leadershipSignals, ...profile.accomplishments, ...profile.evidence.map(e => `${e.label} ${e.detail}`)].join(' ');
  const desc = overlapScore(job.description, evidenceText);
  const title = overlapScore(job.title, evidenceText);
  const required = clamp((desc.score * 0.8 + title.score * 0.2) * 100);
  const responsibility = clamp(desc.score * 100);
  const leadershipTerms = /director|executive|portfolio|global|stakeholder|governance|leadership|strategy|transformation/gi;
  const leadershipMatches = (job.description.match(leadershipTerms) || []).length;
  const profileLeadership = profile.leadershipSignals.length + profile.accomplishments.filter(a => /\$|global|stakeholder|portfolio|team|program/i.test(a)).length;
  const leadership = clamp(Math.min(100, 45 + leadershipMatches * 6 + Math.min(profileLeadership, 10) * 3));
  const technology = clamp(desc.score * 85 + (profile.technologies.length ? 10 : 0));
  const preferred = clamp(desc.score * 90);
  const locationFit = job.workArrangement === 'REMOTE' ? 100 : inferMetro(job.location, 25) ? 100 : 0;
  const compensationFit = job.salaryMin || job.salaryMax ? ((job.salaryMax ?? job.salaryMin ?? 0) >= 100000 ? 100 : 0) : 80;
  const breakdown: QualificationBreakdown = {
    requiredAlignment: Math.round(required * 0.30),
    responsibilityAlignment: Math.round(responsibility * 0.25),
    leadershipComplexity: Math.round(leadership * 0.15),
    technologyDomain: Math.round(technology * 0.10),
    preferredAlignment: Math.round(preferred * 0.05),
    locationFit: Math.round(locationFit * 0.05),
    compensationFit: Math.round(compensationFit * 0.05),
    recency: recencyPoints(job),
  };
  const overall = clamp(Object.values(breakdown).reduce((a, b) => a + b, 0));

  const yearsReq = Math.max(...[...job.description.matchAll(/(\d{1,2})\+?\s+years?/gi)].map(m => Number(m[1])), 0);
  const overqualificationRisk = profile.yearsExperience && yearsReq && profile.yearsExperience > yearsReq + 10 && /project manager|scrum master|product owner/i.test(job.title) ? 'HIGH' : profile.yearsExperience && yearsReq && profile.yearsExperience > yearsReq + 6 ? 'MEDIUM' : 'LOW';
  const underqualificationRisk = overall < 80 ? 'HIGH' : overall < 88 ? 'MEDIUM' : 'LOW';
  const ats = clamp(required * 0.34 + responsibility * 0.22 + technology * 0.14 + preferred * 0.08 + leadership * 0.08 + 14);
  const priorityScore = clamp(overall * 0.55 + ats * 0.2 + recencyPoints(job) * 4 + (job.workArrangement === 'REMOTE' ? 8 : 4) + (job.benefits?.length ? 5 : 0) - (overqualificationRisk === 'HIGH' ? 12 : overqualificationRisk === 'MEDIUM' ? 5 : 0));

  return {
    id: nanoid(),
    jobId: job.id,
    analysisDate: new Date().toISOString(),
    overallFitScore: overall,
    atsScore: ats,
    overqualificationRisk,
    underqualificationRisk,
    qualificationBreakdown: breakdown,
    keywordCoverage: desc.hits,
    missingKeywords: desc.misses,
    semanticAlignment: responsibility,
    requiredQualificationCoverage: required,
    preferredQualificationCoverage: preferred,
    technicalAlignment: technology,
    domainAlignment: technology,
    leadershipAlignment: leadership,
    educationAlignment: profile.education.length ? 95 : 50,
    certificationAlignment: profile.certifications.length ? 90 : 50,
    compensationFit,
    geographicFit: locationFit,
    strengths: desc.hits.slice(0, 8).map(k => `Documented alignment with ${k}`),
    gaps: desc.misses.slice(0, 8).map(k => `No direct evidence yet for ${k}`),
    wordingGaps: desc.misses.slice(0, 5).map(k => `Review source evidence for transferable wording related to ${k}`),
    trueExperienceGaps: [],
    hardQualificationRisks: [],
    recruiterObjections: overqualificationRisk === 'HIGH' ? ['Potential overqualification based on career level and years of experience'] : [],
    recommendedApplicationStrategy: overqualificationRisk === 'HIGH' ? 'Use execution-forward positioning and reduce unnecessary emphasis on executive scope without changing factual titles or achievements.' : 'Lead with the strongest directly supported program, project, transformation, and delivery evidence.',
    recommendedMasterResume: job.searchLane === 'AGILE' ? 'Scrum Master / Agile Master' : job.searchLane === 'PRODUCT' ? 'Product Owner Master' : job.searchLane === 'EXECUTIVE' ? 'Executive / Senior Program Management Master' : 'Technical Program Management Master',
    priorityRecommendation: priorityLabel(overall, overqualificationRisk, job.searchLane),
    priorityScore,
  };
}
