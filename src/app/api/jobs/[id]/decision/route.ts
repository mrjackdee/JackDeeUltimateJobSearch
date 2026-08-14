import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';
import type { ResultStatus } from '@/lib/types';

const allowed: ResultStatus[] = ['SAVED', 'REJECTED_BY_USER', 'PREVIOUSLY_SEEN'];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Choose Save or Reject and try again.' }, { status: 400 });
  }

  try {
    const result = await updateState(state => {
      const job = state.jobs.find(item => item.id === id);
      if (!job) throw new Error('This job is no longer available in your workspace.');
      job.resultStatus = body.status;
      return { jobId: job.id, resultStatus: job.resultStatus };
    });
    return NextResponse.json(result);
  } catch (error) {
    const userMessage = plainUserError('Your job decision could not be saved right now. Please try again.', error);
    await logAppIssue({
      area: 'Job review',
      action: 'Save or reject a job',
      severity: 'ERROR',
      userMessage,
      technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error),
      route: `/api/jobs/${id}/decision`,
      statusCode: 500,
      resolved: false,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
