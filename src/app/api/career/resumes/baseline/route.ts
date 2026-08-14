import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    await updateState(state => {
      if (!state.masterResumes.some(r => r.id === id)) throw new Error('That saved resume could not be found. Refresh the page and try again.');
      state.masterResumes.forEach(r => { r.isBaseline = r.id === id; });
      state.baselineResumeId = id;
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const userMessage=plainUserError('The active resume could not be changed right now. Please try again.',error);
    await logAppIssue({area:'Resume setup',action:'Choose a different baseline resume',severity:'ERROR',userMessage,technicalMessage:error instanceof Error?error.stack??error.message:String(error),route:'/api/career/resumes/baseline',statusCode:500,resolved:false});
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
