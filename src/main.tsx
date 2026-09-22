// Polyfills for iOS < 17.4 and older mobile Safari versions
if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof Object !== 'undefined' && !(Object as any).groupBy) {
  (Object as any).groupBy = function <T, K extends PropertyKey>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K
  ): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    let index = 0;
    for (const item of items) {
      const key = keySelector(item, index++);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    return result;
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { initAnalyticsHeartbeat } from './lib/analytics';

// Initialize anonymous usage analytics and heartbeat
try {
  initAnalyticsHeartbeat();
} catch (err) {
  // Fail-silent
}

// Safely register service worker for offline functionality and instant updates
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    let refreshing = false;
    const hadController = !!navigator.serviceWorker.controller;

    // Reload once when a new service worker takes control (prevents stale cached assets on iOS/standalone PWA)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const updateSW = registerSW({ 
      immediate: true,
      onNeedRefresh() {
        // Automatically activate new service worker so users see updates immediately
        updateSW(true);
      },
      onRegisteredSW(_swScriptUrl, registration) {
        if (!registration) return;

        const checkSWUpdate = () => {
          if (registration.installing || !navigator.onLine) return;
          registration.update().catch((err) => {
            console.warn('Service worker update check failed:', err);
          });
        };

        // Check for updates on initial registration
        checkSWUpdate();

        // Check for SW updates when iOS Home Screen app becomes visible or focused
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkSWUpdate();
          }
        });

        window.addEventListener('pageshow', checkSWUpdate);
        window.addEventListener('focus', checkSWUpdate);

        // Periodic background update check every hour
        setInterval(checkSWUpdate, 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.warn('Service worker registration error:', error);
      }
    });
  }
} catch (err) {
  console.warn('Service worker initialization skipped:', err);
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}


