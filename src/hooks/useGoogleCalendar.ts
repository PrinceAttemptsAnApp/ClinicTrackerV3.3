import { useState, useEffect, useCallback } from 'react';
import { 
  getGCalSettings, 
  saveGCalSettings, 
  clearGCalSettings 
} from '../lib/googleCalendar/storage';
import { 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  initAuthListener 
} from '../lib/googleCalendar/auth';
import { listUserCalendars } from '../lib/googleCalendar/calendarApi';
import { 
  syncSingleCaseVisit, 
  syncUpcomingClinicalEvents, 
  getCaseSyncStatus 
} from '../lib/googleCalendar/syncService';
import { 
  GoogleCalendarSettings, 
  GoogleCalendarListItem, 
  SyncStatsResult, 
  SyncedEventRecord 
} from '../lib/googleCalendar/types';
import { DentalCase, ClinicSession } from '../types';

export function useGoogleCalendar() {
  const [settings, setSettings] = useState<GoogleCalendarSettings>(getGCalSettings);
  const [calendars, setCalendars] = useState<GoogleCalendarListItem[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncStatsResult | null>(null);
  const [error, setError] = useState<string | null>(settings.lastError || null);

  // Sync settings whenever component mounts or window storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getGCalSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = initAuthListener(async (user, token) => {
      if (user && token) {
        setSettings(getGCalSettings());
      } else if (!user) {
        setSettings((prev) => ({ ...prev, isConnected: false }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load available user calendars when connected
  const refreshCalendars = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingCalendars(true);
    try {
      const items = await listUserCalendars(token);
      setCalendars(items);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to list Google Calendars:', err);
      setError(err.message || 'Could not fetch Google Calendar list.');
    } finally {
      setIsLoadingCalendars(false);
    }
  }, []);

  useEffect(() => {
    if (settings.isConnected) {
      refreshCalendars();
    }
  }, [settings.isConnected, refreshCalendars]);

  // Connect Google Calendar with popup flow
  const connect = async () => {
    setError(null);
    try {
      const { user, accessToken } = await googleSignIn();
      const updated = saveGCalSettings({
        isConnected: true,
        userEmail: user.email || undefined,
        userName: user.displayName || undefined,
        userPhotoUrl: user.photoURL || undefined,
        lastError: undefined,
      });
      setSettings(updated);

      // Load user's calendars
      try {
        const items = await listUserCalendars(accessToken);
        setCalendars(items);
      } catch (calErr: any) {
        console.warn('Connected, but could not list secondary calendars:', calErr);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google Calendar.');
      throw err;
    }
  };

  // Disconnect Google Calendar
  const disconnect = async () => {
    try {
      await googleSignOut();
      clearGCalSettings();
      setSettings(getGCalSettings());
      setCalendars([]);
      setLastResult(null);
      setError(null);
    } catch (err: any) {
      console.error('Error disconnecting Google Calendar:', err);
    }
  };

  // Change selected target calendar
  const selectCalendar = (calendarId: string, calendarName?: string) => {
    const updated = saveGCalSettings({
      selectedCalendarId: calendarId,
      selectedCalendarName: calendarName,
    });
    setSettings(updated);
  };

  // Bulk sync upcoming clinical events
  const syncUpcoming = async (cases: DentalCase[], schedule: ClinicSession[] = [], days: number = 60) => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncUpcomingClinicalEvents(cases, schedule, days);
      setLastResult(result);
      setSettings(getGCalSettings());
      if (result.errors.length > 0) {
        setError(result.errors[0]);
      }
      return result;
    } catch (err: any) {
      const msg = err.message || 'Sync failed.';
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync a single case
  const syncCase = async (dentalCase: DentalCase, schedule: ClinicSession[] = []) => {
    setError(null);
    const res = await syncSingleCaseVisit(dentalCase, schedule);
    setSettings(getGCalSettings());
    if (!res.success && res.error) {
      setError(res.error);
    }
    return res;
  };

  // Query sync state of an event
  const checkCaseEventStatus = (caseId: string, dateStr: string): SyncedEventRecord | null => {
    return getCaseSyncStatus(caseId, dateStr);
  };

  return {
    isConnected: settings.isConnected,
    settings,
    calendars,
    isLoadingCalendars,
    isSyncing,
    lastResult,
    error,
    connect,
    disconnect,
    selectCalendar,
    refreshCalendars,
    syncUpcoming,
    syncCase,
    checkCaseEventStatus,
  };
}
