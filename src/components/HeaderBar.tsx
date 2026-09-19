import React, { useState, useEffect } from 'react';
import { Sparkles, Wifi, WifiOff, Stethoscope } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { StudentProfile } from '../types';

interface HeaderBarProps {
  profile: StudentProfile;
  activeSemester?: string;
  onSemesterChange?: (sem: 'Semester 1' | 'Semester 2') => void;
  onOpenTutorial: () => void;
}

const GREETINGS = [
  'Ready for clinical sessions today, Doctor?',
  'Precision & care, Doctor. Let\'s conquer today\'s cases!',
  'Keep rubber dam isolated and chairside ergonomics sharp.',
  'Remember to photograph rubrics right after instructor sign-off.',
  'Target: 1+ Comprehensive Case per semester. You\'ve got this!',
  'Excellence in every margin and prep, Doctor.',
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  onOpenTutorial,
}) => {
  const isOnline = useOnlineStatus();
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="frosted-glass sticky top-0 z-30 px-4 py-2.5 sm:px-6 border-b border-white/60">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Identity & Rotating Doctor Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-800">
                DentaTrack
              </h1>
              <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 border border-sky-500/30">
                5th Year Clinical
              </span>
            </div>
            {/* Rotating Doctor Greeting */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium transition-all duration-500">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 animate-pulse" />
              <span className="font-semibold text-slate-700">{profile.studentName || 'Doctor'}:</span>
              <span className="truncate max-w-[200px] sm:max-w-md text-slate-500">
                {GREETINGS[greetingIndex]}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Online/Offline badge, Tutorial & Install button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Online/Offline indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
            }`}
            title={isOnline ? 'Online - Local Database Active' : 'Offline - Fully Functional with Local Storage'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span className="text-[11px]">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span className="text-[11px]">Offline Ready</span>
              </>
            )}
          </div>

          {/* Workflow Guide / Tutorial Button */}
          <button
            onClick={onOpenTutorial}
            className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-700 cursor-pointer flex items-center gap-1"
            title="Open Interactive Clinical Workflow Tutorial"
          >
            <span className="hidden sm:inline">Guide</span>
            <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold">?</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
