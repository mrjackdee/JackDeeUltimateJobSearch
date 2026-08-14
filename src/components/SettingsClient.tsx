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
      setMessage(res.ok ? 'A test email was sent to jackdee.sync@gmail.com.' : data.error ?? 'The test email could not be sent. Please try again.');
    });
  }
  function toggleNotifications(enabled: boolean) {
    startTransition(async () => {
      const res = await fetch('/api/settings/notifications', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({enabled}) }); const data=await res.json();
      setMessage(res.ok ? `Email notifications are now ${enabled ? 'on' : 'off'}.` : data.error ?? 'Your notification setting could not be changed. Please try again.');
      router.refresh();
    });
  }
  function syncCareer() {
    startTransition(async () => {
      const res = await fetch('/api/career/sync', { method:'POST' }); const data = await res.json();
      setMessage(res.ok ? `Your Career Profile was refreshed using ${data.sourceFileIds?.length ?? 0} resume file(s).` : data.error ?? 'Your Career Profile could not be refreshed. Check your baseline resume and try again.');
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
      setMessage(res.ok ? 'Your new resume was saved and is now the resume the app will use for future matches and tailored documents.' : data.error ?? 'The resume could not be saved. Please check the file or Google Docs link and try again.');
      if (res.ok) (event.currentTarget as HTMLFormElement).reset();
      router.refresh();
    });
  }
  function setBaseline(id: string) {
    startTransition(async () => {
      const res = await fetch('/api/career/resumes/baseline', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({id}) });
      const data = await res.json();
      setMessage(res.ok ? 'This resume is now your active baseline.' : data.error ?? 'The active resume could not be changed. Please try again.');
      router.refresh();
    });
  }
  return <div className="detail-layout">
    <section className="panel"><h2>Search preferences</h2><div className="kv">
      <div className="kv-row"><div className="kv-key">Minimum salary</div><div>${settings.salaryFloor.toLocaleString()}</div></div>
      <div className="kv-row"><div className="kv-key">Distance from target city</div><div>{settings.radiusMiles} miles</div></div>
      <div className="kv-row"><div className="kv-key">How recent a job should be</div><div>{settings.lookbackDays} days</div></div>
      <div className="kv-row"><div className="kv-key">Minimum match score</div><div>{settings.fitThreshold}/100</div></div>
      <div className="kv-row"><div className="kv-key">Prepare automatically at</div><div>{settings.autoPrepareThreshold}/100</div></div>
      <div className="kv-row"><div className="kv-key">Automatic searches</div><div>7:00 AM and 4:00 PM Eastern</div></div>
      <div className="kv-row"><div className="kv-key">Email notifications</div><div><span className={`badge ${notificationsEnabled ? 'good':'warn'}`}>{notificationsEnabled ? 'ON':'OFF'}</span></div></div>
    </div></section>
    <aside className="panel"><h2>Connected services</h2><p className="fit">These are the services the app uses in the background. “Ready” means no action is needed.</p><div className="kv" style={{marginTop:10}}>
      {Object.entries(integration).map(([key,value]) => <div className="kv-row" key={key}><div className="kv-key">{key}</div><div><span className={`badge ${value ? 'good':'danger'}`}>{value ? 'READY':'NEEDS ATTENTION'}</span></div></div>)}
    </div></aside>
    <section className="panel"><h2>Email updates</h2><p className="fit">The app can email <strong>jackdee.sync@gmail.com</strong> when scheduled searches find results and when application materials are ready.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={testNotification}>Send test email</button><button className="button" disabled={pending} onClick={()=>toggleNotifications(!notificationsEnabled)}>{notificationsEnabled ? 'Turn email updates off' : 'Turn email updates on'}</button></div></section>
    <section id="career-profile" className="panel"><h2>Career Profile</h2><p className="fit">Status: <strong>{hasCareerProfile ? 'Ready' : 'Needs to be created'}</strong>. The app reads your approved resume files to build a private summary of your experience, skills, education, and accomplishments. It uses that information to judge job matches and keep tailored resumes accurate.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={syncCareer}>{pending ? 'Refreshing…' : 'Refresh Career Profile'}</button></div></section>
    <section id="baseline-resume" className="panel"><h2>Update baseline resume</h2><p className="fit">Your baseline resume is the main resume the app uses when it compares you with jobs and prepares tailored application materials. You can add a newer version at any time as a DOCX, PDF, or Google Doc. Your older versions stay safely stored in Google Drive.</p><ol className="settings-steps"><li>Give the resume a name you will recognize later.</li><li>Select the type of jobs this resume is best suited for.</li><li>Choose one option: upload a DOCX or PDF file, or paste the link to a Google Doc you can open with this Google account.</li><li>Select <strong>Add and use as baseline</strong>. The app saves a copy, makes it your active resume, and refreshes your Career Profile.</li><li>To switch back later, choose <strong>Use as baseline</strong> beside another resume in your saved resume list.</li></ol><form className="form" onSubmit={uploadResume} style={{marginTop:12}}><div className="field"><label htmlFor="name">Resume name</label><input id="name" name="name" defaultValue="Current Master Resume" required/></div><div className="field"><label htmlFor="lane">Best fit for</label><select id="lane" name="lane" defaultValue="PROGRAM_PROJECT"><option value="PROGRAM_PROJECT">Project and Program Management</option><option value="EXECUTIVE">Executive Leadership</option><option value="AGILE">Agile Leadership</option><option value="PRODUCT">Product Leadership</option></select></div><div className="field"><label htmlFor="resume">Upload a DOCX or PDF</label><input id="resume" name="resume" type="file" accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"/><span className="field-help">Files can be up to 10 MB. Leave this blank if you are using a Google Docs link instead.</span></div><div className="source-divider"><span>or</span></div><div className="field"><label htmlFor="googleDocUrl">Paste a Google Docs link</label><input id="googleDocUrl" name="googleDocUrl" type="url" placeholder="https://docs.google.com/document/d/..."/><span className="field-help">Use a Google Doc that opens with the same Google account you use to sign in here. Leave this blank if you uploaded a file.</span></div><button className="button primary" disabled={pending}>Add and use as baseline</button></form></section>
    <section className="panel"><h2>Saved resumes</h2><p className="fit">All saved resume versions remain available so you can change your active baseline whenever needed.</p><div className="kv" style={{marginTop:10}}>{masterResumes.map(m => <div className="kv-row" key={m.id}><div className="kv-key">{m.name}</div><div className="resume-library-actions"><span className={`badge ${m.status === 'APPROVED' ? 'good':'warn'}`}>{m.status === 'APPROVED' ? 'READY' : 'REVIEW'}</span>{m.isBaseline && <span className="badge good">ACTIVE BASELINE</span>}{m.googleDriveUrl && <a href={m.googleDriveUrl} target="_blank" rel="noreferrer" className="inline-link">Open in Drive</a>}{m.googleDriveFileId && !m.isBaseline && <button className="text-button" onClick={()=>setBaseline(m.id)} disabled={pending}>Use as baseline</button>}</div></div>)}</div></section>
    {message && <div className={message.toLowerCase().includes('could not') || message.toLowerCase().includes('check') ? 'notice error':'notice'}>{message}</div>}
  </div>;
}
