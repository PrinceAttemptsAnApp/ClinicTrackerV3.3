import { GoogleCalendarListItem } from './types';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface GoogleEventPayload {
  summary: string;
  description: string;
  location?: string;
  start: {
    dateTime?: string; // ISO 8601 string, e.g. "2026-10-15T09:00:00"
    date?: string; // For all-day events, e.g. "2026-10-15"
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

export interface GoogleCalendarEventResponse {
  id: string;
  status: string;
  htmlLink: string;
  summary: string;
  updated: string;
}

function handleApiError(status: number, message: string): Error {
  if (status === 401) {
    return new Error('Google Calendar connection expired. Reconnect your Google account in Settings to continue syncing.');
  }
  if (status === 403) {
    if (message.includes('usageLimits') || message.includes('rateLimitExceeded')) {
      return new Error('Google Calendar is temporarily limiting requests. DentaTrack queued your changes and will retry later.');
    }
    return new Error('Google Calendar permissions were denied or revoked. Please reconnect your account.');
  }
  if (status === 404) {
    return new Error('Google Calendar event or calendar not found.');
  }
  return new Error(`Google Calendar error (${status}): ${message}`);
}

/**
 * Fetches the user's available calendars (Primary, Work, etc.).
 */
export async function listUserCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
  try {
    const res = await fetch(`${API_BASE}/users/me/calendarList?minAccessRole=writer`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || res.statusText;
      throw handleApiError(res.status, msg);
    }

    const data = await res.json();
    const items: GoogleCalendarListItem[] = (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      primary: Boolean(item.primary),
      backgroundColor: item.backgroundColor,
      foregroundColor: item.foregroundColor,
      accessRole: item.accessRole,
    }));

    return items;
  } catch (err: any) {
    if (!navigator.onLine) {
      throw new Error('You are currently offline. Calendars will load once connection is restored.');
    }
    throw err;
  }
}

/**
 * Creates an event in the specified Google Calendar.
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleEventPayload
): Promise<GoogleCalendarEventResponse> {
  const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const msg = errJson.error?.message || res.statusText;
    throw handleApiError(res.status, msg);
  }

  return await res.json();
}

/**
 * Updates an existing event in Google Calendar.
 */
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleEventPayload
): Promise<GoogleCalendarEventResponse> {
  const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const msg = errJson.error?.message || res.statusText;
    throw handleApiError(res.status, msg);
  }

  return await res.json();
}

/**
 * Deletes an event from Google Calendar.
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 404/410 means already deleted in Google Calendar, which is acceptable
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errJson = await res.json().catch(() => ({}));
    const msg = errJson.error?.message || res.statusText;
    throw handleApiError(res.status, msg);
  }
}
