'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function TargetCompaniesClient({ companies }: { companies: string[] }) {
  const [value, setValue] = useState(companies.join('\n'));
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.split(/\n|,/).map(item => item.trim()).filter(Boolean);
    startTransition(async () => {
      const res = await fetch('/api/settings/target-companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companies: next }),
      });
      const data = await res.json();
      setMessage(res.ok ? 'Your target company list was saved.' : data.error ?? 'Your target company list could not be saved.');
      if (res.ok) router.refresh();
    });
  }

  return <section className="panel">
    <h2>Target Companies</h2>
    <p className="fit">The app can give extra search coverage to companies you want to watch. A job still has to pass the same resume-evidence and match requirements before it is recommended.</p>
    <form className="form" onSubmit={save} style={{marginTop:12}}>
      <div className="field"><label htmlFor="target-companies">Companies to watch</label><textarea id="target-companies" value={value} onChange={event => setValue(event.target.value)} rows={9}/><span className="field-help">Enter one company per line. You can change this list at any time.</span></div>
      <button className="button primary" disabled={pending}>{pending ? 'Saving…' : 'Save target companies'}</button>
    </form>
    {message && <div className={message.toLowerCase().includes('could not') ? 'notice error' : 'notice'} style={{marginTop:12}}>{message}</div>}
  </section>;
}
