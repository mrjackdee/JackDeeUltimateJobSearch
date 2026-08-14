import { NextRequest, NextResponse } from 'next/server';
import { prepareApplication } from '@/lib/package-service';
import { logAppIssue, plainUserError } from '@/lib/issues';
export const maxDuration = 300;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let jobId = 'unknown';
  try {
    const { id } = await context.params;
    jobId = id;
    const body = await request.json().catch(() => ({}));
    const pkg = await prepareApplication(id, Boolean(body.forceNewVersion));
    return NextResponse.json(pkg);
  } catch (error) {
    const userMessage = plainUserError('The application materials could not be prepared right now. Please try again. If it continues, check Admin & Diagnostics.', error);
    await logAppIssue({ area: 'Application preparation', action: 'Create tailored resume and cover letter', severity: 'ERROR', userMessage, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: `/api/jobs/${jobId}/prepare`, statusCode: 500, resolved: false });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
