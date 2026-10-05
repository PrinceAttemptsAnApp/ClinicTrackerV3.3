import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CalendarDays, 
  PlusCircle, 
  FileDown, 
  Archive, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Trash2, 
  AlertTriangle, 
  X, 
  Phone, 
  PhoneCall, 
  Copy, 
  Check, 
  Edit3, 
  ChevronRight, 
  Stethoscope, 
  ArrowRight, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  MoreVertical,
  Award,
  Activity,
  FileText
} from 'lucide-react';
import { DentalCase, ClinicalProcedure, ProcedureTemplate, ClinicSession } from '../types';
import { ProcedureDetailView } from './ProcedureDetailView';
import { AddProcedureModal } from './AddProcedureModal';
import { PlanNextVisitModal } from './PlanNextVisitModal';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';
import { ExportToast, ToastMessage } from './ExportToast';
import { computeIsComprehensive } from '../lib/storage';
import { ModalPortal } from './ModalPortal';
import { 
  getProcedureMacroStepStatus, 
  formatTeethDisplay, 
  getCaseInvolvedTeeth, 
  cleanProcedureTitle 
} from '../lib/macroSteps';
import { 
  getPatientInitials, 
  getPatientAvatarTheme, 
  getDisciplineIcon, 
  getDisciplineTheme,
  ToothIcon,
  getStatusIcon
} from '../lib/clinicalVisuals';
import { resolvePlannedVisit } from '../lib/visitPlanner';
import { haptic } from '../lib/haptics';

