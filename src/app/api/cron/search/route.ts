import { NextRequest, NextResponse } from 'next/server';
import { runSearch } from '@/lib/search-service';
import { getState } from '@/lib/storage/state';
import { prepareApplication } from '@/lib/package-service';
import { logAppIssue } from '@/lib/issues';
export const maxDuration = 300;

function easternHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(date));
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'This scheduled search request was not authorized.' }, { status: 401 });
  try {
    const state = await getState();
    const hour = easternHour();
    const trigger = hour === state.settings.morningHourEastern ? 'MORNING' : hour === state.settings.afternoonHourEastern ? 'AFTERNOON' : null;
    if (!trigger) return NextResponse.json({ skipped: true, reason: 'This check ran outside the two scheduled search times, so no search was started.' });
    const run = await runSearch(trigger);
    const refreshed = await getState();
    const latestByJob = new Map<string, typeof refreshed.analyses[number]>();
    refreshed.analyses.forEach(a => { const old = latestByJob.get(a.jobId); if (!old || a.analysisDate > old.analysisDate) latestByJob.set(a.jobId, a); });
    const auto = [...latestByJob.values()].filter(a => a.analysisDate >= run.startedAt && a.overallFitScore >= refreshed.settings.autoPrepareThreshold);
    const prepared: string[] = [];
    const errors: string[] = [];
    for (const analysis of auto) {
      try { const pkg = await prepareApplication(analysis.jobId); prepared.push(pkg.id); }
      catch (error) {
        errors.push('One high-match job could not have its application materials prepared automatically.');
        await logAppIssue({ area:'Scheduled search', action:'Prepare application materials after an automatic search', severity:'ERROR', userMessage:'One high-match job could not have its application materials prepared automatically. You can still open the job and prepare them manually.', technicalMessage:`${analysis.jobId}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`, route:'/api/cron/search', statusCode:500, resolved:false });
      }
    }
    return NextResponse.json({ run, prepared, errors });
  } catch (error) {
    await logAppIssue({ area:'Scheduled search', action:'Run the automatic morning or afternoon job search', severity:'ERROR', userMessage:'An automatic job search could not finish. The next scheduled search will still run normally.', technicalMessage:error instanceof Error ? error.stack ?? error.message : String(error), route:'/api/cron/search', statusCode:500, resolved:false });
    return NextResponse.json({ error:'The automatic job search could not finish this time.' }, { status:500 });
  }
}
