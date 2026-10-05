import React from 'react';
import { 
  Crown, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Scissors, 
  Smile, 
  Compass, 
  Award, 
  Stethoscope,
  Layers,
  Activity
} from 'lucide-react';
import { DisciplineType } from '../types';

/**
 * Generates 1-2 uppercase initials from a patient name.
 */
export function getPatientInitials(name: string): string {
  if (!name || !name.trim()) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically generates a soft, pleasant color theme for a patient's avatar based on name hash.
 */
export function getPatientAvatarTheme(name: string): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  const themes = [
    {
      bg: 'bg-sky-100 dark:bg-sky-950/70',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60',
      ring: 'ring-sky-500/30',
    },
    {
      bg: 'bg-emerald-100 dark:bg-emerald-950/70',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      ring: 'ring-emerald-500/30',
    },
    {
      bg: 'bg-indigo-100 dark:bg-indigo-950/70',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800/60',
      ring: 'ring-indigo-500/30',
    },
    {
      bg: 'bg-purple-100 dark:bg-purple-950/70',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800/60',
      ring: 'ring-purple-500/30',
    },
    {
      bg: 'bg-teal-100 dark:bg-teal-950/70',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800/60',
      ring: 'ring-teal-500/30',
    },
    {
      bg: 'bg-amber-100 dark:bg-amber-950/70',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      ring: 'ring-amber-500/30',
    },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % themes.length;
  return themes[index];
}

/**
 * Returns a discipline-specific icon component.
 */
export function getDisciplineIcon(
  discipline: DisciplineType | string,
  className: string = 'w-4 h-4'
): React.ReactElement {
  const disc = discipline.toLowerCase();

  if (disc.includes('fixed') || disc.includes('crown') || disc.includes('bridge')) {
    return <Crown className={className} />;
  }
  if (disc.includes('endo') || disc.includes('root')) {
    return <Zap className={className} />;
  }
  if (disc.includes('operative') || disc.includes('restorative')) {
    return <Sparkles className={className} />;
  }
  if (disc.includes('removable') || disc.includes('denture') || disc.includes('prostho')) {
    return <Layers className={className} />;
  }
  if (disc.includes('perio') || disc.includes('scaling')) {
    return <ShieldCheck className={className} />;
  }
  if (disc.includes('surgery') || disc.includes('extraction')) {
    return <Scissors className={className} />;
  }
  if (disc.includes('pedo') || disc.includes('pediatric')) {
    return <Smile className={className} />;
  }
  if (disc.includes('ortho')) {
    return <Compass className={className} />;
  }
  if (disc.includes('comprehensive')) {
    return <Award className={className} />;
  }

  return <Stethoscope className={className} />;
}

/**
 * Returns subtle semantic discipline color classes.
 */
export function getDisciplineTheme(discipline: DisciplineType | string): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  const disc = discipline.toLowerCase();

  if (disc.includes('fixed')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/50',
      accent: 'text-amber-600 dark:text-amber-400',
    };
  }
  if (disc.includes('endo')) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/50',
      accent: 'text-rose-600 dark:text-rose-400',
    };
  }
  if (disc.includes('operative')) {
    return {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200/80 dark:border-sky-800/50',
      accent: 'text-sky-600 dark:text-sky-400',
    };
  }
  if (disc.includes('removable')) {
    return {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200/80 dark:border-indigo-800/50',
      accent: 'text-indigo-600 dark:text-indigo-400',
    };
  }
  if (disc.includes('perio')) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/50',
      accent: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (disc.includes('surgery')) {
    return {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200/80 dark:border-red-800/50',
      accent: 'text-red-600 dark:text-red-400',
    };
  }
  if (disc.includes('comprehensive')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200/80 dark:border-purple-800/50',
      accent: 'text-purple-600 dark:text-purple-400',
    };
  }

  return {
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200/80 dark:border-slate-700/60',
    accent: 'text-slate-600 dark:text-slate-400',
  };
}
