'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationPackage, ApplicationStatus } from '@/lib/types';

const STATUS_LABELS: Record<ApplicationStatus,string> = {
  DISCOVERED:'Found', REVIEWING:'Reviewing', PREPARING:'Preparing materials', READY_TO_APPLY:'Ready to apply', APPLIED:'Applied', RECRUITER_CONTACT:'Recruiter contacted me', INTERVIEW:'Interviewing', FINAL_INTERVIEW:'Final interview', OFFER:'Offer received', REJECTED:'Not selected', WITHDRAWN:'I withdrew', CLOSED:'Closed', ARCHIVED:'Archived'
};

export function JobActions({ jobId, packages, currentStatus }: { jobId: string; packages: ApplicationPackage[]; currentStatus?: ApplicationStatus }) {
  const [message,setMessage] = useState('');
  const [pending,startTransition] = useTransition();
  const router = useRouter();
  async function prepare(force=false) {
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/prepare`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({forceNewVersion:force}) });
      const data = await res.json(); setMessage(res.ok ? `Your application materials are ready${data.version ? ` (version ${data.version})` : ''}.` : data.error ?? 'The application materials could not be prepared. Please try again.'); router.refresh();
    });
  }
  async function setStatus(status: ApplicationStatus) {
    const latestReady = packages.filter(p => p.packageStatus === 'READY_TO_APPLY' && !p.superseded).sort((a,b)=>b.version-a.version)[0];
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/status`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({status, packageId: status === 'APPLIED' ? latestReady?.id : undefined}) });
      const data = await res.json(); setMessage(res.ok ? `Application status changed to “${STATUS_LABELS[status]}.”` : data.error ?? 'The application status could not be changed. Please try again.'); router.refresh();
    });
  }
  return <div className="panel"><h2>What would you like to do next?</h2><div className="hero-actions"><button className="button accent" disabled={pending} onClick={()=>prepare(false)}>Prepare resume & cover letter</button>{packages.length>0 && <button className="button" disabled={pending} onClick={()=>prepare(true)}>Create another version</button>}<button className="button primary" disabled={pending || !packages.some(p=>p.packageStatus==='READY_TO_APPLY'&&!p.superseded)} onClick={()=>setStatus('APPLIED')}>Mark as applied</button></div><div className="field" style={{marginTop:12,maxWidth:280}}><label htmlFor="application-status">Where are you with this job?</label><select id="application-status" value={currentStatus ?? 'DISCOVERED'} onChange={e=>setStatus(e.target.value as ApplicationStatus)} disabled={pending}>{(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(status=><option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select></div>{message&&<div className={message.toLowerCase().includes('could not')?'notice error':'notice'} style={{marginTop:12}}>{message}</div>}</div>;
}
