import 'server-only';

import { google } from 'googleapis';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { driveClient, googleAuth } from './storage/google';
import { supportCategories, supportPriorities, type SupportTicket, type SupportTicketInput } from './support-types';

const ticketSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export const supportTicketInputSchema = z.object({
  category: z.enum(supportCategories),
  priority: z.enum(supportPriorities),
  subject: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(5000),
  pageUrl: z.string().trim().max(1000).optional().default(''),
  deviceInfo: z.string().trim().max(1000).optional().default(''),
});

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra?: Record<string, string>) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Support database is not configured.');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function supabaseEndpoint(path: string) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Support database is not configured.');
  return `${base}/rest/v1/${path}`;
}

function mapRow(row: Record<string, unknown>): SupportTicket {
  return {
    ticketNumber: String(row.ticket_number),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: String(row.status) as SupportTicket['status'],
    category: String(row.category) as SupportTicket['category'],
    priority: String(row.priority) as SupportTicket['priority'],
    subject: String(row.subject),
    description: String(row.description),
    pageUrl: String(row.page_url ?? ''),
    deviceInfo: String(row.device_info ?? ''),
    userEmail: String(row.user_email),
    driveFileId: row.drive_file_id ? String(row.drive_file_id) : undefined,
    driveFileUrl: row.drive_file_url ? String(row.drive_file_url) : undefined,
    archiveSyncStatus: String(row.archive_sync_status ?? 'PENDING') as SupportTicket['archiveSyncStatus'],
  };
}

async function insertDatabaseTicket(ticket: SupportTicket) {
  if (!supabaseConfigured()) throw new Error('Support database is not configured.');
  const response = await fetch(supabaseEndpoint('support_tickets'), {
    method: 'POST',
    headers: supabaseHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      ticket_number: ticket.ticketNumber,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      subject: ticket.subject,
      description: ticket.description,
      page_url: ticket.pageUrl || null,
      device_info: ticket.deviceInfo || null,
      user_email: ticket.userEmail,
      archive_sync_status: ticket.archiveSyncStatus,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Support database write failed (${response.status}).`);
}

async function updateDatabaseArchive(ticketNumber: string, archive: { status: 'COMPLETE' | 'FAILED'; driveFileId?: string; driveFileUrl?: string }) {
  if (!supabaseConfigured()) return;
  const response = await fetch(supabaseEndpoint(`support_tickets?ticket_number=eq.${encodeURIComponent(ticketNumber)}`), {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      updated_at: new Date().toISOString(),
      archive_sync_status: archive.status,
      drive_file_id: archive.driveFileId ?? null,
      drive_file_url: archive.driveFileUrl ?? null,
    }),
    cache: 'no-store',
  });
  if (!response.ok) console.error('Unable to update support archive status', ticketNumber, response.status);
}

async function createDriveTicketRecord(ticket: SupportTicket) {
  const parentId = process.env.SUPPORT_GOOGLE_DRIVE_FOLDER_ID;
  if (!parentId) throw new Error('Support Drive folder is not configured.');

  const drive = await driveClient();
  const created = await drive.files.create({
    requestBody: {
      name: `${ticket.ticketNumber} - ${ticket.subject}`.slice(0, 180),
      mimeType: 'application/vnd.google-apps.document',
      parents: [parentId],
    },
    fields: 'id,webViewLink',
  });
  if (!created.data.id) throw new Error('Unable to create the support ticket Drive record.');

  const docs = google.docs({ version: 'v1', auth: await googleAuth() });
  const body = [
    'ROLEBRIGHT SUPPORT TICKET',
    '',
    `Ticket: ${ticket.ticketNumber}`,
    `Status: ${ticket.status}`,
    `Priority: ${ticket.priority}`,
    `Category: ${ticket.category.replaceAll('_', ' ')}`,
    `Created: ${ticket.createdAt}`,
    `Submitted by: ${ticket.userEmail}`,
    '',
    'SUBJECT',
    ticket.subject,
    '',
    'DESCRIPTION',
    ticket.description,
    '',
    'SOURCE PAGE',
    ticket.pageUrl || 'Not provided',
    '',
    'DEVICE / BROWSER',
    ticket.deviceInfo || 'Not provided',
    '',
    'SYSTEM NOTE',
    'This record was created automatically by RoleBright when the support request was submitted.',
  ].join('\n');

  await docs.documents.batchUpdate({
    documentId: created.data.id,
    requestBody: { requests: [{ insertText: { location: { index: 1 }, text: body } }] },
  });

  return {
    id: created.data.id,
    url: created.data.webViewLink ?? `https://docs.google.com/document/d/${created.data.id}/edit`,
  };
}

async function appendTicketToSheet(ticket: SupportTicket) {
  const spreadsheetId = process.env.SUPPORT_GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('Support Google Sheet is not configured.');
  const sheets = google.sheets({ version: 'v4', auth: await googleAuth() });
  const driveLink = ticket.driveFileUrl ? `=HYPERLINK("${ticket.driveFileUrl.replaceAll('"', '""')}","Open ticket")` : '';
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Tickets!A:M',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        ticket.ticketNumber,
        ticket.createdAt,
        ticket.status,
        ticket.priority,
        ticket.category.replaceAll('_', ' '),
        ticket.subject,
        ticket.description,
        ticket.pageUrl,
        ticket.userEmail,
        ticket.deviceInfo,
        driveLink,
        ticket.archiveSyncStatus,
        ticket.updatedAt,
      ]],
    },
  });
}

export async function createSupportTicket(input: SupportTicketInput, userEmail: string): Promise<SupportTicket> {
  const parsed = supportTicketInputSchema.parse(input);
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
  const ticket: SupportTicket = {
    ...parsed,
    ticketNumber: `RB-${datePart}-${ticketSuffix()}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'OPEN',
    userEmail,
    archiveSyncStatus: 'PENDING',
  };

  await insertDatabaseTicket(ticket);

  try {
    const driveRecord = await createDriveTicketRecord(ticket);
    ticket.driveFileId = driveRecord.id;
    ticket.driveFileUrl = driveRecord.url;
    ticket.archiveSyncStatus = 'COMPLETE';
    ticket.updatedAt = new Date().toISOString();
    await appendTicketToSheet(ticket);
    await updateDatabaseArchive(ticket.ticketNumber, { status: 'COMPLETE', driveFileId: driveRecord.id, driveFileUrl: driveRecord.url });
  } catch (error) {
    ticket.archiveSyncStatus = 'FAILED';
    ticket.updatedAt = new Date().toISOString();
    await updateDatabaseArchive(ticket.ticketNumber, { status: 'FAILED', driveFileId: ticket.driveFileId, driveFileUrl: ticket.driveFileUrl });
    console.error('Support ticket Google archive sync failed', ticket.ticketNumber, error);
  }

  return ticket;
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  if (!supabaseConfigured()) return [];
  const response = await fetch(supabaseEndpoint('support_tickets?select=*&order=created_at.desc&limit=100'), {
    headers: supabaseHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Support database read failed (${response.status}).`);
  const rows = await response.json() as Record<string, unknown>[];
  return rows.map(mapRow);
}

export function supportDatabaseConfigured() {
  return supabaseConfigured();
}
