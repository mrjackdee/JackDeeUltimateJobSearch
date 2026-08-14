import { NextResponse } from 'next/server';
import { googleConfigured } from '@/lib/storage/google';
import { appSecurityConfigured } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({
    ok: true,
    appSecurityConfigured: appSecurityConfigured(),
    googleDriveConfigured: googleConfigured(),
    aiGatewayConfigured: Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY),
    serpApiConfigured: Boolean(process.env.SERPAPI_KEY),
    timestamp: new Date().toISOString(),
  });
}
