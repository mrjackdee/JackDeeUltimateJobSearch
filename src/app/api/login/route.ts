import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const accessCode = process.env.APP_ACCESS_CODE;
  const sessionSecret = process.env.APP_SESSION_SECRET;
  if (!accessCode || !sessionSecret) return NextResponse.json({ error: 'App access is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (body.accessCode !== accessCode) return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set('jd_session', await createSessionToken(sessionSecret), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 24 * 60 * 60 });
  return response;
}
