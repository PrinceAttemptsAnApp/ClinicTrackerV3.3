import { safeLocalStorage } from './safeStorage';

export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dentatrack_theme';

/**
 * Retrieves the user's stored theme preference or defaults to 'system'.
 */
export function getSavedTheme(): ThemeMode {
  const saved = safeLocalStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

/**
 * Determines whether dark mode is active based on preference and OS state.
 */
export function isDarkActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Applies the given theme to the document and updates meta tags and color schemes.
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const dark = isDarkActive(mode);
  const root = document.documentElement;

  if (dark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Update mobile status bar and browser theme color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', dark ? '#0b1120' : '#0284c7');
  }

  safeLocalStorage.setItem(THEME_STORAGE_KEY, mode);
}

/**
 * Initializes OS listener for 'system' preference changes.
 */
export function initThemeListener(onThemeChange?: (dark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    const currentMode = getSavedTheme();
    if (currentMode === 'system') {
      applyTheme('system');
      onThemeChange?.(mediaQuery.matches);
    }
  };

  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}
