import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications';
export async function POST(){
  try { await sendNotification('Jack Dee Job Search Command Center notification test', '<p>Your Gmail notifications are connected and operating.</p>'); return NextResponse.json({ok:true}); }
  catch(error){ return NextResponse.json({error:error instanceof Error?error.message:'Notification test failed.'},{status:500}); }
}
