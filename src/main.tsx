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

// Safely register service worker for offline functionality
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({ 
      immediate: true,
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


