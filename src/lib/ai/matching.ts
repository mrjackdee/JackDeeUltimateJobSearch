import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type {
  Analysis,
  CareerEvidenceProfile,
  CompensationLabel,
  Job,
  PriorityLabel,
  RequirementEvaluation,
  SearchSettings,
} from '../types';
import { clamp, daysOld } from '../utils';

const model = () => process.env.AI_MODEL || 'openai/gpt-5.6-sol';
const gatewayOptions = { gateway: { zeroDataRetention: true, tags: ['app:jackdee-job-search', 'task:evidence-match'] } } as any;

const requirementSchema = z.object({
  requirement: z.string(),
  category: z.enum(['CORE_RESPONSIBILITY', 'REQUIRED_QUALIFICATION', 'PREFERRED_QUALIFICATION', 'SENIORITY_SCOPE', 'DOMAIN', 'TECHNOLOGY_METHODOLOGY', 'LOCATION_COMPENSATION', 'OTHER']),
  importance: z.enum(['HARD', 'HIGH', 'MEDIUM', 'LOW']),
  resumeEvidence: z.array(z.string()).max(6),
  evidenceClassification: z.enum(['DIRECT', 'TRANSFERABLE', 'ADJACENT', 'MISSING', 'CONTRADICTORY']),
  pass: z.boolean(),
  scoreImpact: z.number().min(-25).max(10),
  gapSeverity: z.enum(['MINOR', 'MODERATE', 'SIGNIFICANT', 'POTENTIAL_DISQUALIFIER']).optional(),
  notes: z.string().optional(),
});

const matchSchema = z.object({
  coreResponsibilities: z.number().min(0).max(100),
  requiredExperienceQualifications: z.number().min(0).max(100),
  seniorityOrganizationalScope: z.number().min(0).max(100),
  industryDomainAlignment: z.number().min(0).max(100),
  technologyMethodologyAlignment: z.number().min(0).max(100),
  locationEmploymentCompensation: z.number().min(0).max(100),
  penalties: z.number().min(0).max(60),
  disqualified: z.boolean(),
  disqualificationReasons: z.array(z.string()).max(8),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  requirements: z.array(requirementSchema).min(1).max(60),
  strengths: z.array(z.string()).min(1).max(5),
  keyResumeEvidence: z.array(z.object({ label: z.string(), evidence: z.string() })).max(8),
  gaps: z.array(z.object({
    requirement: z.string(),
    severity: z.enum(['MINOR', 'MODERATE', 'SIGNIFICANT', 'POTENTIAL_DISQUALIFIER']),
    explanation: z.string(),
  })).max(12),
  whySelected: z.string(),
  resumeCompetitiveness: z.enum(['HIGHLY_COMPETITIVE', 'COMPETITIVE', 'POSSIBLE', 'WEAK', 'NOT_COMPETITIVE']),
  recommendedApplicationStrategy: z.string(),
  recommendedMasterResume: z.string(),
});

const validatorSchema = z.object({
  defensibleScore: z.number().min(0).max(100),
  shouldDisqualify: z.boolean(),
  disqualificationReasons: z.array(z.string()).max(8),
  concerns: z.array(z.string()).max(10),
});

function compensation(job: Job, settings: SearchSettings): { fit: number; label: CompensationLabel; risk: boolean } {
  if (!job.salaryMin && !job.salaryMax) return { fit: 70, label: 'NOT_DISCLOSED', risk: false };
  const target = settings.targetSalary ?? 200000;
  const floor = job.workArrangement === 'REMOTE'
    ? (settings.remoteSalaryFloor ?? settings.salaryFloor)
    : (settings.hybridOnsiteSalaryFloor ?? settings.salaryFloor);
  const min = job.salaryMin ?? job.salaryMax ?? 0;
  const max = job.salaryMax ?? job.salaryMin ?? 0;
  if (max < floor) return { fit: 0, label: 'BELOW_TARGET', risk: false };
  const risk = min < floor && max >= floor;
  if (max >= target) return { fit: risk ? 80 : 100, label: 'ABOVE_TARGET', risk };
  if (max >= floor) return { fit: risk ? 65 : 85, label: 'WITHIN_TARGET', risk };
  return { fit: 25, label: 'BELOW_TARGET', risk };
}

function confidenceFor(job: Job): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (job.descriptionCompleteness === 'FULL') return 'HIGH';
  if (job.descriptionCompleteness === 'MOSTLY_COMPLETE') return 'MEDIUM';
  if (job.descriptionCompleteness === 'PARTIAL') return 'LOW';
  const length = job.description?.trim().length ?? 0;
  return length >= 3000 ? 'HIGH' : length >= 1200 ? 'MEDIUM' : 'LOW';
}

