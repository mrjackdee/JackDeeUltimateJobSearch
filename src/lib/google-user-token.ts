import 'server-only';
import { decryptSecret, encryptSecret } from './auth';
import { downloadFile, findFileByName, uploadBuffer } from './storage/google';

const FILE_NAME = '.jd-google-user-token.json';

async function rootId() {
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.');
  return root;
}

export async function saveGoogleUserRefreshToken(refreshToken: string) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is not configured.');
  const root = await rootId();
  const existing = await findFileByName(FILE_NAME, root);
  const encrypted = await encryptSecret(refreshToken, secret);
  await uploadBuffer({
    name: FILE_NAME,
    parentId: root,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ encrypted, updatedAt: new Date().toISOString() })),
    replaceFileId: existing?.id ?? undefined,
  });
}

export async function loadGoogleUserRefreshToken(): Promise<string | undefined> {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return undefined;
  const root = await rootId();
  const existing = await findFileByName(FILE_NAME, root);
  if (!existing?.id) return undefined;
  const raw = JSON.parse((await downloadFile(existing.id)).toString('utf8')) as { encrypted?: string };
  if (!raw.encrypted) return undefined;
  return decryptSecret(raw.encrypted, secret);
}
