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
  ChevronRight 
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
      daysAhead: 21,
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

  // Initial selection: match current plan or default to first recommended occurrence
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

  // Manual fallback mode if user has no schedule imported or prefers a custom date
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
      // Manual date plan
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-visit-title"
      >
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-200">
          
          {/* MODAL HEADER */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 id="plan-visit-title" className="text-base font-black text-slate-900">
                  Plan Next Visit
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Associate next clinical action with your extracted timetable
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
            
            {/* 1. WHAT AM I PLANNING? */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-sky-800 block">
                1. Clinical Action to Perform
              </span>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="e.g. Secondary impression, Tooth preparation..."
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 bg-white"
                />

                {/* Patient & Procedure Context */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 px-1">
                  <span className="font-bold text-slate-800">{dentalCase.patientName}</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="font-mono text-slate-500 font-medium">Case #{dentalCase.fileNumber}</span>
                  {activeProcedure && (
                    <>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="font-bold text-sky-800">{activeProcedure.discipline}</span>
                      {teethFormatted && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700">Tooth {teethFormatted}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CHOOSE A CLINIC SESSION */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                  2. Choose Upcoming Clinic Session
                </span>

                {schedule.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseCustomDate(!useCustomDate)}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                  >
                    {useCustomDate ? '← Select from Timetable' : 'Custom Date'}
                  </button>
                )}
              </div>

              {!useCustomDate && schedule.length > 0 ? (
                <div className="space-y-3">
                  
                  {/* RECOMMENDED SESSIONS */}
                  {recommendedOccurrences.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-sky-800 px-1">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        <span>Recommended for this case</span>
                      </div>

                      <div className="space-y-2">
                        {recommendedOccurrences.map((occ) => {
                          const isSelected = selectedOccurrenceId === occ.occurrenceId;
                          return (
                            <button
                              key={occ.occurrenceId}
                              type="button"
                              onClick={() => handleSelectOccurrence(occ)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[52px] flex items-center justify-between gap-3 active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                  : 'bg-white hover:bg-slate-50/90 border-slate-200/90'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-xs sm:text-sm text-slate-900">
                                    {occ.formattedDate}
                                  </span>
                                  {occ.isToday && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                      Today
                                    </span>
                                  )}
                                  {occ.isTomorrow && (
                                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                                      Tomorrow
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-1.5 py-0.5 rounded">
                                    Recommended
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                                  <span className="font-extrabold text-slate-800">
                                    Clinic {occ.clinicPlace}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-400">·</span>
                                  <span className="font-medium text-slate-600">
                                    {occ.startTime} – {occ.endTime}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-400">·</span>
                                  <span className="text-slate-500 truncate">
                                    {occ.discipline}
                                  </span>
                                </div>
                              </div>

                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                                isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 text-transparent'
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
                      <div className="text-[11px] font-bold text-slate-500 px-1">
                        Other Upcoming Sessions
                      </div>

                      <div className="space-y-2">
                        {otherOccurrences.slice(0, 8).map((occ) => {
                          const isSelected = selectedOccurrenceId === occ.occurrenceId;
                          return (
                            <button
                              key={occ.occurrenceId}
                              type="button"
                              onClick={() => handleSelectOccurrence(occ)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[50px] flex items-center justify-between gap-3 active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                  : 'bg-white hover:bg-slate-50/90 border-slate-200/90'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900">
                                    {occ.formattedDate}
                                  </span>
                                  {occ.isToday && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      Today
                                    </span>
                                  )}
                                  {occ.isTomorrow && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                                      Tomorrow
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                                  <span className="font-bold text-slate-700">
                                    Clinic {occ.clinicPlace}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-400">·</span>
                                  <span className="font-medium text-slate-600">
                                    {occ.startTime} – {occ.endTime}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-400">·</span>
                                  <span className="text-slate-500 truncate">
                                    {occ.discipline}
                                  </span>
                                </div>
                              </div>

                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                                isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 text-transparent'
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
                /* CUSTOM DATE / FALLBACK FORM */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  {schedule.length === 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>No timetable imported yet</span>
                      </p>
                      <p className="text-[11px] text-amber-800">
                        You can set a target date below, or import your doctor schedule to pick from recurring clinic sessions.
                      </p>
                      {onNavigateToSchedule && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToSchedule();
                          }}
                          className="mt-1 text-xs font-bold text-sky-700 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Import Clinic Schedule</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Visit Date:
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="neu-input w-full p-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Clinic Station:
                        </label>
                        <select
                          value={customClinic}
                          onChange={(e) => setCustomClinic(e.target.value as ClinicPlace)}
                          className="neu-input w-full p-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                        >
                          {(['A', 'B', 'C', 'M', 'N', 'G'] as ClinicPlace[]).map((c) => (
                            <option key={c} value={c}>
                              Clinic {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Session Time:
                        </label>
                        <input
                          type="text"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          placeholder="09:00–12:00"
                          className="neu-input w-full p-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* STALE OR UNAVAILABLE NOTICE */}
            {currentPlan.isStale && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Original schedule session updated</p>
                <p className="text-[11px] text-amber-800">
                  The previously selected session was modified or replaced during schedule update. Choose one of your active upcoming sessions above to refresh the plan.
                </p>
              </div>
            )}
          </div>

          {/* MODAL ACTIONS FOOTER (Fixed thumb-friendly bottom bar) */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-2.5 flex-shrink-0 safe-area-bottom">
            {currentPlan.isPlanned ? (
              <button
                type="button"
                onClick={handleRemovePlan}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition cursor-pointer min-h-[44px] flex items-center gap-1.5"
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 border border-slate-200 transition cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!useCustomDate && !selectedOccurrenceId && !customDate}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm transition cursor-pointer min-h-[44px] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
