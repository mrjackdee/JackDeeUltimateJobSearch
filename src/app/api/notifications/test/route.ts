import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications';
import { logAppIssue, plainUserError } from '@/lib/issues';
export async function POST(){
  try {
    await sendNotification('RoleBright notification test', '<p>Your email updates are connected and working.</p>');
    return NextResponse.json({ok:true});
  } catch(error){
    const userMessage = plainUserError('The test email could not be sent right now. Check Admin & Diagnostics for more information, then try again.', error);
    await logAppIssue({ area:'Email updates', action:'Send a test email', severity:'ERROR', userMessage, technicalMessage:error instanceof Error ? error.stack ?? error.message : String(error), route:'/api/notifications/test', statusCode:500, resolved:false });
    return NextResponse.json({error:userMessage},{status:500});
  }
}
