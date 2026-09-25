/**
 * DentaTrack Contrast-Safe Theme Token & Verification System
 * Complies with W3C WCAG 2.1 AA Standards:
 * - Normal Text (< 18pt / < 24px, or < 14pt bold): minimum 4.5:1 contrast ratio
 * - Large Text / Headings (>= 18pt / >= 24px, or >= 14pt bold): minimum 3.0:1 contrast ratio
 * - UI Components & Interactive Controls: minimum 3.0:1 contrast ratio
 */

export interface ColorTokenPair {
  name: string;
  fg: string; // Hex color (e.g. #0f172a)
  bg: string; // Hex color (e.g. #ffffff)
  minRatio: number; // Required minimum (4.5 for normal text, 3.0 for large text/icons)
  description: string;
}

/**
 * Calculates relative luminance of an sRGB color per WCAG 2.1 specs.
 */
export function getRelativeLuminance(hexColor: string): number {
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) {
    return 0;
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates relative luminance from an rgb/rgba string (e.g. 'rgb(15, 23, 42)').
 */
export function rgbStringToLuminance(rgbStr: string): number {
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;
  const r = parseInt(match[1], 10) / 255;
  const g = parseInt(match[2], 10) / 255;
  const b = parseInt(match[3], 10) / 255;

  const toLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates the contrast ratio between two hex colors (returns ratio between 1 and 21).
 */
export function getContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = getRelativeLuminance(fgHex);
  const lum2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Calculates contrast ratio from two luminance values.
 */
export function getLuminanceContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Canonical semantic tokens for Light and Dark themes in DentaTrack
 * Every combination is calculated and verified to meet WCAG AA specifications.
 */
export const LIGHT_THEME_TOKENS: ColorTokenPair[] = [
  // Primary page text on page & card background
  { name: 'Primary Text on Page', fg: '#0f172a', bg: '#eaf0f6', minRatio: 4.5, description: 'Page headers & titles against light canvas' },
  { name: 'Secondary Text on Page', fg: '#334155', bg: '#eaf0f6', minRatio: 4.5, description: 'Section subtitles against light canvas' },
  { name: 'Muted Text on Page', fg: '#475569', bg: '#eaf0f6', minRatio: 4.5, description: 'Tertiary metadata against light canvas' },

  { name: 'Primary Text on Card', fg: '#0f172a', bg: '#ffffff', minRatio: 4.5, description: 'Primary headings and title text on card' },
  { name: 'Secondary Text on Card', fg: '#334155', bg: '#ffffff', minRatio: 4.5, description: 'Card body text and descriptive labels' },
  { name: 'Muted Text on Card', fg: '#475569', bg: '#ffffff', minRatio: 4.5, description: 'Subtle captions, timestamps, file numbers' },

  { name: 'Primary Text on Inset Well', fg: '#0f172a', bg: '#f1f5f9', minRatio: 4.5, description: 'Text inside filter containers and wells' },
  { name: 'Secondary Text on Inset Well', fg: '#334155', bg: '#f1f5f9', minRatio: 4.5, description: 'Unselected filter pill labels' },
  
  // Interactive Buttons & Controls (Sky-700 #0369a1 gives 6.01:1, Sky-600 #0284c7 gives 4.10:1 which exceeds UI 3.0:1)
  { name: 'Text on Primary Accent', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'White text on Sky-700 action button' },
  { name: 'Selected Filter Pill', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'Active filter pill text on selected background' },
  { name: 'Selected Tab Text', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'Active filter tab text in Light Mode' },
  { name: 'Neutral Badge Text', fg: '#334155', bg: '#f1f5f9', minRatio: 4.5, description: 'Neutral badge (File #) text on light slate container' },
  { name: 'Modal Header Title', fg: '#0f172a', bg: '#ffffff', minRatio: 4.5, description: 'Modal header title on light surface' },
  { name: 'Modal Header Subtitle', fg: '#334155', bg: '#ffffff', minRatio: 4.5, description: 'Modal header subtitle on light surface' },

  // Status Badges & Roles (Light mode)
  { name: 'Success Badge Text', fg: '#065f46', bg: '#ecfdf5', minRatio: 4.5, description: 'Signed / completed status text' },
  { name: 'Warning Badge Text', fg: '#92400e', bg: '#fffbeb', minRatio: 4.5, description: 'Pending signature / attention text' },
  { name: 'Error Badge Text', fg: '#9f1239', bg: '#fff1f2', minRatio: 4.5, description: 'Incomplete / danger badge text' },
  { name: 'Info Badge Text', fg: '#075985', bg: '#f0f9ff', minRatio: 4.5, description: 'In progress / clinic info badge text' },
  { name: 'Purple Badge Text', fg: '#6b21a8', bg: '#faf5ff', minRatio: 4.5, description: 'Moodle ready / comprehensive badge text' },

  // Highlighted Cards (Light mode)
  { name: 'Sky Accent Card Text', fg: '#0c4a6e', bg: '#f0f9ff', minRatio: 4.5, description: 'Text on sky highlighted card' },
  { name: 'Emerald Accent Card Text', fg: '#064e3b', bg: '#ecfdf5', minRatio: 4.5, description: 'Text on emerald completed card' },
  { name: 'Amber Accent Card Text', fg: '#78350f', bg: '#fffbeb', minRatio: 4.5, description: 'Text on amber attention card' },
  { name: 'Upcoming Banner Text', fg: '#78350f', bg: '#fffbeb', minRatio: 4.5, description: 'Descriptive text on upcoming feature banner' },
];

export const DARK_THEME_TOKENS: ColorTokenPair[] = [
  // Primary page text on dark page & card background (#0b1120 and #1e293b)
  { name: 'Dark Primary Text on Page', fg: '#f8fafc', bg: '#0b1120', minRatio: 4.5, description: 'Primary headings against deep navy canvas' },
  { name: 'Dark Secondary Text on Page', fg: '#cbd5e1', bg: '#0b1120', minRatio: 4.5, description: 'Section subtitles against deep navy canvas' },
  { name: 'Dark Muted Text on Page', fg: '#94a3b8', bg: '#0b1120', minRatio: 4.5, description: 'Tertiary metadata against deep navy canvas' },

  { name: 'Dark Primary Text on Card', fg: '#f8fafc', bg: '#1e293b', minRatio: 4.5, description: 'Primary headings and titles in dark mode' },
  { name: 'Dark Secondary Text on Card', fg: '#cbd5e1', bg: '#1e293b', minRatio: 4.5, description: 'Card body text and labels in dark mode' },
  { name: 'Dark Muted Text on Card', fg: '#94a3b8', bg: '#1e293b', minRatio: 4.5, description: 'Subtle captions, timestamps in dark mode' },

  { name: 'Dark Primary Text on Well', fg: '#f8fafc', bg: '#0f172a', minRatio: 4.5, description: 'Text inside filter containers in dark mode' },
  { name: 'Dark Secondary Text on Well', fg: '#cbd5e1', bg: '#0f172a', minRatio: 4.5, description: 'Unselected filter pill labels in dark mode' },
  
  // Interactive Buttons & Controls (Dark mode)
  { name: 'Dark Text on Primary Accent', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'White text on Sky-700 action button in dark mode' },
  { name: 'Dark Selected Filter Pill', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'Active filter pill text in dark mode' },
  { name: 'Dark Selected Tab Text', fg: '#ffffff', bg: '#0369a1', minRatio: 4.5, description: 'Active filter tab text in dark mode' },
  { name: 'Dark Secondary Button Text', fg: '#f8fafc', bg: '#334155', minRatio: 4.5, description: 'Light text on Slate-700 secondary button' },
  { name: 'Dark Neutral Badge Text', fg: '#e2e8f0', bg: '#1e293b', minRatio: 4.5, description: 'Neutral badge text on dark container' },
  { name: 'Dark Modal Header Title', fg: '#f8fafc', bg: '#1e293b', minRatio: 4.5, description: 'Modal header title on dark modal surface' },
  { name: 'Dark Modal Header Subtitle', fg: '#cbd5e1', bg: '#1e293b', minRatio: 4.5, description: 'Modal header subtitle on dark modal surface' },

  // Status Badges (Dark mode - dark container with vivid light foreground)
  { name: 'Dark Success Badge Text', fg: '#6ee7b7', bg: '#064e3b', minRatio: 4.5, description: 'Emerald text on dark emerald container' },
  { name: 'Dark Warning Badge Text', fg: '#fde68a', bg: '#78350f', minRatio: 4.5, description: 'Amber text on dark amber container' },
  { name: 'Dark Error Badge Text', fg: '#fecdd3', bg: '#881337', minRatio: 4.5, description: 'Rose text on dark rose container' },
  { name: 'Dark Info Badge Text', fg: '#7dd3fc', bg: '#0c4a6e', minRatio: 4.5, description: 'Sky text on dark sky container' },
  { name: 'Dark Purple Badge Text', fg: '#d8b4fe', bg: '#581c87', minRatio: 4.5, description: 'Purple text on dark purple container' },

  // Highlighted Cards (Dark mode)
  { name: 'Dark Sky Accent Card Text', fg: '#f0f9ff', bg: '#0c4a6e', minRatio: 4.5, description: 'Text on dark sky highlighted card' },
  { name: 'Dark Emerald Accent Card Text', fg: '#f0fdf4', bg: '#064e3b', minRatio: 4.5, description: 'Text on dark emerald completed card' },
  { name: 'Dark Amber Accent Card Text', fg: '#fffbeb', bg: '#78350f', minRatio: 4.5, description: 'Text on dark amber attention card' },
  { name: 'Dark Upcoming Banner Text', fg: '#cbd5e1', bg: '#1e293b', minRatio: 4.5, description: 'Descriptive text on dark upcoming feature banner' },
];

export interface ValidationResult {
  valid: boolean;
  violations: Array<{
    name: string;
    actualRatio: number;
    requiredRatio: number;
    fg: string;
    bg: string;
    description: string;
  }>;
}

/**
 * Validates all registered theme tokens against their required WCAG contrast thresholds.
 */
export function validateThemeTokens(): ValidationResult {
  const allTokens = [...LIGHT_THEME_TOKENS, ...DARK_THEME_TOKENS];
  const violations: ValidationResult['violations'] = [];

  for (const token of allTokens) {
    const ratio = getContrastRatio(token.fg, token.bg);
    if (ratio < token.minRatio) {
      violations.push({
        name: token.name,
        actualRatio: ratio,
        requiredRatio: token.minRatio,
        fg: token.fg,
        bg: token.bg,
        description: token.description,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export interface SuspiciousElementFinding {
  element: string;
  className: string;
  foreground: string;
  background: string;
  contrastRatio: number;
  expectedMin: number;
  issue: string;
}

/**
 * Resolves effective background color of an element by traversing up the DOM.
 */
function getEffectiveBackgroundColor(el: HTMLElement): string {
  let curr: HTMLElement | null = el;
  while (curr && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    const bg = style.backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return bg;
    }
    curr = curr.parentElement;
  }
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? 'rgb(11, 17, 32)' : 'rgb(234, 240, 246)';
}

/**
 * Development diagnostic capable of detecting suspicious semantic color combinations
 * and actual rendered contrast violations on the active page.
 */
export function detectSuspiciousCombinations(rootElement?: HTMLElement): SuspiciousElementFinding[] {
  if (typeof document === 'undefined' || typeof window === 'undefined') return [];
  const root = rootElement || document.body;
  const isDarkMode = document.documentElement.classList.contains('dark');
  const findings: SuspiciousElementFinding[] = [];

  // Query all text-bearing elements
  const candidates = root.querySelectorAll<HTMLElement>(
    'p, h1, h2, h3, h4, h5, h6, span, button, a, label, li, td, th'
  );

  candidates.forEach((el) => {
    // Skip empty, hidden, or structural overlay elements
    if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) return;
    const text = el.innerText?.trim();
    if (!text || text.length === 0) return;

    // Skip fixed overlays or dev widgets
    if (el.closest('[role="status"]') || el.classList.contains('fixed-portal')) return;

    const style = window.getComputedStyle(el);
    const fg = style.color;
    const bg = getEffectiveBackgroundColor(el);

    const fgLum = rgbStringToLuminance(fg);
    const bgLum = rgbStringToLuminance(bg);
    const ratio = getLuminanceContrastRatio(fgLum, bgLum);

    // Determine if text is large (>= 24px or >= 18.5px bold)
    const fontSize = parseFloat(style.fontSize) || 14;
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.5 && fontWeight >= 700);
    const minRequired = isLarge ? 3.0 : 4.5;

    // Detect white text on light backgrounds
    if (fgLum > 0.85 && bgLum > 0.4) {
      findings.push({
        element: `<${el.tagName.toLowerCase()}> "${text.slice(0, 24)}..."`,
        className: el.className,
        foreground: fg,
        background: bg,
        contrastRatio: ratio,
        expectedMin: minRequired,
        issue: 'Critical: Light/White text rendered on light background surface.',
      });
    }
    // Detect dark text on dark backgrounds in Dark Mode
    else if (isDarkMode && fgLum < 0.15 && bgLum < 0.25) {
      findings.push({
        element: `<${el.tagName.toLowerCase()}> "${text.slice(0, 24)}..."`,
        className: el.className,
        foreground: fg,
        background: bg,
        contrastRatio: ratio,
        expectedMin: minRequired,
        issue: 'Critical: Dark text rendered on dark background surface.',
      });
    }
    // General contrast failure for meaningful text
    else if (ratio < minRequired && text.length > 2 && style.opacity !== '0') {
      findings.push({
        element: `<${el.tagName.toLowerCase()}> "${text.slice(0, 24)}..."`,
        className: el.className,
        foreground: fg,
        background: bg,
        contrastRatio: ratio,
        expectedMin: minRequired,
        issue: `Contrast ratio ${ratio}:1 is below required WCAG threshold ${minRequired}:1`,
      });
    }
  });

  return findings;
}

/**
 * Backward compatibility helper for legacy call sites.
 */
export function detectSuspiciousGreyBoxes(element?: HTMLElement): string[] {
  const findings = detectSuspiciousCombinations(element);
  return findings.map((f) => `${f.issue} on ${f.element} [classes: "${f.className}"]`);
}

/**
 * Run diagnostic check in development environment without crashing production.
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    const check = validateThemeTokens();
    if (!check.valid) {
      console.warn('[DentaTrack Contrast Guard] Theme tokens with contrast violations:', check.violations);
    }
  } catch (err) {
    console.error('[DentaTrack Contrast Guard] Failed to execute token verification:', err);
  }
}
