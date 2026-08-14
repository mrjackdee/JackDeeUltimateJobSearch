'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FolderOpen, Sparkles } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import type { Analysis, Application, ApplicationPackage, Job, SearchLane, SearchRun, SearchSettings } from '@/lib/types';
import { salaryText } from '@/lib/utils';

type Row = { job: Job; analysis?: Analysis; application?: Application; packages: ApplicationPackage[] };

const laneLabels: Record<SearchLane, string> = { EXECUTIVE: 'Executive', PROGRAM_PROJECT: 'Project + Program', AGILE: 'Agile', PRODUCT: 'Product' };

function fitCopy(row: Row) {
  const a = row.analysis;
  if (!a) return 'Analysis pending.';
  if (a.overallFitScore >= 95) return 'Exceptional alignment with the documented career profile.';
  if (a.overallFitScore >= 90) return 'Very strong alignment and a high-priority application candidate.';
  if (a.overallFitScore >= 85) return 'Strong match with manageable gaps.';
  return 'Viable role that warrants a focused review of the remaining gaps.';
}

export function DashboardClient({ rows, searchRuns, settings, hasCareerProfile }: { rows: Row[]; searchRuns: SearchRun[]; settings: SearchSettings; hasCareerProfile: boolean }) {
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
    ['DISCOVERED','Discovered'],['REVIEWING','Review'],['PREPARING','Preparing'],['READY_TO_APPLY','Ready'],['APPLIED','Applied'],['RECRUITER_CONTACT','Recruiter'],['INTERVIEW','Interview'],['FINAL_INTERVIEW','Final'],['OFFER','Offer'],['CLOSED','Closed']
  ] as const;

  async function runSearch() {
    setMessage('');
    startTransition(async () => {
      const res = await fetch('/api/search', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? 'Search failed.');
      else setMessage(`Search complete: ${data.qualified} qualifying roles, ${data.duplicates} duplicates suppressed, ${data.inactive} inactive listings removed.`);
      router.refresh();
    });
  }

  async function prepare(jobId: string) {
    setMessage('');
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/prepare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? 'Application package failed.');
      else setMessage(`Application package v${data.version} is ready in Google Drive.`);
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

    {!hasCareerProfile && <div className="notice">Career Evidence Profile is not synced yet. Go to Settings and run Career Profile Sync before relying on fit and ATS scores.</div>}
    {message && <div className={message.toLowerCase().includes('failed') ? 'notice error' : 'notice'}>{message}</div>}

    <section className="stats" aria-label="Daily summary">
      <div className="stat"><div className="stat-value">{newToday}</div><div className="stat-label">Today&apos;s new jobs</div></div>
      <div className="stat"><div className="stat-value">{applyNow}</div><div className="stat-label">Apply now</div></div>
      <div className="stat"><div className="stat-value">{high}</div><div className="stat-label">90+ matches</div></div>
      <div className="stat"><div className="stat-value">{ready}</div><div className="stat-label">Applications ready</div></div>
      <div className="stat"><div className="stat-value">{interviews}</div><div className="stat-label">Interviews</div></div>
      <div className="stat"><div className="stat-value">{followups}</div><div className="stat-label">Follow-ups due</div></div>
    </section>

    <section aria-labelledby="pipeline-title">
      <div className="section-head"><div><div className="eyebrow">Process dashboard</div><h2 id="pipeline-title">Application pipeline</h2></div><Link className="inline-link" href="/applications">View all</Link></div>
      <div className="pipeline-grid">{phases.map(([status,label]) => { const phaseRows = rows.filter(r => (r.application?.status ?? 'DISCOVERED') === status); const latest = phaseRows[0]; const pkg = latest?.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0]; return <article className="pipeline-card" key={status}><Link href={`/applications?status=${status}`} className="pipeline-card-main"><span>{label}</span><strong>{phaseRows.length}</strong></Link>{latest && <div className="pipeline-latest"><Link href={`/jobs/${latest.job.id}`}>{latest.job.company}<br/><b>{latest.job.title}</b></Link>{pkg && <div className="pipeline-doc-links">{pkg.googleDriveFolderUrl && <a href={pkg.googleDriveFolderUrl} target="_blank" rel="noreferrer" className="drive-link"><FolderOpen size={14}/>Folder</a>}{pkg.resumeUrl && <a href={pkg.resumeUrl} target="_blank" rel="noreferrer" className="drive-link">Resume</a>}{pkg.coverLetterUrl && <a href={pkg.coverLetterUrl} target="_blank" rel="noreferrer" className="drive-link">Letter</a>}</div>}</div>}</article>; })}</div>
    </section>

    <section className="toolbar" aria-label="Job filters">
      <div className="filters">
        {(['ALL','EXECUTIVE','PROGRAM_PROJECT','AGILE','PRODUCT'] as const).map(value => <button key={value} className={`filter ${lane === value ? 'active' : ''}`} onClick={() => setLane(value)}>{value === 'ALL' ? 'All opportunities' : laneLabels[value]}</button>)}
      </div>
    </section>

    <div className="section-head"><div><div className="eyebrow">Prioritized queue</div><h2>Best current opportunities</h2></div><p>{visible.length} shown</p></div>
    {visible.length ? <div className="job-grid">{visible.map(row => <article className="job-card" key={row.job.id}>
      <div className="job-head"><div><h3 className="job-title">{row.job.title}</h3><div className="company">{row.job.company}</div></div><div className="score" aria-label={`Fit score ${row.analysis?.overallFitScore ?? 0} out of 100`}>{row.analysis?.overallFitScore ?? '—'}</div></div>
      <div className="meta">
        <span className="badge">{laneLabels[row.job.searchLane]}</span>
        <span className="badge">{row.job.workArrangement}</span>
        <span className="badge">{row.job.location}</span>
        <span className="badge">{salaryText(row.job.salaryMin, row.job.salaryMax)}</span>
        <span className={`badge ${row.job.verificationStatus === 'ACTIVE_VERIFIED' ? 'good' : 'warn'}`}>{row.job.verificationStatus.replaceAll('_',' ')}</span>
        {row.analysis && <span className={`badge ${row.analysis.overqualificationRisk === 'HIGH' ? 'danger' : row.analysis.overqualificationRisk === 'MEDIUM' ? 'warn' : 'good'}`}>Overqual {row.analysis.overqualificationRisk}</span>}
      </div>
      <p className="fit">{fitCopy(row)}</p>
      <div className="card-actions">
        <Link className="button subtle" href={`/jobs/${row.job.id}`}>View Analysis</Link>
        {(row.analysis?.overallFitScore ?? 0) >= 80 && !row.packages.some(p => p.packageStatus === 'READY_TO_APPLY') && <button className="button accent" disabled={isPending} onClick={() => prepare(row.job.id)}><Sparkles size={15}/>Prepare</button>}
        <a className="button" href={row.job.applicationUrl} target="_blank" rel="noreferrer">Employer Post <ArrowUpRight size={14}/></a>
        {row.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0]?.googleDriveFolderUrl && <a className="button" href={row.packages.filter(p=>!p.superseded).sort((a,b)=>b.version-a.version)[0].googleDriveFolderUrl} target="_blank" rel="noreferrer"><FolderOpen size={14}/>Drive Package</a>}
      </div>
    </article>)}</div> : <div className="empty">No qualifying opportunities match the current filters. Run a search, sync the career profile, or import a job directly.</div>}

    <section className="about-card" aria-labelledby="about-me-title">
      <div className="about-photo-wrap">
        <img src="/jack-dee-profile.jpg" alt="Jack Dee" className="about-photo" />
      </div>
      <div className="about-copy">
        <div className="eyebrow">About Me</div>
        <h2 id="about-me-title">Jack Dee</h2>
        <p>This private command center supports my search, application preparation, document management, and career tracking in one secure workspace.</p>
        <div className="about-links">
          <a className="button primary" href="https://www.donoraglobal.com" target="_blank" rel="noreferrer">DonOra Global <ArrowUpRight size={14}/></a>
          <a className="inline-link" href="https://www.donoraglobal.com" target="_blank" rel="noreferrer">www.donoraglobal.com</a>
        </div>
      </div>
    </section>

    {searchRuns[0] && <div className="section-head"><p>Last search: {new Date(searchRuns[0].completedAt ?? searchRuns[0].startedAt).toLocaleString()} · {searchRuns[0].qualified} qualified · {searchRuns[0].duplicates} duplicates suppressed</p></div>}
  </>;
}

function normalize(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
