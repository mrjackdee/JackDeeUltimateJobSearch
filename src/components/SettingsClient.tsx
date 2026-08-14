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
  function saveSearchPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await fetch('/api/settings/search-preferences', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({
          fitThreshold: Number(form.get('fitThreshold')),
          lookbackDays: Number(form.get('lookbackDays')),
          showStretchRoles: form.get('showStretchRoles') === 'on',
          showContractRoles: form.get('showContractRoles') === 'on',
        }),
      });
      const data = await res.json();
      setMessage(res.ok ? 'Your job matching preferences were saved.' : data.error ?? 'Your search preferences could not be saved. Please try again.');
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
    <section className="panel"><h2>Job matching preferences</h2><p className="fit">The app compares the complete available job description with evidence in your active resume. These controls determine which jobs make it into your recommended results.</p><form className="form" onSubmit={saveSearchPreferences} style={{marginTop:14}}>
      <div className="field"><label htmlFor="fitThreshold">Minimum Match Score</label><select id="fitThreshold" name="fitThreshold" defaultValue={String(settings.fitThreshold)}>{[70,75,80,85,90,95].map(value=><option key={value} value={value}>{value}+</option>)}</select><span className="field-help">Default is 80. Higher scores make the recommendations more selective.</span></div>
      <div className="field"><label htmlFor="lookbackDays">Posted within</label><select id="lookbackDays" name="lookbackDays" defaultValue={String(settings.lookbackDays)}><option value="1">24 hours</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></div>
      <label className="settings-toggle"><input type="checkbox" name="showStretchRoles" defaultChecked={Boolean(settings.showStretchRoles)}/><span><strong>Show Stretch Roles</strong><small>Include credible roles scoring 70–79 even when they fall below your selected minimum.</small></span></label>
      <label className="settings-toggle"><input type="checkbox" name="showContractRoles" defaultChecked={Boolean(settings.showContractRoles)}/><span><strong>Show Contract Roles</strong><small>Permanent full-time jobs are shown by default. Turn this on when you also want contract opportunities.</small></span></label>
      <button className="button primary" disabled={pending}>{pending ? 'Saving…' : 'Save matching preferences'}</button>
    </form></section>

    <aside className="panel"><h2>Your search profile</h2><div className="kv">
      <div className="kv-row"><div className="kv-key">Target compensation</div><div>${(settings.targetSalary ?? 200000).toLocaleString()}+</div></div>
      <div className="kv-row"><div className="kv-key">Fully remote minimum</div><div>${(settings.remoteSalaryFloor ?? settings.salaryFloor).toLocaleString()}</div></div>
      <div className="kv-row"><div className="kv-key">Hybrid / on-site minimum</div><div>${(settings.hybridOnsiteSalaryFloor ?? settings.salaryFloor).toLocaleString()}</div></div>
      <div className="kv-row"><div className="kv-key">Hybrid / on-site locations</div><div>Atlanta and Dallas/Fort Worth</div></div>
      <div className="kv-row"><div className="kv-key">Fully remote locations</div><div>United States</div></div>
      <div className="kv-row"><div className="kv-key">Automatic searches</div><div>7:00 AM and 4:00 PM Eastern</div></div>
      <div className="kv-row"><div className="kv-key">Email notifications</div><div><span className={`badge ${notificationsEnabled ? 'good':'warn'}`}>{notificationsEnabled ? 'ON':'OFF'}</span></div></div>
    </div><p className="field-help" style={{marginTop:12}}>These preferences are available only after you sign in and are used to rank your private job-search results.</p></aside>

    <section className="panel"><h2>How matching works</h2><p className="fit">A job is not recommended just because its title sounds relevant. The app checks responsibilities, required qualifications, seniority, industry knowledge, technologies, work location, and compensation against evidence in your resume.</p><div className="kv" style={{marginTop:10}}><div className="kv-row"><div className="kv-key">85+ scores</div><div>Receive a second independent review</div></div><div className="kv-row"><div className="kv-key">Hard requirements</div><div>Checked separately for possible disqualification</div></div><div className="kv-row"><div className="kv-key">Missing experience</div><div>Shown as a gap, never invented in your resume</div></div></div></section>

    <aside className="panel"><h2>Connected services</h2><p className="fit">These are the services the app uses in the background. “Ready” means no action is needed.</p><div className="kv" style={{marginTop:10}}>{Object.entries(integration).map(([key,value]) => <div className="kv-row" key={key}><div className="kv-key">{key}</div><div><span className={`badge ${value ? 'good':'danger'}`}>{value ? 'READY':'NEEDS ATTENTION'}</span></div></div>)}</div></aside>

    <section className="panel"><h2>Email updates</h2><p className="fit">The app can email <strong>jackdee.sync@gmail.com</strong> when scheduled searches find results and when application materials are ready.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={testNotification}>Send test email</button><button className="button" disabled={pending} onClick={()=>toggleNotifications(!notificationsEnabled)}>{notificationsEnabled ? 'Turn email updates off' : 'Turn email updates on'}</button></div></section>

    <section id="career-profile" className="panel"><h2>Career Profile</h2><p className="fit">Status: <strong>{hasCareerProfile ? 'Ready' : 'Needs to be created'}</strong>. The app reads your approved resume files to build a private evidence profile of your experience, skills, education, accomplishments, leadership scope, and technologies. This is the evidence used to judge job matches and keep tailored resumes accurate.</p><div className="hero-actions"><button className="button primary" disabled={pending} onClick={syncCareer}>{pending ? 'Refreshing…' : 'Refresh Career Profile'}</button></div></section>

    <section id="baseline-resume" className="panel"><h2>Update baseline resume</h2><p className="fit">Your baseline resume is the source of truth the app uses when it compares you with jobs and prepares tailored application materials. You can add a newer version at any time as a DOCX, PDF, or Google Doc. Your older versions stay safely stored in Google Drive.</p><ol className="settings-steps"><li>Give the resume a name you will recognize later.</li><li>Select the type of jobs this resume is best suited for.</li><li>Choose one option: upload a DOCX or PDF file, or paste the link to a Google Doc you can open with this Google account.</li><li>Select <strong>Add and use as baseline</strong>. The app saves a copy, makes it your active resume, and refreshes your Career Profile.</li><li>To switch back later, choose <strong>Use as baseline</strong> beside another resume in your saved resume list.</li></ol><form className="form" onSubmit={uploadResume} style={{marginTop:12}}><div className="field"><label htmlFor="name">Resume name</label><input id="name" name="name" defaultValue="Current Master Resume" required/></div><div className="field"><label htmlFor="lane">Best fit for</label><select id="lane" name="lane" defaultValue="PROGRAM_PROJECT"><option value="PROGRAM_PROJECT">Project and Program Management</option><option value="EXECUTIVE">Executive Leadership</option><option value="AGILE">Agile Leadership</option><option value="PRODUCT">Product Leadership</option></select></div><div className="field"><label htmlFor="resume">Upload a DOCX or PDF</label><input id="resume" name="resume" type="file" accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"/><span className="field-help">Files can be up to 10 MB. Leave this blank if you are using a Google Docs link instead.</span></div><div className="source-divider"><span>or</span></div><div className="field"><label htmlFor="googleDocUrl">Paste a Google Docs link</label><input id="googleDocUrl" name="googleDocUrl" type="url" placeholder="https://docs.google.com/document/d/..."/><span className="field-help">Use a Google Doc that opens with the same Google account you use to sign in here. Leave this blank if you uploaded a file.</span></div><button className="button primary" disabled={pending}>Add and use as baseline</button></form></section>

    <section className="panel"><h2>Saved resumes</h2><p className="fit">All saved resume versions remain available so you can change your active baseline whenever needed.</p><div className="kv" style={{marginTop:10}}>{masterResumes.map(m => <div className="kv-row" key={m.id}><div className="kv-key">{m.name}</div><div className="resume-library-actions"><span className={`badge ${m.status === 'APPROVED' ? 'good':'warn'}`}>{m.status === 'APPROVED' ? 'READY' : 'REVIEW'}</span>{m.isBaseline && <span className="badge good">ACTIVE BASELINE</span>}{m.googleDriveUrl && <a href={m.googleDriveUrl} target="_blank" rel="noreferrer" className="inline-link">Open in Drive</a>}{m.googleDriveFileId && !m.isBaseline && <button className="text-button" onClick={()=>setBaseline(m.id)} disabled={pending}>Use as baseline</button>}</div></div>)}</div></section>
    {message && <div className={message.toLowerCase().includes('could not') || message.toLowerCase().includes('check') ? 'notice error':'notice'}>{message}</div>}
  </div>;
}
