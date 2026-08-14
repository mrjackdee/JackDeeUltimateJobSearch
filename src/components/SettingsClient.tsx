'use client';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MasterResume, SearchSettings } from '@/lib/types';

export function SettingsClient({ settings, masterResumes, hasCareerProfile, integration, notificationsEnabled }: { settings: SearchSettings; masterResumes: MasterResume[]; hasCareerProfile: boolean; integration: Record<string, boolean>; notificationsEnabled: boolean }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function testNotification() {
    startTransition(async () => {
      const res = await fetch('/api/notifications/test', { method:'POST' }); const data = await res.json();
      setMessage(res.ok ? 'Test notification sent to jackdee.sync@gmail.com.' : data.error ?? 'Notification test failed.');
    });
  }
  function toggleNotifications(enabled: boolean) {
    startTransition(async () => {
      const res = await fetch('/api/settings/notifications', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({enabled}) }); const data=await res.json();
      setMessage(res.ok ? `Email notifications ${enabled ? 'enabled' : 'disabled'}.` : data.error ?? 'Unable to update notifications.');
      router.refresh();
    });
  }
  function syncCareer() {
    startTransition(async () => {
      const res = await fetch('/api/career/sync', { method:'POST' }); const data = await res.json();
      setMessage(res.ok ? `Career Evidence Profile synchronized from ${data.sourceFileIds?.length ?? 0} source files with ${data.evidenceCount ?? 0} evidence records.` : data.error ?? 'Sync failed.');
      router.refresh();
    });
  }
  function uploadResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set('baseline', 'true');
    startTransition(async () => {
      const res = await fetch('/api/career/resumes/upload', { method: 'POST', body: form });
      const data = await res.json();
      setMessage(res.ok ? 'Updated master resume uploaded to Google Drive and set as the active baseline.' : data.error ?? 'Resume upload failed.');
      if (res.ok) (event.currentTarget as HTMLFormElement).reset();
      router.refresh();
    });
  }
  function setBaseline(id: string) {
    startTransition(async () => {
      const res = await fetch('/api/career/resumes/baseline', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({id}) });
      const data = await res.json();
      setMessage(res.ok ? 'Baseline resume updated.' : data.error ?? 'Unable to update baseline.');
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
      <div className="kv-row"><div className="kv-key">Email notifications</div><div><span className={`badge ${notificationsEnabled ? 'good':'warn'}`}>{notificationsEnabled ? 'ON':'OFF'}</span></div></div>
    </div></section>
    <aside className="panel"><h2>Integration health</h2><div className="kv">
      {Object.entries(integration).map(([key,value]) => <div className="kv-row" key={key}><div className="kv-key">{key}</div><div><span className={`badge ${value ? 'good':'danger'}`}>{value ? 'READY':'SETUP REQUIRED'}</span></div></div>)}
    </div></aside>
    <section className="panel"><h2>Gmail notifications</h2><p className="fit">Real-time messages are sent to <strong>jackdee.sync@gmail.com</strong> for scheduled search results and newly generated application packages.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={testNotification}>Send test notification</button><button className="button" disabled={pending} onClick={()=>toggleNotifications(!notificationsEnabled)}>{notificationsEnabled ? 'Turn notifications off' : 'Turn notifications on'}</button></div></section>
    <section className="panel"><h2>Career Evidence Profile</h2><p className="fit">Status: <strong>{hasCareerProfile ? 'Synchronized' : 'Not synchronized'}</strong>. The profile is generated only from approved Drive documents and is the truth boundary for ATS tailoring.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={syncCareer}>{pending ? 'Syncing…' : 'Sync Career Profile'}</button></div></section>
    <section className="panel"><h2>Update baseline resume</h2><p className="fit">Upload a newer DOCX at any time. The original remains in Drive, the new file is added to the master library, and the selected baseline becomes the source for future tailoring until you change it.</p><form className="form" onSubmit={uploadResume} style={{marginTop:12}}><div className="field"><label htmlFor="name">Resume label</label><input id="name" name="name" defaultValue="Current Master Resume" required/></div><div className="field"><label htmlFor="lane">Primary search lane</label><select id="lane" name="lane" defaultValue="PROGRAM_PROJECT"><option value="PROGRAM_PROJECT">Project + Program</option><option value="EXECUTIVE">Executive</option><option value="AGILE">Agile</option><option value="PRODUCT">Product</option></select></div><div className="field"><label htmlFor="resume">DOCX resume</label><input id="resume" name="resume" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required/></div><button className="button primary" disabled={pending}>Upload and use as baseline</button></form></section>
    <section className="panel"><h2>Master resume library</h2><div className="kv">{masterResumes.map(m => <div className="kv-row" key={m.id}><div className="kv-key">{m.name}</div><div className="resume-library-actions"><span className={`badge ${m.status === 'APPROVED' ? 'good':'warn'}`}>{m.status.replaceAll('_',' ')}</span>{m.isBaseline && <span className="badge good">BASELINE</span>}{m.googleDriveUrl && <a href={m.googleDriveUrl} target="_blank" rel="noreferrer" className="inline-link">Open in Drive</a>}{m.googleDriveFileId && !m.isBaseline && <button className="text-button" onClick={()=>setBaseline(m.id)} disabled={pending}>Use as baseline</button>}</div></div>)}</div></section>
    {message && <div className={message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable') ? 'notice error':'notice'}>{message}</div>}
  </div>;
}
