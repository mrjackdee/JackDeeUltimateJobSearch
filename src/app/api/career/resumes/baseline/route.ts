import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    await updateState(state => {
      if (!state.masterResumes.some(r => r.id === id)) throw new Error('Resume not found.');
      state.masterResumes.forEach(r => { r.isBaseline = r.id === id; });
      state.baselineResumeId = id;
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update baseline.' }, { status: 400 }); }
}
