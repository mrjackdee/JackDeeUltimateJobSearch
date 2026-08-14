'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/admin/report-issue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        area: 'App screen',
        action: 'Open or use a page',
        severity: 'ERROR',
        userMessage: 'A page could not finish loading or completing the requested action.',
        technicalMessage: `${error.message}${error.digest ? `\nReference: ${error.digest}` : ''}`,
        route: window.location.pathname,
      }),
    }).catch(() => undefined);
  }, [error]);

  return <div className="friendly-error">
    <div className="friendly-error-card">
      <AlertTriangle size={28}/>
      <div className="eyebrow">Something needs attention</div>
      <h1>This page could not finish what it was doing.</h1>
      <p>You did not lose your saved job-search information. Try the action again. If it happens again, open Admin & Diagnostics from Settings and download the issue log for troubleshooting.</p>
      <div className="hero-actions"><button className="button primary" onClick={reset}><RefreshCcw size={15}/>Try again</button><Link className="button" href="/">Return home</Link></div>
    </div>
  </div>;
}
