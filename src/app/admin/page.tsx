import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Download, Info, ShieldCheck } from 'lucide-react';
import { getState } from '@/lib/storage/state';
import { googleConfigured } from '@/lib/storage/google';
import { appSecurityConfigured } from '@/lib/auth';
import { notificationsConfigured } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const state = await getState();
  const issues = (state.issues ?? []).slice().sort((a,b) => b.occurredAt.localeCompare(a.occurredAt));
  const unresolved = issues.filter(issue => !issue.resolved);
  const errors = unresolved.filter(issue => issue.severity === 'ERROR').length;
  const warnings = unresolved.filter(issue => issue.severity === 'WARNING').length;
  const services = [
    ['Secure sign-in', appSecurityConfigured()],
    ['Google Drive', googleConfigured()],
    ['Email updates', notificationsConfigured()],
    ['AI assistance', Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY)],
    ['Live job search', Boolean(process.env.SERPAPI_KEY)],
  ] as const;

  return <>
    <section className="hero">
      <div className="eyebrow">Admin & Diagnostics</div>
      <h1>See what is working and what needs attention.</h1>
      <p>This page keeps a private record of app problems so troubleshooting does not depend on screenshots or memory. Technical details are included only in this admin area.</p>
      <div className="hero-actions"><a className="button primary" href="/api/admin/issues.csv"><Download size={15}/>Download issue log</a><Link className="button" href="/settings">Back to Settings</Link></div>
    </section>

    <section className="stats" aria-label="Admin summary">
      <div className="stat"><div className="stat-value">{errors}</div><div className="stat-label">Errors needing review</div></div>
      <div className="stat"><div className="stat-value">{warnings}</div><div className="stat-label">Warnings</div></div>
      <div className="stat"><div className="stat-value">{issues.length}</div><div className="stat-label">Saved log entries</div></div>
      <div className="stat"><div className="stat-value">{services.filter(([,ready])=>ready).length}/{services.length}</div><div className="stat-label">Services ready</div></div>
    </section>

    <div className="detail-layout">
      <section className="panel">
        <h2>Recent issues</h2>
        <p className="fit">Download the CSV when you want ChatGPT Work or another support tool to review the history.</p>
        {issues.length ? <div className="admin-log-list">{issues.map(issue => <article className="admin-log-item" key={issue.id}>
          <div className="admin-log-heading">
            <span className={`badge ${issue.severity === 'ERROR' ? 'danger' : issue.severity === 'WARNING' ? 'warn' : 'good'}`}>{issue.severity}</span>
            <strong>{issue.area}</strong>
            <time>{new Date(issue.occurredAt).toLocaleString()}</time>
          </div>
          <p>{issue.userMessage}</p>
          <details><summary>Technical details for troubleshooting</summary><div className="admin-tech-details"><div><strong>Action:</strong> {issue.action || 'Not recorded'}</div><div><strong>Page or route:</strong> {issue.route || 'Not recorded'}</div><div><strong>Status:</strong> {issue.statusCode ?? 'Not recorded'}</div><pre>{issue.technicalMessage || 'No additional technical details were recorded.'}</pre></div></details>
        </article>)}</div> : <div className="empty"><CheckCircle2 size={22}/><p>No app issues have been recorded yet.</p></div>}
      </section>

      <aside className="panel">
        <h2>System check</h2>
        <p className="fit">“Ready” means the app can see the required setup for that service.</p>
        <div className="kv" style={{marginTop:12}}>{services.map(([name,ready]) => <div className="kv-row" key={name}><div className="kv-key">{name}</div><div className="admin-health"><span className={`badge ${ready ? 'good' : 'danger'}`}>{ready ? 'READY' : 'NEEDS ATTENTION'}</span>{ready ? <ShieldCheck size={15}/> : <AlertTriangle size={15}/>}</div></div>)}</div>
        <div className="notice" style={{marginTop:14}}><Info size={15}/> The issue log is limited to the most recent 1,000 entries so it stays manageable.</div>
      </aside>
    </div>
  </>;
}