function applicationRecommendation(score: number, disqualified: boolean, significantGap: boolean): Analysis['applicationRecommendation'] {
  if (disqualified) return 'DO_NOT_APPLY';
  if (score >= 90 && !significantGap) return 'APPLY_NOW';
  if (score >= 85 && !significantGap) return 'APPLY';
  if (score >= 80) return 'REVIEW_BEFORE_APPLYING';
  if (score >= 70) return 'STRETCH_APPLICATION';
  return 'DO_NOT_APPLY';
}

function priorityLabel(score: number, disqualified: boolean): PriorityLabel {
  if (disqualified) return 'SKIP';
  if (score >= 92) return 'APPLY_NOW';
  if (score >= 86) return 'HIGH_PRIORITY';
  if (score >= 80) return 'REVIEW';
  if (score >= 70) return 'STRETCH';
  return 'SKIP';
}

function freshnessScore(job: Job): number {
  const age = daysOld(job.employerDatePosted || job.datePosted);
  if (age <= 1) return 100;
  if (age <= 3) return 85;
  if (age <= 7) return 65;
  if (age <= 14) return 35;
  return 10;
}

function competitivenessScore(value: Analysis['resumeCompetitiveness']): number {
  if (value === 'HIGHLY_COMPETITIVE') return 100;
  if (value === 'COMPETITIVE') return 85;
  if (value === 'POSSIBLE') return 60;
  if (value === 'WEAK') return 30;
  return 0;
}

export function basicEligibility(job: Job, settings: SearchSettings): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!job.active || job.verificationStatus === 'INACTIVE') reasons.push('The posting is no longer active.');
  if (!settings.showContractRoles && job.employmentType !== 'FULL_TIME') reasons.push('The role is not confirmed as permanent full-time employment.');
  if (job.workArrangement !== 'REMOTE') {
    const place = `${job.location} ${job.city ?? ''} ${job.state ?? ''}`.toLowerCase();
    const allowed = /(atlanta|alpharetta|marietta|sandy springs|roswell|decatur|dunwoody|smyrna|norcross|duluth|dallas|fort worth|plano|irving|frisco|richardson|arlington|addison|coppell|las colinas|grapevine)/i.test(place);
    if (!allowed) reasons.push('Hybrid and on-site roles are limited to Atlanta or Dallas/Fort Worth.');
  }
  const comp = compensation(job, settings);
  if ((job.salaryMin || job.salaryMax) && comp.fit === 0) reasons.push('The disclosed salary range does not reach the minimum acceptable compensation for this work arrangement.');
  return { pass: reasons.length === 0, reasons };
}

