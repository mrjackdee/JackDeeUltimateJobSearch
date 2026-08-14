import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { copyFileToFolder, findFileByName, getFileMetadata, uploadBuffer } from '@/lib/storage/google';
import { updateState } from '@/lib/storage/state';
import { syncCareerProfile } from '@/lib/career';
import type { SearchLane } from '@/lib/types';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';

async function masterFolderId() {
  if (process.env.GOOGLE_MASTER_FOLDER_ID) return process.env.GOOGLE_MASTER_FOLDER_ID;
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.');
  const folder = await findFileByName('00 - Master Career Documents', root, 'application/vnd.google-apps.folder');
  if (!folder?.id) throw new Error('Master Career Documents folder not found.');
  return folder.id;
}

function extractGoogleDocId(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('resume');
    const googleDocInput = String(form.get('googleDocUrl') || '').trim();
    const name = String(form.get('name') || 'Updated Master Resume').trim();
    const lane = String(form.get('lane') || 'PROGRAM_PROJECT') as SearchLane;
    const baseline = String(form.get('baseline') || '') === 'true';
    const hasFile = file instanceof File && file.size > 0;
    const googleDocId = extractGoogleDocId(googleDocInput);

    if (!hasFile && !googleDocId) {
      return NextResponse.json({ error: 'Upload a DOCX or PDF resume, or provide a Google Docs URL.' }, { status: 400 });
    }
    if (hasFile && googleDocId) {
      return NextResponse.json({ error: 'Choose one source: a DOCX/PDF upload or a Google Docs URL.' }, { status: 400 });
    }

    const folder = await masterFolderId();
    let stored: { id: string; url: string };

    if (googleDocId) {
      const meta = await getFileMetadata(googleDocId);
      if (meta.mimeType !== GOOGLE_DOC_MIME) {
        return NextResponse.json({ error: 'The Google Drive link must point to a native Google Docs document.' }, { status: 400 });
      }
      const cleanName = name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'Updated Master Resume';
      stored = await copyFileToFolder({ fileId: googleDocId, name: `${cleanName}_${new Date().toISOString().slice(0,10)}`, parentId: folder });
    } else {
      const resumeFile = file as File;
      const lower = resumeFile.name.toLowerCase();
      const isDocx = lower.endsWith('.docx') || resumeFile.type === DOCX_MIME;
      const isPdf = lower.endsWith('.pdf') || resumeFile.type === PDF_MIME;
      if (!isDocx && !isPdf) {
        return NextResponse.json({ error: 'Only DOCX and PDF file uploads are supported.' }, { status: 400 });
      }
      if (resumeFile.size > 10_000_000) {
        return NextResponse.json({ error: 'Resume file exceeds the 10 MB limit.' }, { status: 400 });
      }
      const extension = isPdf ? 'pdf' : 'docx';
      const mimeType = isPdf ? PDF_MIME : DOCX_MIME;
      const cleanName = name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'Updated Master Resume';
      const stampedName = `${cleanName}_${new Date().toISOString().slice(0,10)}.${extension}`;
      stored = await uploadBuffer({ name: stampedName, parentId: folder, mimeType, buffer: Buffer.from(await resumeFile.arrayBuffer()) });
    }

    const id = nanoid();
    await updateState(state => {
      if (baseline) state.masterResumes.forEach(r => { r.isBaseline = false; });
      state.masterResumes.push({ id, name, lane, googleDriveFileId: stored.id, googleDriveUrl: stored.url, status: 'APPROVED', lastUpdated: new Date().toISOString(), isBaseline: baseline });
      if (baseline) state.baselineResumeId = id;
    });
    await syncCareerProfile();
    return NextResponse.json({ ok: true, id, url: stored.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 500 });
  }
}
