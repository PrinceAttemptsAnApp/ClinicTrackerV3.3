import { safeLocalStorage } from '../safeStorage';
import { GoogleCalendarSettings, SyncedEventRecord, PendingSyncQueueItem } from './types';

const SETTINGS_KEY = 'dentatrack_gcal_settings_v1';
const SYNC_MAP_KEY = 'dentatrack_gcal_sync_map_v1';
const QUEUE_KEY = 'dentatrack_gcal_sync_queue_v1';

export const DEFAULT_GCAL_SETTINGS: GoogleCalendarSettings = {
  isConnected: false,
  selectedCalendarId: 'primary',
  selectedCalendarName: 'Primary Calendar',
  autoSync: true,
};

export function getGCalSettings(): GoogleCalendarSettings {
  try {
    const raw = safeLocalStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_GCAL_SETTINGS };
    return { ...DEFAULT_GCAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GCAL_SETTINGS };
  }
}

export function saveGCalSettings(settings: Partial<GoogleCalendarSettings>): GoogleCalendarSettings {
  const current = getGCalSettings();
  const updated: GoogleCalendarSettings = { ...current, ...settings };
  safeLocalStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function clearGCalSettings(): void {
  safeLocalStorage.removeItem(SETTINGS_KEY);
  safeLocalStorage.removeItem(SYNC_MAP_KEY);
  safeLocalStorage.removeItem(QUEUE_KEY);
}

export function getGCalSyncMap(): Record<string, SyncedEventRecord> {
  try {
    const raw = safeLocalStorage.getItem(SYNC_MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveGCalSyncRecord(record: SyncedEventRecord): void {
  const map = getGCalSyncMap();
  map[record.dentaTrackKey] = record;
  safeLocalStorage.setItem(SYNC_MAP_KEY, JSON.stringify(map));
}

export function removeGCalSyncRecord(dentaTrackKey: string): void {
  const map = getGCalSyncMap();
  delete map[dentaTrackKey];
  safeLocalStorage.setItem(SYNC_MAP_KEY, JSON.stringify(map));
}

export function getGCalSyncQueue(): PendingSyncQueueItem[] {
  try {
    const raw = safeLocalStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function enqueueGCalItem(item: PendingSyncQueueItem): void {
  const queue = getGCalSyncQueue();
  // Filter out any older action for the same key to avoid duplicate operations
  const filtered = queue.filter((q) => q.key !== item.key);
  filtered.push(item);
  safeLocalStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function removeGCalQueueItem(id: string): void {
  const queue = getGCalSyncQueue();
  const filtered = queue.filter((q) => q.id !== id);
  safeLocalStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function clearGCalQueue(): void {
  safeLocalStorage.removeItem(QUEUE_KEY);
}
