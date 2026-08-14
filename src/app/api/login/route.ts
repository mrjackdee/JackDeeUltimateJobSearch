import { NextResponse } from 'next/server';
export async function POST(){ return NextResponse.json({ error: 'Password login is disabled. Use Google sign-in.' }, { status: 410 }); }
