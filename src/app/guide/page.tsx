import { WorkflowGuide, type WorkflowStatus } from '@/components/WorkflowGuide';
import { getState } from '@/lib/storage/state';

export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const state = await getState();
  const baseline = state.masterResumes.find(resume => resume.id === state.baselineResumeId || resume.isBaseline);
  const tracked = state.applications.some(application => !['DISCOVERED', 'REVIEWING', 'PREPARING', 'READY_TO_APPLY'].includes(application.status));
  const status: WorkflowStatus = {
    baselineReady: Boolean(baseline?.googleDriveFileId),
    careerProfileReady: Boolean(state.careerProfile),
    searchCompleted: state.searchRuns.length > 0,
    analysisReady: state.analyses.length > 0,
    packageReady: state.applicationPackages.some(pkg => ['READY_TO_APPLY', 'SUBMITTED'].includes(pkg.packageStatus)),
    applicationTracked: tracked,
  };

  return <>
    <section className="hero guide-hero">
      <div className="eyebrow">How to use the app</div>
      <h1>Your job search, one clear step at a time.</h1>
      <p>Use this guided workflow as the primary path through the system. Each step shows what to do, why it matters, and where to go next.</p>
    </section>
    <WorkflowGuide status={status}/>
  </>;
}
