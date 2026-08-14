import { notFound } from 'next/navigation';
import { getState } from '@/lib/storage/state';
import { salaryText } from '@/lib/utils';
import { JobActions } from '@/components/JobActions';
export const dynamic = 'force-dynamic';
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getState();
  const job = state.jobs.find(j=>j.id===id); if (!job) notFound();
  const analysis = state.analyses.filter(a=>a.jobId===id).sort((a,b)=>b.analysisDate.localeCompare(a.analysisDate))[0];
  const packages = state.applicationPackages.filter(p=>p.jobId===id).sort((a,b)=>b.version-a.version);
  const application = state.applications.find(a=>a.jobId===id);
  return <>
    <section className="hero"><div className="eyebrow">{job.company}</div><h1>{job.title}</h1><p>{job.location} · {job.workArrangement} · {salaryText(job.salaryMin,job.salaryMax)}</p><div className="hero-actions"><a className="button primary" href={job.applicationUrl} target="_blank" rel="noreferrer">Open Employer Posting</a>{packages[0]?.googleDriveFolderUrl&&<a className="button" href={packages[0].googleDriveFolderUrl} target="_blank" rel="noreferrer">Open Application Folder</a>}</div></section>
    <div className="detail-layout"><div style={{display:'grid',gap:14}}>
      {analysis?<section className="panel"><h2>Fit analysis</h2><div className="stats" style={{margin:'0 0 12px'}}><div className="stat"><div className="stat-value">{analysis.overallFitScore}</div><div className="stat-label">Overall fit</div></div><div className="stat"><div className="stat-value">{analysis.atsScore}</div><div className="stat-label">ATS before tailoring</div></div><div className="stat"><div className="stat-value">{analysis.priorityScore}</div><div className="stat-label">Priority score</div></div><div className="stat"><div className="stat-value" style={{fontSize:17}}>{analysis.overqualificationRisk}</div><div className="stat-label">Overqualification risk</div></div></div><h3>Why this role makes sense</h3><ul>{analysis.strengths.map(x=><li key={x}>{x}</li>)}</ul><h3>Potential gaps</h3><ul>{analysis.gaps.length?analysis.gaps.map(x=><li key={x}>{x}</li>):<li>No material gaps identified by the current analysis.</li>}</ul><h3>Application strategy</h3><p className="fit">{analysis.recommendedApplicationStrategy}</p></section>:<div className="notice">Analysis has not been generated yet.</div>}
      <section className="panel"><h2>Job description</h2><div className="prose">{job.description}</div></section>
    </div><aside style={{display:'grid',gap:14}}>
      <JobActions jobId={job.id} packages={packages} currentStatus={application?.status}/>
      <section className="panel"><h2>Opportunity record</h2><div className="kv"><div className="kv-row"><div className="kv-key">Verification</div><div>{job.verificationStatus.replaceAll('_',' ')}</div></div><div className="kv-row"><div className="kv-key">Source</div><div>{job.source}</div></div><div className="kv-row"><div className="kv-key">Posted</div><div>{job.datePosted?new Date(job.datePosted).toLocaleDateString():'Unknown'}</div></div><div className="kv-row"><div className="kv-key">Discovered</div><div>{new Date(job.dateDiscovered).toLocaleDateString()}</div></div><div className="kv-row"><div className="kv-key">Repost</div><div>{job.repost?'Yes':'No'}</div></div><div className="kv-row"><div className="kv-key">Recommended master</div><div>{analysis?.recommendedMasterResume??'Pending'}</div></div></div></section>
      <section className="panel"><h2>Application packages</h2>{packages.length?packages.map(p=><div key={p.id} style={{borderTop:'1px solid var(--line)',padding:'10px 0'}}><strong>Version {p.version}</strong> · <span className={`badge ${p.qaStatus==='PASSED'?'good':'danger'}`}>{p.qaStatus}</span><div className="fit">ATS {p.atsScoreBefore} → {p.atsScoreAfter}</div><div className="hero-actions" style={{marginTop:8}}>{p.resumeUrl&&<a className="button" href={p.resumeUrl} target="_blank" rel="noreferrer">Resume</a>}{p.coverLetterUrl&&<a className="button" href={p.coverLetterUrl} target="_blank" rel="noreferrer">Cover Letter</a>}{p.analysisUrl&&<a className="button" href={p.analysisUrl} target="_blank" rel="noreferrer">Analysis</a>}</div></div>):<p className="fit">No package generated yet.</p>}</section>
    </aside></div>
  </>;
}
