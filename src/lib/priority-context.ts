import type { Analysis, Job, PriorityLabel, SearchSettings } from './types';
import type { NetworkContact } from './network';
import { networkOpportunity } from './network';
import { daysOld, normalizeText } from './utils';

function freshness(job: Job): number {
  const age = daysOld(job.employerDatePosted || job.datePosted);
  if (age <= 1) return 100;
  if (age <= 3) return 85;
  if (age <= 7) return 65;
  if (age <= 14) return 35;
  return 10;
}

function competitiveness(value: Analysis['resumeCompetitiveness']): number {
  if (value === 'HIGHLY_COMPETITIVE') return 100;
  if (value === 'COMPETITIVE') return 85;
  if (value === 'POSSIBLE') return 60;
  if (value === 'WEAK') return 30;
  return 0;
}

function employerDesirability(company: string, settings: SearchSettings): number {
  const companyKey = normalizeText(company);
  const isTarget = (settings.targetCompanies ?? []).some(target => {
    const targetKey = normalizeText(target);
    return targetKey === companyKey || targetKey.includes(companyKey) || companyKey.includes(targetKey);
  });
  return isTarget ? 100 : 50;
}

function recommendation(priority: number, fit: number, disqualified: boolean): PriorityLabel {
  if (disqualified || fit < 70) return 'SKIP';
  if (fit < 80) return 'STRETCH';
  if (priority >= 85 && fit >= 85) return 'APPLY_NOW';
  if (priority >= 75) return 'HIGH_PRIORITY';
  if (priority >= 60) return 'REVIEW';
  return 'STRETCH';
}

export function applyApplicationPriority(analysis: Analysis, job: Job, settings: SearchSettings, contacts: NetworkContact[]): Analysis {
  const network = networkOpportunity(job.company, contacts);
  const score = Math.round(Math.max(0, Math.min(100,
    analysis.overallFitScore * 0.50 +
    freshness(job) * 0.20 +
    analysis.compensationFit * 0.10 +
    competitiveness(analysis.resumeCompetitiveness) * 0.10 +
    employerDesirability(job.company, settings) * 0.05 +
    network.score * 0.05
  )));
  return {
    ...analysis,
    priorityScore: score,
    priorityRecommendation: recommendation(score, analysis.overallFitScore, Boolean(analysis.disqualified)),
  };
}
