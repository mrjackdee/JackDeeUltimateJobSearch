import { SupportTicketClient } from '@/components/SupportTicketClient';
import { listSupportTickets, supportDatabaseConfigured } from '@/lib/support';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  let tickets = [];
  try {
    tickets = await listSupportTickets();
  } catch {
    tickets = [];
  }

  return (
    <>
      <section className="hero support-hero">
        <div className="eyebrow">RoleBright Support</div>
        <h1>Report an issue and keep track of the request.</h1>
        <p>Use this page when something in RoleBright is not working as expected. Every submitted request receives a ticket number and is stored in the support database, Google Drive, and the support register.</p>
      </section>
      <SupportTicketClient
        initialTickets={tickets}
        databaseConfigured={supportDatabaseConfigured()}
        supportSheetUrl="https://docs.google.com/spreadsheets/d/1L8fBHeufSQlUO18X9ivK6eW3RRbmD6zAmtHb3Q1urQU/edit"
      />
    </>
  );
}
