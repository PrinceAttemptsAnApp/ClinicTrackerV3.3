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
  Image as ImageIcon 
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
        className="frosted-card rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-xs"
      >
        {currentSessionInfo.hasTodaySchedule && currentSessionInfo.active ? (
          /* STATE 1: A CLINIC IS SCHEDULED TODAY */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="font-extrabold uppercase text-sky-700">Today</span>
                <span aria-hidden="true">·</span>
                <span>{todayFormattedDate}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-xs font-black">
                    Clinic {currentSessionInfo.active.clinicPlace}
                  </span>
                  <span>{currentSessionInfo.active.discipline}</span>
                </h2>
                <span className="text-xs text-slate-600 font-semibold">
                  · {currentSessionInfo.active.startTime} – {currentSessionInfo.active.endTime}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  · {displayedCases.length} {displayedCases.length === 1 ? 'case' : 'cases'}
                  {attentionItems.length > 0 && (
                    <span className="text-amber-700"> ({attentionItems.length} need attention)</span>
                  )}
                </span>
              </div>
            </div>

            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-50 border border-sky-200/80 flex items-center gap-1.5 transition cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                <span>Open Schedule</span>
              </button>
            )}
          </div>
        ) : (
          /* STATE 2: NO CLINIC IS SCHEDULED TODAY */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="font-extrabold uppercase text-slate-600">Today</span>
                <span aria-hidden="true">·</span>
                <span>{todayFormattedDate}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  No clinic scheduled today
                </h2>

                {currentSessionInfo.nextUpcoming ? (
                  <span className="text-xs font-medium text-slate-600">
                    <span className="text-slate-400 mr-1">· Next:</span>
                    <strong className="text-sky-800 font-bold">{currentSessionInfo.nextUpcoming.dayOfWeek}</strong> · Clinic {currentSessionInfo.nextUpcoming.clinicPlace} ({currentSessionInfo.nextUpcoming.startTime}–{currentSessionInfo.nextUpcoming.endTime})
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    · All active cases remain accessible below
                  </span>
                )}
              </div>
            </div>

            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="self-start sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-50 border border-sky-200/80 flex items-center gap-1.5 transition cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
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
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  {currentSessionInfo.hasTodaySchedule ? "Today's Cases" : "My Active Cases"}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  ({displayedCases.length})
                </span>
              </div>

              {onNavigateToCases && (
                <button
                  type="button"
                  onClick={onNavigateToCases}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 cursor-pointer transition"
                >
                  <span>Full Case List</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Case Filter Row (Station Filter Pills clearly associated with Case List) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div 
                className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70"
                role="tablist"
                aria-label="Filter cases by clinic place"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSelectedClinicFilter('ALL');
                  }}
                  className={`px-2.5 h-7 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                    selectedClinicFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center ${
                      selectedClinicFilter === clinic
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition"
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
                const toothInfo = primaryProc?.toothNumber ? resolveToothInfo(primaryProc.toothNumber) : null;
                const toothDisplay = primaryProc?.toothNumber ? formatTeethDisplay(primaryProc.toothNumber) : '';
                const plannedVisit = resolvePlannedVisit(c, schedule);

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
                    className="frosted-card rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-sky-300 transition flex flex-col justify-between gap-3"
                  >
                    {/* Compact Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => onSelectCase(c.id)}
                            className="text-sm font-black text-slate-800 hover:text-sky-600 transition cursor-pointer truncate"
                          >
                            {c.patientName}
                          </h4>
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            · Case #{c.fileNumber}
                          </span>
                        </div>

                        {/* Discipline · Tooth notation · Clinic assignment */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap">
                          <span className="font-bold text-sky-800">
                            {primaryProc ? primaryProc.discipline : 'General'}
                          </span>
                          {toothDisplay && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span className="font-semibold text-slate-700">
                                Tooth {toothDisplay}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="text-slate-500 font-medium">
                            Clinic {c.clinicPlace}
                          </span>
                          {c.isComprehensive && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span className="text-purple-700 font-bold text-[11px] inline-flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3" /> Comprehensive
                              </span>
                            </>
                          )}
                          {plannedVisit.isPlanned && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlanVisitTargetCase(c);
                                }}
                                className="text-sky-800 font-bold text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 transition cursor-pointer"
                                title="Tap to view or change planned visit"
                              >
                                <CalendarDays className="w-3 h-3 text-sky-600" />
                                <span>{plannedVisit.dayName || plannedVisit.formattedDate} · Clinic {plannedVisit.clinicPlace}{plannedVisit.time ? ` (${plannedVisit.time})` : ''}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status indicator & phone call */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {c.patientPhone && (
                          <a
                            href={`tel:${c.patientPhone.replace(/\s+/g, '')}`}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80 cursor-pointer"
                            title={`Call patient (${c.patientPhone})`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span
                          className={`text-xs font-bold ${
                            c.status === 'Completed' || c.status === 'Finished'
                              ? 'text-emerald-700'
                              : c.status === 'Ready for Moodle'
                              ? 'text-purple-700'
                              : 'text-sky-700'
                          }`}
                        >
                          ● {c.status}
                        </span>
                      </div>
                    </div>

                    {/* Next Action Box */}
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/70 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {nextActionType === 'rubric' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : nextActionType === 'moodle' ? (
                          <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs">
                          <span className="font-semibold text-slate-500 mr-1.5">
                            Next:
                          </span>
                          <span className="font-bold text-slate-800">
                            {nextActionText}
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Milestone Advance if next step exists */}
                      {statusInfo?.nextStep && primaryProc && (
                        <button
                          type="button"
                          onClick={() => handleToggleStep(c, primaryProc.id, statusInfo.nextStep!.id)}
                          className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer flex-shrink-0 flex items-center gap-1"
                          title="Complete next step"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Done</span>
                        </button>
                      )}
                    </div>

                    {/* Card Footer: Quick Actions + Open Case */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
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
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                              title="Scan Rubric Signature"
                            >
                              <Camera className="w-3.5 h-3.5 text-sky-600" />
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
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                              title="Attach Clinical Photo / X-Ray"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Photo</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setPlanVisitTargetCase(c)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                          title="Plan next clinical session from extracted schedule"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                          <span>{plannedVisit.isPlanned ? 'Visit' : '+ Visit'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectCase(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-100 text-sky-800 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <span>Open Case</span>
                        <ChevronRight className="w-3.5 h-3.5 text-sky-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="frosted-card rounded-2xl p-6 text-center space-y-3 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {selectedClinicFilter === 'ALL'
                  ? 'No active cases in progress'
                  : `No active cases in Clinic ${selectedClinicFilter}`}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your chairside cases appear here. Tap below to create a new patient record.
              </p>
              <button
                type="button"
                onClick={onOpenAddCaseModal}
                className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + New Patient Case
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Cockpit Side Panels (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 3. NEEDS ATTENTION / NEXT ACTIONS (Only shown if items exist or compact catch-up indicator) */}
          <section aria-label="Needs Attention" className="frosted-card rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Needs Attention
                </h4>
              </div>
              <span className="text-xs font-bold text-amber-700">
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
                    className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 hover:border-sky-300 transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 flex-shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center space-y-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">All caught up</p>
                <p className="text-[11px] text-slate-500">
                  No outstanding clinical tasks requiring immediate action.
                </p>
              </div>
            )}
          </section>

          {/* 4. QUICK ACTIONS GRID */}
          <section aria-label="Quick Actions" className="frosted-card rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              Quick Actions
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenAddCaseModal}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[58px]"
              >
                <div className="flex items-center justify-between text-sky-600">
                  <User className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1">+ New Case</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('procedure')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[58px]"
              >
                <div className="flex items-center justify-between text-purple-600">
                  <Layers className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1">+ Procedure</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('rubric')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[58px]"
              >
                <div className="flex items-center justify-between text-amber-600">
                  <Camera className="w-4 h-4" />
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1">Scan Rubric</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerQuickAction('evidence')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-left transition cursor-pointer active:scale-95 flex flex-col justify-between min-h-[58px]"
              >
                <div className="flex items-center justify-between text-emerald-600">
                  <ImageIcon className="w-4 h-4" />
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1">Add Photo</span>
              </button>
            </div>
          </section>

          {/* 5. TODAY'S SESSIONS (Only rendered if there are active sessions today, avoiding duplicate "no clinic" message) */}
          {todaySessions.length > 1 && (
            <section aria-label="Today Timeline" className="frosted-card rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Today&apos;s Sessions
                  </h4>
                </div>
                {onNavigateToSchedule && (
                  <button
                    type="button"
                    onClick={onNavigateToSchedule}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Full Schedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {todaySessions.map((session, sIdx) => (
                  <div
                    key={session.id || sIdx}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sky-800">
                        Clinic {session.clinicPlace}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {session.discipline}
                      </span>
                    </div>
                    <span className="text-slate-500 font-medium text-[11px] flex-shrink-0">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="frosted-card w-full max-w-sm rounded-2xl p-5 relative shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Select Patient Case
                </h4>
                <button
                  type="button"
                  onClick={() => setTargetCaseModal({ isOpen: false, type: 'procedure' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Choose the patient to {targetCaseModal.type === 'procedure' ? 'add a procedure' : targetCaseModal.type === 'rubric' ? 'scan a rubric' : 'attach a photo'}:
              </p>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {basePool.map((c) => (
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
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.patientName}</p>
                      <p className="text-[11px] text-slate-500">#{c.fileNumber} · Clinic {c.clinicPlace}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
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
