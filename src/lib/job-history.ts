import type { Job, ResultStatus } from './types';
import { normalizeText } from './utils';

export function jobIdentityKey(job: Job): string {
  return `${normalizeText(job.company)}|${normalizeText(job.title)}|${normalizeText(job.location)}|${normalizeText(job.requisitionNumber ?? job.externalId ?? '')}`;
}

export function jobBaseKey(job: Job): string {
  return `${normalizeText(job.company)}|${normalizeText(job.title)}|${normalizeText(job.location)}`;
}

export function descriptionSimilarity(a: string, b: string): number {
  const words = (value: string) => new Set(normalizeText(value).split(' ').filter(word => word.length > 4));
  const aa = words(a);
  const bb = words(b);
  if (!aa.size || !bb.size) return 0;
  let hits = 0;
  for (const word of aa) if (bb.has(word)) hits++;
  return hits / Math.min(aa.size, bb.size);
}

export function materiallyChanged(a: Job, b: Job): boolean {
  const compensationChanged = a.salaryMin !== b.salaryMin || a.salaryMax !== b.salaryMax;
  const locationChanged = normalizeText(a.location) !== normalizeText(b.location) || a.workArrangement !== b.workArrangement;
  const descriptionChanged = descriptionSimilarity(a.description, b.description) < 0.82;
  return compensationChanged || locationChanged || descriptionChanged;
}

export function seenAgainStatus(status?: ResultStatus): ResultStatus {
  if (status === 'SAVED' || status === 'APPLIED' || status === 'INTERVIEWING' || status === 'REJECTED_BY_USER') return status;
  if (status === 'UPDATED') return 'UPDATED';
  return 'PREVIOUSLY_SEEN';
}

export function mergeVerification(existing: Job, checked: Job): Job {
  if (!checked.active || checked.verificationStatus === 'INACTIVE') {
    return { ...existing, ...checked, id: existing.id, dateDiscovered: existing.dateDiscovered, active: false, resultStatus: 'EXPIRED' };
  }
  const changed = materiallyChanged(existing, checked);
  return {
    ...existing,
    ...checked,
    id: existing.id,
    dateDiscovered: existing.dateDiscovered,
    resultStatus: changed ? 'UPDATED' : seenAgainStatus(existing.resultStatus),
  };
}
