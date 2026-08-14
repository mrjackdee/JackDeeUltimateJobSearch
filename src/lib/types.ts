export type WorkArrangement = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
export type VerificationStatus = 'ACTIVE_VERIFIED' | 'ACTIVE_LIKELY' | 'STATUS_UNCERTAIN' | 'INACTIVE';
export type SearchLane = 'EXECUTIVE' | 'PROGRAM_PROJECT' | 'AGILE' | 'PRODUCT';
export type PriorityLabel = 'APPLY_NOW' | 'HIGH_PRIORITY' | 'REVIEW' | 'STRATEGIC' | 'BRIDGE_ROLE' | 'STRETCH' | 'SKIP';
export type OverqualificationRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type MatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceClassification = 'DIRECT' | 'TRANSFERABLE' | 'ADJACENT' | 'MISSING' | 'CONTRADICTORY';
export type GapSeverity = 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'POTENTIAL_DISQUALIFIER';
export type ResumeCompetitiveness = 'HIGHLY_COMPETITIVE' | 'COMPETITIVE' | 'POSSIBLE' | 'WEAK' | 'NOT_COMPETITIVE';
export type ResultStatus = 'NEW' | 'PREVIOUSLY_SEEN' | 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'REJECTED_BY_USER' | 'EXPIRED' | 'UPDATED';
export type CompensationLabel = 'ABOVE_TARGET' | 'WITHIN_TARGET' | 'BELOW_TARGET' | 'NOT_DISCLOSED';
export type ApplicationStatus =
  | 'DISCOVERED'
  | 'REVIEWING'
  | 'PREPARING'
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'RECRUITER_CONTACT'
  | 'INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CLOSED'
  | 'ARCHIVED';

export interface AppIssue {
  id: string;
  occurredAt: string;
  area: string;
  action?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  userMessage: string;
  technicalMessage?: string;
  route?: string;
  statusCode?: number;
  resolved?: boolean;
}

export interface Job {
  id: string;
  externalId?: string;
  requisitionNumber?: string;
  title: string;
  company: string;
  companyLogo?: string;
  employerCareersUrl?: string;
  applicationUrl: string;
  sourceUrl?: string;
  description: string;
  descriptionCompleteness?: 'FULL' | 'MOSTLY_COMPLETE' | 'PARTIAL';
  location: string;
  city?: string;
  state?: string;
  country?: string;
  workArrangement: WorkArrangement;
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'PART_TIME' | 'TEMPORARY' | 'INTERNSHIP' | 'UNKNOWN';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  bonus?: string;
  equity?: string;
  benefits?: string[];
  datePosted?: string;
  employerDatePosted?: string;
  dateDiscovered: string;
  lastVerifiedDate?: string;
  source: string;
  searchLane: SearchLane;
  verificationStatus: VerificationStatus;
  repost: boolean;
  duplicateFingerprint: string;
  active: boolean;
  resultStatus?: ResultStatus;
  raw?: Record<string, unknown>;
}

export interface RequirementEvaluation {
  requirement: string;
  category: 'CORE_RESPONSIBILITY' | 'REQUIRED_QUALIFICATION' | 'PREFERRED_QUALIFICATION' | 'SENIORITY_SCOPE' | 'DOMAIN' | 'TECHNOLOGY_METHODOLOGY' | 'LOCATION_COMPENSATION' | 'OTHER';
  importance: 'HARD' | 'HIGH' | 'MEDIUM' | 'LOW';
  resumeEvidence: string[];
  evidenceClassification: EvidenceClassification;
  pass: boolean;
  scoreImpact: number;
  gapSeverity?: GapSeverity;
  notes?: string;
}

export interface QualificationBreakdown {
  requiredAlignment: number;
  responsibilityAlignment: number;
  leadershipComplexity: number;
  technologyDomain: number;
  preferredAlignment: number;
  locationFit: number;
  compensationFit: number;
  recency: number;
  coreResponsibilities?: number;
  requiredExperienceQualifications?: number;
  seniorityOrganizationalScope?: number;
  industryDomainAlignment?: number;
  technologyMethodologyAlignment?: number;
  locationEmploymentCompensation?: number;
  penalties?: number;
}

export interface MatchGap {
  requirement: string;
  severity: GapSeverity;
  explanation: string;
}

export interface Analysis {
  id: string;
  jobId: string;
  analysisDate: string;
  resumeVersionAnalyzed?: string;
  overallFitScore: number;
  atsScore: number;
  overqualificationRisk: OverqualificationRisk;
  underqualificationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  qualificationBreakdown: QualificationBreakdown;
  keywordCoverage: string[];
  missingKeywords: string[];
  semanticAlignment: number;
  requiredQualificationCoverage: number;
  preferredQualificationCoverage: number;
  technicalAlignment: number;
  domainAlignment: number;
  leadershipAlignment: number;
  educationAlignment: number;
  certificationAlignment: number;
  compensationFit: number;
  geographicFit: number;
  strengths: string[];
  gaps: string[];
  wordingGaps: string[];
  trueExperienceGaps: string[];
  hardQualificationRisks: string[];
  recruiterObjections: string[];
  recommendedApplicationStrategy: string;
  recommendedMasterResume: string;
  priorityRecommendation: PriorityLabel;
  priorityScore: number;
  disqualified?: boolean;
  disqualificationReasons?: string[];
  matchConfidence?: MatchConfidence;
  matchLabel?: string;
  requirementEvaluations?: RequirementEvaluation[];
  keyResumeEvidence?: Array<{ label: string; evidence: string }>;
  gapDetails?: MatchGap[];
  whySelected?: string;
  resumeCompetitiveness?: ResumeCompetitiveness;
  compensationLabel?: CompensationLabel;
  compensationRisk?: boolean;
  applicationRecommendation?: 'APPLY_NOW' | 'APPLY' | 'REVIEW_BEFORE_APPLYING' | 'STRETCH_APPLICATION' | 'DO_NOT_APPLY';
  validatorScore?: number;
  validatorDelta?: number;
  validatorNotes?: string[];
}

