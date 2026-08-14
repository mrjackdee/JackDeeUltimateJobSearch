import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';
export async function POST(request: NextRequest){
  try {
    const {enabled}=await request.json();
    await updateState(s=>{s.notificationsEnabled=Boolean(enabled)});
    return NextResponse.json({ok:true,enabled:Boolean(enabled)});
  } catch(error){
    const userMessage=plainUserError('Your email update setting could not be changed right now. Please try again.',error);
    await logAppIssue({area:'Email updates',action:'Turn email updates on or off',severity:'ERROR',userMessage,technicalMessage:error instanceof Error?error.stack??error.message:String(error),route:'/api/settings/notifications',statusCode:500,resolved:false});
    return NextResponse.json({error:userMessage},{status:500});
  }
}
