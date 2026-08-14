import { google } from 'googleapis';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function encodePayload(payload: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(value: string): Record<string, unknown> | undefined {
  try { return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); } catch { return undefined; }
}

export async function createSessionToken(secret: string, email = process.env.ALLOWED_LOGIN_EMAIL ?? ''): Promise<string> {
  const payload = encodePayload({ email: email.toLowerCase(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function sessionEmail(token: string | undefined, secret: string | undefined): Promise<string | undefined> {
  if (!token || !secret) return undefined;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return undefined;
  const expected = await hmac(payload, secret);
  if (expected.length !== signature.length) return undefined;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return undefined;
  const decoded = decodePayload(payload);
  const exp = Number(decoded?.exp ?? 0);
  const email = String(decoded?.email ?? '').toLowerCase();
  if (!email || exp < Date.now()) return undefined;
  return email;
}

export async function validSessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  const email = await sessionEmail(token, secret);
  const allowed = (process.env.ALLOWED_LOGIN_EMAIL ?? 'jackdee.sync@gmail.com').toLowerCase();
  return Boolean(email && email === allowed);
}

export function appSecurityConfigured() {
  return Boolean(process.env.APP_SESSION_SECRET && process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.ALLOWED_LOGIN_EMAIL);
}

export function oauthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth is not configured.');
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function encryptSecret(value: string, secret: string): Promise<string> {
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value));
  return `${Buffer.from(iv).toString('base64url')}.${Buffer.from(cipher).toString('base64url')}`;
}

export async function decryptSecret(value: string, secret: string): Promise<string> {
  const [ivPart, cipherPart] = value.split('.');
  if (!ivPart || !cipherPart) throw new Error('Encrypted secret is invalid.');
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(ivPart, 'base64url') }, key, Buffer.from(cipherPart, 'base64url'));
  return decoder.decode(plain);
}