interface CaseDetailViewProps {
  dentalCase: DentalCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onDeleteCase: (caseId: string) => void;
  onDeleteProcedure?: (procedureId: string, deletedProcedure?: ClinicalProcedure) => void;
  templates: ProcedureTemplate[];
  initialProcedureId?: string | null;
  schedule?: ClinicSession[];
  onNavigateToSchedule?: () => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  dentalCase,
  onBack,
  onUpdateCase,
  onDeleteCase,
  onDeleteProcedure,
  templates,
  initialProcedureId = null,
  schedule = [],
  onNavigateToSchedule,
}) => {
  // Navigation: which procedure is currently selected (null = Case Details page)
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(initialProcedureId);

  // Modals state
  const [isAddProcOpen, setIsAddProcOpen] = useState(false);
  const [isDeleteCaseModalOpen, setIsDeleteCaseModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Plan Next Visit Modal State
  const [isPlanVisitModalOpen, setIsPlanVisitModalOpen] = useState(false);
  const [planTargetProcedure, setPlanTargetProcedure] = useState<ClinicalProcedure | null>(null);

  // Procedure Delete State
  const [procedurePendingDelete, setProcedurePendingDelete] = useState<{
    id: string;
    title: string;
    discipline: string;
    toothNumber?: string;
  } | null>(null);

  // Phone & Notes Editor State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(dentalCase.patientPhone || '');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(dentalCase.notes || '');

  useEffect(() => {
    setPhoneInput(dentalCase.patientPhone || '');
  }, [dentalCase.patientPhone]);

  useEffect(() => {
    setNotesInput(dentalCase.notes || '');
  }, [dentalCase.notes]);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isMenuOpen]);

  // Export handlers
  const handleExportPdf = async () => {
    setIsMenuOpen(false);
    if (isExportingPdf || isExportingZip) return;
    setIsExportingPdf(true);
    haptic.selection();
    try {
      const result = await generateCaseMoodlePDF(dentalCase);
      if (result.success) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        const message = (isMobile && result.method !== 'download') ? 'PDF ready' : 'PDF exported successfully';
        setToast({ id: Date.now().toString(), type: 'success', message });
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to export PDF report. Please try again.' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportZip = async () => {
    setIsMenuOpen(false);
    if (isExportingPdf || isExportingZip) return;
    setIsExportingZip(true);
    haptic.selection();
    try {
      await exportCaseAsZip(dentalCase);
      setToast({ id: Date.now().toString(), type: 'success', message: 'ZIP archive downloaded successfully' });
    } catch (err) {
      console.error('ZIP export error:', err);
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to export ZIP archive. Please try again.' });
    } finally {
      setIsExportingZip(false);
    }
  };

  // Add Procedure Callback
  const handleProcedureAdded = (newProc: ClinicalProcedure) => {
    const updated = [...dentalCase.procedures, newProc];
    const disciplines = Array.from(new Set(updated.map((p) => p.discipline)));
    onUpdateCase({
      ...dentalCase,
      procedures: updated,
      disciplines,
      isComprehensive: computeIsComprehensive(updated),
    });
    setSelectedProcedureId(newProc.id);
  };

  // Delete Procedure Execution
  const handleDeleteProcedure = (procId: string, snapshot?: ClinicalProcedure) => {
    const procedureToDelete = snapshot || dentalCase.procedures.find((p) => p.id === procId);
    
    if (onDeleteProcedure) {
      onDeleteProcedure(procId, procedureToDelete);
    } else {
      const updated = dentalCase.procedures.filter((p) => p.id !== procId);
      const disciplines = Array.from(new Set(updated.map((p) => p.discipline)));
      onUpdateCase({
        ...dentalCase,
        procedures: updated,
        disciplines,
        isComprehensive: computeIsComprehensive(updated),
      });
    }
    setProcedurePendingDelete(null);
  };

  const handleSavePhone = () => {
    const trimmed = phoneInput.trim();
    onUpdateCase({
      ...dentalCase,
      patientPhone: trimmed || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingPhone(false);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dentalCase.patientPhone) return;
    navigator.clipboard.writeText(dentalCase.patientPhone).then(() => {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }).catch(() => {});
  };

  const handleSaveNotes = () => {
    onUpdateCase({
      ...dentalCase,
      notes: notesInput.trim(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditingNotes(false);
  };

  // Selected procedure object (Level 3)
  const selectedProcedure = dentalCase.procedures.find((p) => p.id === selectedProcedureId);

  // If a procedure is selected, render the dedicated Level 3 Procedure Details View!
  if (selectedProcedureId && selectedProcedure) {
    return (
      <ProcedureDetailView
        procedure={selectedProcedure}
        dentalCase={dentalCase}
        onBack={() => {
          setSelectedProcedureId(null);
        }}
        onUpdateCase={onUpdateCase}
        onDeleteProcedure={handleDeleteProcedure}
        templates={templates}
        schedule={schedule}
        onNavigateToSchedule={onNavigateToSchedule}
      />
    );
  }

  // Calculate Metrics
  const allMilestones = dentalCase.procedures.flatMap((p) => p.steps);
  const totalMilestones = allMilestones.length;
  const completedSteps = allMilestones.filter((s) => s.isCompleted);
  const progressPercent = totalMilestones > 0 ? Math.round((completedSteps.length / totalMilestones) * 100) : 0;
  
  const allRubrics = dentalCase.procedures.flatMap((p) => p.rubrics);
  const signedRubrics = allRubrics.filter((r) => r.status === 'Signed');
  const totalPoints = dentalCase.procedures.reduce((acc, p) => acc + (p.points || 10), 0);

  // Next Milestone Across Case
  const nextMilestoneProc = dentalCase.procedures.find((p) => {
    const status = getProcedureMacroStepStatus(p);
    return status.nextStep !== null;
  });
  const nextUpcomingStep = nextMilestoneProc ? getProcedureMacroStepStatus(nextMilestoneProc).nextStep : null;

  // Planned Visit Info
  const plannedVisitInfo = resolvePlannedVisit(dentalCase, schedule);

  // Patient Avatar theme
  const initials = getPatientInitials(dentalCase.patientName);
  const avatarTheme = getPatientAvatarTheme(dentalCase.patientName);

  // Standard Status Tag & Indicator Styling
  let statusText = 'In Progress';
  let statusStyle = 'text-sky-700 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/70 border-sky-200 dark:border-sky-900';
  let statusDotColor = 'bg-sky-500';
  let progressBarColor = 'bg-sky-500';

  if (dentalCase.status === 'Completed' || (dentalCase.procedures.length > 0 && dentalCase.procedures.every((p) => p.moodleStatus === 'Submitted'))) {
    statusText = 'Completed';
    statusStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900';
    statusDotColor = 'bg-emerald-500';
    progressBarColor = 'bg-emerald-500';
  } else if (
    dentalCase.status === 'Finished (Awaiting Signatures)' ||
    dentalCase.procedures.some((p) => p.rubrics.some((r) => r.status === 'Pending'))
  ) {
    statusText = 'Missing Signatures';
    statusStyle = 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900';
    statusDotColor = 'bg-amber-500';
    progressBarColor = 'bg-amber-500';
  } else if (dentalCase.status === 'Ready for Moodle') {
    statusText = 'Ready for Moodle';
    statusStyle = 'text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/70 border-purple-200 dark:border-purple-900';
    statusDotColor = 'bg-purple-500';
    progressBarColor = 'bg-purple-500';
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. CASE HEADER: PATIENT IDENTITY & TOP LEVEL ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Back to Cases"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Patient Initials Avatar Circle */}
            <div
              className={`w-11 h-11 rounded-2xl ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-2xs tracking-tight select-none mt-0.5`}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {dentalCase.patientName}
                </h2>
              </div>

              {/* Clean Unboxed Metadata with · separators */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span className="font-mono">#{dentalCase.fileNumber}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Clinic {dentalCase.clinicPlace}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span>{dentalCase.semester}</span>
                {dentalCase.isComprehensive && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-0.5">
                      <Award className="w-3 h-3" />
                      <span>Comprehensive Case ⭐</span>
                    </span>
                  </>
                )}
                {dentalCase.isDemo && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-amber-600 font-bold">Demo</span>
                  </>
                )}
              </div>

              {/* Phone Row */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                {isEditingPhone ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      type="tel"
                      autoFocus
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 01012345678"
                      className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white w-40 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="px-2 py-1.5 text-slate-400 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : dentalCase.patientPhone ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${dentalCase.patientPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-sky-600 font-medium"
                      title="Call patient"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dentalCase.patientPhone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Copy phone"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Edit phone"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    <span>+ Add Phone</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Controls: Status Badge, Add Procedure & Overflow Menu */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${statusStyle} inline-flex items-center gap-1.5`}>
              {getStatusIcon(statusText, 'w-3.5 h-3.5 shrink-0')}
              <span>{statusText}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsAddProcOpen(true)}
              className="min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-sky-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Procedure</span>
            </button>

            {/* Overflow 3-Dots Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                  haptic.selection();
                }}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="More case options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" /> : <FileDown className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Export PDF Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportZip}
                    disabled={isExportingZip}
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    {isExportingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" /> : <Archive className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Export ZIP Archive</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteCaseModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Case</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CASE HEALTH & CLINICAL ACTION MODULES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Overall Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Case Health & Progress</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-xs">
              {progressPercent}% Complete
            </span>
          </div>

          {/* Unified Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full ${progressBarColor} rounded-full transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-0.5">
            <span>{completedSteps.length} of {totalMilestones} Milestones Done</span>
            <span>{signedRubrics.length}/{allRubrics.length} Rubrics Signed</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{totalPoints} pts</span>
          </div>
        </div>

        {/* Next Visit / Next Action Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Next Clinical Action</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setPlanTargetProcedure(nextMilestoneProc || null);
                setIsPlanVisitModalOpen(true);
              }}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {plannedVisitInfo.isPlanned ? 'Change Plan' : '+ Plan Visit'}
            </button>
          </div>

          {plannedVisitInfo.isPlanned ? (
            <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/50 text-xs space-y-1">
              <p className="font-bold text-sky-950 dark:text-sky-100 flex items-center gap-1.5">
                <span>📅</span>
                <span>{plannedVisitInfo.formattedDate} · Clinic {plannedVisitInfo.clinicPlace}</span>
              </p>
              <p className="text-[11px] text-sky-800 dark:text-sky-300 font-medium truncate">
                {plannedVisitInfo.actionText}
              </p>
            </div>
          ) : nextUpcomingStep ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Next Milestone: {nextUpcomingStep.title}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No clinic date assigned yet. Tap &apos;+ Plan Visit&apos; to schedule.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All clinical milestones in this case completed!</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PROCEDURES SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Procedures ({dentalCase.procedures.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any procedure to manage chairside milestones, rubrics & evidence
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddProcOpen(true)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Procedure</span>
          </button>
        </div>

        {dentalCase.procedures.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Stethoscope className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No procedures added yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-0.5">
                Add an official MIU clinical procedure to begin logging milestones, rubrics, and clinical evidence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddProcOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add First Procedure</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dentalCase.procedures.map((proc) => {
              const statusInfo = getProcedureMacroStepStatus(proc);
              const teethDisplay = formatTeethDisplay(proc.toothNumber);
              const displayTitle = cleanProcedureTitle(proc.title);
              const discTheme = getDisciplineTheme(proc.discipline);

              return (
                <div
                  key={proc.id}
                  onClick={() => {
                    haptic.light();
                    setSelectedProcedureId(proc.id);
                  }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition shadow-xs cursor-pointer group select-none flex items-center justify-between gap-3 active:scale-[0.995]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Discipline Icon */}
                    <div className={`w-10 h-10 rounded-xl ${discTheme.bg} ${discTheme.text} border ${discTheme.border} flex items-center justify-center shrink-0`}>
                      {getDisciplineIcon(proc.discipline, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Procedure Title */}
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                        {displayTitle}
                      </h4>

                      {/* Procedure Subtitle */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{proc.discipline}</span>
                        {teethDisplay && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-sky-600 dark:text-sky-400 font-bold inline-flex items-center gap-1">
                              <ToothIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{teethDisplay}</span>
                            </span>
                          </>
                        )}
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{proc.points || 10} pts</span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${statusInfo.isAllDone ? 'bg-emerald-500' : 'bg-sky-500'}`}
                            style={{ width: `${statusInfo.percent}%` }}
                          />
                        </div>
                        <span className="font-medium truncate">
                          {statusInfo.isAllDone
                            ? 'Completed ✓'
                            : `${statusInfo.completedCount}/${statusInfo.totalSteps} steps`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                        proc.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : proc.status === 'Ready for Moodle'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : proc.status === 'Awaiting Signature'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      }`}
                    >
                      {proc.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CASE CLINICAL NOTES (COLLAPSIBLE / EDITABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Case Clinical Notes</span>
          </span>

          {!isEditingNotes && (
            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{dentalCase.notes ? 'Edit Notes' : '+ Add Note'}</span>
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2 pt-1">
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Record patient medical history, allergies, treatment plan notes..."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : dentalCase.notes ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-0.5">
            {dentalCase.notes}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">No clinical notes recorded for this case.</p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS & PORTALS */}
      {/* ========================================================================= */}
      {isAddProcOpen && (
        <AddProcedureModal
          isOpen={isAddProcOpen}
          onClose={() => setIsAddProcOpen(false)}
          onProcedureAdded={handleProcedureAdded}
          templates={templates}
          defaultDiscipline={dentalCase.disciplines[0] || 'Operative'}
          caseId={dentalCase.id}
        />
      )}

      {isPlanVisitModalOpen && (
        <PlanNextVisitModal
          isOpen={isPlanVisitModalOpen}
          onClose={() => {
            setIsPlanVisitModalOpen(false);
            setPlanTargetProcedure(null);
          }}
          dentalCase={dentalCase}
          schedule={schedule}
          targetProcedure={planTargetProcedure}
          onSavePlan={(updated) => {
            onUpdateCase(updated);
            setIsPlanVisitModalOpen(false);
            setPlanTargetProcedure(null);
            haptic.success();
          }}
          onNavigateToSchedule={onNavigateToSchedule}
        />
      )}

      {/* In-App Delete Case Confirmation Modal */}
      {isDeleteCaseModalOpen && (
        <ModalPortal isOpen={isDeleteCaseModalOpen}>
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/50 space-y-4 animate-modal-pop text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteCaseModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Delete Clinical Case?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to delete the case for{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">{dentalCase.patientName}</strong>{' '}
                  (File #{dentalCase.fileNumber}, Clinic {dentalCase.clinicPlace})?
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Removing clinical case:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700/90 dark:text-rose-400/90 pl-1 space-y-0.5">
                  <li>All {dentalCase.procedures.length} procedure(s) and milestones will be removed</li>
                  <li>All attached rubrics and clinical evidence will be removed</li>
                  <li>You will have an <strong>Undo</strong> window to restore this case</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteCaseModalOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.error();
                    setIsDeleteCaseModalOpen(false);
                    onDeleteCase(dentalCase.id);
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Case</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Floating Export Feedback Toast */}
      <ExportToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
