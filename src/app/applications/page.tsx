import Link from 'next/link';
import { getState } from '@/lib/storage/state';
import { salaryText } from '@/lib/utils';
export const dynamic = 'force-dynamic';
export default async function ApplicationsPage() {
  const state = await getState();
  const rows = state.applications.map(a => ({ application: a, job: state.jobs.find(j => j.id === a.jobId), analysis: state.analyses.filter(x => x.jobId === a.jobId).sort((x,y) => y.analysisDate.localeCompare(x.analysisDate))[0], pkg: state.applicationPackages.find(p => p.id === a.submittedApplicationPackageId) ?? state.applicationPackages.filter(p => p.jobId === a.jobId && !p.superseded).sort((x,y)=>y.version-x.version)[0] })).filter(r => r.job).sort((a,b) => b.application.updatedAt.localeCompare(a.application.updatedAt));
  return <>
    <section className="hero"><div className="eyebrow">Applications</div><h1>Keep every application and follow-up in one place.</h1><p>Each job stays connected to the exact resume and cover letter you prepared for it, so you can always see what was sent and what happened next.</p></section>
    {rows.length ? <div className="application-list">{rows.map(r => <article className="application-card" key={r.application.id}>
      <div className="job-head"><div><div className="company">{r.job!.company}</div><h2 className="application-title"><Link href={`/jobs/${r.job!.id}`}>{r.job!.title}</Link></h2></div><span className="badge">{friendlyStatus(r.application.status)}</span></div>
      <div className="application-metrics">
        <div><span>Job match</span><strong>{r.analysis?.overallFitScore ?? '—'}</strong></div>
        <div><span>Resume match</span><strong>{r.pkg?.atsScoreAfter ?? r.analysis?.atsScore ?? '—'}</strong></div>
        <div><span>Salary</span><strong>{salaryText(r.job!.salaryMin,r.job!.salaryMax)}</strong></div>
        <div><span>Materials</span><strong>{r.pkg ? `Version ${r.pkg.version}` : 'Not prepared'}</strong></div>
      </div>
      <div className="application-footer"><span>Follow-up: {r.application.followUpDate ? new Date(r.application.followUpDate).toLocaleDateString() : 'Not scheduled'}</span><Link className="button subtle" href={`/jobs/${r.job!.id}`}>Open application</Link></div>
    </article>)}</div> : <div className="empty">No applications are being tracked yet. Start by reviewing a job match and preparing its application materials.</div>}
  </>;
}

function friendlyStatus(status: string) {
  const labels: Record<string,string> = {
    DISCOVERED:'Found', REVIEWING:'Reviewing', PREPARING:'Preparing materials', READY_TO_APPLY:'Ready to apply', APPLIED:'Applied', RECRUITER_CONTACT:'Recruiter contact', INTERVIEW:'Interviewing', FINAL_INTERVIEW:'Final interview', OFFER:'Offer received', REJECTED:'Not selected', WITHDRAWN:'Withdrawn', CLOSED:'Closed', ARCHIVED:'Archived'
  };
  return labels[status] ?? status.replaceAll('_',' ').toLowerCase();
}
