import { NextRequest, NextResponse } from 'next/server';
import { oauthClient } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const redirectUri = new URL('/api/auth/google/callback', request.nextUrl.origin).toString();
  const oauth = oauthClient(redirectUri);
  const state = crypto.randomUUID();
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'],
    state,
  });
  const response = NextResponse.redirect(url);
  response.cookies.set('jd_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
  return response;
}
