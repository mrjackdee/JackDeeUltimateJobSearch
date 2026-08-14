import { NextResponse } from 'next/server';
import { runSearch } from '@/lib/search-service';
import { getState } from '@/lib/storage/state';
import { prepareApplication } from '@/lib/package-service';
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
      catch (error) { preparationErrors.push(`${analysis.jobId}: ${error instanceof Error ? error.message : 'prepare failed'}`); }
    }
    return NextResponse.json({ ...run, autoPrepared: prepared.length, preparationErrors });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed' }, { status: 500 }); }
}
