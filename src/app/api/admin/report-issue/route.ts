import { NextRequest, NextResponse } from 'next/server';
import { logAppIssue } from '@/lib/issues';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await logAppIssue({
      area: String(body.area || 'App screen'),
      action: body.action ? String(body.action) : undefined,
      severity: body.severity === 'WARNING' || body.severity === 'INFO' ? body.severity : 'ERROR',
      userMessage: String(body.userMessage || 'Something unexpected happened while using the app.'),
      technicalMessage: body.technicalMessage ? String(body.technicalMessage).slice(0, 8000) : undefined,
      route: body.route ? String(body.route) : undefined,
      statusCode: Number.isFinite(Number(body.statusCode)) ? Number(body.statusCode) : undefined,
      resolved: false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Client issue report could not be saved', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
