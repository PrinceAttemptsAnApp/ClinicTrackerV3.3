/**
 * Centralized Haptic Feedback Utility
 * 
 * Provides crisp, subtle, and intentional tactile feedback on supported
 * mobile devices (via navigator.vibrate) with safe feature detection and no-op fallbacks.
 * Designed specifically for high-end clinical/academic productivity workflows.
 */

type HapticStyle = 'light' | 'medium' | 'success' | 'warning' | 'error' | 'selection';

class HapticController {
  private isSupported: boolean;
  private isEnabled: boolean = true;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator;
  }

  /**
   * Check if vibration is available in the current browser/environment
   */
  public supported(): boolean {
    return this.isSupported;
  }

  /**
   * Toggle haptics globally if user disables them in settings
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Internal trigger with strict duration limits (never long or jarring)
   */
  private trigger(pattern: number | number[]): void {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore security policy or unsupported gesture restrictions
    }
  }

  /**
   * Light: For tiny micro-interactions
   * e.g., toggling a checkbox, tapping a filter pill, selecting a tooth
   */
  public light(): void {
    this.trigger(12);
  }

  /**
   * Selection: Ultra-short tick
   * e.g., switching bottom navigation tabs or clinic tabs
   */
  public selection(): void {
    this.trigger(8);
  }

  /**
   * Medium: For meaningful state transitions
   * e.g., case created, milestone reached, status updated
   */
  public medium(): void {
    this.trigger(22);
  }

  /**
   * Success: Crisp, rhythmic confirmation (two tiny taps)
   * e.g., rubric signed, evidence photo uploaded, procedure completed
   */
  public success(): void {
    this.trigger([14, 35, 18]);
  }

  /**
   * Warning: Slightly distinct alert
   * e.g., missing signature prompt or confirmation request
   */
  public warning(): void {
    this.trigger([24, 40, 24]);
  }

  /**
   * Error: Distinct double pulse
   * e.g., validation failure or failed file upload
   */
  public error(): void {
    this.trigger([30, 45, 30]);
  }
}

export const haptic = new HapticController();
