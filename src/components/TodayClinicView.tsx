import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Camera, 
  Clock, 
  FileCheck2, 
  User, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  PhoneCall, 
  ArrowRight, 
  AlertTriangle, 
  Check, 
  CalendarDays, 
  Layers, 
  Image as ImageIcon,
  X 
} from 'lucide-react';
import { DentalCase, ClinicPlace, ClinicalProcedure, ProcedureTemplate, ClinicSession } from '../types';
import { RubricUploadModal } from './RubricUploadModal';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { AddProcedureModal } from './AddProcedureModal';
import { PlanNextVisitModal } from './PlanNextVisitModal';
import { generateCaseMoodlePDF } from '../lib/pdfExport';
import { ExportToast, ToastMessage } from './ExportToast';
import { getProcedureMacroStepStatus, resolveToothInfo, formatTeethDisplay } from '../lib/macroSteps';
import { resolvePlannedVisit } from '../lib/visitPlanner';
import { 
  getPatientInitials, 
  getPatientAvatarTheme, 
  getDisciplineIcon, 
  getDisciplineTheme,
  ToothIcon 
} from '../lib/clinicalVisuals';
import { ModalPortal } from './ModalPortal';
import { haptic } from '../lib/haptics';

interface TodayClinicViewProps {
  cases: DentalCase[];
  schedule?: ClinicSession[];
  activeClinicPlace: ClinicPlace;
  onChangeClinicPlace: (place: ClinicPlace) => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onOpenAddCaseModal: () => void;
  onSelectCase: (caseId: string) => void;
  onNavigateToSchedule?: () => void;
  onNavigateToCases?: () => void;
  templates: ProcedureTemplate[];
}

const CLINICS: ClinicPlace[] = ['A', 'B', 'C', 'M', 'N', 'G'];

interface AttentionItem {
  id: string;
  type: 'signature' | 'evidence' | 'moodle' | 'visit';
  title: string;
  description: string;
  badge?: string;
  caseId: string;
  procedure?: ClinicalProcedure;
  dentalCase: DentalCase;
}

