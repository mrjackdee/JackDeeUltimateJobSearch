'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FolderOpen, Sparkles } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import { WorkflowGuide, type WorkflowStatus } from '@/components/WorkflowGuide';
import type { Analysis, Application, ApplicationPackage, Job, SearchLane, SearchRun, SearchSettings } from '@/lib/types';
import { salaryText } from '@/lib/utils';

type Row = { job: Job; analysis?: Analysis; application?: Application; packages: ApplicationPackage[] };

const laneLabels: Record<SearchLane, string> = { EXECUTIVE: 'Executive', PROGRAM_PROJECT: 'Project + Program', AGILE: 'Agile', PRODUCT: 'Product' };

function fitCopy(row: Row) {
  const a = row.analysis;
  if (!a) return 'This job has not been reviewed yet.';
  if (a.overallFitScore >= 95) return 'Excellent match with your documented experience.';
  if (a.overallFitScore >= 90) return 'Very strong match and worth reviewing soon.';
  if (a.overallFitScore >= 85) return 'Strong match with a few areas to review.';
  return 'Possible match. Review the details before deciding whether to apply.';
}

function verificationLabel(value: Job['verificationStatus']) {
  if (value === 'ACTIVE_VERIFIED') return 'Active listing';
  if (value === 'ACTIVE_LIKELY') return 'Likely active';
  if (value === 'STATUS_UNCERTAIN') return 'Status unclear';
  return 'No longer active';
}

