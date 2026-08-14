import Link from 'next/link';
import { getState } from '@/lib/storage/state';
import { salaryText } from '@/lib/utils';
export const dynamic = 'force-dynamic';
export default async function ApplicationsPage() {
  const state = await getState();
  const rows = state.applications.map(a => ({ application: a, job: state.jobs.find(j => j.id === a.jobId), analysis: state.analyses.filter(x => x.jobId === a.jobId).sort((x,y) => y.analysisDate.localeCompare(x.analysisDate))[0], pkg: state.applicationPackages.find(p => p.id === a.submittedApplicationPackageId) ?? state.applicationPackages.filter(p => p.jobId === a.jobId && !p.superseded).sort((x,y)=>y.version-x.version)[0] })).filter(r => r.job).sort((a,b) => b.application.updatedAt.localeCompare(a.application.updatedAt));
  return <>
    <section className="hero"><div className="eyebrow">Application tracker</div><h1>Every candidacy stays tied to the exact package used.</h1><p>Job, analysis, application package, and application history remain separate so submitted resume versions and ATS scores never get mixed together.</p></section>
    {rows.length ? <div className="application-list">{rows.map(r => <article className="application-card" key={r.application.id}>
      <div className="job-head"><div><div className="company">{r.job!.company}</div><h2 className="application-title"><Link href={`/jobs/${r.job!.id}`}>{r.job!.title}</Link></h2></div><span className="badge">{r.application.status.replaceAll('_',' ')}</span></div>
      <div className="application-metrics">
        <div><span>Fit</span><strong>{r.analysis?.overallFitScore ?? '—'}</strong></div>
        <div><span>ATS</span><strong>{r.pkg?.atsScoreAfter ?? r.analysis?.atsScore ?? '—'}</strong></div>
        <div><span>Salary</span><strong>{salaryText(r.job!.salaryMin,r.job!.salaryMax)}</strong></div>
        <div><span>Package</span><strong>{r.pkg ? `v${r.pkg.version}` : '—'}</strong></div>
      </div>
      <div className="application-footer"><span>Follow-up: {r.application.followUpDate ? new Date(r.application.followUpDate).toLocaleDateString() : 'Not set'}</span><Link className="button subtle" href={`/jobs/${r.job!.id}`}>Open application</Link></div>
    </article>)}</div> : <div className="empty">No application records yet. Preparing a package or changing a job status will create one.</div>}
  </>;
}
