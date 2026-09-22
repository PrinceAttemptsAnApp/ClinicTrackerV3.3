import { safeLocalStorage } from './safeStorage';

export const APP_VERSION = '3.3.0';
const ANON_ID_STORAGE_KEY = 'dt_anon_inst_id';

/**
 * Returns or generates a persistent, strictly anonymous installation identifier.
 * NEVER includes student, patient, email, phone, or clinical information.
 */
export function getAnonymousInstallationId(): string {
  let anonId = safeLocalStorage.getItem(ANON_ID_STORAGE_KEY);
  if (!anonId || typeof anonId !== 'string' || !anonId.startsWith('inst_')) {
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    anonId = `inst_${randomPart}`;
    safeLocalStorage.setItem(ANON_ID_STORAGE_KEY, anonId);
  }
  return anonId;
}

/**
 * Detects whether the app is running as an installed PWA or browser page.
 */
export function getDisplayMode(): 'pwa' | 'browser' {
  if (typeof window === 'undefined') return 'browser';
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isStandalone ? 'pwa' : 'browser';
}

/**
 * Detects general platform category without invasive fingerprinting.
 */
export function getPlatformCategory(): string {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform || '';

  if (/iphone|ipad|ipod/.test(ua) || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/android/.test(ua)) return 'android';
  if (/mac/.test(ua) || platform.startsWith('Mac')) return 'mac';
  if (/win/.test(ua) || platform.startsWith('Win')) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

export type AnalyticsEventType =
  | 'app_opened'
  | 'heartbeat'
  | 'case_created'
  | 'procedure_created'
  | 'case_exported'
  | 'pwa_installed';

interface AnalyticsPayload {
  anonymousInstallationId: string;
  event: AnalyticsEventType;
  appVersion: string;
  displayMode: 'pwa' | 'browser';
  platform: string;
  timestamp: string;
}

const PUBLIC_PRODUCTION_ANALYTICS_ENDPOINT =
  'https://dentatrack-analytics.amirsameh04.workers.dev/api/analytics/event';

/**
 * Resolves the analytics endpoint.
 * - Uses VITE_ANALYTICS_ENDPOINT if defined and valid.
 * - Uses local/preview relative endpoint when running on localhost, 127.0.0.1, or run.app.
 * - Uses public Cloudflare Worker event endpoint as fallback for GitHub Pages or production builds.
 */
function getAnalyticsEndpoint(): string | null {
  const rawEndpoint = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string || '').trim();

  // If a custom worker/server URL is explicitly provided via environment variable
  if (rawEndpoint && !rawEndpoint.includes('YOUR_') && rawEndpoint !== 'placeholder') {
    return rawEndpoint;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // In local development or node container preview, use the relative Express endpoint
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app')) {
      return '/api/analytics/event';
    }

    // On GitHub Pages or production web hosting, default to the public Cloudflare Worker endpoint
    if (host.includes('github.io') || host.includes('dentatrack')) {
      return PUBLIC_PRODUCTION_ANALYTICS_ENDPOINT;
    }
  }

  // Built-in fallback for production static builds where .env is absent
  return PUBLIC_PRODUCTION_ANALYTICS_ENDPOINT;
}

/**
 * Sends an anonymous analytics payload asynchronously.
 * Strictly non-blocking, fail-silent, with zero clinical or patient data.
 */
export function sendAnalyticsEvent(eventType: AnalyticsEventType): void {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const endpoint = getAnalyticsEndpoint();
  if (!endpoint) return;

  try {
    const payload: AnalyticsPayload = {
      anonymousInstallationId: getAnonymousInstallationId(),
      event: eventType,
      appVersion: APP_VERSION,
      displayMode: getDisplayMode(),
      platform: getPlatformCategory(),
      timestamp: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(payload);

    // Primary analytics transport using fetch with keepalive and standard JSON headers
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      keepalive: true,
    }).catch(() => {
      // Ignore network errors quietly (e.g. offline, adblocker, server down)
    });
  } catch (err) {
    // Fail silently without interrupting UI or application workflow
  }
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

/**
 * Initializes app-open tracking and periodic heartbeat pinging (~60 seconds).
 * Automatically pauses heartbeats when app is hidden/backgrounded and resumes when visible.
 */
export function initAnalyticsHeartbeat(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  // 1. Send initial app_opened event
  sendAnalyticsEvent('app_opened');

  const startHeartbeatTimer = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendAnalyticsEvent('heartbeat');
      }
    }, 60 * 1000); // 60 seconds
  };

  // 2. Start initial heartbeat interval
  startHeartbeatTimer();

  // 3. Pause/resume heartbeat based on tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    } else if (document.visibilityState === 'visible') {
      // Immediately send heartbeat on foreground resume
      sendAnalyticsEvent('heartbeat');
      startHeartbeatTimer();
    }
  });
}
