'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function ImportForm() {
  const [result, setResult] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(formData: FormData) {
    setResult('');
    startTransition(async () => {
      const payload = Object.fromEntries([...formData.entries()].filter(([,v]) => String(v).trim()));
      const res = await fetch('/api/import', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) setResult(data.error ?? 'Import failed.');
      else if (data.excluded) setResult(`Imported for review but excluded from the primary queue: ${data.reasons.join(' ')}`);
      else { setResult(`Imported and analyzed. Fit score: ${data.analysis?.overallFitScore ?? 'pending'}.`); router.refresh(); }
    });
  }
  return <form className="form" action={submit}>
    <div className="field"><label htmlFor="url">Job posting URL</label><input id="url" name="url" type="url" required placeholder="https://company.com/careers/job/..."/></div>
    <div className="notice">The app will try to extract structured JobPosting data from the URL. If the page blocks automated access, paste the description and the missing fields below.</div>
    <div className="field"><label htmlFor="title">Job title (optional if detectable)</label><input id="title" name="title"/></div>
    <div className="field"><label htmlFor="company">Company (optional if detectable)</label><input id="company" name="company"/></div>
    <div className="field"><label htmlFor="location">Location (optional if detectable)</label><input id="location" name="location" placeholder="Atlanta, GA / Dallas, TX / Remote"/></div>
    <div className="field"><label htmlFor="description">Full job description (optional if detectable)</label><textarea id="description" name="description"/></div>
    <button className="button primary" disabled={pending}>{pending ? 'Analyzing…' : 'Import and Analyze'}</button>
    {result && <div className={result.toLowerCase().includes('failed') || result.toLowerCase().includes('excluded') ? 'notice error' : 'notice'}>{result}</div>}
  </form>;
}
