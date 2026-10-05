import { DentalCase, ClinicSession } from '../../types';
import { resolvePlannedVisit } from '../visitPlanner';
import { formatTeethDisplay, cleanProcedureTitle } from '../macroSteps';
import { 
  getGCalSettings, 
  saveGCalSettings, 
  getGCalSyncMap, 
  saveGCalSyncRecord, 
  removeGCalSyncRecord, 
  getGCalSyncQueue, 
  enqueueGCalItem, 
  removeGCalQueueItem 
} from './storage';
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent, 
  GoogleEventPayload 
} from './calendarApi';
import { getAccessToken } from './auth';
import { SyncStatsResult, SyncedEventRecord } from './types';

/**
 * Deterministic hash for checking if an event payload has changed.
 */
function hashEventPayload(payload: GoogleEventPayload): string {
  const str = `${payload.summary}|${payload.description}|${payload.start.dateTime || payload.start.date}|${payload.end.dateTime || payload.end.date}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Creates human-readable, privacy-conscious event payload for a planned patient visit.
 */
export function buildCaseEventPayload(
  dentalCase: DentalCase,
  schedule: ClinicSession[] = []
): { key: string; payload: GoogleEventPayload; dateStr: string } | null {
  const visitInfo = resolvePlannedVisit(dentalCase, schedule);
  const dateStr = visitInfo.date || dentalCase.plannedSessionDate || dentalCase.targetNextVisitDate;
  
  if (!dateStr) return null;

  const proc = dentalCase.procedures.find((p) => p.id === (visitInfo.procedureId || dentalCase.plannedProcedureId)) 
    || dentalCase.procedures[0];
  
  const procTitle = proc ? cleanProcedureTitle(proc.title) : 'Clinical Procedure';
  const teethFormatted = proc?.toothNumber ? formatTeethDisplay(proc.toothNumber) : '';
  const actionText = visitInfo.actionText || dentalCase.plannedAction || 'Next Clinical Step';
  const clinicPlace = visitInfo.clinicPlace || dentalCase.plannedSessionClinic || dentalCase.clinicPlace;

  // Title: "DentaTrack · Ahmed · Molar RCT"
  const firstName = dentalCase.patientName.split(' ')[0] || 'Patient';
  const summary = `DentaTrack · ${firstName} · ${procTitle}`;

  // Description: Minimal, privacy-conscious clinical planning notes
  const lines = [
    `Patient: ${dentalCase.patientName}`,
    `File: #${dentalCase.fileNumber}`,
    `Procedure: ${procTitle}`,
    teethFormatted ? `Tooth: ${teethFormatted}` : null,
    `Next Milestone: ${actionText}`,
    `Station: Clinic ${clinicPlace}`,
    '',
    'Planned clinical visit recorded in DentaTrack.'
  ].filter(Boolean);

  const description = lines.join('\n');
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  let start: GoogleEventPayload['start'];
  let end: GoogleEventPayload['end'];

  const time = visitInfo.time || dentalCase.plannedSessionTime;
  if (time && time.includes(':')) {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const startIso = `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    // Default 2.5 hour clinic block
    const endH = Math.min(23, h + 2);
    const endM = Math.min(59, m + 30);
    const endIso = `${dateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    start = { dateTime: startIso, timeZone: userTz };
    end = { dateTime: endIso, timeZone: userTz };
  } else {
    // All-day appointment
    start = { date: dateStr };
    end = { date: dateStr };
  }

  const payload: GoogleEventPayload = {
    summary,
    description,
    location: `Clinic ${clinicPlace}`,
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 }, // 1 day before
        { method: 'popup', minutes: 120 }       // 2 hours before
      ]
    }
  };

  return {
    key: `case_${dentalCase.id}_${dateStr}`,
    payload,
    dateStr
  };
}

/**
 * Synchronizes a single planned patient visit with Google Calendar (idempotent).
 */
