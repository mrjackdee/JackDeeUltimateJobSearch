'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, LifeBuoy, Send, TicketCheck } from 'lucide-react';
import type { SupportCategory, SupportPriority, SupportTicket } from '@/lib/support-types';

type Props = {
  initialTickets: SupportTicket[];
  databaseConfigured: boolean;
  supportSheetUrl: string;
};

const categoryLabels: Record<SupportCategory, string> = {
  APP_ISSUE: 'App issue / bug',
  LOGIN_ACCESS: 'Login or access',
  JOB_SEARCH: 'Job search',
  MATCHING_SCORING: 'Matching or scoring',
  RESUME_DOCUMENTS: 'Resume or documents',
  APPLICATION_TRACKING: 'Application tracking',
  GOOGLE_DRIVE: 'Google Drive',
  OTHER: 'Other',
};

const priorityLabels: Record<SupportPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

function pretty(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

export function SupportTicketClient({ initialTickets, databaseConfigured, supportSheetUrl }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [category, setCategory] = useState<SupportCategory>('APP_ISSUE');
  const [priority, setPriority] = useState<SupportPriority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<SupportTicket | null>(null);

  const openCount = useMemo(() => tickets.filter(ticket => ['OPEN', 'IN_PROGRESS', 'WAITING'].includes(ticket.status)).length, [tickets]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setConfirmation(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          priority,
          subject,
          description,
          pageUrl: window.location.href,
          deviceInfo: navigator.userAgent,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Your support request could not be submitted.');
      setTickets(current => [payload.ticket, ...current]);
      setConfirmation(payload.ticket);
      setSubject('');
      setDescription('');
      setCategory('APP_ISSUE');
      setPriority('NORMAL');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your support request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="support-layout">
      <section className="panel support-form-panel" aria-labelledby="support-form-heading">
        <div className="support-panel-head">
          <div>
            <div className="eyebrow">Raise a request</div>
            <h2 id="support-form-heading">Tell us what went wrong.</h2>
          </div>
          <LifeBuoy size={24} aria-hidden="true" />
        </div>

        {!databaseConfigured && (
          <div className="notice error" role="status">
            The support database still needs to be connected before new tickets can be submitted. The form is ready, but requests will not be accepted until that connection is configured.
          </div>
        )}

        {confirmation && (
          <div className="support-confirmation" role="status" aria-live="polite">
            <CheckCircle2 size={24} aria-hidden="true" />
            <div>
              <strong>Request submitted successfully</strong>
              <p>Your ticket number is <b>{confirmation.ticketNumber}</b>. Keep this number for reference.</p>
              {confirmation.archiveSyncStatus !== 'COMPLETE' && <p>The ticket is saved, but its Google Drive archive copy is still pending.</p>}
            </div>
          </div>
        )}

        {error && <div className="notice error" role="alert">{error}</div>}

        <form className="form" onSubmit={submit}>
          <div className="support-two-column">
            <div className="field">
              <label htmlFor="support-category">Request type</label>
              <select id="support-category" value={category} onChange={event => setCategory(event.target.value as SupportCategory)} disabled={submitting}>
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="support-priority">Priority</label>
              <select id="support-priority" value={priority} onChange={event => setPriority(event.target.value as SupportPriority)} disabled={submitting}>
                {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="support-subject">Subject</label>
            <input id="support-subject" value={subject} onChange={event => setSubject(event.target.value)} minLength={5} maxLength={140} required placeholder="Example: Google login returns an error" disabled={submitting} />
          </div>

          <div className="field">
            <label htmlFor="support-description">What happened?</label>
            <textarea id="support-description" value={description} onChange={event => setDescription(event.target.value)} minLength={20} maxLength={5000} required placeholder="Describe what you were doing, what you expected to happen, and what happened instead. Include the exact error message if you saw one." disabled={submitting} />
          </div>

          <div className="support-form-note">RoleBright automatically records the current support page and your browser/device information to help diagnose the issue. It does not collect passwords or OAuth secrets.</div>

          <button className="button primary" type="submit" disabled={submitting || !databaseConfigured}>
            <Send size={16} aria-hidden="true" />
            {submitting ? 'Submitting request...' : 'Submit support request'}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="ticket-history-heading">
        <div className="support-panel-head">
          <div>
            <div className="eyebrow">Request history</div>
            <h2 id="ticket-history-heading">My support tickets</h2>
          </div>
          <div className="support-count"><TicketCheck size={16} aria-hidden="true" /> {openCount} open</div>
        </div>

        <div className="support-actions-row">
          <span>{tickets.length} ticket{tickets.length === 1 ? '' : 's'} on record</span>
          <a className="inline-link" href={supportSheetUrl} target="_blank" rel="noreferrer">Open support register <ExternalLink size={14} aria-hidden="true" /></a>
        </div>

        {tickets.length === 0 ? (
          <div className="empty">No support tickets have been submitted yet.</div>
        ) : (
          <div className="support-ticket-list">
            {tickets.map(ticket => (
              <article className="support-ticket-card" key={ticket.ticketNumber}>
                <div className="support-ticket-topline">
                  <strong>{ticket.ticketNumber}</strong>
                  <span className={`badge ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'good' : ticket.priority === 'URGENT' ? 'danger' : 'warn'}`}>{pretty(ticket.status)}</span>
                </div>
                <h3>{ticket.subject}</h3>
                <div className="meta">
                  <span className="badge">{categoryLabels[ticket.category]}</span>
                  <span className={`badge ${ticket.priority === 'URGENT' ? 'danger' : ticket.priority === 'HIGH' ? 'warn' : ''}`}>{pretty(ticket.priority)}</span>
                </div>
                <p>{ticket.description}</p>
                <div className="support-ticket-footer">
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  {ticket.driveFileUrl && <a className="inline-link" href={ticket.driveFileUrl} target="_blank" rel="noreferrer">Drive record <ExternalLink size={13} aria-hidden="true" /></a>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
