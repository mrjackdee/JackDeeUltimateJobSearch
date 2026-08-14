import type { AppState } from './types';
import { normalizeText } from './utils';

export type ConnectionStrength = 'STRONG' | 'WARM' | 'MUTUAL' | 'KNOWN' | 'RECRUITER';
export type ContactRole = 'FORMER_COWORKER' | 'RECRUITER' | 'HIRING_MANAGER' | 'EXECUTIVE' | 'OTHER';

export interface NetworkContact {
  id: string;
  name: string;
  company: string;
  title?: string;
  relationship?: string;
  connectionStrength: ConnectionStrength;
  contactRole: ContactRole;
  referralRequested: boolean;
  referralReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type NetworkState = AppState & { networkContacts?: NetworkContact[] };

export function contactsFromState(state: AppState): NetworkContact[] {
  return (state as NetworkState).networkContacts ?? [];
}

export function ensureNetworkContacts(state: AppState): NetworkContact[] {
  const networkState = state as NetworkState;
  if (!networkState.networkContacts) networkState.networkContacts = [];
  return networkState.networkContacts;
}

export function contactsForCompany(company: string, contacts: NetworkContact[]): NetworkContact[] {
  const companyKey = normalizeText(company);
  return contacts.filter(contact => {
    const contactKey = normalizeText(contact.company);
    return contactKey === companyKey || contactKey.includes(companyKey) || companyKey.includes(contactKey);
  });
}

export function networkOpportunity(company: string, contacts: NetworkContact[]): { label: 'Strong Warm Connection' | 'Warm Connection' | 'Mutual Connection' | 'Recruiter Opportunity' | 'No Known Connection'; score: number; contacts: NetworkContact[] } {
  const matches = contactsForCompany(company, contacts);
  if (!matches.length) return { label: 'No Known Connection', score: 0, contacts: [] };
  if (matches.some(contact => contact.referralReceived || contact.connectionStrength === 'STRONG')) return { label: 'Strong Warm Connection', score: 100, contacts: matches };
  if (matches.some(contact => contact.connectionStrength === 'WARM' || contact.contactRole === 'FORMER_COWORKER')) return { label: 'Warm Connection', score: 80, contacts: matches };
  if (matches.some(contact => contact.connectionStrength === 'MUTUAL')) return { label: 'Mutual Connection', score: 60, contacts: matches };
  if (matches.some(contact => contact.contactRole === 'RECRUITER' || contact.connectionStrength === 'RECRUITER')) return { label: 'Recruiter Opportunity', score: 50, contacts: matches };
  return { label: 'Warm Connection', score: 40, contacts: matches };
}
