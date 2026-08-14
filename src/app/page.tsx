import { getState } from '@/lib/storage/state';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const state = await getState();
  const latestAnalysisByJob = new Map<string, typeof state.analyses[number]>();
  for (const a of state.analyses) { const old = latestAnalysisByJob.get(a.jobId); if (!old || a.analysisDate > old.analysisDate) latestAnalysisByJob.set(a.jobId, a); }
  const rows = state.jobs
    .filter(j => j.active && ['ACTIVE_VERIFIED','ACTIVE_LIKELY'].includes(j.verificationStatus))
    .map(job => ({ job, analysis: latestAnalysisByJob.get(job.id), application: state.applications.find(a => a.jobId === job.id), packages: state.applicationPackages.filter(p => p.jobId === job.id) }))
    .filter(row => row.analysis && row.analysis.overallFitScore >= state.settings.fitThreshold)
    .sort((a,b) => (b.analysis?.priorityScore ?? 0) - (a.analysis?.priorityScore ?? 0));
  return <DashboardClient rows={rows} searchRuns={state.searchRuns.slice(0,10)} settings={state.settings} hasCareerProfile={Boolean(state.careerProfile)}/>;
}