export async function evidenceBasedAnalysis(job: Job, profile: CareerEvidenceProfile, settings: SearchSettings): Promise<Analysis> {
  const confidence = confidenceFor(job);
  const comp = compensation(job, settings);
  const { object } = await generateObject({
    model: model(),
    schema: matchSchema,
    providerOptions: gatewayOptions,
    prompt: `Evaluate this job against the candidate's CURRENT resume evidence. This is a strict recruiter-credibility assessment, not a keyword-matching exercise.

NON-NEGOTIABLE EVIDENCE RULES
- Use only facts explicitly supported by the Career Evidence Profile.
- Never infer experience merely because the candidate worked near a function.
- Working with engineers is not software engineering experience.
- Managing AI programs is not machine-learning engineering experience.
- Technology work involving finance is not accounting, FP&A, investment, or CPA expertise.
- Healthcare technology work is not clinical or nursing expertise.
- Distinguish DIRECT, TRANSFERABLE, ADJACENT, MISSING, and CONTRADICTORY evidence.
- A title match must never override a specialized-domain mismatch.
- Preferred qualifications are not hard requirements unless the posting clearly says otherwise.
- Required/must/minimum/mandatory language should be treated as a hard requirement when appropriate.
- If a hard requirement is unsupported, record it clearly and apply an appropriate penalty or disqualification.
- Do not inflate a score to make a role look attractive.
- Ask whether a recruiter reading the CURRENT resume would reasonably see the candidate as qualified.

DOMAIN MISMATCH SAFEGUARDS
Be especially strict when the role materially requires accounting, corporate finance, FP&A, investment management, clinical medicine, nursing, construction, civil/mechanical/electrical engineering, software engineering, data science, machine-learning engineering, legal practice, actuarial work, specialized sales, or specialized marketing.

SCORING COMPONENTS, before penalties
- Core responsibilities: 35%
- Required experience and qualifications: 25%
- Seniority and organizational scope: 15%
- Industry/domain alignment: 10%
- Technology and methodology alignment: 10%
- Location, employment type, and compensation alignment: 5%

The numeric component fields you return are raw 0-100 component ratings. Penalties are a separate 0-60 deduction for material gaps. Do not include title similarity or keyword frequency as a scoring factor.

CONFIDENCE
The available description is classified by the application as ${confidence}. Do not claim higher confidence than this.

JOB
${JSON.stringify({
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      workArrangement: job.workArrangement,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      benefits: job.benefits,
      datePosted: job.employerDatePosted || job.datePosted,
      applicationUrl: job.applicationUrl,
    })}

CAREER EVIDENCE PROFILE
${JSON.stringify(profile)}`,
  });

  const weighted =
    object.coreResponsibilities * 0.35 +
    object.requiredExperienceQualifications * 0.25 +
    object.seniorityOrganizationalScope * 0.15 +
    object.industryDomainAlignment * 0.10 +
    object.technologyMethodologyAlignment * 0.10 +
    object.locationEmploymentCompensation * 0.05;
  let score = Math.round(clamp(weighted - object.penalties));
  let disqualified = object.disqualified;
  let disqualificationReasons = [...object.disqualificationReasons];

  const eligibility = basicEligibility(job, settings);
  if (!eligibility.pass) {
    disqualified = true;
    disqualificationReasons = [...new Set([...disqualificationReasons, ...eligibility.reasons])];
    score = Math.min(score, 69);
  }

  const significantGap = object.gaps.some(g => g.severity === 'SIGNIFICANT' || g.severity === 'POTENTIAL_DISQUALIFIER');
  const underqualificationRisk = score < 80 ? 'HIGH' : score < 88 || significantGap ? 'MEDIUM' : 'LOW';
  const requirements = object.requirements as RequirementEvaluation[];
  const priorityScore = Math.round(clamp(
    score * 0.50 +
    freshnessScore(job) * 0.20 +
    comp.fit * 0.10 +
    competitivenessScore(object.resumeCompetitiveness) * 0.10 +
    50 * 0.05 +
    0 * 0.05
  ));

  const analysis: Analysis = {
    id: nanoid(),
    jobId: job.id,
    analysisDate: new Date().toISOString(),
    overallFitScore: disqualified ? Math.min(score, 69) : score,
    atsScore: Math.round(clamp((object.requiredExperienceQualifications * 0.45) + (object.coreResponsibilities * 0.35) + (object.technologyMethodologyAlignment * 0.20))),
    overqualificationRisk: 'LOW',
    underqualificationRisk,
    qualificationBreakdown: {
      requiredAlignment: Math.round(object.requiredExperienceQualifications * 0.25),
      responsibilityAlignment: Math.round(object.coreResponsibilities * 0.35),
      leadershipComplexity: Math.round(object.seniorityOrganizationalScope * 0.15),
      technologyDomain: Math.round(((object.industryDomainAlignment + object.technologyMethodologyAlignment) / 2) * 0.20),
      preferredAlignment: 0,
      locationFit: Math.round(object.locationEmploymentCompensation * 0.05),
      compensationFit: comp.fit,
      recency: Math.round(freshnessScore(job) / 20),
      coreResponsibilities: object.coreResponsibilities,
      requiredExperienceQualifications: object.requiredExperienceQualifications,
      seniorityOrganizationalScope: object.seniorityOrganizationalScope,
      industryDomainAlignment: object.industryDomainAlignment,
      technologyMethodologyAlignment: object.technologyMethodologyAlignment,
      locationEmploymentCompensation: object.locationEmploymentCompensation,
      penalties: object.penalties,
    },
    keywordCoverage: [],
    missingKeywords: [],
    semanticAlignment: object.coreResponsibilities,
    requiredQualificationCoverage: object.requiredExperienceQualifications,
    preferredQualificationCoverage: Math.round(requirements.filter(r => r.category === 'PREFERRED_QUALIFICATION' && r.pass).length / Math.max(1, requirements.filter(r => r.category === 'PREFERRED_QUALIFICATION').length) * 100),
    technicalAlignment: object.technologyMethodologyAlignment,
    domainAlignment: object.industryDomainAlignment,
    leadershipAlignment: object.seniorityOrganizationalScope,
    educationAlignment: Math.round(requirements.filter(r => /education|degree|bachelor|master|mba/i.test(r.requirement) && r.pass).length ? 90 : 70),
    certificationAlignment: Math.round(requirements.filter(r => /certif|pmp|scrum|safe|cpa|rn|license/i.test(r.requirement) && r.pass).length ? 90 : 70),
    compensationFit: comp.fit,
    geographicFit: object.locationEmploymentCompensation,
    strengths: object.strengths,
    gaps: object.gaps.map(g => g.explanation),
    wordingGaps: requirements.filter(r => r.evidenceClassification === 'TRANSFERABLE').slice(0, 6).map(r => r.requirement),
    trueExperienceGaps: requirements.filter(r => r.evidenceClassification === 'MISSING').slice(0, 10).map(r => r.requirement),
    hardQualificationRisks: requirements.filter(r => r.importance === 'HARD' && !r.pass).slice(0, 10).map(r => r.requirement),
    recruiterObjections: object.gaps.filter(g => g.severity !== 'MINOR').map(g => g.explanation).slice(0, 8),
    recommendedApplicationStrategy: object.recommendedApplicationStrategy,
    recommendedMasterResume: object.recommendedMasterResume,
    priorityRecommendation: priorityLabel(score, disqualified),
    priorityScore,
    disqualified,
    disqualificationReasons,
    matchConfidence: confidence === 'LOW' ? 'LOW' : object.confidence === 'HIGH' && confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
    matchLabel: confidence === 'LOW' ? 'Preliminary Match' : score >= 95 ? 'Exceptional Match' : score >= 90 ? 'Excellent Match' : score >= 85 ? 'Strong Match' : score >= 80 ? 'Viable Match' : score >= 70 ? 'Stretch' : 'Poor Match',
    requirementEvaluations: requirements,
    keyResumeEvidence: object.keyResumeEvidence,
    gapDetails: object.gaps,
    whySelected: object.whySelected,
    resumeCompetitiveness: object.resumeCompetitiveness,
    compensationLabel: comp.label,
    compensationRisk: comp.risk,
    applicationRecommendation: applicationRecommendation(score, disqualified, significantGap),
  };

  return analysis;
}

