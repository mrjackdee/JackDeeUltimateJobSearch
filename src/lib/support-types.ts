export const supportCategories = ['APP_ISSUE', 'LOGIN_ACCESS', 'JOB_SEARCH', 'MATCHING_SCORING', 'RESUME_DOCUMENTS', 'APPLICATION_TRACKING', 'GOOGLE_DRIVE', 'OTHER'] as const;
export const supportPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const supportStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'] as const;

export type SupportCategory = typeof supportCategories[number];
export type SupportPriority = typeof supportPriorities[number];
export type SupportStatus = typeof supportStatuses[number];

export interface SupportTicketInput {
  category: SupportCategory;
  priority: SupportPriority;
  subject: string;
  description: string;
  pageUrl: string;
  deviceInfo: string;
}

export interface SupportTicket extends SupportTicketInput {
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
  status: SupportStatus;
  userEmail: string;
  driveFileId?: string;
  driveFileUrl?: string;
  archiveSyncStatus: 'PENDING' | 'COMPLETE' | 'FAILED';
}
