import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, oauthClient } from '@/lib/auth';
import { saveGoogleUserRefreshToken } from '@/lib/google-user-token';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('jd_oauth_state')?.value;
  if (!code || !state || !expectedState || state !== expectedState) return NextResponse.redirect(new URL('/login?error=oauth_state', request.url));
  const redirectUri = new URL('/api/auth/google/callback', request.nextUrl.origin).toString();
  const oauth = oauthClient(redirectUri);
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);
  if (!tokens.id_token) return NextResponse.redirect(new URL('/login?error=identity', request.url));
  const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_OAUTH_CLIENT_ID });
  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();
  if (!payload?.email_verified) return NextResponse.redirect(new URL('/login?error=unverified', request.url));
  const allowed = (process.env.ALLOWED_LOGIN_EMAIL ?? 'jackdee.sync@gmail.com').toLowerCase();
  if (!email || email !== allowed) return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  if (tokens.refresh_token) await saveGoogleUserRefreshToken(tokens.refresh_token, tokens.access_token ?? undefined);
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is not configured.');
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('jd_session', await createSessionToken(secret, email), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 });
  response.cookies.delete('jd_oauth_state');
  return response;
}
