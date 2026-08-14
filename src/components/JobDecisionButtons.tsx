'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ResultStatus } from '@/lib/types';

export function JobDecisionButtons({ jobId, status }: { jobId: string; status?: ResultStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(nextStatus: 'SAVED' | 'REJECTED_BY_USER') {
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) router.refresh();
    });
  }

  return <div className="job-decision-actions" aria-label="Save or reject this job">
    <button className={`button ${status === 'SAVED' ? 'primary' : 'subtle'}`} disabled={pending || status === 'SAVED'} onClick={() => decide('SAVED')}>
      {status === 'SAVED' ? 'Saved' : 'Save'}
    </button>
    <button className="button subtle" disabled={pending || status === 'REJECTED_BY_USER'} onClick={() => decide('REJECTED_BY_USER')}>
      {status === 'REJECTED_BY_USER' ? 'Rejected' : 'Reject'}
    </button>
  </div>;
}
