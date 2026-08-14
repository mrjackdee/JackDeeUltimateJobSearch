import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { copyFileToFolder, findFileByName, getFileMetadata, uploadBuffer } from '@/lib/storage/google';
import { updateState } from '@/lib/storage/state';
import { syncCareerProfile } from '@/lib/career';
import { logAppIssue, plainUserError } from '@/lib/issues';
import type { SearchLane } from '@/lib/types';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';

async function masterFolderId() {
  if (process.env.GOOGLE_MASTER_FOLDER_ID) return process.env.GOOGLE_MASTER_FOLDER_ID;
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('The app cannot reach your resume folder right now.');
  const folder = await findFileByName('00 - Master Career Documents', root, 'application/vnd.google-apps.folder');
  if (!folder?.id) throw new Error('The app could not find your Master Career Documents folder in Google Drive.');
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

    if (!hasFile && !googleDocId) return NextResponse.json({ error: 'Choose a DOCX or PDF file, or paste a Google Docs link before continuing.' }, { status: 400 });
    if (googleDocInput && !googleDocId) return NextResponse.json({ error: 'That Google Docs link does not look complete. Open the document in Google Docs, copy the full address from your browser, and try again.' }, { status: 400 });
    if (hasFile && googleDocId) return NextResponse.json({ error: 'Please choose only one resume source. Either upload a DOCX/PDF file or use a Google Docs link.' }, { status: 400 });

    const folder = await masterFolderId();
    let stored: { id: string; url: string };

    if (googleDocId) {
      let meta;
      try { meta = await getFileMetadata(googleDocId); }
      catch { return NextResponse.json({ error: 'The app could not open that Google Doc. Make sure the same Google account can open it, then copy the full document link and try again.' }, { status: 400 }); }
      if (meta.mimeType !== GOOGLE_DOC_MIME) return NextResponse.json({ error: 'That link is not a Google Doc. Open the resume in Google Docs and paste that document link instead.' }, { status: 400 });
      const cleanName = name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'Updated Master Resume';
      stored = await copyFileToFolder({ fileId: googleDocId, name: `${cleanName}_${new Date().toISOString().slice(0,10)}`, parentId: folder });
    } else {
      const resumeFile = file as File;
      const lower = resumeFile.name.toLowerCase();
      const isDocx = lower.endsWith('.docx') || resumeFile.type === DOCX_MIME;
      const isPdf = lower.endsWith('.pdf') || resumeFile.type === PDF_MIME;
      if (!isDocx && !isPdf) return NextResponse.json({ error: 'Please choose a Word DOCX file or PDF file.' }, { status: 400 });
      if (resumeFile.size > 10_000_000) return NextResponse.json({ error: 'That resume is larger than 10 MB. Please use a smaller file and try again.' }, { status: 400 });
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
    console.error('Resume update failed', error);
    const message = plainUserError('The resume could not be saved right now. Please try again. If this keeps happening, check the Google Drive connection in Settings.', error);
    await logAppIssue({ area: 'Resume setup', action: 'Add or change the baseline resume', severity: 'ERROR', userMessage: message, technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error), route: '/api/career/resumes/upload', statusCode: 500, resolved: false });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
