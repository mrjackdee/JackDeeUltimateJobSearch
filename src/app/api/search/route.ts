import { NextResponse } from 'next/server';
import { runSearch } from '@/lib/search-service';
import { getState } from '@/lib/storage/state';
import { prepareApplication } from '@/lib/package-service';
import { logAppIssue, plainUserError } from '@/lib/issues';
export const maxDuration = 300;
export async function POST() {
  try {
    const run = await runSearch('MANUAL');
    const state = await getState();
    const latestByJob = new Map<string, typeof state.analyses[number]>();
    state.analyses.forEach(a => { const old = latestByJob.get(a.jobId); if (!old || a.analysisDate > old.analysisDate) latestByJob.set(a.jobId, a); });
    const auto = [...latestByJob.values()].filter(a => a.analysisDate >= run.startedAt && a.overallFitScore >= state.settings.autoPrepareThreshold);
    const prepared: string[] = [];
    const preparationErrors: string[] = [];
    for (const analysis of auto) {
      try { const pkg = await prepareApplication(analysis.jobId); prepared.push(pkg.id); }
      catch (error) {
        const technical = error instanceof Error ? error.message : 'Unknown preparation error';
        preparationErrors.push('One matching role could not be prepared automatically.');
        await logAppIssue({ area: 'Application preparation', action: 'Prepare a high-match role after search', severity: 'ERROR', userMessage: 'One matching role could not be prepared automatically. You can still review the role and try preparing it manually.', technicalMessage: `${analysis.jobId}: ${technical}`, route: '/api/search', statusCode: 500, resolved: false });
      }
    }
    return NextResponse.json({ ...run, autoPrepared: prepared.length, preparationErrors });
  } catch (error) {
    const userMessage = plainUserError('The job search could not be completed right now. Please try again in a few minutes.', error);
    await logAppIssue({ area: 'Job search', action: 'Run a manual job search', severity: 'ERROR', userMessage, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: '/api/search', statusCode: 500, resolved: false });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
