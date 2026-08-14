import type { SearchLane } from './types';

export interface StrategicSearchContext {
  lane: SearchLane;
  query: string;
  location?: string;
}

export const relevantRoleTitle = /\b(project manager|program manager|technical project|technical program|technology program|principal program|portfolio manager|portfolio director|scrum master|agile (?:lead|delivery|program)|release train engineer|product owner|director.*(?:program|project|pmo|transformation|portfolio|technology|strategic|operations)|senior director.*(?:program|transformation|portfolio|technology)|pmo director|transformation director|technology transformation|enterprise transformation|ai transformation|ai enablement|digital transformation|technology strategy|digital strategy|technology operations|strategic initiatives|business transformation|enterprise modernization|cloud transformation|transformation office)\b/i;

export function coreStrategicSearchContexts(): StrategicSearchContext[] {
  return [
    { lane: 'EXECUTIVE', query: 'PMO Director OR Director Program Management OR Transformation Director', location: 'Atlanta, Georgia' },
    { lane: 'EXECUTIVE', query: 'PMO Director OR Director Program Management OR Transformation Director', location: 'Dallas, Texas' },
    { lane: 'EXECUTIVE', query: 'Senior Director Program Management OR Portfolio Director OR Transformation Director remote', location: 'United States' },
    { lane: 'EXECUTIVE', query: 'AI Enablement OR AI Transformation OR Enterprise Transformation remote', location: 'United States' },
    { lane: 'EXECUTIVE', query: 'Technology Strategy OR Digital Strategy OR Strategic Initiatives remote', location: 'United States' },
    { lane: 'EXECUTIVE', query: 'Enterprise Modernization OR Cloud Transformation OR Transformation Office remote', location: 'United States' },
    { lane: 'PROGRAM_PROJECT', query: 'Senior Program Manager OR Technical Program Manager OR Principal Program Manager', location: 'Atlanta, Georgia' },
    { lane: 'PROGRAM_PROJECT', query: 'Senior Program Manager OR Technical Program Manager OR Principal Program Manager', location: 'Dallas, Texas' },
    { lane: 'PROGRAM_PROJECT', query: 'Senior Program Manager OR Technical Program Manager OR Transformation Program Manager remote', location: 'United States' },
    { lane: 'AGILE', query: 'Senior Scrum Master OR Agile Delivery Lead OR Agile Program Manager OR Release Train Engineer remote', location: 'United States' },
    { lane: 'PRODUCT', query: 'Product Owner OR Senior Product Owner OR Technical Product Owner remote', location: 'United States' },
  ];
}

export function targetCompanySearchContexts(companies: string[]): StrategicSearchContext[] {
  const cleaned = [...new Set(companies.map(value => value.trim()).filter(Boolean))].slice(0, 48);
  const groups: string[][] = [];
  for (let index = 0; index < cleaned.length; index += 4) groups.push(cleaned.slice(index, index + 4));
  return groups.slice(0, 12).map(group => ({
    lane: 'EXECUTIVE' as const,
    query: `(${group.map(company => `\"${company}\"`).join(' OR ')}) (program management OR technology transformation OR AI enablement OR strategic initiatives OR portfolio management)`,
    location: 'United States',
  }));
}
