/**
 * DentaTrack Storage Persistence & Health Diagnostic Utilities
 * Requests browser persistent storage (navigator.storage.persist) to prevent OS auto-eviction
 * and provides real-time IndexedDB storage quota diagnostics.
 */

export interface StorageHealthReport {
  isSupported: boolean;
  isPersisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

/**
 * Safely requests persistent storage from the browser (navigator.storage.persist)
 * Prevents mobile OS (iOS/Android) from automatically clearing IndexedDB under low disk space.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (
      typeof navigator === 'undefined' ||
      !navigator.storage ||
      typeof navigator.storage.persist !== 'function'
    ) {
      return false;
    }

    // Safely check if persisted method exists before calling it
    if (typeof navigator.storage.persisted === 'function') {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
          return true;
        }
      } catch (e) {
        console.warn('[DentaTrack Storage] navigator.storage.persisted check ignored:', e);
      }
    }

    // Call persist method safely
    const granted = await navigator.storage.persist();
    return Boolean(granted);
  } catch (err) {
    console.warn('[DentaTrack Storage] navigator.storage.persist request handled gracefully:', err);
    return false;
  }
}

/**
 * Retrieves real-time storage diagnostics using navigator.storage.estimate() and navigator.storage.persisted()
 */
export async function getStorageHealth(): Promise<StorageHealthReport> {
  const defaultReport: StorageHealthReport = {
    isSupported: false,
    isPersisted: false,
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: 'Unknown',
    quotaFormatted: 'Unknown',
    percentUsed: 0,
  };

  try {
    if (typeof navigator === 'undefined' || !navigator.storage) {
      return defaultReport;
    }

    const hasEstimate = typeof navigator.storage.estimate === 'function';
    const hasPersisted = typeof navigator.storage.persisted === 'function';
    const isSupported = hasEstimate && hasPersisted;

    let isPersisted = false;
    if (hasPersisted) {
      try {
        isPersisted = Boolean(await navigator.storage.persisted());
      } catch {
        isPersisted = false;
      }
    }

    let usageBytes = 0;
    let quotaBytes = 0;

    if (hasEstimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch {
        usageBytes = 0;
        quotaBytes = 0;
      }
    }

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const percentUsed = quotaBytes > 0 ? Number(((usageBytes / quotaBytes) * 100).toFixed(2)) : 0;

    return {
      isSupported,
      isPersisted,
      usageBytes,
      quotaBytes,
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      percentUsed,
    };
  } catch (err) {
    console.warn('[DentaTrack Storage] Storage health estimate check failed:', err);
    return defaultReport;
  }
}
