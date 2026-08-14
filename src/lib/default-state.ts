import type { AppState, MasterResume, SearchSettings } from './types';

export const defaultSettings: SearchSettings = {
  salaryFloor: 100000,
  radiusMiles: 25,
  lookbackDays: 7,
  fitThreshold: 80,
  autoPrepareThreshold: 90,
  morningHourEastern: 7,
  afternoonHourEastern: 16,
  remoteFirst: true,
};

export const defaultMasterResumes: MasterResume[] = [
  { id: 'executive', name: 'Executive / Senior Program Management Master', lane: 'EXECUTIVE', status: 'MISSING' },
  { id: 'pmo', name: 'Program Governance & PMO Master', lane: 'EXECUTIVE', status: 'MISSING' },
  { id: 'tpm', name: 'Technical Program Management Master', lane: 'PROGRAM_PROJECT', status: 'MISSING' },
  { id: 'pm', name: 'Standard Project Manager Master', lane: 'PROGRAM_PROJECT', status: 'MISSING' },
  { id: 'agile', name: 'Scrum Master / Agile Master', lane: 'AGILE', status: 'MISSING' },
  { id: 'product', name: 'Product Owner Master', lane: 'PRODUCT', status: 'MISSING' },
];

export function createDefaultState(): AppState {
  return {
    schemaVersion: 1,
    jobs: [],
    analyses: [],
    applicationPackages: [],
    applications: [],
    masterResumes: structuredClone(defaultMasterResumes),
    searchRuns: [],
    settings: { ...defaultSettings },
    updatedAt: new Date().toISOString(),
  };
}
