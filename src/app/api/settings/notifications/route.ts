import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
export async function POST(request: NextRequest){
  try { const {enabled}=await request.json(); await updateState(s=>{s.notificationsEnabled=Boolean(enabled)}); return NextResponse.json({ok:true,enabled:Boolean(enabled)}); }
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to update notifications.'},{status:400});}
}
