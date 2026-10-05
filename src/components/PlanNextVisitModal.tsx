import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Clock, 
  X, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  Trash2, 
  ArrowRight, 
  Stethoscope, 
  ChevronRight,
  MapPin,
  Tag
} from 'lucide-react';
import { DentalCase, ClinicalProcedure, ClinicSession, ClinicPlace } from '../types';
import { 
  getUpcomingClinicOccurrences, 
  getNextActionForCase, 
  UpcomingClinicOccurrence, 
  resolvePlannedVisit 
} from '../lib/visitPlanner';
import { ModalPortal } from './ModalPortal';
import { formatTeethDisplay, cleanProcedureTitle } from '../lib/macroSteps';
import { 
  getPatientInitials, 
  getPatientAvatarTheme, 
  getDisciplineIcon, 
  getDisciplineTheme 
} from '../lib/clinicalVisuals';
import { haptic } from '../lib/haptics';

interface PlanNextVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  dentalCase: DentalCase;
  schedule: ClinicSession[];
  targetProcedure?: ClinicalProcedure | null;
  onSavePlan: (updatedCase: DentalCase) => void;
  onNavigateToSchedule?: () => void;
}

const ACTION_SUGGESTIONS = [
  'Preparation & Impression',
  'Try-in & Delivery',
  'Obturation & Seal',
  'Cavity Restoration',
  'Evaluation & Polish',
  'Scaling & Root Planing',
  'Surgical Extraction',
  'Clinical Examination',
];

