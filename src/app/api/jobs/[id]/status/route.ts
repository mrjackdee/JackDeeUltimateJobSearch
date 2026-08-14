import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';
import type { ApplicationStatus } from '@/lib/types';

const allowed: ApplicationStatus[] = ['DISCOVERED','REVIEWING','PREPARING','READY_TO_APPLY','APPLIED','RECRUITER_CONTACT','INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN','CLOSED','ARCHIVED'];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (!allowed.includes(body.status)) return NextResponse.json({ error: 'Choose one of the available application stages and try again.' }, { status: 400 });
  try {
    const app = await updateState(state => {
      if (!state.jobs.some(j => j.id === id)) throw new Error('This job is no longer available in your workspace.');
      let row = state.applications.find(a => a.jobId === id);
      if (!row) {
        row = { id: nanoid(), jobId: id, status: body.status, interviewDates: [], notes: [], updatedAt: new Date().toISOString() };
        state.applications.push(row);
      }
      row.status = body.status;
      row.updatedAt = new Date().toISOString();
      if (body.note) row.notes.push(String(body.note));
      if (body.followUpDate) row.followUpDate = String(body.followUpDate);
      if (body.status === 'APPLIED') {
        row.dateApplied = new Date().toISOString();
        if (body.packageId) {
          const pkg = state.applicationPackages.find(p => p.id === body.packageId && p.jobId === id);
          if (!pkg) throw new Error('The saved application materials for this job could not be found. Prepare them again, then mark the job as applied.');
          row.submittedApplicationPackageId = pkg.id;
          pkg.submitted = true;
          pkg.packageStatus = 'SUBMITTED';
        }
      }
      if (body.status === 'REJECTED') row.rejectionDate = new Date().toISOString();
      if (body.status === 'WITHDRAWN') row.withdrawalDate = new Date().toISOString();
      if (body.status === 'CLOSED') row.closedDate = new Date().toISOString();
      return row;
    });
    return NextResponse.json(app);
  } catch (error) {
    const userMessage = plainUserError('The application stage could not be changed right now. Please try again.', error);
    await logAppIssue({ area: 'Application tracking', action: 'Change an application stage', severity: 'ERROR', userMessage, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: `/api/jobs/${id}/status`, statusCode: 500, resolved: false });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
