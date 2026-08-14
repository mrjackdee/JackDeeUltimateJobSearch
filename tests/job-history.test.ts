import { describe, expect, it } from 'vitest';
import { mergeVerification, materiallyChanged, seenAgainStatus } from '../src/lib/job-history';
import type { Job } from '../src/lib/types';

function job(overrides: Partial<Job> = {}): Job {
  return {
    id:'job-1', title:'Technical Program Manager', company:'Example', applicationUrl:'https://example.com/job', description:'Lead enterprise cloud migration programs, executive governance, vendors, risk, budget, and delivery across a large technology portfolio.', location:'Remote', workArrangement:'REMOTE', employmentType:'FULL_TIME', dateDiscovered:'2026-08-13T12:00:00.000Z', source:'test', searchLane:'PROGRAM_PROJECT', verificationStatus:'ACTIVE_VERIFIED', repost:false, duplicateFingerprint:'x', active:true, resultStatus:'NEW', ...overrides,
  };
}

describe('job history behavior', () => {
  it('changes NEW to PREVIOUSLY_SEEN when an unchanged active posting appears again', () => {
    const existing = job();
    const checked = job({ lastVerifiedDate:'2026-08-14T12:00:00.000Z' });
    expect(mergeVerification(existing, checked).resultStatus).toBe('PREVIOUSLY_SEEN');
  });

  it('preserves a SAVED decision when the same job appears again unchanged', () => {
    expect(seenAgainStatus('SAVED')).toBe('SAVED');
  });

  it('marks a removed posting as EXPIRED', () => {
    const existing = job();
    const checked = job({ active:false, verificationStatus:'INACTIVE' });
    const merged = mergeVerification(existing, checked);
    expect(merged.active).toBe(false);
    expect(merged.resultStatus).toBe('EXPIRED');
  });

  it('marks a materially changed description as UPDATED', () => {
    const existing = job();
    const checked = job({ description:'This revised role now leads a different enterprise portfolio, owns organizational transformation, operating model design, executive strategy, acquisition integration, and global modernization across multiple business units.' });
    expect(materiallyChanged(existing, checked)).toBe(true);
    expect(mergeVerification(existing, checked).resultStatus).toBe('UPDATED');
  });

  it('marks a changed compensation range as UPDATED', () => {
    const existing = job({ salaryMin:150000, salaryMax:190000 });
    const checked = job({ salaryMin:170000, salaryMax:215000 });
    expect(mergeVerification(existing, checked).resultStatus).toBe('UPDATED');
  });
});
