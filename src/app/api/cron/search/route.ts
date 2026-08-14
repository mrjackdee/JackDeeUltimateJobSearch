import { NextRequest, NextResponse } from 'next/server';
import { runSearch } from '@/lib/search-service';
import { getState } from '@/lib/storage/state';
import { prepareApplication } from '@/lib/package-service';
export const maxDuration = 300;

function easternHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(date));
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const state = await getState();
  const hour = easternHour();
  const trigger = hour === state.settings.morningHourEastern ? 'MORNING' : hour === state.settings.afternoonHourEastern ? 'AFTERNOON' : null;
  if (!trigger) return NextResponse.json({ skipped: true, reason: `Current Eastern hour ${hour} is outside configured run windows.` });
  const run = await runSearch(trigger);
  const refreshed = await getState();
  const latestByJob = new Map<string, typeof refreshed.analyses[number]>();
  refreshed.analyses.forEach(a => { const old = latestByJob.get(a.jobId); if (!old || a.analysisDate > old.analysisDate) latestByJob.set(a.jobId, a); });
  const auto = [...latestByJob.values()].filter(a => a.analysisDate >= run.startedAt && a.overallFitScore >= refreshed.settings.autoPrepareThreshold);
  const prepared: string[] = [];
  const errors: string[] = [];
  for (const analysis of auto) {
    try { const pkg = await prepareApplication(analysis.jobId); prepared.push(pkg.id); }
    catch (error) { errors.push(`${analysis.jobId}: ${error instanceof Error ? error.message : 'prepare failed'}`); }
  }
  return NextResponse.json({ run, prepared, errors });
}
