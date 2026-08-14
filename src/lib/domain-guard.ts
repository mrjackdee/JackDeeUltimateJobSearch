import type { CareerEvidenceProfile, Job } from './types';
import { normalizeText } from './utils';

type SpecializedDomainRule = {
  label: string;
  jobSignals: RegExp[];
  evidenceSignals: RegExp[];
  hardSignals?: RegExp[];
};

const rules: SpecializedDomainRule[] = [
  {
    label: 'construction management',
    jobSignals: [/construction/i, /general contractor/i, /jobsite/i, /construction project/i],
    evidenceSignals: [/construction/i, /general contractor/i, /jobsite/i, /construction management/i],
  },
  {
    label: 'accounting / CPA expertise',
    jobSignals: [/\bcpa\b/i, /gaap/i, /public accounting/i, /accounting expertise/i, /controller/i],
    evidenceSignals: [/\bcpa\b/i, /gaap/i, /public accounting/i, /accounting/i, /controller/i],
    hardSignals: [/cpa.{0,25}(required|must|mandatory)/i, /(required|must|mandatory).{0,25}cpa/i],
  },
  {
    label: 'corporate finance / FP&A',
    jobSignals: [/\bfp&a\b/i, /financial planning and analysis/i, /investment management/i, /financial modeling/i],
    evidenceSignals: [/\bfp&a\b/i, /financial planning and analysis/i, /investment management/i, /financial modeling/i],
  },
  {
    label: 'clinical / nursing expertise',
    jobSignals: [/\brn\b/i, /registered nurse/i, /clinical license/i, /nursing/i],
    evidenceSignals: [/\brn\b/i, /registered nurse/i, /clinical license/i, /nursing/i],
    hardSignals: [/\brn\b.{0,30}(required|must|license)/i, /(required|must).{0,30}\brn\b/i],
  },
  {
    label: 'software engineering leadership',
    jobSignals: [/software engineering/i, /engineering manager/i, /hands-on coding/i, /software development leadership/i],
    evidenceSignals: [/software engineer/i, /software engineering/i, /engineering manager/i, /software development/i, /hands-on coding/i],
  },
  {
    label: 'machine-learning engineering',
    jobSignals: [/machine learning engineer/i, /ml engineer/i, /model development/i, /deep learning/i, /training models/i],
    evidenceSignals: [/machine learning engineer/i, /ml engineer/i, /model development/i, /deep learning/i, /training models/i],
  },
  {
    label: 'data science',
    jobSignals: [/data scientist/i, /statistical modeling/i, /predictive modeling/i],
    evidenceSignals: [/data scientist/i, /statistical modeling/i, /predictive modeling/i],
  },
  {
    label: 'actuarial expertise',
    jobSignals: [/actuarial/i, /actuary/i, /society of actuaries/i],
    evidenceSignals: [/actuarial/i, /actuary/i, /society of actuaries/i],
  },
  {
    label: 'legal practice',
    jobSignals: [/bar admission/i, /licensed attorney/i, /legal counsel/i, /juris doctor/i],
    evidenceSignals: [/bar admission/i, /licensed attorney/i, /legal counsel/i, /juris doctor/i],
  },
  {
    label: 'civil / mechanical / electrical engineering',
    jobSignals: [/civil engineer/i, /mechanical engineer/i, /electrical engineer/i, /professional engineer/i, /\bp\.e\.\b/i],
    evidenceSignals: [/civil engineer/i, /mechanical engineer/i, /electrical engineer/i, /professional engineer/i, /\bp\.e\.\b/i],
  },
];

function profileText(profile: CareerEvidenceProfile): string {
  return normalizeText([
    profile.headline,
    ...profile.skills,
    ...profile.technologies,
    ...profile.certifications,
    ...profile.education,
    ...profile.domains,
    ...profile.leadershipSignals,
    ...profile.accomplishments,
    ...profile.evidence.flatMap(e => [e.label, e.detail]),
  ].join(' '));
}

export function specializedDomainMismatch(job: Job, profile: CareerEvidenceProfile): { mismatch: boolean; reasons: string[] } {
  const jobText = `${job.title}\n${job.description}`;
  const evidence = profileText(profile);
  const reasons: string[] = [];

  for (const rule of rules) {
    const jobMatches = rule.jobSignals.filter(signal => signal.test(jobText));
    if (!jobMatches.length) continue;
    const evidenceMatches = rule.evidenceSignals.some(signal => signal.test(evidence));
    if (evidenceMatches) continue;

    const strongRequirementLanguage = new RegExp(`(required|must have|minimum|mandatory|requires|demonstrated experience|extensive experience)[^\\n.]{0,100}(${rule.jobSignals.map(r=>r.source).join('|')})|(${rule.jobSignals.map(r=>r.source).join('|')})[^\\n.]{0,100}(required|must have|minimum|mandatory|requires)`, 'i').test(jobText);
    const explicitHard = rule.hardSignals?.some(signal => signal.test(jobText)) ?? false;
    const titlePrimary = rule.jobSignals.some(signal => signal.test(job.title));

    if (strongRequirementLanguage || explicitHard || titlePrimary) {
      reasons.push(`The role materially requires ${rule.label}, but the current resume does not demonstrate that specialized experience.`);
    }
  }

  return { mismatch: reasons.length > 0, reasons };
}
