import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { DentalCase, ClinicSession } from '../types';
import { haptic } from '../lib/haptics';

interface GoogleCalendarSettingsCardProps {
  cases: DentalCase[];
  schedule?: ClinicSession[];
}

export const GoogleCalendarSettingsCard: React.FC<GoogleCalendarSettingsCardProps> = ({
  cases,
  schedule = [],
}) => {
  const {
    isConnected,
    settings,
    calendars,
    isLoadingCalendars,
    isSyncing,
    lastResult,
    error,
    connect,
    disconnect,
    selectCalendar,
    syncUpcoming,
  } = useGoogleCalendar();

  const [isConnecting, setIsConnecting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleConnect = async () => {
    haptic.selection();
    setIsConnecting(true);
    try {
      await connect();
      haptic.success();
    } catch (err: any) {
      haptic.warning();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect DentaTrack from Google Calendar? Local clinical records will remain completely safe.')) {
      haptic.light();
      await disconnect();
    }
  };

  const handleSyncNow = async () => {
    haptic.selection();
    setSyncFeedback(null);
    try {
      const res = await syncUpcoming(cases, schedule, 60);
      haptic.success();
      setSyncFeedback(
        `✓ Sync completed: ${res.synced} visit${res.synced === 1 ? '' : 's'} added, ${res.updated} updated.`
      );
    } catch (err: any) {
      haptic.warning();
      setSyncFeedback(err.message || 'Sync failed.');
    }
  };

  const formattedLastSync = settings.lastSyncedAt 
    ? new Date(settings.lastSyncedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/80 dark:border-sky-800/60 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Google Calendar
              </h2>
              {isConnected && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync planned patient appointments and clinical sessions to your personal calendar
            </p>
          </div>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-xs font-semibold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer flex items-center gap-1 self-start sm:self-auto py-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        )}
      </div>

      {/* DISCONNECTED STATE */}
      {!isConnected ? (
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Connect DentaTrack to Google Calendar to keep planned patient appointments and clinic shifts automatically organized on your phone and laptop.
          </p>

          {/* Official Sign in with Google Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center gap-3 font-bold text-xs sm:text-sm"
            >
              {/* Google multicolor SVG icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.91H1.28v3.13C3.26 21.3 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.28C.46 8.2 0 10.04 0 12s.46 3.8 1.28 5.43l4.04-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.7 1.28 6.57l4.04 3.14c.94-2.82 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span>{isConnecting ? 'Opening Google Authorization...' : 'Connect Google Calendar'}</span>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Privacy First:</strong> DentaTrack only sends planned appointment times and minimal procedure summaries that you choose to synchronize. Your patient database and radiographs remain stored locally on your device.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* CONNECTED STATE */
        <div className="space-y-4 text-xs">
          {/* Account and Target Calendar Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Google Account
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {settings.userName || 'Authorized Doctor'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                {settings.userEmail}
              </p>
            </div>

            {/* Calendar Selector */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Calendar
              </span>
              {calendars.length > 0 ? (
                <div className="relative">
                  <select
                    value={settings.selectedCalendarId}
                    onChange={(e) => {
                      const cal = calendars.find((c) => c.id === e.target.value);
                      selectCalendar(e.target.value, cal?.summary);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 appearance-none pr-7 cursor-pointer"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.primary ? `Personal (${cal.summary})` : cal.summary}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              ) : (
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {isLoadingCalendars ? 'Loading calendars...' : settings.selectedCalendarName || 'Primary Calendar'}
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                Where DentaTrack patient visits are recorded
              </p>
            </div>
          </div>

          {/* Sync Status & Action Bar */}
          <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Synchronization Status
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {formattedLastSync ? `Last synced: ${formattedLastSync}` : 'Ready to synchronize planned visits.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-sky-600/20 shrink-0 self-start sm:self-auto disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Visits...' : 'Sync Upcoming (60 Days)'}</span>
            </button>
          </div>

          {/* Sync Result Feedback */}
          {syncFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
              syncFeedback.includes('✓')
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}>
              {syncFeedback.includes('✓') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{syncFeedback}</span>
            </div>
          )}

          {error && !syncFeedback && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
