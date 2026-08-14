import type { SearchLane } from './types';

export const laneTitles: Record<SearchLane, string[]> = {
  EXECUTIVE: [
    'Director Program Management',
    'Director Project Management',
    'Director Technical Program Management',
    'PMO Director',
    'Senior Director Program Management',
    'Senior Program Manager',
    'Principal Program Manager',
    'Strategic Program Manager',
    'Technical Program Manager',
    'Transformation Program Manager',
    'Enterprise Program Manager',
    'AI Program Manager',
    'Program Governance',
    'Technology Transformation',
  ],
  PROGRAM_PROJECT: [
    'Project Manager',
    'Senior Project Manager',
    'IT Project Manager',
    'Technical Project Manager',
    'Program Manager',
    'Senior Program Manager',
    'Implementation Project Manager',
    'Implementation Program Manager',
    'Delivery Manager',
    'Operations Project Manager',
    'Portfolio Manager',
  ],
  AGILE: ['Scrum Master', 'Senior Scrum Master', 'Agile Lead', 'Agile Delivery Lead', 'Agile Program Manager'],
  PRODUCT: ['Product Owner', 'Senior Product Owner', 'Technical Product Owner', 'Platform Product Owner', 'Digital Product Owner'],
};

export const targetLocations = ['Atlanta, GA', 'Dallas, TX', 'Plano, TX', 'Irving, TX', 'Addison, TX', 'Remote'];

export const excludedEmploymentTerms = ['contract', 'contract-to-hire', 'temporary', 'part-time', 'internship', 'freelance', 'fractional'];

export const expiredSignals = [
  'job is no longer available',
  'position has been filled',
  'job has expired',
  'this job has expired',
  'no longer accepting applications',
  'requisition is closed',
  'job not found',
  'position is closed',
];

export const strongBenefits = ['medical', 'health', 'dental', 'vision', '401k', '401(k)', 'paid time off', 'pto'];
