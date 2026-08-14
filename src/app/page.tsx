import { getState } from '@/lib/storage/state';
import { contactsFromState, networkOpportunity } from '@/lib/network';
import { DashboardClient } from '@/components/DashboardClient';
import type { WorkflowStatus } from '@/components/WorkflowGuide';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const state = await getState();
  const contacts = contactsFromState(state);
  const latestAnalysisByJob = new Map<string, typeof state.analyses[number]>();
  for (const a of state.analyses) { const old = latestAnalysisByJob.get(a.jobId); if (!old || a.analysisDate > old.analysisDate) latestAnalysisByJob.set(a.jobId, a); }
  const rows = state.jobs
    .filter(j => j.active && j.resultStatus !== 'REJECTED_BY_USER' && ['ACTIVE_VERIFIED','ACTIVE_LIKELY'].includes(j.verificationStatus))
    .map(job => ({
      job,
      analysis: latestAnalysisByJob.get(job.id),
      application: state.applications.find(a => a.jobId === job.id),
      packages: state.applicationPackages.filter(p => p.jobId === job.id),
      networkOpportunity: networkOpportunity(job.company, contacts).label,
    }))
    .filter(row => row.analysis && !row.analysis.disqualified && (row.analysis.overallFitScore >= state.settings.fitThreshold || (state.settings.showStretchRoles && row.analysis.overallFitScore >= 70)))
    .sort((a,b) => (b.analysis?.priorityScore ?? 0) - (a.analysis?.priorityScore ?? 0));

  const baseline = state.masterResumes.find(resume => resume.id === state.baselineResumeId || resume.isBaseline);
  const workflowStatus: WorkflowStatus = {
    baselineReady: Boolean(baseline?.googleDriveFileId),
    careerProfileReady: Boolean(state.careerProfile),
    searchCompleted: state.searchRuns.length > 0,
    analysisReady: state.analyses.length > 0,
    packageReady: state.applicationPackages.some(pkg => ['READY_TO_APPLY', 'SUBMITTED'].includes(pkg.packageStatus)),
    applicationTracked: state.applications.some(application => !['DISCOVERED', 'REVIEWING', 'PREPARING', 'READY_TO_APPLY'].includes(application.status)),
  };

  return <DashboardClient rows={rows} searchRuns={state.searchRuns.slice(0,10)} settings={state.settings} hasCareerProfile={Boolean(state.careerProfile)} workflowStatus={workflowStatus}/>;
}
