export type GoogleSyncStatus = 
  | 'not_connected'
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'disconnected';

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface GoogleCalendarSettings {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  userPhotoUrl?: string;
  selectedCalendarId: string; // Defaults to 'primary'
  selectedCalendarName?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  lastError?: string;
}

export interface SyncedEventRecord {
  dentaTrackKey: string; // e.g., "case_123_2026-10-15" or "session_mon_N_0900"
  googleEventId: string;
  calendarId: string;
  eventHash: string;
  lastSyncedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
}

export interface PendingSyncQueueItem {
  id: string;
  key: string;
  action: 'upsert' | 'delete';
  caseId?: string;
  dateStr: string;
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  queuedAt: string;
  retryCount: number;
}

export interface SyncStatsResult {
  synced: number;
  updated: number;
  failed: number;
  errors: string[];
}