export async function syncSingleCaseVisit(
  dentalCase: DentalCase,
  schedule: ClinicSession[] = []
): Promise<{ success: boolean; googleEventId?: string; isNew?: boolean; error?: string }> {
  const eventData = buildCaseEventPayload(dentalCase, schedule);
  if (!eventData) {
    return { success: false, error: 'No upcoming planned visit date is set for this case.' };
  }

  const settings = getGCalSettings();
  if (!settings.isConnected) {
    return { success: false, error: 'Google Calendar is not connected in Settings.' };
  }

  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Authorization token not active. Please reconnect Google Calendar in Settings.' };
  }

  const syncMap = getGCalSyncMap();
  const existingRecord = syncMap[eventData.key];
  const payloadHash = hashEventPayload(eventData.payload);
  const calendarId = settings.selectedCalendarId || 'primary';

  // Offline handler: queue for future execution
  if (!navigator.onLine) {
    enqueueGCalItem({
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      key: eventData.key,
      action: 'upsert',
      caseId: dentalCase.id,
      dateStr: eventData.dateStr,
      title: eventData.payload.summary,
      description: eventData.payload.description,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    });
    return { success: true, error: 'Offline: Planned visit queued for automatic Google Calendar sync.' };
  }

  try {
    let resultEventId = existingRecord?.googleEventId;
    let isNew = false;

    if (existingRecord?.googleEventId) {
      // Check if content actually changed
      if (existingRecord.eventHash === payloadHash && existingRecord.syncStatus === 'synced') {
        return { success: true, googleEventId: existingRecord.googleEventId, isNew: false };
      }

      // Update existing Google Calendar event
      try {
        const updated = await updateCalendarEvent(token, calendarId, existingRecord.googleEventId, eventData.payload);
        resultEventId = updated.id;
      } catch (patchErr: any) {
        // If event was deleted in Google Calendar directly, recreate it
        if (patchErr.message?.includes('not found') || patchErr.message?.includes('404')) {
          const created = await createCalendarEvent(token, calendarId, eventData.payload);
          resultEventId = created.id;
          isNew = true;
        } else {
          throw patchErr;
        }
      }
    } else {
      // Create new event
      const created = await createCalendarEvent(token, calendarId, eventData.payload);
      resultEventId = created.id;
      isNew = true;
    }

    // Save record to local sync map
    saveGCalSyncRecord({
      dentaTrackKey: eventData.key,
      googleEventId: resultEventId,
      calendarId,
      eventHash: payloadHash,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    saveGCalSettings({
      lastSyncedAt: new Date().toISOString(),
      lastError: undefined,
    });

    return { success: true, googleEventId: resultEventId, isNew };
  } catch (err: any) {
    console.error('[Google Calendar Sync Error]', err);
    saveGCalSyncRecord({
      dentaTrackKey: eventData.key,
      googleEventId: existingRecord?.googleEventId || '',
      calendarId,
      eventHash: payloadHash,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'failed',
      errorMessage: err.message,
    });

    saveGCalSettings({
      lastError: err.message,
    });

    return { success: false, error: err.message };
  }
}

/**
 * Removes a planned visit from Google Calendar when cancelled or completed.
 */
export async function deleteCaseGoogleEvent(
  dentalCaseId: string,
  dateStr: string
): Promise<void> {
  const key = `case_${dentalCaseId}_${dateStr}`;
  const syncMap = getGCalSyncMap();
  const record = syncMap[key];

  if (!record || !record.googleEventId) {
    removeGCalSyncRecord(key);
    return;
  }

  const token = await getAccessToken();
  if (token && navigator.onLine) {
    try {
      await deleteCalendarEvent(token, record.calendarId, record.googleEventId);
    } catch (e) {
      console.warn('Could not delete event from Google Calendar:', e);
    }
  }

  removeGCalSyncRecord(key);
}

/**
 * Bulk synchronizes upcoming planned visits for the next 30-90 days.
 */
export async function syncUpcomingClinicalEvents(
  cases: DentalCase[],
  schedule: ClinicSession[] = [],
  daysWindow: number = 60
): Promise<SyncStatsResult> {
  const stats: SyncStatsResult = {
    synced: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  const settings = getGCalSettings();
  if (!settings.isConnected) {
    stats.errors.push('Google Calendar is not connected in Settings.');
    return stats;
  }

  const token = await getAccessToken();
  if (!token) {
    stats.errors.push('Google Calendar authorization is inactive. Please reconnect in Settings.');
    return stats;
  }

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + daysWindow);

  // Find cases with planned visits in the upcoming window
  const eligibleCases = cases.filter((c) => {
    const visit = resolvePlannedVisit(c, schedule);
    const dateStr = visit.date || c.plannedSessionDate || c.targetNextVisitDate;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= now && d <= cutoff;
  });

  for (const c of eligibleCases) {
    try {
      const res = await syncSingleCaseVisit(c, schedule);
      if (res.success) {
        if (res.isNew) {
          stats.synced++;
        } else {
          stats.updated++;
        }
      } else {
        stats.failed++;
        if (res.error) stats.errors.push(`${c.patientName}: ${res.error}`);
      }
    } catch (err: any) {
      stats.failed++;
      stats.errors.push(`${c.patientName}: ${err.message}`);
    }
  }

  // Also process pending offline queue if online
  if (navigator.onLine) {
    await processOfflineSyncQueue(token);
  }

  saveGCalSettings({
    lastSyncedAt: new Date().toISOString(),
    lastError: stats.errors.length > 0 ? stats.errors[0] : undefined,
  });

  return stats;
}

/**
 * Processes queued items that were modified while offline.
 */
export async function processOfflineSyncQueue(token: string): Promise<void> {
  const queue = getGCalSyncQueue();
  if (queue.length === 0) return;

  const settings = getGCalSettings();
  const calendarId = settings.selectedCalendarId || 'primary';

  for (const item of queue) {
    try {
      if (item.action === 'delete') {
        const map = getGCalSyncMap();
        const record = map[item.key];
        if (record?.googleEventId) {
          await deleteCalendarEvent(token, calendarId, record.googleEventId);
        }
        removeGCalSyncRecord(item.key);
      }
      removeGCalQueueItem(item.id);
    } catch (err) {
      console.warn('Failed to process queued sync item:', err);
    }
  }
}

/**
 * Checks whether a specific case visit is currently synced to Google Calendar.
 */
export function getCaseSyncStatus(
  dentalCaseId: string,
  dateStr: string
): SyncedEventRecord | null {
  const key = `case_${dentalCaseId}_${dateStr}`;
  const map = getGCalSyncMap();
  return map[key] || null;
}
