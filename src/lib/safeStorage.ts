// Safe wrapper for localStorage to prevent SecurityError or QuotaExceededError in iOS Safari private browsing

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage.getItem error suppressed:', e);
    }
    return null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage.setItem error suppressed:', e);
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage.removeItem error suppressed:', e);
    }
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('localStorage.clear error suppressed:', e);
    }
  },
};
