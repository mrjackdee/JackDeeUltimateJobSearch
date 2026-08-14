import { getState } from '@/lib/storage/state';
import { googleConfigured } from '@/lib/storage/google';
import { appSecurityConfigured } from '@/lib/auth';
import { SettingsClient } from '@/components/SettingsClient';
export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const state = await getState();
  const integration = { 'App security': appSecurityConfigured(), 'Google Drive': googleConfigured(), 'AI Gateway': Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY), 'Broad search API': Boolean(process.env.SERPAPI_KEY) };
  return <><section className="hero"><div className="eyebrow">System settings</div><h1>Search rules, evidence, and integrations.</h1><p>These controls define what the system is allowed to find, claim, generate, and store.</p></section><SettingsClient settings={state.settings} masterResumes={state.masterResumes} hasCareerProfile={Boolean(state.careerProfile)} integration={integration}/></>;
}
