'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MasterResume, SearchSettings } from '@/lib/types';

export function SettingsClient({ settings, masterResumes, hasCareerProfile, integration }: { settings: SearchSettings; masterResumes: MasterResume[]; hasCareerProfile: boolean; integration: Record<string, boolean> }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function syncCareer() {
    startTransition(async () => {
      const res = await fetch('/api/career/sync', { method:'POST' }); const data = await res.json();
      setMessage(res.ok ? `Career Evidence Profile synchronized from ${data.sourceFileIds?.length ?? 0} source files with ${data.evidenceCount ?? 0} evidence records.` : data.error ?? 'Sync failed.');
      router.refresh();
    });
  }
  return <div className="detail-layout">
    <section className="panel"><h2>Search configuration</h2><div className="kv">
      <div className="kv-row"><div className="kv-key">Salary floor</div><div>${settings.salaryFloor.toLocaleString()}</div></div>
      <div className="kv-row"><div className="kv-key">Metro radius</div><div>{settings.radiusMiles} miles</div></div>
      <div className="kv-row"><div className="kv-key">Listing window</div><div>{settings.lookbackDays} days</div></div>
      <div className="kv-row"><div className="kv-key">Fit threshold</div><div>{settings.fitThreshold}/100</div></div>
      <div className="kv-row"><div className="kv-key">Auto-prepare threshold</div><div>{settings.autoPrepareThreshold}/100</div></div>
      <div className="kv-row"><div className="kv-key">Scheduled runs</div><div>7:00 AM and 4:00 PM Eastern</div></div>
    </div></section>
    <aside className="panel"><h2>Integration health</h2><div className="kv">
      {Object.entries(integration).map(([key,value]) => <div className="kv-row" key={key}><div className="kv-key">{key}</div><div><span className={`badge ${value ? 'good':'danger'}`}>{value ? 'READY':'SETUP REQUIRED'}</span></div></div>)}
    </div></aside>
    <section className="panel"><h2>Career Evidence Profile</h2><p className="fit">Status: <strong>{hasCareerProfile ? 'Synchronized' : 'Not synchronized'}</strong>. The profile is generated only from approved Drive documents and is the truth boundary for ATS tailoring.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={syncCareer}>{pending ? 'Syncing…' : 'Sync Career Profile'}</button></div>{message && <div className={message.toLowerCase().includes('failed') ? 'notice error':'notice'} style={{marginTop:12}}>{message}</div>}</section>
    <section className="panel"><h2>Master resume library</h2><div className="kv">{masterResumes.map(m => <div className="kv-row" key={m.id}><div className="kv-key">{m.name}</div><div><span className={`badge ${m.status === 'APPROVED' ? 'good':'warn'}`}>{m.status.replaceAll('_',' ')}</span>{m.googleDriveUrl && <> · <a href={m.googleDriveUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)',fontWeight:700}}>Open in Drive</a></>}</div></div>)}</div></section>
  </div>;
}
