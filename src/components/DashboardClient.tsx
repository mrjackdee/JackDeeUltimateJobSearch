'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, BriefcaseBusiness, RefreshCw, Sparkles } from 'lucide-react';
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
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const visible = useMemo(() => rows.filter(r => (lane === 'ALL' || r.job.searchLane === lane) && normalize(`${r.job.title} ${r.job.company} ${r.job.location}`).includes(normalize(query))), [rows, lane, query]);
  const today = new Date().toISOString().slice(0,10);
  const newToday = rows.filter(r => r.job.dateDiscovered.startsWith(today)).length;
  const applyNow = rows.filter(r => r.analysis?.priorityRecommendation === 'APPLY_NOW').length;
  const ready = rows.filter(r => r.packages.some(p => p.packageStatus === 'READY_TO_APPLY')).length;
  const interviews = rows.filter(r => ['INTERVIEW','FINAL_INTERVIEW'].includes(r.application?.status ?? '')).length;
  const followups = rows.filter(r => r.application?.followUpDate && r.application.followUpDate.slice(0,10) <= today).length;
  const high = rows.filter(r => (r.analysis?.overallFitScore ?? 0) >= settings.autoPrepareThreshold).length;

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
    <section className="hero">
      <div className="eyebrow">Daily Job Rundown</div>
      <h1>Know what deserves your attention today.</h1>
      <p>Fresh opportunities are ranked by fit, ATS alignment, recency, compensation, work arrangement, and career strategy. Morning search runs at 7:00 AM Eastern and refreshes at 4:00 PM Eastern.</p>
      <div className="hero-actions">
        <button className="button primary" onClick={runSearch} disabled={isPending}><RefreshCw size={16}/>{isPending ? 'Working…' : 'Run Job Search Now'}</button>
        <Link className="button" href="/import"><BriefcaseBusiness size={16}/>Import a Job</Link>
      </div>
      {!hasCareerProfile && <div className="notice">Career Evidence Profile is not synced yet. Go to Settings and run Career Profile Sync before relying on fit and ATS scores.</div>}
      {message && <div className={message.toLowerCase().includes('failed') ? 'notice error' : 'notice'}>{message}</div>}
    </section>

    <section className="stats" aria-label="Daily summary">
      <div className="stat"><div className="stat-value">{newToday}</div><div className="stat-label">Today&apos;s new jobs</div></div>
      <div className="stat"><div className="stat-value">{applyNow}</div><div className="stat-label">Apply now</div></div>
      <div className="stat"><div className="stat-value">{high}</div><div className="stat-label">90+ matches</div></div>
      <div className="stat"><div className="stat-value">{ready}</div><div className="stat-label">Applications ready</div></div>
      <div className="stat"><div className="stat-value">{interviews}</div><div className="stat-label">Interviews</div></div>
      <div className="stat"><div className="stat-value">{followups}</div><div className="stat-label">Follow-ups due</div></div>
    </section>

    <section className="toolbar" aria-label="Job filters">
      <input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company, role, or location" aria-label="Search opportunities"/>
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
      </div>
    </article>)}</div> : <div className="empty">No qualifying opportunities match the current filters. Run a search, sync the career profile, or import a job directly.</div>}

    {searchRuns[0] && <div className="section-head"><p>Last search: {new Date(searchRuns[0].completedAt ?? searchRuns[0].startedAt).toLocaleString()} · {searchRuns[0].qualified} qualified · {searchRuns[0].duplicates} duplicates suppressed</p></div>}
  </>;
}

function normalize(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
