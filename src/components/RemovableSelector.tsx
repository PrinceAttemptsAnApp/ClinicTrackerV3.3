import React, { useMemo } from 'react';
import { Layers, Info } from 'lucide-react';
import { safeLocalStorage } from '../lib/safeStorage';
import { 
  ToothInfo, 
  PERMANENT_TEETH, 
} from './ToothDiagramSelector';
import { haptic } from '../lib/haptics';
import { RemovableCaseConfig } from '../types';

export type RemovableProsthesisType = 'none' | 'partial' | 'complete';

export interface RemovableSelectorProps {
  config: RemovableCaseConfig;
  onChange: (newConfig: RemovableCaseConfig) => void;
  notation?: 'palmer' | 'fdi';
}

/**
 * Creates a default empty RemovableCaseConfig object
 */
export function getDefaultRemovableConfig(): RemovableCaseConfig {
  return {
    maxillary: { type: 'complete', replacedTeeth: [] },
    mandibular: { type: 'complete', replacedTeeth: [] },
  };
}

/**
 * Converts a RemovableCaseConfig into a clinically intuitive toothNumber/description string
 */
export function formatRemovableSummary(
  config?: RemovableCaseConfig,
  notation: 'palmer' | 'fdi' = 'palmer'
): string {
  if (!config) return '';

  const formatTeeth = (teeth: string[]) => {
    if (!teeth || teeth.length === 0) return '';
    const sorted = [...teeth].sort();
    if (notation === 'palmer') {
      const symbols = sorted.map((fdi) => {
        const t = PERMANENT_TEETH.find((item) => item.fdi === fdi);
        return t ? t.digitalPalmer : fdi;
      });
      return symbols.join(', ');
    }
    return sorted.map((id) => `#${id}`).join(', ');
  };

  const parts: string[] = [];

  // Maxillary
  if (config.maxillary.type === 'complete') {
    parts.push('Maxillary: Complete Denture');
  } else if (config.maxillary.type === 'partial') {
    const teethStr = formatTeeth(config.maxillary.replacedTeeth);
    parts.push(`Maxillary: RPD${teethStr ? ` (Teeth: ${teethStr})` : ' (No teeth selected)'}`);
  }

  // Mandibular
  if (config.mandibular.type === 'complete') {
    parts.push('Mandibular: Complete Denture');
  } else if (config.mandibular.type === 'partial') {
    const teethStr = formatTeeth(config.mandibular.replacedTeeth);
    parts.push(`Mandibular: RPD${teethStr ? ` (Teeth: ${teethStr})` : ' (No teeth selected)'}`);
  }

  return parts.join(' | ');
}

/**
 * Validates whether the removable configuration is valid for saving
 */
export function validateRemovableConfig(config: RemovableCaseConfig): {
  isValid: boolean;
  errorMessage?: string;
} {
  const { maxillary, mandibular } = config;

  if (maxillary.type === 'none' && mandibular.type === 'none') {
    return {
      isValid: false,
      errorMessage: 'Please select at least one prosthesis for the Maxillary or Mandibular arch.',
    };
  }

  if (maxillary.type === 'partial' && maxillary.replacedTeeth.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Please select at least one replaced tooth for the Maxillary Partial Denture.',
    };
  }

  if (mandibular.type === 'partial' && mandibular.replacedTeeth.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Please select at least one replaced tooth for the Mandibular Partial Denture.',
    };
  }

  return { isValid: true };
}

// Tooth buccal and occlusal graphics reusing the exact SVG paths
interface ToothCardMiniProps {
  tooth: ToothInfo;
  isUpper: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  effectiveNotation: 'palmer' | 'fdi';
  onToggle: (fdi: string) => void;
}

