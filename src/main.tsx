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

import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalyticsHeartbeat } from './lib/analytics';

// Visual Error Boundary for diagnostics
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[DentaTrack Startup Error Boundary Caught]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '12px', border: '1px solid #fca5a5', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#b91c1c', margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Startup Diagnostic Error</h2>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            The application encountered an issue during startup:
          </p>
          <pre style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #fecaca' }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Reload DentaTrack
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global window error catcher before React mount
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[DentaTrack Global Error Handler]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[DentaTrack Unhandled Rejection Handler]:', event.reason);
  });
}

// Initialize anonymous usage analytics and heartbeat
try {
  initAnalyticsHeartbeat();
} catch (err) {
  // Fail-silent
}

// Safely register service worker for offline functionality only in production
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const updateSW = registerSW({ 
        immediate: true,
        onNeedRefresh() {
          updateSW(true);
        },
        onRegisterError(error: unknown) {
          console.warn('Service worker registration notice:', error);
        }
      });
    })
    .catch((err) => {
      console.warn('Service worker registration skipped:', err);
    });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  );
}


