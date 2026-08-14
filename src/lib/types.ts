export type WorkArrangement = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
export type VerificationStatus = 'ACTIVE_VERIFIED' | 'ACTIVE_LIKELY' | 'STATUS_UNCERTAIN' | 'INACTIVE';
export type SearchLane = 'EXECUTIVE' | 'PROGRAM_PROJECT' | 'AGILE' | 'PRODUCT';
export type PriorityLabel = 'APPLY_NOW' | 'HIGH_PRIORITY' | 'STRATEGIC' | 'BRIDGE_ROLE' | 'STRETCH' | 'SKIP';
export type OverqualificationRisk = 'LOW' | 'MEDIUM' | 'HIGH';
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
  title: string;
  company: string;
  companyLogo?: string;
  employerCareersUrl?: string;
  applicationUrl: string;
  sourceUrl?: string;
  description: string;
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
  dateDiscovered: string;
  lastVerifiedDate?: string;
  source: string;
  searchLane: SearchLane;
  verificationStatus: VerificationStatus;
  repost: boolean;
  duplicateFingerprint: string;
  active: boolean;
  raw?: Record<string, unknown>;
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
  radiusMiles: number;
  lookbackDays: number;
  fitThreshold: number;
  autoPrepareThreshold: number;
  morningHourEastern: number;
  afternoonHourEastern: number;
  remoteFirst: boolean;
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