export const RemovableToothCard: React.FC<ToothCardMiniProps> = ({
  tooth,
  isUpper,
  isSelected,
  isDisabled,
  effectiveNotation,
  onToggle,
}) => {
  const crownFill = isDisabled ? '#f1f5f9' : isSelected ? '#0284c7' : '#ffffff';
  const crownStroke = isDisabled ? '#cbd5e1' : isSelected ? '#0369a1' : '#94a3b8';
  const rootFill = isDisabled ? '#e2e8f0' : isSelected ? '#38bdf8' : '#fef3c7';
  const rootStroke = isDisabled ? '#cbd5e1' : isSelected ? '#0284c7' : '#cbd5e1';

  const sub = tooth.subType || 'central';
  const rotation = isUpper ? '' : 'rotate(180 21 23)';

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled) {
          haptic.selection();
          onToggle(tooth.fdi);
        }
      }}
      className={`w-full min-w-0 p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex flex-col items-center justify-between transition-all select-none touch-manipulation relative ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border border-slate-200 grayscale-30'
          : isSelected
          ? 'bg-sky-100 border-2 border-sky-500 shadow-xs ring-1 ring-sky-300 cursor-pointer active:scale-95'
          : 'bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 cursor-pointer active:scale-95'
      }`}
      title={
        isDisabled
          ? `${tooth.name} (Arch not configured for partial replacement)`
          : `${tooth.name} • ${tooth.digitalPalmer} • FDI #${tooth.fdi} • Tap to replace with partial denture`
      }
    >
      {/* Upper Arch: Root points up, Crown points down */}
      {isUpper ? (
        <>
          <div className="w-full h-7 xs:h-8 sm:h-9 flex items-center justify-center pointer-events-none relative">
            <svg viewBox="0 0 42 46" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <g transform={rotation}>
                {sub === 'central' && (
                  <g>
                    <path d="M 15 22 C 16 12, 19 3, 21 2 C 23 3, 26 12, 27 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 11 22 C 11 20, 31 20, 31 22 C 32 30, 31 43, 30 44 C 27 44.5, 15 44.5, 12 44 C 11 43, 10 30, 11 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <line x1="12" y1="44" x2="30" y2="44" stroke={crownStroke} strokeWidth="1.8" strokeLinecap="round" />
                  </g>
                )}
                {sub === 'lateral' && (
                  <g>
                    <path d="M 16 22 C 17 13, 20 4, 21.5 3 C 23 4, 25.5 13, 26 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 13 22 C 13 21, 29 21, 29 22 C 30 29, 29 43, 28 44 C 25 44.5, 16 44.5, 14 44 C 13 43, 12 29, 13 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <line x1="14" y1="44" x2="28" y2="44" stroke={crownStroke} strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                )}
                {sub === 'canine' && (
                  <g>
                    <path d="M 15 22 C 16 10, 20 1, 21 1 C 22 1, 26 10, 27 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 12 22 C 12 21, 30 21, 30 22 C 32 29, 31 38, 29 41 C 26 44, 22 45.5, 21 45.5 C 20 45.5, 16 44, 13 41 C 11 38, 10 29, 12 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <circle cx="21" cy="44.5" r="1" fill={crownStroke} />
                  </g>
                )}
                {(sub === 'pm1' || sub === 'pm2') && (
                  <g>
                    <path d="M 14 22 C 15 13, 17 4, 18 3 C 19 6, 20 15, 21 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 21 22 C 22 15, 23 6, 24 3 C 25 4, 27 13, 28 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 11 22 C 11 21, 31 21, 31 22 C 32 30, 31 41, 28 43 C 25 44, 17 44, 14 43 C 11 41, 10 30, 11 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                  </g>
                )}
                {(sub === 'm1' || sub === 'm2' || sub === 'm3') && (
                  <g>
                    <path d="M 11 22 C 12 12, 14 3, 15 2 C 16 5, 17 14, 18 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 24 22 C 25 14, 26 5, 27 2 C 28 3, 30 12, 31 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 18 22 C 19 14, 20 5, 21 4 C 22 5, 23 14, 24 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 9 22 C 9 21, 33 21, 33 22 C 34 30, 33 42, 30 43.5 C 26 44.5, 16 44.5, 12 43.5 C 9 42, 8 30, 9 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            </svg>
          </div>
          {/* Occlusal aspect mini */}
          <div className="w-full h-3.5 sm:h-4 flex items-center justify-center my-0.5 pointer-events-none">
            <div className={`w-3.5 sm:w-4 h-2.5 sm:h-3 rounded-xs border ${isSelected ? 'bg-sky-400 border-sky-600' : isDisabled ? 'bg-slate-200 border-slate-300' : 'bg-slate-100 border-slate-300'}`} />
          </div>
        </>
      ) : (
        /* Lower Arch: Occlusal top, Crown & Root bottom */
        <>
          <div className="w-full h-3.5 sm:h-4 flex items-center justify-center my-0.5 pointer-events-none">
            <div className={`w-3.5 sm:w-4 h-2.5 sm:h-3 rounded-xs border ${isSelected ? 'bg-sky-400 border-sky-600' : isDisabled ? 'bg-slate-200 border-slate-300' : 'bg-slate-100 border-slate-300'}`} />
          </div>
          <div className="w-full h-7 xs:h-8 sm:h-9 flex items-center justify-center pointer-events-none relative">
            <svg viewBox="0 0 42 46" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <g transform={rotation}>
                {sub === 'central' && (
                  <g>
                    <path d="M 15 22 C 16 12, 19 3, 21 2 C 23 3, 26 12, 27 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 12 22 C 12 20, 30 20, 30 22 C 31 30, 30 43, 29 44 C 26 44.5, 16 44.5, 13 44 C 12 43, 11 30, 12 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <line x1="13" y1="44" x2="29" y2="44" stroke={crownStroke} strokeWidth="1.8" strokeLinecap="round" />
                  </g>
                )}
                {sub === 'lateral' && (
                  <g>
                    <path d="M 16 22 C 17 13, 20 4, 21.5 3 C 23 4, 25.5 13, 26 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 13 22 C 13 21, 29 21, 29 22 C 30 29, 29 43, 28 44 C 25 44.5, 16 44.5, 14 44 C 13 43, 12 29, 13 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <line x1="14" y1="44" x2="28" y2="44" stroke={crownStroke} strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                )}
                {sub === 'canine' && (
                  <g>
                    <path d="M 15 22 C 16 10, 20 1, 21 1 C 22 1, 26 10, 27 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 12 22 C 12 21, 30 21, 30 22 C 32 29, 31 38, 29 41 C 26 44, 22 45.5, 21 45.5 C 20 45.5, 16 44, 13 41 C 11 38, 10 29, 12 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                    <circle cx="21" cy="44.5" r="1" fill={crownStroke} />
                  </g>
                )}
                {(sub === 'pm1' || sub === 'pm2') && (
                  <g>
                    <path d="M 16 22 C 17 12, 20 2, 21 2 C 22 2, 25 12, 26 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.2" />
                    <path d="M 12 22 C 12 21, 30 21, 30 22 C 31 30, 30 42, 27 43.5 C 24 44.5, 18 44.5, 15 43.5 C 12 42, 11 30, 12 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                  </g>
                )}
                {(sub === 'm1' || sub === 'm2' || sub === 'm3') && (
                  <g>
                    <path d="M 12 22 C 13 13, 15 3, 16 2 C 17 5, 18 14, 19 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 23 22 C 24 14, 25 5, 26 2 C 27 3, 29 13, 30 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                    <path d="M 9 22 C 9 21, 33 21, 33 22 C 34 30, 33 42, 30 43.5 C 26 44.5, 16 44.5, 12 43.5 C 9 42, 8 30, 9 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1.4" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            </svg>
          </div>
        </>
      )}

      {/* Notation label below tooth */}
      <div className="w-full pt-0.5 border-t border-slate-100 flex items-center justify-center pointer-events-none min-h-[18px]">
        {effectiveNotation === 'palmer' ? (
          <span
            className={`font-black text-[9px] sm:text-[11px] leading-tight ${
              isDisabled ? 'text-slate-400' : isSelected ? 'text-sky-700 font-extrabold' : 'text-slate-700'
            }`}
          >
            {tooth.digitalPalmer}
          </span>
        ) : (
          <span
            className={`font-black text-[10px] sm:text-[11px] leading-none ${
              isDisabled ? 'text-slate-400' : isSelected ? 'text-sky-700 font-extrabold' : 'text-slate-700'
            }`}
          >
            #{tooth.fdi}
          </span>
        )}
      </div>

      {/* Selected Indicator Badge */}
      {isSelected && !isDisabled && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-sky-600 text-white rounded-full flex items-center justify-center text-[8px] sm:text-[9px] shadow-xs pointer-events-none font-bold">
          ✓
        </span>
      )}
    </button>
  );
};

export const RemovableSelector: React.FC<RemovableSelectorProps> = ({
  config,
  onChange,
  notation,
}) => {
  const effectiveNotation: 'palmer' | 'fdi' =
    notation ||
    (safeLocalStorage.getItem('dentatrack_notation') as 'palmer' | 'fdi') ||
    'palmer';

  // Quadrants of permanent teeth
  const qUpperRight = useMemo(() => PERMANENT_TEETH.filter((t) => t.quadrant === 1), []);
  const qUpperLeft = useMemo(() => PERMANENT_TEETH.filter((t) => t.quadrant === 2), []);
  const qLowerRight = useMemo(() => PERMANENT_TEETH.filter((t) => t.quadrant === 4), []);
  const qLowerLeft = useMemo(() => PERMANENT_TEETH.filter((t) => t.quadrant === 3), []);

  const maxType = config.maxillary.type;
  const mandType = config.mandibular.type;

  const isMaxSelectable = maxType === 'partial';
  const isMandSelectable = mandType === 'partial';

  // Handlers for switching prosthesis types
  const handleMaxTypeChange = (newType: RemovableProsthesisType) => {
    haptic.selection();
    onChange({
      ...config,
      maxillary: {
        type: newType,
        // When changing away from partial or to complete, clear replaced teeth
        replacedTeeth: newType === 'partial' ? config.maxillary.replacedTeeth : [],
      },
    });
  };

  const handleMandTypeChange = (newType: RemovableProsthesisType) => {
    haptic.selection();
    onChange({
      ...config,
      mandibular: {
        type: newType,
        // When changing away from partial or to complete, clear replaced teeth
        replacedTeeth: newType === 'partial' ? config.mandibular.replacedTeeth : [],
      },
    });
  };

  // Toggle teeth in maxillary arch (only permanent Q1 & Q2)
  const handleToggleMaxTooth = (fdi: string) => {
    if (!isMaxSelectable) return;
    const current = config.maxillary.replacedTeeth;
    const next = current.includes(fdi)
      ? current.filter((id) => id !== fdi)
      : [...current, fdi];

    onChange({
      ...config,
      maxillary: {
        ...config.maxillary,
        replacedTeeth: next,
      },
    });
  };

  // Toggle teeth in mandibular arch (only permanent Q3 & Q4)
  const handleToggleMandTooth = (fdi: string) => {
    if (!isMandSelectable) return;
    const current = config.mandibular.replacedTeeth;
    const next = current.includes(fdi)
      ? current.filter((id) => id !== fdi)
      : [...current, fdi];

    onChange({
      ...config,
      mandibular: {
        ...config.mandibular,
        replacedTeeth: next,
      },
    });
  };

  // Quick preset helper for maxillary arch
  const handleClearMaxTeeth = () => {
    haptic.light();
    onChange({
      ...config,
      maxillary: {
        ...config.maxillary,
        replacedTeeth: [],
      },
    });
  };

  const handleSelectAllMaxTeeth = () => {
    haptic.light();
    const allUpperFdi = [...qUpperRight, ...qUpperLeft].map((t) => t.fdi);
    onChange({
      ...config,
      maxillary: {
        ...config.maxillary,
        replacedTeeth: allUpperFdi,
      },
    });
  };

  // Quick preset helper for mandibular arch
  const handleClearMandTeeth = () => {
    haptic.light();
    onChange({
      ...config,
      mandibular: {
        ...config.mandibular,
        replacedTeeth: [],
      },
    });
  };

  const handleSelectAllMandTeeth = () => {
    haptic.light();
    const allLowerFdi = [...qLowerRight, ...qLowerLeft].map((t) => t.fdi);
    onChange({
      ...config,
      mandibular: {
        ...config.mandibular,
        replacedTeeth: allLowerFdi,
      },
    });
  };

  // Format summary of replaced teeth
  const formatReplacedTeeth = (teeth: string[]) => {
    if (teeth.length === 0) return 'None selected';
    const sorted = [...teeth].sort();
    if (effectiveNotation === 'palmer') {
      const symbols = sorted.map((fdi) => {
        const t = PERMANENT_TEETH.find((item) => item.fdi === fdi);
        return t ? t.digitalPalmer : fdi;
      });
      return symbols.join(', ');
    }
    return sorted.map((id) => `#${id}`).join(', ');
  };

  return (
    <div className="rounded-2xl bg-white/95 dark:bg-[#1e293b] border border-sky-200/90 dark:border-slate-700/80 shadow-xs p-3 sm:p-4 space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-[#f8fafc]">
              Removable Prosthodontics Configuration
            </h4>
            <p className="text-[11px] text-slate-500">
              Configure Maxillary and Mandibular prostheses independently.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
          Dual-Arch Module
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAXILLARY ARCH SECTION                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Maxillary Arch (Upper Jaw)</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Select prosthesis type for the upper arch:
            </p>
          </div>
          {maxType === 'complete' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Complete Denture
            </span>
          )}
          {maxType === 'partial' && (
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
              RPD • {config.maxillary.replacedTeeth.length} replaced
            </span>
          )}
          {maxType === 'none' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
              No Prosthesis
            </span>
          )}
        </div>

        {/* Maxillary Type Radio Selection */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleMaxTypeChange('none')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              maxType === 'none'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold'
            }`}
          >
            <span className="block text-xs">○ None</span>
            <span className="block text-[10px] opacity-75 mt-0.5">No upper denture</span>
          </button>

          <button
            type="button"
            onClick={() => handleMaxTypeChange('partial')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              maxType === 'partial'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-700 font-semibold'
            }`}
          >
            <span className="block text-xs">● Partial Denture</span>
            <span className="block text-[10px] opacity-80 mt-0.5">Maxillary RPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleMaxTypeChange('complete')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              maxType === 'complete'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-700 font-semibold'
            }`}
          >
            <span className="block text-xs">● Complete Denture</span>
            <span className="block text-[10px] opacity-80 mt-0.5">Full upper arch</span>
          </button>
        </div>

        {/* Contextual Status Guidance */}
        {maxType === 'partial' && (
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span>Select the teeth being replaced by the partial denture.</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllMaxTeeth}
                className="text-[10px] font-bold text-sky-700 hover:underline cursor-pointer"
              >
                Select All
              </button>
              {config.maxillary.replacedTeeth.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMaxTeeth}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {maxType === 'complete' && (
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span>Complete denture: individual tooth selection is not required (replaces entire maxillary dentition).</span>
          </div>
        )}

        {maxType === 'none' && (
          <div className="p-2 rounded-lg bg-slate-100/60 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>No maxillary removable prosthesis configured for this case.</span>
          </div>
        )}

        {/* Maxillary Tooth Chart (Q1 & Q2) */}
        <div className={`rounded-xl bg-white border p-1.5 sm:p-2 transition-all ${isMaxSelectable ? 'border-sky-300 ring-1 ring-sky-200 shadow-2xs' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 px-1 pb-1 uppercase tracking-wider">
            <span>← Upper Right (UR / Q1)</span>
            <span className={isMaxSelectable ? 'text-sky-700 font-bold' : 'text-slate-400'}>
              {isMaxSelectable ? 'Teeth Replaced by Denture' : 'Maxillary Arch (Disabled)'}
            </span>
            <span>Upper Left (UL / Q2) →</span>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-300 pb-1">
            {/* Upper Right (Q1) */}
            <div className="border-r border-slate-300 pr-1 sm:pr-2">
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 w-full">
                {qUpperRight.map((t) => (
                  <RemovableToothCard
                    key={t.fdi}
                    tooth={t}
                    isUpper={true}
                    isSelected={config.maxillary.replacedTeeth.includes(t.fdi)}
                    isDisabled={!isMaxSelectable}
                    effectiveNotation={effectiveNotation}
                    onToggle={handleToggleMaxTooth}
                  />
                ))}
              </div>
            </div>

            {/* Upper Left (Q2) */}
            <div className="pl-1 sm:pl-2">
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 w-full">
                {qUpperLeft.map((t) => (
                  <RemovableToothCard
                    key={t.fdi}
                    tooth={t}
                    isUpper={true}
                    isSelected={config.maxillary.replacedTeeth.includes(t.fdi)}
                    isDisabled={!isMaxSelectable}
                    effectiveNotation={effectiveNotation}
                    onToggle={handleToggleMaxTooth}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Maxillary Selection Readout */}
          {isMaxSelectable && (
            <div className="pt-1.5 px-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                Replaced: <strong className="text-slate-800">{formatReplacedTeeth(config.maxillary.replacedTeeth)}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {config.maxillary.replacedTeeth.length} of 16 teeth
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MANDIBULAR ARCH SECTION                                                */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Mandibular Arch (Lower Jaw)</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Select prosthesis type for the lower arch:
            </p>
          </div>
          {mandType === 'complete' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Complete Denture
            </span>
          )}
          {mandType === 'partial' && (
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
              RPD • {config.mandibular.replacedTeeth.length} replaced
            </span>
          )}
          {mandType === 'none' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
              No Prosthesis
            </span>
          )}
        </div>

        {/* Mandibular Type Radio Selection */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleMandTypeChange('none')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              mandType === 'none'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold'
            }`}
          >
            <span className="block text-xs">○ None</span>
            <span className="block text-[10px] opacity-75 mt-0.5">No lower denture</span>
          </button>

          <button
            type="button"
            onClick={() => handleMandTypeChange('partial')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              mandType === 'partial'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-700 font-semibold'
            }`}
          >
            <span className="block text-xs">● Partial Denture</span>
            <span className="block text-[10px] opacity-80 mt-0.5">Mandibular RPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleMandTypeChange('complete')}
            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
              mandType === 'complete'
                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-700 font-semibold'
            }`}
          >
            <span className="block text-xs">● Complete Denture</span>
            <span className="block text-[10px] opacity-80 mt-0.5">Full lower arch</span>
          </button>
        </div>

        {/* Contextual Status Guidance */}
        {mandType === 'partial' && (
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span>Select the teeth being replaced by the partial denture.</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllMandTeeth}
                className="text-[10px] font-bold text-sky-700 hover:underline cursor-pointer"
              >
                Select All
              </button>
              {config.mandibular.replacedTeeth.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMandTeeth}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {mandType === 'complete' && (
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span>Complete denture: individual tooth selection is not required (replaces entire mandibular dentition).</span>
          </div>
        )}

        {mandType === 'none' && (
          <div className="p-2 rounded-lg bg-slate-100/60 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>No mandibular removable prosthesis configured for this case.</span>
          </div>
        )}

        {/* Mandibular Tooth Chart (Q4 & Q3) */}
        <div className={`rounded-xl bg-white border p-1.5 sm:p-2 transition-all ${isMandSelectable ? 'border-sky-300 ring-1 ring-sky-200 shadow-2xs' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 px-1 pb-1 uppercase tracking-wider">
            <span>← Lower Right (LR / Q4)</span>
            <span className={isMandSelectable ? 'text-sky-700 font-bold' : 'text-slate-400'}>
              {isMandSelectable ? 'Teeth Replaced by Denture' : 'Mandibular Arch (Disabled)'}
            </span>
            <span>Lower Left (LL / Q3) →</span>
          </div>

          <div className="grid grid-cols-2 pt-1 border-t border-slate-300">
            {/* Lower Right (Q4) */}
            <div className="border-r border-slate-300 pr-1 sm:pr-2">
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 w-full">
                {qLowerRight.map((t) => (
                  <RemovableToothCard
                    key={t.fdi}
                    tooth={t}
                    isUpper={false}
                    isSelected={config.mandibular.replacedTeeth.includes(t.fdi)}
                    isDisabled={!isMandSelectable}
                    effectiveNotation={effectiveNotation}
                    onToggle={handleToggleMandTooth}
                  />
                ))}
              </div>
            </div>

            {/* Lower Left (Q3) */}
            <div className="pl-1 sm:pl-2">
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 w-full">
                {qLowerLeft.map((t) => (
                  <RemovableToothCard
                    key={t.fdi}
                    tooth={t}
                    isUpper={false}
                    isSelected={config.mandibular.replacedTeeth.includes(t.fdi)}
                    isDisabled={!isMandSelectable}
                    effectiveNotation={effectiveNotation}
                    onToggle={handleToggleMandTooth}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mandibular Selection Readout */}
          {isMandSelectable && (
            <div className="pt-1.5 px-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                Replaced: <strong className="text-slate-800">{formatReplacedTeeth(config.mandibular.replacedTeeth)}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {config.mandibular.replacedTeeth.length} of 16 teeth
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