export function DashboardClient({ rows, searchRuns, settings, hasCareerProfile, workflowStatus }: { rows: Row[]; searchRuns: SearchRun[]; settings: SearchSettings; hasCareerProfile: boolean; workflowStatus: WorkflowStatus }) {
  const [lane, setLane] = useState<'ALL' | SearchLane>('ALL');
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const visible = useMemo(() => rows.filter(r => {
    const laneMatches = lane === 'ALL' || r.job.searchLane === lane;
    const roleMatches = !normalize(query) || normalize(`${r.job.title} ${r.job.company}`).includes(normalize(query));
    const locationMatches = !normalize(locationQuery) || normalize(`${r.job.location} ${r.job.workArrangement}`).includes(normalize(locationQuery));
    return laneMatches && roleMatches && locationMatches;
  }), [rows, lane, query, locationQuery]);
  const today = new Date().toISOString().slice(0,10);
  const newToday = rows.filter(r => r.job.dateDiscovered.startsWith(today)).length;
  const applyNow = rows.filter(r => r.analysis?.priorityRecommendation === 'APPLY_NOW').length;
  const ready = rows.filter(r => r.packages.some(p => p.packageStatus === 'READY_TO_APPLY')).length;
  const interviews = rows.filter(r => ['INTERVIEW','FINAL_INTERVIEW'].includes(r.application?.status ?? '')).length;
  const followups = rows.filter(r => r.application?.followUpDate && r.application.followUpDate.slice(0,10) <= today).length;
  const high = rows.filter(r => (r.analysis?.overallFitScore ?? 0) >= settings.autoPrepareThreshold).length;
  const phases = [
    ['DISCOVERED','Found'],['REVIEWING','Reviewing'],['PREPARING','Preparing'],['READY_TO_APPLY','Ready'],['APPLIED','Applied'],['RECRUITER_CONTACT','Recruiter'],['INTERVIEW','Interview'],['FINAL_INTERVIEW','Final'],['OFFER','Offer'],['CLOSED','Closed']
  ] as const;

  async function runSearch() {
    setMessage('');
    startTransition(async () => {
      const res = await fetch('/api/search', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? 'The search could not be completed. Please try again.');
      else setMessage(`Search complete. ${data.qualified} matching role${data.qualified === 1 ? '' : 's'} found. Jobs you already saw or that are no longer active were left out.`);
      router.refresh();
    });
  }

  async function prepare(jobId: string) {
    setMessage('');
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/prepare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? 'The application materials could not be prepared. Please try again.');
      else setMessage('Your tailored resume and cover letter are ready and saved in Google Drive.');
      router.refresh();
    });
  }

  return <>
    <HeroSection
      roleQuery={query}
      locationQuery={locationQuery}
      onRoleQueryChange={setQuery}
      onLocationQueryChange={setLocationQuery}
      onSearch={runSearch}
      isPending={isPending}
    />

    <WorkflowGuide status={workflowStatus} compact/>

    {!hasCareerProfile && <div className="notice">Your Career Profile still needs to be created. Complete that step before relying on job match scores. <Link className="inline-link" href="/settings#career-profile">Go to Career Profile</Link></div>}
    {message && <div className={message.toLowerCase().includes('could not') ? 'notice error' : 'notice'}>{message}</div>}

    <section className="stats" aria-label="Today at a glance">
      <div className="stat"><div className="stat-value">{newToday}</div><div className="stat-label">New today</div></div>
      <div className="stat"><div className="stat-value">{applyNow}</div><div className="stat-label">Apply soon</div></div>
      <div className="stat"><div className="stat-value">{high}</div><div className="stat-label">Top matches</div></div>
      <div className="stat"><div className="stat-value">{ready}</div><div className="stat-label">Ready to apply</div></div>
      <div className="stat"><div className="stat-value">{interviews}</div><div className="stat-label">Interviews</div></div>
      <div className="stat"><div className="stat-value">{followups}</div><div className="stat-label">Follow-ups due</div></div>
    </section>

    <section aria-labelledby="pipeline-title">
      <div className="section-head"><div><div className="eyebrow">Where things stand</div><h2 id="pipeline-title">Application progress</h2></div><Link className="inline-link" href="/applications">See all applications</Link></div>
      <div className="pipeline-grid">{phases.map(([status,label]) => { const phaseRows = rows.filter(r => (r.application?.status ?? 'DISCOVERED') === status); const latest = phaseRows[0]; const pkg = latest?.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0]; return <article className="pipeline-card" key={status}><Link href={`/applications?status=${status}`} className="pipeline-card-main"><span>{label}</span><strong>{phaseRows.length}</strong></Link>{latest && <div className="pipeline-latest"><Link href={`/jobs/${latest.job.id}`}>{latest.job.company}<br/><b>{latest.job.title}</b></Link>{pkg && <div className="pipeline-doc-links">{pkg.googleDriveFolderUrl && <a href={pkg.googleDriveFolderUrl} target="_blank" rel="noreferrer" className="drive-link"><FolderOpen size={14}/>Open folder</a>}{pkg.resumeUrl && <a href={pkg.resumeUrl} target="_blank" rel="noreferrer" className="drive-link">Resume</a>}{pkg.coverLetterUrl && <a href={pkg.coverLetterUrl} target="_blank" rel="noreferrer" className="drive-link">Cover letter</a>}</div>}</div>}</article>; })}</div>
    </section>

    <section id="opportunities" className="toolbar" aria-label="Filter job matches">
      <div className="filters">
        {(['ALL','EXECUTIVE','PROGRAM_PROJECT','AGILE','PRODUCT'] as const).map(value => <button key={value} className={`filter ${lane === value ? 'active' : ''}`} onClick={() => setLane(value)}>{value === 'ALL' ? 'All matches' : laneLabels[value]}</button>)}
      </div>
    </section>

    <div className="section-head"><div><div className="eyebrow">Best matches</div><h2>Jobs worth reviewing</h2></div><p>{visible.length} shown</p></div>
    {visible.length ? <div className="job-grid">{visible.map(row => <article className="job-card" key={row.job.id}>
      <div className="job-head"><div><h3 className="job-title">{row.job.title}</h3><div className="company">{row.job.company}</div></div><div className="score" aria-label={`Match score ${row.analysis?.overallFitScore ?? 0} out of 100`}>{row.analysis?.overallFitScore ?? '—'}</div></div>
      <div className="meta">
        <span className="badge">{laneLabels[row.job.searchLane]}</span>
        <span className="badge">{row.job.workArrangement === 'REMOTE' ? 'Remote' : row.job.workArrangement === 'HYBRID' ? 'Hybrid' : row.job.workArrangement === 'ONSITE' ? 'On-site' : 'Work style unclear'}</span>
        <span className="badge">{row.job.location}</span>
        <span className="badge">{salaryText(row.job.salaryMin, row.job.salaryMax)}</span>
        <span className={`badge ${row.job.verificationStatus === 'ACTIVE_VERIFIED' ? 'good' : 'warn'}`}>{verificationLabel(row.job.verificationStatus)}</span>
        {row.analysis && <span className={`badge ${row.analysis.overqualificationRisk === 'HIGH' ? 'danger' : row.analysis.overqualificationRisk === 'MEDIUM' ? 'warn' : 'good'}`}>Overqualification: {row.analysis.overqualificationRisk.toLowerCase()}</span>}
      </div>
      <p className="fit">{fitCopy(row)}</p>
      <div className="card-actions">
        <Link className="button subtle" href={`/jobs/${row.job.id}`}>Review match</Link>
        {(row.analysis?.overallFitScore ?? 0) >= 80 && !row.packages.some(p => p.packageStatus === 'READY_TO_APPLY') && <button className="button accent" disabled={isPending} onClick={() => prepare(row.job.id)}><Sparkles size={15}/>Prepare materials</button>}
        <a className="button" href={row.job.applicationUrl} target="_blank" rel="noreferrer">View job posting <ArrowUpRight size={14}/></a>
        {row.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0]?.googleDriveFolderUrl && <a className="button" href={row.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0].googleDriveFolderUrl} target="_blank" rel="noreferrer"><FolderOpen size={14}/>Open saved materials</a>}
      </div>
    </article>)}</div> : <div className="empty">No job matches are showing with these filters. Run a new search, finish your Career Profile, or import a job you already found.</div>}

    <section className="about-card" aria-labelledby="about-me-title">
      <div className="about-photo-wrap"><img src="/jack-dee-profile.jpg" alt="Jack Dee" className="about-photo" /></div>
      <div className="about-copy"><div className="eyebrow">About</div><h2 id="about-me-title">Jack Dee</h2><p>This private workspace keeps job discovery, application materials, and application progress organized in one place.</p><div className="about-links"><a className="button primary" href="https://www.donoraglobal.com" target="_blank" rel="noreferrer">DonOra Global <ArrowUpRight size={14}/></a><a className="inline-link" href="https://www.donoraglobal.com" target="_blank" rel="noreferrer">www.donoraglobal.com</a></div></div>
    </section>

    {searchRuns[0] && <div className="section-head"><p>Last search: {new Date(searchRuns[0].completedAt ?? searchRuns[0].startedAt).toLocaleString()} · {searchRuns[0].qualified} matches found</p></div>}
  </>;
}

function normalize(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
