import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionEmail } from '@/lib/auth';
import { logAppIssue, plainUserError } from '@/lib/issues';
import { createSupportTicket, listSupportTickets, supportTicketInputSchema } from '@/lib/support';

export const dynamic = 'force-dynamic';

async function currentUserEmail() {
  const cookieStore = await cookies();
  const email = await sessionEmail(cookieStore.get('jd_session')?.value, process.env.APP_SESSION_SECRET);
  return email ?? process.env.ALLOWED_LOGIN_EMAIL ?? 'authorized-user';
}

export async function GET() {
  try {
    const tickets = await listSupportTickets();
    return NextResponse.json({ tickets });
  } catch (error) {
    await logAppIssue({
      area: 'Support',
      action: 'List support tickets',
      severity: 'ERROR',
      userMessage: 'Support requests could not be loaded.',
      technicalMessage: error instanceof Error ? error.message : String(error),
      route: '/api/support/tickets',
    });
    return NextResponse.json({ error: plainUserError('Support requests could not be loaded. Please try again.', error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = supportTicketInputSchema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Please review the support request and try again.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const ticket = await createSupportTicket(parsed.data, await currentUserEmail());
    return NextResponse.json({
      ticket,
      message: ticket.archiveSyncStatus === 'COMPLETE'
        ? `Support request ${ticket.ticketNumber} was created successfully.`
        : `Support request ${ticket.ticketNumber} was created. The Google archive copy still needs to finish syncing.`,
    }, { status: 201 });
  } catch (error) {
    await logAppIssue({
      area: 'Support',
      action: 'Create support ticket',
      severity: 'ERROR',
      userMessage: 'Your support request could not be submitted.',
      technicalMessage: error instanceof Error ? error.message : String(error),
      route: '/api/support/tickets',
    });
    return NextResponse.json({ error: plainUserError('Your support request could not be submitted. Please try again.', error) }, { status: 500 });
  }
}
