import { NextRequest, NextResponse } from 'next/server';
import { prepareApplication } from '@/lib/package-service';
export const maxDuration = 300;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const pkg = await prepareApplication(id, Boolean(body.forceNewVersion));
    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Application preparation failed' }, { status: 500 });
  }
}
