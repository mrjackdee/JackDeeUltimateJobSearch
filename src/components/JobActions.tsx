'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationPackage, ApplicationStatus } from '@/lib/types';

export function JobActions({ jobId, packages, currentStatus }: { jobId: string; packages: ApplicationPackage[]; currentStatus?: ApplicationStatus }) {
  const [message,setMessage] = useState('');
  const [pending,startTransition] = useTransition();
  const router = useRouter();
  async function prepare(force=false) {
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/prepare`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({forceNewVersion:force}) });
      const data = await res.json(); setMessage(res.ok ? `Application package v${data.version} is ready.` : data.error ?? 'Preparation failed.'); router.refresh();
    });
  }
  async function setStatus(status: ApplicationStatus) {
    const latestReady = packages.filter(p => p.packageStatus === 'READY_TO_APPLY' && !p.superseded).sort((a,b)=>b.version-a.version)[0];
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${jobId}/status`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({status, packageId: status === 'APPLIED' ? latestReady?.id : undefined}) });
      const data = await res.json(); setMessage(res.ok ? `Status updated to ${status.replaceAll('_',' ')}.` : data.error ?? 'Status update failed.'); router.refresh();
    });
  }
  return <div className="panel"><h2>Next action</h2><div className="hero-actions"><button className="button accent" disabled={pending} onClick={()=>prepare(false)}>Prepare Application</button>{packages.length>0 && <button className="button" disabled={pending} onClick={()=>prepare(true)}>Generate New Version</button>}<button className="button primary" disabled={pending || !packages.some(p=>p.packageStatus==='READY_TO_APPLY'&&!p.superseded)} onClick={()=>setStatus('APPLIED')}>Mark Applied</button></div><div className="hero-actions"><select className="button" value={currentStatus ?? 'DISCOVERED'} onChange={e=>setStatus(e.target.value as ApplicationStatus)} disabled={pending} aria-label="Application status"><option>DISCOVERED</option><option>REVIEWING</option><option>PREPARING</option><option>READY_TO_APPLY</option><option>APPLIED</option><option>RECRUITER_CONTACT</option><option>INTERVIEW</option><option>FINAL_INTERVIEW</option><option>OFFER</option><option>REJECTED</option><option>WITHDRAWN</option><option>CLOSED</option><option>ARCHIVED</option></select></div>{message&&<div className={message.toLowerCase().includes('failed')?'notice error':'notice'} style={{marginTop:12}}>{message}</div>}</div>;
}
