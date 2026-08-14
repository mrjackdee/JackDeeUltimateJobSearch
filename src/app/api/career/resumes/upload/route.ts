import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { findFileByName, uploadBuffer } from '@/lib/storage/google';
import { updateState } from '@/lib/storage/state';
import { syncCareerProfile } from '@/lib/career';
import type { SearchLane } from '@/lib/types';

async function masterFolderId() {
  if (process.env.GOOGLE_MASTER_FOLDER_ID) return process.env.GOOGLE_MASTER_FOLDER_ID;
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.');
  const folder = await findFileByName('00 - Master Career Documents', root, 'application/vnd.google-apps.folder');
  if (!folder?.id) throw new Error('Master Career Documents folder not found.');
  return folder.id;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('resume');
    const name = String(form.get('name') || 'Updated Master Resume').trim();
    const lane = String(form.get('lane') || 'PROGRAM_PROJECT') as SearchLane;
    const baseline = String(form.get('baseline') || '') === 'true';
    if (!(file instanceof File)) return NextResponse.json({ error: 'A DOCX resume file is required.' }, { status: 400 });
    if (!/\.docx$/i.test(file.name)) return NextResponse.json({ error: 'Only DOCX resume uploads are supported.' }, { status: 400 });
    if (file.size > 5_000_000) return NextResponse.json({ error: 'Resume file exceeds the 5 MB limit.' }, { status: 400 });
    const folder = await masterFolderId();
    const stampedName = `${name.replace(/[^a-z0-9 _-]/gi, '').trim()}_${new Date().toISOString().slice(0,10)}.docx`;
    const uploaded = await uploadBuffer({ name: stampedName, parentId: folder, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(await file.arrayBuffer()) });
    const id = nanoid();
    await updateState(state => {
      if (baseline) state.masterResumes.forEach(r => { r.isBaseline = false; });
      state.masterResumes.push({ id, name, lane, googleDriveFileId: uploaded.id, googleDriveUrl: uploaded.url, status: 'APPROVED', lastUpdated: new Date().toISOString(), isBaseline: baseline });
      if (baseline) state.baselineResumeId = id;
    });
    await syncCareerProfile();
    return NextResponse.json({ ok: true, id, url: uploaded.url });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 500 }); }
}