export const PlanNextVisitModal: React.FC<PlanNextVisitModalProps> = ({
  isOpen,
  onClose,
  dentalCase,
  schedule = [],
  targetProcedure = null,
  onSavePlan,
  onNavigateToSchedule,
}) => {
  // Determine default action & procedure
  const defaultActionInfo = useMemo(() => {
    return getNextActionForCase(dentalCase, targetProcedure?.id);
  }, [dentalCase, targetProcedure]);

  const activeProcedure = targetProcedure || defaultActionInfo.procedure;
  const teethFormatted = activeProcedure ? formatTeethDisplay(activeProcedure.toothNumber) : '';
  const displayProcTitle = activeProcedure ? cleanProcedureTitle(activeProcedure.title) : '';

  // Patient avatar & theme
  const initials = getPatientInitials(dentalCase.patientName);
  const avatarTheme = getPatientAvatarTheme(dentalCase.patientName);
  const discTheme = activeProcedure ? getDisciplineTheme(activeProcedure.discipline) : null;

  // Current planned visit info
  const currentPlan = useMemo(() => {
    return resolvePlannedVisit(dentalCase, schedule);
  }, [dentalCase, schedule]);

  // State: chosen action text
  const [actionText, setActionText] = useState(
    dentalCase.targetNextVisitPlan || defaultActionInfo.actionTitle || 'Clinical treatment'
  );

  // State: selected occurrence
  const upcomingOccurrences = useMemo(() => {
    return getUpcomingClinicOccurrences(schedule, {
      daysAhead: 28,
      dentalCase,
      procedure: activeProcedure || undefined,
    });
  }, [schedule, dentalCase, activeProcedure]);

  // Split into Recommended and Other
  const recommendedOccurrences = useMemo(() => {
    return upcomingOccurrences.filter((occ) => occ.isRecommended);
  }, [upcomingOccurrences]);

  const otherOccurrences = useMemo(() => {
    return upcomingOccurrences.filter((occ) => !occ.isRecommended);
  }, [upcomingOccurrences]);

  // Initial selection
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(() => {
    if (dentalCase.plannedSessionDate && dentalCase.plannedSessionId) {
      const match = upcomingOccurrences.find(
        (occ) => occ.date === dentalCase.plannedSessionDate && occ.session.id === dentalCase.plannedSessionId
      );
      if (match) return match.occurrenceId;
    }
    if (dentalCase.targetNextVisitDate) {
      const match = upcomingOccurrences.find((occ) => occ.date === dentalCase.targetNextVisitDate);
      if (match) return match.occurrenceId;
    }
    if (recommendedOccurrences.length > 0) {
      return recommendedOccurrences[0].occurrenceId;
    }
    if (upcomingOccurrences.length > 0) {
      return upcomingOccurrences[0].occurrenceId;
    }
    return null;
  });

  // Custom date mode
  const [useCustomDate, setUseCustomDate] = useState(schedule.length === 0);
  const [customDate, setCustomDate] = useState(dentalCase.targetNextVisitDate || '');
  const [customTime, setCustomTime] = useState(dentalCase.plannedSessionTime || '09:00–12:00');
  const [customClinic, setCustomClinic] = useState<ClinicPlace>(dentalCase.clinicPlace || 'A');

  if (!isOpen) return null;

  const selectedOccurrence = upcomingOccurrences.find((occ) => occ.occurrenceId === selectedOccurrenceId);

  const handleSelectOccurrence = (occurrence: UpcomingClinicOccurrence) => {
    haptic.selection();
    setSelectedOccurrenceId(occurrence.occurrenceId);
    setUseCustomDate(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    haptic.selection();
    setActionText(suggestion);
  };

  const handleSave = () => {
    haptic.success();

    let updatedCase: DentalCase;

    if (!useCustomDate && selectedOccurrence) {
      updatedCase = {
        ...dentalCase,
        targetNextVisitDate: selectedOccurrence.date,
        targetNextVisitPlan: actionText.trim() || defaultActionInfo.actionTitle,
        plannedSessionId: selectedOccurrence.session.id,
        plannedSessionDate: selectedOccurrence.date,
        plannedSessionDay: selectedOccurrence.dayName,
        plannedSessionTime: `${selectedOccurrence.startTime}–${selectedOccurrence.endTime}`,
        plannedSessionClinic: selectedOccurrence.clinicPlace,
        plannedSessionDiscipline: selectedOccurrence.discipline,
        plannedAction: actionText.trim() || defaultActionInfo.actionTitle,
        plannedProcedureId: activeProcedure?.id,
        plannedStepId: defaultActionInfo.step?.id,
        updatedAt: new Date().toISOString(),
      };
    } else if (customDate) {
      const [y, m, d] = customDate.split('-').map((n) => parseInt(n, 10));
      const dObj = new Date(y, m - 1, d);
      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });

      updatedCase = {
        ...dentalCase,
        targetNextVisitDate: customDate,
        targetNextVisitPlan: actionText.trim() || defaultActionInfo.actionTitle,
        plannedSessionId: undefined,
        plannedSessionDate: customDate,
        plannedSessionDay: dayName,
        plannedSessionTime: customTime,
        plannedSessionClinic: customClinic,
        plannedSessionDiscipline: activeProcedure?.discipline,
        plannedAction: actionText.trim() || defaultActionInfo.actionTitle,
        plannedProcedureId: activeProcedure?.id,
        plannedStepId: defaultActionInfo.step?.id,
        updatedAt: new Date().toISOString(),
      };
    } else {
      return;
    }

    onSavePlan(updatedCase);
    onClose();
  };

  const handleRemovePlan = () => {
    haptic.medium();
    const updatedCase: DentalCase = {
      ...dentalCase,
      targetNextVisitDate: undefined,
      targetNextVisitPlan: undefined,
      plannedSessionId: undefined,
      plannedSessionDate: undefined,
      plannedSessionDay: undefined,
      plannedSessionTime: undefined,
      plannedSessionClinic: undefined,
      plannedSessionDiscipline: undefined,
      plannedAction: undefined,
      plannedProcedureId: undefined,
      plannedStepId: undefined,
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedCase);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-visit-title"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden animate-modal-pop text-slate-900 dark:text-slate-100">
          
          {/* MODAL HEADER */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="plan-visit-title" className="text-base sm:text-lg font-bold truncate text-slate-900 dark:text-white">
                  Plan Next Visit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Pick what to do next and choose a clinic session
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain text-xs">
            
            {/* PATIENT & PROCEDURE HERO CONTEXT */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-bold text-xs flex items-center justify-center shrink-0`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {dentalCase.patientName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    <span className="font-mono">#{dentalCase.fileNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Clinic {dentalCase.clinicPlace}</span>
                    {activeProcedure && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-600 dark:text-sky-400 font-bold">{activeProcedure.discipline}</span>
                        {teethFormatted && <span>(Tooth {teethFormatted})</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {activeProcedure && discTheme && (
                <div className={`w-8 h-8 rounded-xl ${discTheme.bg} ${discTheme.text} border ${discTheme.border} flex items-center justify-center shrink-0`}>
                  {getDisciplineIcon(activeProcedure.discipline, 'w-4 h-4')}
                </div>
              )}
            </div>

            {/* 1. CLINICAL ACTION TO PERFORM */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                1. What are you doing next?
              </label>

              <input
                type="text"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="e.g. Preparation & Impression, Try-in, Obturation..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              />

              {/* Quick suggestions pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  <span>Quick pick:</span>
                </span>
                {ACTION_SUGGESTIONS.map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => handleSelectSuggestion(sugg)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200/70 dark:border-slate-700/70 text-[10px] font-medium transition cursor-pointer"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CHOOSE CLINIC SESSION / DATE */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                  2. Choose Session Date
                </label>

                {schedule.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setUseCustomDate(!useCustomDate);
                    }}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {useCustomDate ? '← Pick from Timetable' : '+ Custom Date'}
                  </button>
                )}
              </div>

              {!useCustomDate && schedule.length > 0 ? (
                <div className="space-y-3">
                  
                  {/* RECOMMENDED SESSIONS */}
                  {recommendedOccurrences.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Recommended for this case & discipline</span>
                      </div>

                      <div className="space-y-2">
                        {recommendedOccurrences.map((occ) => {
                          const isSelected = selectedOccurrenceId === occ.occurrenceId;
                          return (
                            <button
                              key={occ.occurrenceId}
                              type="button"
                              onClick={() => handleSelectOccurrence(occ)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[56px] flex items-center justify-between gap-3 active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                    {occ.formattedDate}
                                  </span>
                                  {occ.isToday && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold">
                                      Today
                                    </span>
                                  )}
                                  {occ.isTomorrow && (
                                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 text-[10px] font-bold">
                                      Tomorrow
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-900/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                                    Recommended
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    Clinic {occ.clinicPlace}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                  <span>{occ.startTime} – {occ.endTime}</span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                  <span className="truncate">{occ.discipline}</span>
                                </div>
                              </div>

                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                              }`}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* OTHER UPCOMING SESSIONS */}
                  {otherOccurrences.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Other Available Sessions
                      </div>

                      <div className="space-y-2">
                        {otherOccurrences.slice(0, 6).map((occ) => {
                          const isSelected = selectedOccurrenceId === occ.occurrenceId;
                          return (
                            <button
                              key={occ.occurrenceId}
                              type="button"
                              onClick={() => handleSelectOccurrence(occ)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[50px] flex items-center justify-between gap-3 active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {occ.formattedDate}
                                  </span>
                                  {occ.isToday && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold">
                                      Today
                                    </span>
                                  )}
                                  {occ.isTomorrow && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 text-[10px] font-bold">
                                      Tomorrow
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    Clinic {occ.clinicPlace}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                  <span>{occ.startTime} – {occ.endTime}</span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                  <span className="truncate">{occ.discipline}</span>
                                </div>
                              </div>

                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : useCustomDate || schedule.length === 0 ? (
                /* CUSTOM DATE / MANUAL FORM */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  {schedule.length === 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>No university timetable imported yet</span>
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                        You can set a specific date below, or import your PDF schedule to auto-match recurring clinic sessions.
                      </p>
                      {onNavigateToSchedule && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToSchedule();
                          }}
                          className="mt-1 text-xs font-bold text-sky-700 dark:text-sky-300 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Import Clinic Schedule</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Visit Date:
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Clinic Station:
                        </label>
                        <select
                          value={customClinic}
                          onChange={(e) => setCustomClinic(e.target.value as ClinicPlace)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                          {(['A', 'B', 'C', 'M', 'N', 'G'] as ClinicPlace[]).map((c) => (
                            <option key={c} value={c}>
                              Clinic {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Session Time:
                        </label>
                        <input
                          type="text"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          placeholder="09:00–12:00"
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* STALE NOTICE */}
            {currentPlan.isStale && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold">Original schedule session updated</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                  The previously selected session was modified. Pick an active upcoming session above to refresh the visit plan.
                </p>
              </div>
            )}
          </div>

          {/* MODAL ACTIONS FOOTER */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-between gap-2.5 sticky bottom-0 z-20">
            {currentPlan.isPlanned ? (
              <button
                type="button"
                onClick={handleRemovePlan}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Plan</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!useCustomDate && !selectedOccurrenceId && !customDate}
                className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Plan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