export async function validateHighScore(job: Job, profile: CareerEvidenceProfile, analysis: Analysis): Promise<Analysis> {
  if (analysis.disqualified || analysis.overallFitScore < 85) return analysis;
  const { object } = await generateObject({
    model: model(),
    schema: validatorSchema,
    providerOptions: { gateway: { zeroDataRetention: true, tags: ['app:jackdee-job-search', 'task:match-validator'] } } as any,
    prompt: `Act as an independent skeptical recruiter reviewing a proposed job-match score. Challenge the score using only the job description and resume evidence.

Check specifically:
1. Is title similarity inflating the score?
2. Is keyword overlap inflating the score?
3. Are required qualifications actually demonstrated?
4. Is specialized domain experience being overlooked?
5. Are preferred qualifications being treated as mandatory?
6. Are mandatory qualifications being treated as optional?
7. Is transferable experience incorrectly classified as direct?
8. Would a recruiter reading the CURRENT resume reasonably see this candidate as qualified?
9. Is anything in the description materially weakening candidacy?
10. Is the score defensible solely from the resume and description?

Do not reward potential, presumed learning ability, or experience that is not documented.

JOB\n${JSON.stringify(job)}
\nCAREER PROFILE\n${JSON.stringify(profile)}
\nINITIAL ANALYSIS\n${JSON.stringify(analysis)}`,
  });

  const delta = Math.abs(object.defensibleScore - analysis.overallFitScore);
  let finalScore = analysis.overallFitScore;
  if (delta > 5) finalScore = Math.round((analysis.overallFitScore + object.defensibleScore) / 2);
  if (object.shouldDisqualify) finalScore = Math.min(finalScore, 69);
  const disqualified = Boolean(analysis.disqualified || object.shouldDisqualify);
  const significantGap = (analysis.gapDetails ?? []).some(g => g.severity === 'SIGNIFICANT' || g.severity === 'POTENTIAL_DISQUALIFIER');

  return {
    ...analysis,
    overallFitScore: finalScore,
    disqualified,
    disqualificationReasons: [...new Set([...(analysis.disqualificationReasons ?? []), ...object.disqualificationReasons])],
    validatorScore: object.defensibleScore,
    validatorDelta: delta,
    validatorNotes: object.concerns,
    matchLabel: analysis.matchConfidence === 'LOW' ? 'Preliminary Match' : finalScore >= 95 ? 'Exceptional Match' : finalScore >= 90 ? 'Excellent Match' : finalScore >= 85 ? 'Strong Match' : finalScore >= 80 ? 'Viable Match' : finalScore >= 70 ? 'Stretch' : 'Poor Match',
    applicationRecommendation: applicationRecommendation(finalScore, disqualified, significantGap),
    priorityRecommendation: priorityLabel(finalScore, disqualified),
  };
}
