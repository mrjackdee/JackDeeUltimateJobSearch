import { NextResponse } from 'next/server';
import { syncCareerProfile } from '@/lib/career';
export const maxDuration = 300;
export async function POST() {
  try { const profile = await syncCareerProfile(); return NextResponse.json({ ok: true, generatedAt: profile.generatedAt, evidenceCount: profile.evidence.length, sourceFileIds: profile.sourceFileIds }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Career sync failed' }, { status: 500 }); }
}