export interface ApplicationPackage {
  id: string;
  jobId: string;
  analysisId: string;
  version: number;
  masterResumeSource: string;
  tailoredResumeVersion: string;
  coverLetterVersion: string;
  jobDescriptionSnapshot: string;
  generatedDate: string;
  qaStatus: 'PENDING' | 'PASSED' | 'FAILED';
  atsScoreBefore: number;
  atsScoreAfter: number;
  coverLetterScore: number;
  keyModifications: string[];
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  resumeFileId?: string;
  resumeUrl?: string;
  coverLetterFileId?: string;
  coverLetterUrl?: string;
  jobDescriptionFileId?: string;
  jobDescriptionUrl?: string;
  analysisFileId?: string;
  analysisUrl?: string;
  packageStatus: 'GENERATING' | 'READY_TO_APPLY' | 'SUPERSEDED' | 'SUBMITTED' | 'FAILED';
  superseded: boolean;
  submitted: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  submittedApplicationPackageId?: string;
  status: ApplicationStatus;
  dateApplied?: string;
  applicationSource?: string;
  recruiter?: string;
  recruiterContact?: string;
  referralContact?: string;
  hiringManager?: string;
  followUpDate?: string;
  recruiterContactDate?: string;
  interviewDates: string[];
  interviewStage?: string;
  interviewNotes?: string;
  compensationDiscussion?: string;
  offerDetails?: string;
  rejectionDate?: string;
  withdrawalDate?: string;
  closedDate?: string;
  notes: string[];
  finalOutcome?: string;
  updatedAt: string;
}

export interface CareerEvidence {
  id: string;
  type: 'EMPLOYMENT' | 'SKILL' | 'TECHNOLOGY' | 'CERTIFICATION' | 'EDUCATION' | 'ACCOMPLISHMENT' | 'DOMAIN';
  label: string;
  detail: string;
  sourceFileId?: string;
  sourceFileName?: string;
  confidence: number;
}

export interface CareerEvidenceProfile {
  generatedAt: string;
  candidateName: string;
  headline: string;
  yearsExperience?: number;
  evidence: CareerEvidence[];
  skills: string[];
  technologies: string[];
  certifications: string[];
  education: string[];
  domains: string[];
  leadershipSignals: string[];
  accomplishments: string[];
  sourceFileIds: string[];
}

export interface MasterResume {
  id: string;
  name: string;
  lane: SearchLane;
  googleDriveFileId?: string;
  googleDriveUrl?: string;
  status: 'APPROVED' | 'GENERATED_DRAFT' | 'MISSING';
  lastUpdated?: string;
  isBaseline?: boolean;
}

export interface SearchRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  trigger: 'MORNING' | 'AFTERNOON' | 'MANUAL' | 'IMPORT';
  discovered: number;
  qualified: number;
  excluded: number;
  inactive: number;
  duplicates: number;
  errors: string[];
}

export interface SearchSettings {
  salaryFloor: number;
  targetSalary?: number;
  remoteSalaryFloor?: number;
  hybridOnsiteSalaryFloor?: number;
  radiusMiles: number;
  lookbackDays: number;
  fitThreshold: number;
  showStretchRoles?: boolean;
  showContractRoles?: boolean;
  autoPrepareThreshold: number;
  morningHourEastern: number;
  afternoonHourEastern: number;
  remoteFirst: boolean;
  targetCompanies?: string[];
}

export interface AppState {
  schemaVersion: 1;
  jobs: Job[];
  analyses: Analysis[];
  applicationPackages: ApplicationPackage[];
  applications: Application[];
  careerProfile?: CareerEvidenceProfile;
  masterResumes: MasterResume[];
  searchRuns: SearchRun[];
  settings: SearchSettings;
  baselineResumeId?: string;
  notificationsEnabled?: boolean;
  issues?: AppIssue[];
  updatedAt: string;
}

export interface ResumeSection {
  heading: string;
  bullets?: string[];
  paragraphs?: string[];
}

export interface TailoredResumeContent {
  candidateName: string;
  contactLine: string;
  headline: string;
  summary: string;
  coreCompetencies: string[];
  sections: ResumeSection[];
  education: string[];
  certifications: string[];
  supportedKeywords: string[];
  excludedUnsupportedKeywords: string[];
  modifications: string[];
}

export interface CoverLetterContent {
  salutation: string;
  paragraphs: string[];
  closing: string;
  optimizationScore: number;
}
