import { getState } from '@/lib/storage/state';
import { googleConfigured } from '@/lib/storage/google';
import { appSecurityConfigured } from '@/lib/auth';
import { notificationsConfigured } from '@/lib/notifications';
import { SettingsClient } from '@/components/SettingsClient';
export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const state = await getState();
  const integration = { 'Single-user Google login': appSecurityConfigured(), 'Google Drive': googleConfigured(), 'Gmail notifications': notificationsConfigured(), 'AI Gateway': Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY), 'Broad search API': Boolean(process.env.SERPAPI_KEY) };
  return <><section className="hero"><div className="eyebrow">System settings</div><h1>Search rules, evidence, and integrations.</h1><p>Manage the baseline resume, Google-connected services, and the rules that control what the system can find, claim, generate, and store.</p></section><SettingsClient settings={state.settings} masterResumes={state.masterResumes} hasCareerProfile={Boolean(state.careerProfile)} integration={integration} notificationsEnabled={state.notificationsEnabled !== false}/></>;
}
