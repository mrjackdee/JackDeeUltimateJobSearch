import Link from 'next/link';
import { getState } from '@/lib/storage/state';
import { googleConfigured } from '@/lib/storage/google';
import { appSecurityConfigured } from '@/lib/auth';
import { notificationsConfigured } from '@/lib/notifications';
import { SettingsClient } from '@/components/SettingsClient';
export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const state = await getState();
  const integration = {
    'Secure Google sign-in': appSecurityConfigured(),
    'Google Drive storage': googleConfigured(),
    'Email updates': notificationsConfigured(),
    'AI assistance': Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY),
    'Live job search': Boolean(process.env.SERPAPI_KEY),
  };
  return <><section className="hero"><div className="eyebrow">Settings</div><h1>Control how the app searches and which resume it uses.</h1><p>Update your resume, refresh your Career Profile, manage email updates, and review the services the app needs to work properly.</p><div className="hero-actions"><Link className="button" href="/admin">Admin & Diagnostics</Link><Link className="button" href="/guide">How to use the app</Link></div></section><SettingsClient settings={state.settings} masterResumes={state.masterResumes} hasCareerProfile={Boolean(state.careerProfile)} integration={integration} notificationsEnabled={state.notificationsEnabled !== false}/></>;
}
