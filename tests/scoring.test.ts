import { describe, expect, it } from 'vitest';
import { deterministicAnalysis, passesHardFilters } from '@/lib/scoring';
import type { CareerEvidenceProfile, Job } from '@/lib/types';

const profile: CareerEvidenceProfile = {
  generatedAt: new Date().toISOString(), candidateName: 'Candidate', headline: 'Senior technology program leader', yearsExperience: 20,
  evidence: [], skills: ['program management','project management','stakeholder management','risk management','governance','agile','scrum','product management'],
  technologies: ['AWS','SaaS','Power BI','AI automation'], certifications: ['PMP','CSPO','SAFe'], education: ['MBA Project Management'], domains: ['technology','financial services'], leadershipSignals: ['global programs','executive stakeholders','portfolio governance'], accomplishments: ['measurable annual cost reduction','large-scale implementation program','complex stakeholder portfolio'], sourceFileIds: ['x']
};
function job(overrides: Partial<Job> = {}): Job {
  return { id:'j1', title:'Senior Program Manager', company:'Acme', applicationUrl:'https://example.com/job', description:'Senior Program Manager responsible for program management, project management, governance, stakeholders, risk, AWS, SaaS, Agile and executive reporting. PMP preferred.', location:'Remote - United States', workArrangement:'REMOTE', employmentType:'FULL_TIME', salaryMin:140000, salaryMax:170000, salaryCurrency:'USD', datePosted:new Date().toISOString(), dateDiscovered:new Date().toISOString(), source:'test', searchLane:'EXECUTIVE', verificationStatus:'ACTIVE_VERIFIED', repost:false, duplicateFingerprint:'abc', active:true, ...overrides };
}

describe('hard filters', () => {
  it('accepts full-time remote jobs meeting salary floor', () => expect(passesHardFilters(job(),100000,25).pass).toBe(true));
  it('rejects disclosed salary below floor', () => expect(passesHardFilters(job({salaryMin:90000,salaryMax:90000}),100000,25).pass).toBe(false));
  it('rejects contracts', () => expect(passesHardFilters(job({employmentType:'CONTRACT'}),100000,25).pass).toBe(false));
  it('rejects remote jobs excluding GA and TX', () => expect(passesHardFilters(job({description:'Remote role. Cannot hire in Georgia and Texas.'}),100000,25).pass).toBe(false));
  it('rejects explicitly restricted remote state lists that omit GA and TX', () => expect(passesHardFilters(job({description:'Remote role. Eligible states: CA, NY, WA, CO.'}),100000,25).pass).toBe(false));
  it('accepts Dallas hybrid in radius', () => expect(passesHardFilters(job({location:'Dallas, TX',workArrangement:'HYBRID'}),100000,25).pass).toBe(true));
  it('rejects Fort Worth hybrid outside the 25-mile target', () => expect(passesHardFilters(job({location:'Fort Worth, TX',workArrangement:'HYBRID'}),100000,25).pass).toBe(false));
  it('rejects inactive jobs', () => expect(passesHardFilters(job({active:false,verificationStatus:'INACTIVE'}),100000,25).pass).toBe(false));
});

describe('fit scoring', () => {
  it('produces a transparent 0-100 score and separate priority score', () => {
    const a=deterministicAnalysis(job(),profile); expect(a.overallFitScore).toBeGreaterThanOrEqual(0); expect(a.overallFitScore).toBeLessThanOrEqual(100); expect(a.priorityScore).toBeGreaterThanOrEqual(0); expect(a.qualificationBreakdown.requiredAlignment).toBeLessThanOrEqual(30);
  });
  it('flags overqualification risk for lower-level roles with low years requirement', () => {
    const a=deterministicAnalysis(job({title:'Project Manager',searchLane:'PROGRAM_PROJECT',description:'Project Manager. Requires 3 years of project management experience.'}),profile); expect(a.overqualificationRisk).toBe('HIGH');
  });
});
