'use client';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
export function LoginForm() {
  const [message,setMessage]=useState(''); const [pending,startTransition]=useTransition(); const router=useRouter();
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault(); const form=new FormData(e.currentTarget); startTransition(async()=>{const res=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessCode:form.get('accessCode')})}); const data=await res.json(); if(!res.ok)setMessage(data.error??'Login failed.'); else {router.push('/');router.refresh();}})}
  return <form className="form" onSubmit={submit}><div className="field"><label htmlFor="accessCode">Private access code</label><input id="accessCode" name="accessCode" type="password" autoComplete="current-password" required/></div><button className="button primary" disabled={pending}>{pending?'Verifying…':'Open Command Center'}</button>{message&&<div className="notice error">{message}</div>}</form>;
}