export const TodayClinicView: React.FC<TodayClinicViewProps> = ({
  cases,
  schedule = [],
  activeClinicPlace,
  onChangeClinicPlace,
  onUpdateCase,
  onOpenAddCaseModal,
  onSelectCase,
  onNavigateToSchedule,
  onNavigateToCases,
  templates,
}) => {
  const [selectedClinicFilter, setSelectedClinicFilter] = useState<ClinicPlace | 'ALL'>('ALL');
  const [exportingCaseId, setExportingCaseId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Quick Action / Case Selection target
  const [targetCaseModal, setTargetCaseModal] = useState<{
    isOpen: boolean;
    type: 'procedure' | 'rubric' | 'evidence';
  }>({ isOpen: false, type: 'procedure' });

  // Modals state
  const [rubricModalData, setRubricModalData] = useState<{
    isOpen: boolean;
    caseId: string;
    procedure: ClinicalProcedure | null;
  }>({ isOpen: false, caseId: '', procedure: null });

  const [evidenceModalData, setEvidenceModalData] = useState<{
    isOpen: boolean;
    caseId: string;
    procedure: ClinicalProcedure | null;
  }>({ isOpen: false, caseId: '', procedure: null });

  const [addProcModalData, setAddProcModalData] = useState<{
    isOpen: boolean;
    caseId: string;
  }>({ isOpen: false, caseId: '' });

  // Next visit planning modal target
  const [planVisitTargetCase, setPlanVisitTargetCase] = useState<DentalCase | null>(null);

  // Compute today's day of the week & date strings
  const todayDateObj = useMemo(() => new Date(), []);
  const todayDayName = useMemo(() => {
    return todayDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  }, [todayDateObj]);

  const todayFormattedDate = useMemo(() => {
    return todayDateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [todayDateObj]);

  // Today's Scheduled Sessions & Current Active Session
  const todaySessions = useMemo(() => {
    return schedule.filter(
      (s) => s.dayOfWeek.toLowerCase() === todayDayName.toLowerCase()
    );
  }, [schedule, todayDayName]);

  // Determine active or next upcoming session
  const currentSessionInfo = useMemo(() => {
    if (todaySessions.length === 0) {
      // Find the next upcoming session in the entire schedule
      const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIdx = todayDateObj.getDay();
      
      let nextSession: ClinicSession | null = null;
      let minDistance = 8;
      
      for (const s of schedule) {
        const sIdx = daysOrder.indexOf(s.dayOfWeek);
        if (sIdx !== -1) {
          const dist = (sIdx - todayIdx + 7) % 7 || 7;
          if (dist < minDistance) {
            minDistance = dist;
            nextSession = s;
          }
        }
      }
      return { active: null, nextUpcoming: nextSession, hasTodaySchedule: false };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    const parseMinutes = (timeStr: string) => {
      const parts = timeStr.split(':').map((n) => parseInt(n, 10));
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };

    let active = todaySessions.find((s) => {
      const start = parseMinutes(s.startTime);
      const end = parseMinutes(s.endTime);
      return currentTimeMinutes >= start && currentTimeMinutes <= end;
    });

    if (!active && todaySessions.length > 0) {
      active = todaySessions[0];
    }

    return { active, nextUpcoming: null, hasTodaySchedule: true };
  }, [todaySessions, schedule, todayDateObj]);

  // Active in-progress cases
  const inProgressCases = useMemo(() => {
    return cases.filter((c) => c.status === 'In Progress');
  }, [cases]);

  const basePool = inProgressCases.length > 0 ? inProgressCases : cases;
  
  // Filtered cases for Case Workload section
  const displayedCases = useMemo(() => {
    return selectedClinicFilter === 'ALL'
      ? basePool
      : basePool.filter((c) => c.clinicPlace === selectedClinicFilter);
  }, [basePool, selectedClinicFilter]);

  // Derive "Needs Attention" items across active cases
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    for (const c of basePool) {
      // Check for procedures needing rubric signature
      for (const proc of c.procedures) {
        const hasSigned = proc.rubrics.some((r) => r.status === 'Signed');
        const hasPending = proc.rubrics.some((r) => r.status === 'Pending');
        const statusInfo = getProcedureMacroStepStatus(proc);

        if (!hasSigned && (statusInfo.isAllDone || hasPending || proc.status === 'Awaiting Signature')) {
          items.push({
            id: `att-sig-${c.id}-${proc.id}`,
            type: 'signature',
            title: 'Get rubric signature',
            description: `${c.patientName} · ${proc.discipline} (#${c.fileNumber})`,
            badge: hasPending ? 'Pending' : 'Signature',
            caseId: c.id,
            procedure: proc,
            dentalCase: c,
          });
        }

        // Check for missing evidence on active procedures
        if (proc.evidenceFiles.length === 0 && (statusInfo.completedCount > 0 || proc.discipline === 'Endo')) {
          items.push({
            id: `att-ev-${c.id}-${proc.id}`,
            type: 'evidence',
            title: 'Attach photo or X-Ray',
            description: `${c.patientName} · ${proc.discipline} (${proc.title})`,
            badge: 'Evidence',
            caseId: c.id,
            procedure: proc,
            dentalCase: c,
          });
        }

        // Check for ready Moodle submissions
        if (hasSigned && statusInfo.isAllDone && proc.moodleStatus === 'Not Submitted') {
          items.push({
            id: `att-moodle-${c.id}-${proc.id}`,
            type: 'moodle',
            title: 'Ready for Moodle submission',
            description: `${c.patientName} · ${proc.discipline} (Signed by ${proc.rubrics[0]?.instructorName || 'Instructor'})`,
            badge: 'Moodle',
            caseId: c.id,
            procedure: proc,
            dentalCase: c,
          });
        }
      }

      // Check for planned next visit
      const plannedVisit = resolvePlannedVisit(c, schedule);
      if (plannedVisit.isPlanned) {
        items.push({
          id: `att-visit-${c.id}`,
          type: 'visit',
          title: `Next: ${plannedVisit.actionText || 'Planned Session'}`,
          description: `${c.patientName} · ${plannedVisit.dayName || plannedVisit.formattedDate} · Clinic ${plannedVisit.clinicPlace}${plannedVisit.time ? ` (${plannedVisit.time})` : ''}`,
          badge: 'Visit',
          caseId: c.id,
          dentalCase: c,
        });
      } else if (c.targetNextVisitDate || c.targetNextVisitPlan) {
        items.push({
          id: `att-visit-${c.id}`,
          type: 'visit',
          title: `Next: ${c.targetNextVisitPlan || 'General session'}`,
          description: `${c.patientName} · Target: ${c.targetNextVisitDate || 'TBD'}`,
          badge: 'Visit',
          caseId: c.id,
          dentalCase: c,
        });
      }
    }

    return items.slice(0, 5); // Keep concise
  }, [basePool, schedule]);

  // Toggle step completion chairside
  const handleToggleStep = (c: DentalCase, procId: string, stepId: string) => {
    let completedTransition = false;
    let allWillBeDone = false;

    const updatedProcedures = c.procedures.map((p) => {
      if (p.id !== procId) return p;
      const todayDateStr = new Date().toISOString().split('T')[0];
      const updatedSteps = p.steps.map((s) => {
        if (s.id !== stepId) return s;
        const newCompleted = !s.isCompleted;
        completedTransition = newCompleted;
        return {
          ...s,
          isCompleted: newCompleted,
          completedDate: newCompleted ? todayDateStr : undefined,
        };
      });

      const allStepsDone = updatedSteps.every((s) => s.isCompleted);
      allWillBeDone = allStepsDone;
      const hasSignedRubric = p.rubrics.some((r) => r.status === 'Signed');
      let newStatus = p.status;
      if (allStepsDone && hasSignedRubric && p.moodleStatus === 'Submitted') {
        newStatus = 'Submitted';
      } else if (allStepsDone && hasSignedRubric) {
        newStatus = 'Ready for Moodle';
      } else if (allStepsDone && !hasSignedRubric) {
        newStatus = 'Awaiting Signature';
      } else if (updatedSteps.some((s) => s.isCompleted)) {
        newStatus = 'In Progress';
      }

      return {
        ...p,
        steps: updatedSteps,
        status: newStatus,
      };
    });

    if (completedTransition) {
      if (allWillBeDone) {
        haptic.success();
      } else {
        haptic.light();
      }
    } else {
      haptic.selection();
    }

    const updatedCase: DentalCase = {
      ...c,
      procedures: updatedProcedures,
    };
    onUpdateCase(updatedCase);
  };

  // Save Rubric from modal
  const handleSaveRubric = (newRubric: any) => {
    if (!rubricModalData.procedure) return;
    const targetCase = cases.find((c) => c.id === rubricModalData.caseId);
    if (!targetCase) return;

    const updatedProcedures = targetCase.procedures.map((p) => {
      if (p.id !== rubricModalData.procedure?.id) return p;
      const updatedRubrics = [...p.rubrics, newRubric];
      const hasSigned = updatedRubrics.some((r) => r.status === 'Signed');
      const allStepsDone = p.steps.every((s) => s.isCompleted);

      let newStatus = p.status;
      if (hasSigned && allStepsDone && p.moodleStatus === 'Submitted') {
        newStatus = 'Submitted';
      } else if (hasSigned && allStepsDone) {
        newStatus = 'Ready for Moodle';
      } else if (!hasSigned) {
        newStatus = 'Awaiting Signature';
      }

      return {
        ...p,
        rubrics: updatedRubrics,
        status: newStatus,
      };
    });

    haptic.success();
    onUpdateCase({
      ...targetCase,
      procedures: updatedProcedures,
    });
  };

  // Save Evidence from modal
  const handleSaveEvidence = (newEvidence: any) => {
    if (!evidenceModalData.procedure) return;
    const targetCase = cases.find((c) => c.id === evidenceModalData.caseId);
    if (!targetCase) return;

    const updatedProcedures = targetCase.procedures.map((p) => {
      if (p.id !== evidenceModalData.procedure?.id) return p;
      return {
        ...p,
        evidenceFiles: [...p.evidenceFiles, newEvidence],
      };
    });

    haptic.success();
    onUpdateCase({
      ...targetCase,
      procedures: updatedProcedures,
    });
  };

  // Add Procedure to Case
  const handleAddProcedure = (newProc: ClinicalProcedure) => {
    const targetCase = cases.find((c) => c.id === addProcModalData.caseId);
    if (!targetCase) return;

    const updatedProcedures = [...targetCase.procedures, newProc];
    haptic.success();
    onUpdateCase({
      ...targetCase,
      procedures: updatedProcedures,
    });
  };

  // Handle Quick Action triggers
  const handleTriggerQuickAction = (type: 'procedure' | 'rubric' | 'evidence') => {
    haptic.selection();
    if (basePool.length === 1) {
      const singleCase = basePool[0];
      const primaryProc = singleCase.procedures[0] || null;
      if (type === 'procedure') {
        setAddProcModalData({ isOpen: true, caseId: singleCase.id });
      } else if (type === 'rubric' && primaryProc) {
        setRubricModalData({ isOpen: true, caseId: singleCase.id, procedure: primaryProc });
      } else if (type === 'evidence' && primaryProc) {
        setEvidenceModalData({ isOpen: true, caseId: singleCase.id, procedure: primaryProc });
      } else {
        onSelectCase(singleCase.id);
      }
    } else if (basePool.length > 1) {
      setTargetCaseModal({ isOpen: true, type });
    } else {
      onOpenAddCaseModal();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* 1. HEADER / TODAY CLINIC SCHEDULE STATUS */}
      <section 
        aria-label="Today Schedule Status" 
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs"
      >
        {currentSessionInfo.hasTodaySchedule && currentSessionInfo.active ? (
          /* STATE 1: A CLINIC IS SCHEDULED TODAY */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="font-extrabold uppercase text-sky-600 dark:text-sky-400">Today</span>
                <span aria-hidden="true">·</span>
                <span>{todayFormattedDate}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-600 text-white text-xs font-black">
                    Clinic {currentSessionInfo.active.clinicPlace}
                  </span>
                  <span>{currentSessionInfo.active.discipline}</span>
                </h2>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  · {currentSessionInfo.active.startTime} – {currentSessionInfo.active.endTime}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  · {displayedCases.length} {displayedCases.length === 1 ? 'case' : 'cases'}
                  {attentionItems.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400"> ({attentionItems.length} need attention)</span>
                  )}
                </span>
              </div>
            </div>

            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="self-start sm:self-center min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Schedule</span>
              </button>
            )}
          </div>
        ) : (
          /* STATE 2: NO CLINIC IS SCHEDULED TODAY */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="font-extrabold uppercase text-slate-600 dark:text-slate-400">Today</span>
                <span aria-hidden="true">·</span>
                <span>{todayFormattedDate}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  No clinic today. Enjoy it while it lasts.
                </h2>

                {currentSessionInfo.nextUpcoming ? (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500 mr-1">· Next:</span>
                    <strong className="text-sky-600 dark:text-sky-400 font-bold">{currentSessionInfo.nextUpcoming.dayOfWeek}</strong> · Clinic {currentSessionInfo.nextUpcoming.clinicPlace} ({currentSessionInfo.nextUpcoming.startTime}–{currentSessionInfo.nextUpcoming.endTime})
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    · All active cases remain accessible below
                  </span>
                )}
              </div>
            </div>

            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="self-start sm:self-center min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Schedule</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* COCKPIT GRID: 2 Columns on Desktop, 1 Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 2. CASE WORKLOAD (Primary Section - 7 cols on desktop) */}
        <section aria-label="Active Cases" className="lg:col-span-7 space-y-3">
          {/* Section Header with Case Filters */}
          <div className="space-y-2.5 px-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {currentSessionInfo.hasTodaySchedule ? "Today's Cases" : "My Active Cases"}
                </h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ({displayedCases.length})
                </span>
              </div>

              {onNavigateToCases && (
                <button
                  type="button"
                  onClick={onNavigateToCases}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer transition"
                >
                  <span>Full Case List</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Case Filter Row (Station Filter Pills clearly associated with Case List) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div 
                className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
                role="tablist"
                aria-label="Filter cases by clinic place"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSelectedClinicFilter('ALL');
                  }}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold cursor-pointer transition ${
                    selectedClinicFilter === 'ALL' 
                      ? 'bg-sky-600 text-white shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="View cases across all clinics"
                >
                  All
                </button>
                {CLINICS.map((clinic) => (
                  <button
                    key={clinic}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedClinicFilter(clinic);
                      onChangeClinicPlace(clinic);
                    }}
                    className={`min-h-[36px] w-9 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition ${
                      selectedClinicFilter === clinic 
                        ? 'bg-sky-600 text-white shadow-2xs' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={`Filter by Clinic ${clinic}`}
                  >
                    {clinic}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onOpenAddCaseModal}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Case</span>
              </button>
            </div>
          </div>

          {/* Compact Case Cards */}
          {displayedCases.length > 0 ? (
            <div className="space-y-3">
              {displayedCases.map((c) => {
                const primaryProc = c.procedures[0];
                const statusInfo = primaryProc ? getProcedureMacroStepStatus(primaryProc) : null;
                const toothDisplay = primaryProc?.toothNumber ? formatTeethDisplay(primaryProc.toothNumber) : '';
                const plannedVisit = resolvePlannedVisit(c, schedule);
                const initials = getPatientInitials(c.patientName);
                const avatarTheme = getPatientAvatarTheme(c.patientName);
                const discTheme = primaryProc ? getDisciplineTheme(primaryProc.discipline) : null;

                // Derive concise next action
                let nextActionText = 'In progress';
                let nextActionType: 'step' | 'rubric' | 'moodle' | 'visit' | 'general' = 'general';

                if (primaryProc) {
                  const hasSigned = primaryProc.rubrics.some((r) => r.status === 'Signed');
                  if (statusInfo?.nextStep) {
                    nextActionText = `${statusInfo.nextStep.title}`;
                    nextActionType = 'step';
                  } else if (!hasSigned && statusInfo?.isAllDone) {
                    nextActionText = 'Get rubric signature from instructor';
                    nextActionType = 'rubric';
                  } else if (hasSigned && primaryProc.moodleStatus === 'Not Submitted') {
                    nextActionText = 'Submit case on Moodle';
                    nextActionType = 'moodle';
                  }
                }

                if (nextActionType === 'general' && plannedVisit.isPlanned) {
                  nextActionText = `${plannedVisit.actionText} (${plannedVisit.dayName || plannedVisit.formattedDate} · Clinic ${plannedVisit.clinicPlace})`;
                  nextActionType = 'visit';
                } else if (nextActionType === 'general' && (c.targetNextVisitDate || c.targetNextVisitPlan)) {
                  nextActionText = `${c.targetNextVisitPlan || 'Continue next session'} (${c.targetNextVisitDate || 'Planned'})`;
                  nextActionType = 'visit';
                }

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition flex flex-col justify-between gap-3"
                  >
                    {/* Compact Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Patient Initials Circle */}
                        <div
                          className={`w-10 h-10 rounded-2xl ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs tracking-tight select-none`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => onSelectCase(c.id)}
                              className="text-base font-black text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer truncate"
                            >
                              {c.patientName}
                            </h4>
                          </div>

                          {/* Discipline · Tooth notation · Clinic assignment */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-mono">#{c.fileNumber}</span>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Clinic {c.clinicPlace}
                            </span>
                            {primaryProc && (
                              <>
                                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1">
                                  {getDisciplineIcon(primaryProc.discipline, 'w-3.5 h-3.5')}
                                  <span>{primaryProc.discipline}</span>
                                </span>
                              </>
                            )}
                            {toothDisplay && (
                              <>
                                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                  <ToothIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                  <span>Tooth {toothDisplay}</span>
                                </span>
                              </>
                            )}
                            {c.isComprehensive && (
                              <>
                                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-0.5">
                                  <Sparkles className="w-3 h-3" /> Comprehensive
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status indicator & phone call */}
                      <div className="flex items-center gap-2 shrink-0">
                        {c.patientPhone && (
                          <a
                            href={`tel:${c.patientPhone.replace(/\s+/g, '')}`}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={`Call patient (${c.patientPhone})`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                            c.status === 'Completed' || c.status === 'Finished'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : c.status === 'Ready for Moodle'
                              ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {/* Next Action Box */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        {nextActionType === 'rubric' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        ) : nextActionType === 'moodle' ? (
                          <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-400 mr-1.5">Next:</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {nextActionText}
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Milestone Advance if next step exists */}
                      {statusInfo?.nextStep && primaryProc && (
                        <button
                          type="button"
                          onClick={() => handleToggleStep(c, primaryProc.id, statusInfo.nextStep!.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-2xs transition cursor-pointer shrink-0 flex items-center gap-1"
                          title="Complete next step"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Done</span>
                        </button>
                      )}
                    </div>

                    {/* Card Footer: Quick Actions + Open Case */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {primaryProc && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setRubricModalData({
                                  isOpen: true,
                                  caseId: c.id,
                                  procedure: primaryProc,
                                })
                              }
                              className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 transition"
                              title="Scan Rubric Signature"
                            >
                              <Camera className="w-3.5 h-3.5 text-purple-500" />
                              <span>Rubric</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEvidenceModalData({
                                  isOpen: true,
                                  caseId: c.id,
                                  procedure: primaryProc,
                                })
                              }
                              className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 transition"
                              title="Attach Clinical Photo / X-Ray"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Photo</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setPlanVisitTargetCase(c)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 transition"
                          title="Plan next clinical session from extracted schedule"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-sky-500" />
                          <span>{plannedVisit.isPlanned ? 'Visit' : '+ Visit'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectCase(c.id)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <span>Open Case</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center font-bold">
                <User className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedClinicFilter === 'ALL'
                    ? 'No active cases in progress'
                    : `No active cases in Clinic ${selectedClinicFilter}`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-0.5">
                  Your active cases show up here. Tap below to add a patient.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddCaseModal}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> <span>+ New Patient Case</span>
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Cockpit Side Panels (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 3. NEEDS ATTENTION / NEXT ACTIONS */}
          <section aria-label="Needs Attention" className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Needs Attention
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                {attentionItems.length}
              </span>
            </div>

            {attentionItems.length > 0 ? (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'signature' && item.procedure) {
                        setRubricModalData({ isOpen: true, caseId: item.caseId, procedure: item.procedure });
                      } else if (item.type === 'evidence' && item.procedure) {
                        setEvidenceModalData({ isOpen: true, caseId: item.caseId, procedure: item.procedure });
                      } else if (item.type === 'visit' && item.dentalCase) {
                        setPlanVisitTargetCase(item.dentalCase);
                      } else {
                        onSelectCase(item.caseId);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-sky-400 dark:hover:border-sky-600 transition cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">All caught up</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  No missing signatures or pending uploads. Suspicious.
                </p>
              </div>
            )}
          </section>

          {/* 4. QUICK ACTIONS GRID */}
          <section aria-label="Quick Actions" className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
              Quick Actions
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenAddCaseModal}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-slate-800 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[64px]"
              >
                <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
                  <User className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">+ New Case</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('procedure')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-slate-800 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[64px]"
              >
                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                  <Layers className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">+ Procedure</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('rubric')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-slate-800 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[64px]"
              >
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <Camera className="w-4 h-4" />
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">Scan Rubric</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('evidence')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-slate-800 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[64px]"
              >
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">Add Photo</span>
              </button>
            </div>
          </section>

          {/* 5. TODAY'S SESSIONS */}
          {todaySessions.length > 1 && (
            <section aria-label="Today Timeline" className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Today&apos;s Sessions
                  </h4>
                </div>
                {onNavigateToSchedule && (
                  <button
                    type="button"
                    onClick={onNavigateToSchedule}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Full Schedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {todaySessions.map((session, sIdx) => (
                  <div
                    key={session.id || sIdx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        Clinic {session.clinicPlace}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {session.discipline}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] shrink-0 font-mono">
                      {session.startTime} – {session.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Target Case Selector Modal for Quick Actions */}
      {targetCaseModal.isOpen && (
        <ModalPortal isOpen={true}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 relative shadow-2xl space-y-3 animate-modal-pop text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Patient Case
                </h4>
                <button
                  type="button"
                  onClick={() => setTargetCaseModal({ isOpen: false, type: 'procedure' })}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the patient to {targetCaseModal.type === 'procedure' ? 'add a procedure' : targetCaseModal.type === 'rubric' ? 'scan a rubric' : 'attach a photo'}:
              </p>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {basePool.map((c) => {
                  const initials = getPatientInitials(c.patientName);
                  const avatarTheme = getPatientAvatarTheme(c.patientName);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const primaryProc = c.procedures[0] || null;
                        const type = targetCaseModal.type;
                        setTargetCaseModal({ isOpen: false, type: 'procedure' });
                        if (type === 'procedure') {
                          setAddProcModalData({ isOpen: true, caseId: c.id });
                        } else if (type === 'rubric' && primaryProc) {
                          setRubricModalData({ isOpen: true, caseId: c.id, procedure: primaryProc });
                        } else if (type === 'evidence' && primaryProc) {
                          setEvidenceModalData({ isOpen: true, caseId: c.id, procedure: primaryProc });
                        } else {
                          onSelectCase(c.id);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left transition cursor-pointer flex items-center justify-between hover:border-sky-400 dark:hover:border-sky-600 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-bold text-xs flex items-center justify-center shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.patientName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">#{c.fileNumber} · Clinic {c.clinicPlace}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Rubric Upload Modal */}
      {rubricModalData.isOpen && rubricModalData.procedure && (
        <RubricUploadModal
          isOpen={rubricModalData.isOpen}
          onClose={() => setRubricModalData({ isOpen: false, caseId: '', procedure: null })}
          procedureTitle={rubricModalData.procedure.title}
          discipline={rubricModalData.procedure.discipline}
          onSaveRubric={handleSaveRubric}
        />
      )}

      {/* Evidence Upload Modal */}
      {evidenceModalData.isOpen && evidenceModalData.procedure && (
        <EvidenceUploadModal
          isOpen={evidenceModalData.isOpen}
          onClose={() => setEvidenceModalData({ isOpen: false, caseId: '', procedure: null })}
          caseId={evidenceModalData.caseId}
          procedureId={evidenceModalData.procedure.id}
          procedureTitle={evidenceModalData.procedure.title}
          onSaveEvidence={handleSaveEvidence}
        />
      )}

      {/* Add Procedure Modal */}
      {addProcModalData.isOpen && (
        <AddProcedureModal
          isOpen={addProcModalData.isOpen}
          onClose={() => setAddProcModalData({ isOpen: false, caseId: '' })}
          caseId={addProcModalData.caseId}
          templates={templates}
          onProcedureAdded={handleAddProcedure}
        />
      )}

      {/* Plan Next Visit Modal */}
      {planVisitTargetCase && (
        <PlanNextVisitModal
          isOpen={Boolean(planVisitTargetCase)}
          onClose={() => setPlanVisitTargetCase(null)}
          dentalCase={planVisitTargetCase}
          schedule={schedule}
          onSavePlan={(updatedCase) => {
            onUpdateCase(updatedCase);
            setPlanVisitTargetCase(null);
          }}
          onNavigateToSchedule={onNavigateToSchedule}
        />
      )}

      {/* Floating Export Feedback Toast */}
      <ExportToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
