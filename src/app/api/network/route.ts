import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { updateState } from '@/lib/storage/state';
import { ensureNetworkContacts, type ConnectionStrength, type ContactRole } from '@/lib/network';
import { logAppIssue, plainUserError } from '@/lib/issues';

const strengths: ConnectionStrength[] = ['STRONG','WARM','MUTUAL','KNOWN','RECRUITER'];
const roles: ContactRole[] = ['FORMER_COWORKER','RECRUITER','HIRING_MANAGER','EXECUTIVE','OTHER'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const company = String(body.company ?? '').trim();
    const connectionStrength = strengths.includes(body.connectionStrength) ? body.connectionStrength as ConnectionStrength : 'KNOWN';
    const contactRole = roles.includes(body.contactRole) ? body.contactRole as ContactRole : 'OTHER';
    if (!name || !company) return NextResponse.json({ error: 'Enter the contact name and company.' }, { status: 400 });

    const contact = await updateState(state => {
      const contacts = ensureNetworkContacts(state);
      const now = new Date().toISOString();
      const row = {
        id: nanoid(),
        name,
        company,
        title: String(body.title ?? '').trim() || undefined,
        relationship: String(body.relationship ?? '').trim() || undefined,
        connectionStrength,
        contactRole,
        referralRequested: Boolean(body.referralRequested),
        referralReceived: Boolean(body.referralReceived),
        notes: String(body.notes ?? '').trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      contacts.push(row);
      return row;
    });
    return NextResponse.json(contact);
  } catch (error) {
    const userMessage = plainUserError('The contact could not be saved right now. Please try again.', error);
    await logAppIssue({ area:'Networking', action:'Add a professional contact', severity:'ERROR', userMessage, technicalMessage:error instanceof Error ? error.stack ?? error.message : String(error), route:'/api/network', statusCode:500, resolved:false });
    return NextResponse.json({ error:userMessage }, { status:500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '');
    await updateState(state => {
      const contacts = ensureNetworkContacts(state);
      const index = contacts.findIndex(contact => contact.id === id);
      if (index >= 0) contacts.splice(index, 1);
    });
    return NextResponse.json({ ok:true });
  } catch (error) {
    const userMessage = plainUserError('The contact could not be removed right now. Please try again.', error);
    return NextResponse.json({ error:userMessage }, { status:500 });
  }
}
