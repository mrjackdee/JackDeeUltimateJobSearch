import 'server-only';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { buildCareerEvidenceProfile } from './ai';
import { listFolder, downloadFile, findFileByName, getFileMetadata } from './storage/google';
import { updateState } from './storage/state';
import type { MasterResume } from './types';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';

async function masterFolderId(): Promise<string> {
  if (process.env.GOOGLE_MASTER_FOLDER_ID) return process.env.GOOGLE_MASTER_FOLDER_ID;
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('The app cannot reach your saved resume folder right now.');
  const folder = await findFileByName('00 - Master Career Documents', root, 'application/vnd.google-apps.folder');
  if (!folder?.id) throw new Error('The app could not find your Master Career Documents folder in Google Drive.');
  return folder.id;
}

function masterId(name: string): string | undefined {
  const n = name.toLowerCase();
  if (n.includes('program governance') || n.includes('pmo')) return 'pmo';
  if (n.includes('technical program')) return 'tpm';
  if (n.includes('executive') || n.includes('senior program')) return 'executive';
  if (n.includes('standard project') || /project manager master/.test(n)) return 'pm';
  if (n.includes('scrum') || n.includes('agile')) return 'agile';
  if (n.includes('product owner')) return 'product';
  return undefined;
}

function readableText(value: string) {
  const text = value.replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 80) throw new Error('The resume does not contain enough readable text. If it is a scanned PDF, use a searchable PDF, DOCX file, or Google Doc instead.');
  return text;
}

export async function extractResumeText(fileId: string): Promise<string> {
  const meta = await getFileMetadata(fileId);
  const mime = meta.mimeType ?? '';
  const bytes = await downloadFile(fileId);

  if (mime === PDF_MIME) {
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      return readableText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  if (mime === DOCX_MIME || mime === GOOGLE_DOC_MIME) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return readableText(result.value);
  }

  throw new Error('This resume format cannot be read. Use a DOCX file, PDF file, or Google Doc.');
}

export async function syncCareerProfile() {
  const folder = await masterFolderId();
  const files = await listFolder(folder);
  const usable = files.filter(f => f.id && f.name && [GOOGLE_DOC_MIME, DOCX_MIME, PDF_MIME].includes(f.mimeType ?? ''));
  if (!usable.length) throw new Error('No readable resume files were found. Add a DOCX, PDF, or Google Doc as your baseline resume first.');

  const sources: Array<{ id: string; name: string; text: string }> = [];
  for (const file of usable) {
    try {
      sources.push({ id: file.id!, name: file.name!, text: await extractResumeText(file.id!) });
    } catch (error) {
      console.warn('Career source extraction failed', file.name, error instanceof Error ? error.message : error);
    }
  }
  if (!sources.length) throw new Error('Resume files were found, but none contained enough readable text. Try a DOCX, searchable PDF, or Google Doc.');
  const profile = await buildCareerEvidenceProfile(sources);

  await updateState(state => {
    state.careerProfile = profile;
    const next = state.masterResumes.map(master => {
      const found = usable.find(f => masterId(f.name ?? '') === master.id);
      if (!found?.id) return master;
      return {
        ...master,
        googleDriveFileId: found.id,
        googleDriveUrl: found.webViewLink ?? `https://drive.google.com/open?id=${found.id}`,
        status: 'APPROVED',
        lastUpdated: found.modifiedTime ?? new Date().toISOString(),
      } satisfies MasterResume;
    });
    state.masterResumes = next;
  });
  return profile;
}

export async function getMasterResumeText(masterName: string): Promise<{ id: string; name: string; text: string }> {
  const folder = await masterFolderId();
  const files = await listFolder(folder);
  const normalized = masterName.toLowerCase();
  const preferred = files.find(f => f.id && f.name && normalized.includes('pmo') && /pmo|governance/i.test(f.name))
    ?? files.find(f => f.id && f.name && normalized.includes('technical') && /technical program/i.test(f.name))
    ?? files.find(f => f.id && f.name && normalized.includes('executive') && /executive|senior program/i.test(f.name))
    ?? files.find(f => f.id && f.name && normalized.includes('scrum') && /scrum|agile/i.test(f.name))
    ?? files.find(f => f.id && f.name && normalized.includes('product') && /product owner/i.test(f.name))
    ?? files.find(f => f.id && f.name && normalized.includes('project manager') && /project manager/i.test(f.name))
    ?? files.find(f => f.id && f.name && [GOOGLE_DOC_MIME, DOCX_MIME, PDF_MIME].includes(f.mimeType ?? ''));
  if (!preferred?.id || !preferred.name) throw new Error('No saved resume is available yet.');
  return { id: preferred.id, name: preferred.name, text: await extractResumeText(preferred.id) };
}

export async function getMasterResumeById(masterId: string): Promise<{ id: string; name: string; text: string }> {
  const state = await import('./storage/state').then(m => m.getState());
  const master = state.masterResumes.find(r => r.id === masterId);
  if (!master?.googleDriveFileId) throw new Error('The selected baseline resume could not be found in Google Drive.');
  return { id: master.googleDriveFileId, name: master.name, text: await extractResumeText(master.googleDriveFileId) };
}
