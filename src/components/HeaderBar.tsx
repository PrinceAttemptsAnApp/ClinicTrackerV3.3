import React, { useState, useEffect } from 'react';
import { Sparkles, Wifi, WifiOff, Stethoscope } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { StudentProfile } from '../types';
import { haptic } from '../lib/haptics';

interface HeaderBarProps {
  profile: StudentProfile;
  activeSemester?: string;
  onSemesterChange?: (sem: 'Semester 1' | 'Semester 2') => void;
  onOpenTutorial: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "One case at a time.",
  "Keep moving.",
  "Small progress still counts.",
  "Do the work. Then go home.",
  "Future you will appreciate this.",
  "One more procedure.",
  "Keep the momentum.",
  "Make today's clinic count.",
  "Progress, not perfection.",
  "Get it done.",
  "You've got this.",
  "Stay consistent.",
  "Keep your records clean.",
  "One requirement closer.",
  "Finish what you started.",
  "Make the next visit easier.",
  "Keep the case moving.",
  "Do good work. Document it.",
  "Another day, another requirement.",
  "Slowly turning into a competent dentist."
];

const HUMOR_QUOTES = [
  "Another day in the operatory.",
  "The patient is waiting. Probably.",
  "Document it before you forget it.",
  "Future you is going to need those records.",
  "Your requirements aren't going to finish themselves.",
  "At least the rubber dam is cooperating.",
  "One more signature.",
  "Another tooth enters the spreadsheet.",
  "The clinic awaits.",
  "Somewhere, a rubric needs a signature.",
  "You came here voluntarily. Allegedly.",
  "Keep calm and check the occlusion.",
  "Trust the process. Verify the margins.",
  "Your case history remembers everything.",
  "Nothing says progress like another completed checkbox.",
  "One day this will all be worth it. Probably.",
  "Dentistry: where 'almost done' means three more visits."
];

const TROLL_QUOTES = [
  "hey loser, im watching you",
  "You opened DentaTrack instead of studying. Interesting.",
  "Your requirements are still there.",
  "I saw that unfinished procedure.",
  "Nice of you to finally show up.",
  "You could be studying right now.",
  "Another day of pretending you're on top of things.",
  "The rubric knows what you did.",
  "You have 14 unfinished things. Good luck.",
  "Don't worry, I'll wait.",
  "That case isn't going to finish itself.",
  "You thought you were done?",
  "Back to work, champion.",
  "Your future self has filed a complaint.",
  "I checked. You still have requirements.",
  "You can't escape the checklist.",
  "The clinic remembers.",
  "One more checkbox. You know you want to.",
  "You opened the app. Might as well do something.",
  "Impressive. You actually documented it.",
  "Somewhere, an instructor is asking for your signature.",
  "This is your sign to finish that case.",
  "You're not procrastinating if you're inside the clinical tracker.",
  "Technically, opening the app counts as progress. Technically.",
  "I have nothing to add. Your case speaks for itself.",
  "Congratulations on doing the bare minimum. Keep going.",
  "The tooth isn't going to treat itself.",
  "You can leave when the checklist says you can.",
  "I believe in you. Unfortunately.",
  "Your clinical requirements have noticed your absence."
];

function getRandomQuote(previousQuote: string): string {
  const rand = Math.random();
  let pool = MOTIVATIONAL_QUOTES;

  if (rand < 0.05) {
    pool = TROLL_QUOTES;
  } else if (rand < 0.30) { // 0.05 + 0.25 = 0.30
    pool = HUMOR_QUOTES;
  } else {
    pool = MOTIVATIONAL_QUOTES;
  }

  let selected = pool[Math.floor(Math.random() * pool.length)];
  let attempts = 0;
  while (selected === previousQuote && attempts < 10) {
    selected = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  }
  return selected;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  onOpenTutorial,
}) => {
  const isOnline = useOnlineStatus();
  const [currentQuote, setCurrentQuote] = useState(() => getRandomQuote(''));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      const timeout = setTimeout(() => {
        setCurrentQuote((prev) => getRandomQuote(prev));
        setFade(true);
      }, 400);
      return () => clearTimeout(timeout);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="frosted-glass sticky top-0 z-30 px-4 py-2.5 sm:px-6 border-b border-white/60">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Identity & Rotating Doctor Greeting */}
        <div className="flex items-center gap-3 max-w-full sm:max-w-[65%] md:max-w-[70%]">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-800">
                DentaTrack
              </h1>
              <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 border border-sky-500/30">
                5th Year Clinical
              </span>
            </div>
            {/* Rotating Doctor Greeting */}
            <div className={`flex items-start gap-1.5 text-xs text-slate-600 font-medium transition-opacity duration-300 motion-reduce:transition-none ${fade ? 'opacity-100' : 'opacity-0'}`}>
              <Sparkles className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 animate-pulse mt-0.5 motion-reduce:animate-none" />
              <div className="text-slate-500 leading-normal">
                <span className="font-semibold text-slate-700 mr-1">{profile.studentName || 'Doctor'}:</span>
                <span className="break-words">
                  {currentQuote}
                </span>
              </div>
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
            onClick={() => {
              haptic.light();
              onOpenTutorial();
            }}
            className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-700 cursor-pointer flex items-center gap-1 active:scale-95"
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
