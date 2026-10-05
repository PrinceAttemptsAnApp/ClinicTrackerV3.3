import React from 'react';
import { DisciplineType } from '../types';
import { 
  ToothIcon, 
  EndoToothIcon, 
  OperativeToothIcon, 
  RemovableDentureIcon, 
  PeriodonticIcon, 
  OralSurgeryIcon, 
  PediatricToothIcon, 
  OrthodonticsIcon,
  getDisciplineIcon,
  getProcedureIcon,
  getClinicalActionIcon,
  getStatusIcon,
  getNavigationIcon
} from './clinicalIcons';

export {
  ToothIcon, 
  EndoToothIcon, 
  OperativeToothIcon, 
  RemovableDentureIcon, 
  PeriodonticIcon, 
  OralSurgeryIcon, 
  PediatricToothIcon, 
  OrthodonticsIcon,
  getDisciplineIcon,
  getProcedureIcon,
  getClinicalActionIcon,
  getStatusIcon,
  getNavigationIcon
};

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

/**
 * Returns a cohesive visual configuration for a clinical case status.
 */
export function getCaseStatusVisual(c: {
  status: string;
  procedures: {
    steps: { isCompleted: boolean }[];
    rubrics: { status: string }[];
    moodleStatus?: string;
  }[];
}): {
  label: string;
  dotColor: string;
  badgeStyle: string;
  progressColor: string;
  isAttentionNeeded: boolean;
} {
  const allProcedures = c.procedures || [];
  const isAllSubmitted = allProcedures.length > 0 && allProcedures.every((p) => p.moodleStatus === 'Submitted');
  const isAwaitingSignatures =
    c.status === 'Finished (Awaiting Signatures)' ||
    allProcedures.some((p) => p.rubrics.some((r) => r.status === 'Pending'));

  if (c.status === 'Completed' || isAllSubmitted) {
    return {
      label: 'Completed',
      dotColor: 'bg-emerald-500',
      badgeStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/90 dark:border-emerald-800/60',
      progressColor: 'bg-emerald-500',
      isAttentionNeeded: false,
    };
  }

  if (isAwaitingSignatures) {
    return {
      label: 'Missing Signatures',
      dotColor: 'bg-amber-500 animate-pulse',
      badgeStyle: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/90 dark:border-amber-800/60',
      progressColor: 'bg-amber-500',
      isAttentionNeeded: true,
    };
  }

  if (c.status === 'Ready for Moodle') {
    return {
      label: 'Ready for Moodle',
      dotColor: 'bg-purple-500',
      badgeStyle: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200/90 dark:border-purple-800/60',
      progressColor: 'bg-purple-500',
      isAttentionNeeded: false,
    };
  }

  return {
    label: 'In Progress',
    dotColor: 'bg-sky-500',
    badgeStyle: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200/90 dark:border-sky-800/60',
    progressColor: 'bg-sky-500',
    isAttentionNeeded: false,
  };
}

