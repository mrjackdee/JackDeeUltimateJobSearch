import { describe, expect, it } from 'vitest';
import { specializedDomainMismatch } from '../src/lib/domain-guard';
import type { CareerEvidenceProfile, Job } from '../src/lib/types';

const profile: CareerEvidenceProfile = {
  generatedAt: '2026-08-14T00:00:00.000Z',
  candidateName: 'Candidate',
  headline: 'Technology Program Management Executive',
  yearsExperience: 20,
  evidence: [
    { id:'1', type:'EMPLOYMENT', label:'Technology Program Leadership', detail:'Led global enterprise technology programs and portfolio governance.', confidence:1 },
    { id:'2', type:'ACCOMPLISHMENT', label:'Cloud Transformation', detail:'Led AWS migration across 600+ implementations.', confidence:1 },
    { id:'3', type:'ACCOMPLISHMENT', label:'Enterprise Programs', detail:'Led technology programs exceeding $300M with 200+ stakeholders.', confidence:1 },
    { id:'4', type:'SKILL', label:'AI Enablement', detail:'Led AI enablement and governance programs.', confidence:1 },
  ],
  skills: ['program management','portfolio governance','PMO leadership','Agile delivery','change management','vendor management','risk management'],
  technologies: ['AWS','SaaS'],
  certifications: ['PMP','CSM','CSPO','SAFe POPM','SAFe LPM'],
  education: ['MBA','M.Ed.','BS Computer Information Systems','BS Business Administration'],
  domains: ['enterprise technology','commercial real estate technology','cloud transformation','AI enablement'],
  leadershipSignals: ['global programs','executive stakeholders','portfolio governance'],
  accomplishments: ['$300M+ programs','600+ AWS migration implementations','200+ stakeholders'],
  sourceFileIds: ['resume'],
};

function job(title: string, description: string): Job {
  return {
    id: title,
    title,
    company: 'Example Co',
    applicationUrl: 'https://example.com/job',
    description,
    location: 'Remote',
    workArrangement: 'REMOTE',
    employmentType: 'FULL_TIME',
    dateDiscovered: '2026-08-14T00:00:00.000Z',
    source: 'test',
    searchLane: 'PROGRAM_PROJECT',
    verificationStatus: 'ACTIVE_VERIFIED',
    repost: false,
    duplicateFingerprint: title,
    active: true,
  };
}

describe('specialized domain mismatch protection', () => {
  it.each([
    ['Senior Program Manager', 'Must have 8 years of direct construction management experience delivering commercial jobsite projects.'],
    ['Technology Program Manager', 'CPA required. Must have deep GAAP and public accounting expertise.'],
    ['Director, AI', 'Requires 10 years as a machine learning engineer with hands-on model development and deep learning.'],
    ['Project Manager', 'Active RN license required. Must have direct nursing and clinical care experience.'],
    ['Product Owner', 'Requires extensive actuarial experience and Society of Actuaries credentials.'],
    ['Senior Manager', 'Must have demonstrated software engineering leadership and hands-on coding experience.'],
  ])('rejects misleading title match: %s', (title, description) => {
    const result = specializedDomainMismatch(job(title, description), profile);
    expect(result.mismatch).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it.each([
    ['PMO Director', 'Lead enterprise PMO governance, portfolio prioritization, executive stakeholder management, risk, budget, and delivery governance.'],
    ['Technical Program Manager', 'Lead a large-scale AWS cloud migration program across enterprise applications and vendors.'],
    ['Director, AI Enablement', 'Lead enterprise AI enablement, governance, adoption, change management, and executive stakeholder alignment.'],
    ['Transformation Director', 'Lead enterprise SaaS implementation, digital transformation, portfolio governance, and strategic program execution.'],
    ['Agile Program Lead', 'Lead Agile enterprise delivery across cross-functional technology programs and Scrum teams.'],
  ])('does not falsely reject legitimate program leadership: %s', (title, description) => {
    const result = specializedDomainMismatch(job(title, description), profile);
    expect(result.mismatch).toBe(false);
  });
});
