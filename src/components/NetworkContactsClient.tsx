'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { NetworkContact } from '@/lib/network';

function strengthLabel(value: NetworkContact['connectionStrength']) {
  if (value === 'STRONG') return 'Strong warm connection';
  if (value === 'WARM') return 'Warm connection';
  if (value === 'MUTUAL') return 'Mutual connection';
  if (value === 'RECRUITER') return 'Recruiter connection';
  return 'Known contact';
}

function roleLabel(value: NetworkContact['contactRole']) {
  if (value === 'FORMER_COWORKER') return 'Former coworker';
  if (value === 'RECRUITER') return 'Recruiter';
  if (value === 'HIRING_MANAGER') return 'Hiring manager';
  if (value === 'EXECUTIVE') return 'Executive';
  return 'Other';
}

export function NetworkContactsClient({ contacts }: { contacts: NetworkContact[] }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await fetch('/api/network', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = await res.json();
      setMessage(res.ok ? 'Contact saved.' : body.error ?? 'The contact could not be saved.');
      if (res.ok) { form.reset(); router.refresh(); }
    });
  }

  function removeContact(id: string) {
    startTransition(async () => {
      const res = await fetch('/api/network', { method:'DELETE', headers:{'content-type':'application/json'}, body:JSON.stringify({id}) });
      setMessage(res.ok ? 'Contact removed.' : 'The contact could not be removed.');
      if (res.ok) router.refresh();
    });
  }

  return <div className="detail-layout">
    <section className="panel"><h2>Add a professional contact</h2><p className="fit">Only add connections you actually know about. The app does not claim access to LinkedIn or any other professional network.</p><form className="form" onSubmit={addContact} style={{marginTop:12}}>
      <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" required/></div>
      <div className="field"><label htmlFor="contact-company">Company</label><input id="contact-company" name="company" required/></div>
      <div className="field"><label htmlFor="contact-title">Title</label><input id="contact-title" name="title"/></div>
      <div className="field"><label htmlFor="contact-role">Contact type</label><select id="contact-role" name="contactRole" defaultValue="OTHER"><option value="FORMER_COWORKER">Former coworker</option><option value="RECRUITER">Recruiter</option><option value="HIRING_MANAGER">Hiring manager</option><option value="EXECUTIVE">Executive</option><option value="OTHER">Other</option></select></div>
      <div className="field"><label htmlFor="contact-strength">Connection strength</label><select id="contact-strength" name="connectionStrength" defaultValue="KNOWN"><option value="STRONG">Strong warm connection</option><option value="WARM">Warm connection</option><option value="MUTUAL">Mutual connection</option><option value="RECRUITER">Recruiter connection</option><option value="KNOWN">Known contact</option></select></div>
      <div className="field"><label htmlFor="relationship">Relationship</label><input id="relationship" name="relationship" placeholder="Former colleague, former client, recruiter I know, etc."/></div>
      <div className="field"><label htmlFor="contact-notes">Notes</label><textarea id="contact-notes" name="notes" rows={3}/></div>
      <button className="button primary" disabled={pending}>{pending?'Saving…':'Save contact'}</button>
    </form>{message&&<div className={message.toLowerCase().includes('could not')?'notice error':'notice'} style={{marginTop:12}}>{message}</div>}</section>

    <aside className="panel"><h2>Saved contacts</h2>{contacts.length ? <div className="network-contact-list">{contacts.map(contact=><div className="network-contact-card" key={contact.id}><div><strong>{contact.name}</strong><p>{contact.title ? `${contact.title} · ` : ''}{contact.company}</p><span>{roleLabel(contact.contactRole)} · {strengthLabel(contact.connectionStrength)}</span>{contact.relationship&&<small>{contact.relationship}</small>}</div><button className="text-button" disabled={pending} onClick={()=>removeContact(contact.id)}>Remove</button></div>)}</div> : <p className="fit">No contacts added yet. Jobs will simply show “No Known Connection” until you add someone.</p>}</aside>
  </div>;
}
