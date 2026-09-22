import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  RefreshCw, 
  AlertCircle, 
  Users, 
  Activity, 
  Smartphone, 
  FolderPlus, 
  FileCheck2, 
  Download, 
  Laptop, 
  Layers,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface StatsResponse {
  metricDisclaimer?: string;
  totalInstallationsEverSeen: number;
  activeUsersCurrently: number;
  recentHeartbeatWindowMinutes: number;
  events?: {
    app_opened?: number;
    case_created?: number;
    procedure_created?: number;
    case_exported?: number;
    pwa_installed?: number;
    heartbeat?: number;
  };
  breakdown?: {
    appVersion?: Record<string, number>;
    platform?: Record<string, number>;
    displayMode?: Record<string, number>;
  };
  serverTimestamp?: string;
}

interface AdminAnalyticsViewProps {
  onBack?: () => void;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ onBack }) => {
  const [secretKey, setSecretKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchStats = async (keyToUse: string) => {
    if (!keyToUse.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://dentatrack-analytics.amirsameh04.workers.dev/api/analytics/stats',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse.trim()}`,
          },
        }
      );

      if (response.status === 401) {
        setError('Invalid analytics key');
        setStats(null);
        return;
      }

      if (!response.ok) {
        setError('Unable to fetch analytics statistics at this time.');
        setStats(null);
        return;
      }

      const data: StatsResponse = await response.json();
      setStats(data);
      setSecretKey(keyToUse.trim());
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Unable to fetch analytics statistics at this time.');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    fetchStats(inputKey.trim());
  };

  const handleRefresh = () => {
    if (secretKey) {
      fetchStats(secretKey);
    }
  };

  const handleLock = () => {
    setSecretKey('');
    setInputKey('');
    setStats(null);
    setError(null);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
        )}

        {secretKey && (
          <button
            onClick={handleLock}
            className="ml-auto px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Clear key from memory and lock analytics dashboard"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Lock Analytics</span>
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-900 text-xs flex items-center gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0" />
        <div className="leading-relaxed">
          <span className="font-extrabold text-sky-900">100% Anonymous Product Analytics: </span>
          <span className="text-slate-600">
            DentaTrack analytics measure app usage, installation pings, and device types. Zero patient records, student names, tooth numbers, clinical notes, or IndexedDB files are ever collected or transmitted.
          </span>
        </div>
      </div>

      {/* Authentication Prompt Screen */}
      {!stats && (
        <div className="frosted-card rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto my-6 border border-slate-200 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-800">Owner Analytics Portal</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Enter your private analytics secret key to view live usage statistics.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter private analytics key"
                className="neu-input w-full px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-center text-slate-800 bg-white"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputKey.trim()}
              className="neu-btn-primary w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Secret...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Analytics</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            The key is kept strictly in React component memory and is never saved to local storage, cookies, or browser logs.
          </p>
        </div>
      )}

      {/* Main Analytics Dashboard */}
      {stats && (
        <div className="space-y-5">
          {/* Dashboard Header Bar */}
          <div className="frosted-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">DentaTrack Usage Dashboard</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live Cloudflare KV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lastRefreshed ? `Last refreshed at ${lastRefreshed}` : 'Live stats from Cloudflare Worker'}
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>

          {/* Primary Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Unique Installations */}
            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Devices</span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 block">
                  {stats.totalInstallationsEverSeen}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                  Unique installations ever
                </span>
              </div>
            </div>

            {/* Currently Active Users */}
            <div className="frosted-card rounded-2xl p-4 border border-emerald-200/90 bg-emerald-50/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Active Now</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 block">
                    {stats.activeUsersCurrently}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mb-1" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                  Heartbeat in last 3 min
                </span>
              </div>
            </div>

            {/* App Opens */}
            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">App Opens</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center border border-purple-500/30">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 block">
                  {stats.events?.app_opened || 0}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                  Launch events logged
                </span>
              </div>
            </div>

            {/* PWA Installed */}
            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PWA Installs</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center border border-amber-500/30">
                  <Download className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 block">
                  {stats.events?.pwa_installed || 0}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                  Standalone app prompts
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Core Usage Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90">
              <div className="flex items-center gap-2 mb-1 text-slate-600 text-xs font-bold">
                <FolderPlus className="w-4 h-4 text-sky-600" />
                <span>Cases Created</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 block">
                {stats.events?.case_created || 0}
              </span>
            </div>

            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90">
              <div className="flex items-center gap-2 mb-1 text-slate-600 text-xs font-bold">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Procedures Created</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 block">
                {stats.events?.procedure_created || 0}
              </span>
            </div>

            <div className="frosted-card rounded-2xl p-4 border border-slate-200/90">
              <div className="flex items-center gap-2 mb-1 text-slate-600 text-xs font-bold">
                <Download className="w-4 h-4 text-purple-600" />
                <span>Case Exports</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 block">
                {stats.events?.case_exported || 0}
              </span>
            </div>
          </div>

          {/* Categorized Breakdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Display Mode Breakdown */}
            <div className="frosted-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-sm">Display Mode</h3>
              </div>
              <div className="space-y-2 text-xs">
                {stats.breakdown?.displayMode && Object.keys(stats.breakdown.displayMode).length > 0 ? (
                  Object.entries(stats.breakdown.displayMode).map(([mode, count]) => (
                    <div key={mode} className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-200/70">
                      <span className="font-semibold text-slate-700 capitalize">{mode}</span>
                      <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No display mode data yet</p>
                )}
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="frosted-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Laptop className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-sm">Device Platform</h3>
              </div>
              <div className="space-y-2 text-xs">
                {stats.breakdown?.platform && Object.keys(stats.breakdown.platform).length > 0 ? (
                  Object.entries(stats.breakdown.platform).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-200/70">
                      <span className="font-semibold text-slate-700 capitalize">{platform}</span>
                      <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No platform data yet</p>
                )}
              </div>
            </div>

            {/* App Version Breakdown */}
            <div className="frosted-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">App Versions</h3>
              </div>
              <div className="space-y-2 text-xs">
                {stats.breakdown?.appVersion && Object.keys(stats.breakdown.appVersion).length > 0 ? (
                  Object.entries(stats.breakdown.appVersion).map(([version, count]) => (
                    <div key={version} className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-200/70">
                      <span className="font-semibold font-mono text-slate-700">v{version}</span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No version data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
