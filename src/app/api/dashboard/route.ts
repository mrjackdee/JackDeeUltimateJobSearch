import { NextResponse } from 'next/server';
import { getState } from '@/lib/storage/state';

export async function GET() {
  const state = await getState();
  const latestAnalysisByJob = new Map<string, typeof state.analyses[number]>();
  for (const a of state.analyses) {
    const old = latestAnalysisByJob.get(a.jobId);
    if (!old || a.analysisDate > old.analysisDate) latestAnalysisByJob.set(a.jobId, a);
  }
  const jobs = state.jobs
    .filter(j => j.active && ['ACTIVE_VERIFIED', 'ACTIVE_LIKELY'].includes(j.verificationStatus))
    .map(job => ({ job, analysis: latestAnalysisByJob.get(job.id), application: state.applications.find(a => a.jobId === job.id), packages: state.applicationPackages.filter(p => p.jobId === job.id) }))
    .filter(row => row.analysis && row.analysis.overallFitScore >= state.settings.fitThreshold)
    .sort((a, b) => (b.analysis?.priorityScore ?? 0) - (a.analysis?.priorityScore ?? 0));
  return NextResponse.json({ jobs, applications: state.applications, searchRuns: state.searchRuns.slice(0, 10), settings: state.settings, masterResumes: state.masterResumes, hasCareerProfile: Boolean(state.careerProfile) });
}
