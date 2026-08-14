import { NextResponse } from 'next/server';
import { syncCareerProfile } from '@/lib/career';
import { logAppIssue, plainUserError } from '@/lib/issues';
export const maxDuration = 300;
export async function POST() {
  try {
    const profile = await syncCareerProfile();
    return NextResponse.json({ ok: true, generatedAt: profile.generatedAt, evidenceCount: profile.evidence.length, sourceFileIds: profile.sourceFileIds });
  } catch (error) {
    const userMessage = plainUserError('Your Career Profile could not be refreshed right now. Check that your saved resume opens correctly in Google Drive, then try again.', error);
    await logAppIssue({ area: 'Career Profile', action: 'Refresh Career Profile', severity: 'ERROR', userMessage, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: '/api/career/sync', statusCode: 500, resolved: false });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
