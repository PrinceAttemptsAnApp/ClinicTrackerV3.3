import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Camera, 
  FileCheck2, 
  Send, 
  Trash2,
  AlertTriangle,
  Eye,
  X,
  Plus,
  PlusCircle,
  Clock,
  Sparkles,
  Layers,
  PhoneCall,
  Check,
  Edit3,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CalendarDays,
  Award
} from 'lucide-react';
import { DentalCase, ClinicalProcedure, ProcedureTemplate, RubricDocument, EvidenceFile, MoodleStatus, ClinicSession } from '../types';
import { RubricUploadModal } from './RubricUploadModal';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { PlanNextVisitModal } from './PlanNextVisitModal';
import { ModalPortal } from './ModalPortal';
import { EndoRadiographSection } from './EndoRadiographSection';
import { getProcedureMacroStepStatus, formatTeethDisplay, cleanProcedureTitle } from '../lib/macroSteps';
import { resolvePlannedVisit } from '../lib/visitPlanner';
import { computeIsComprehensive } from '../lib/storage';
import { 
  getDisciplineIcon, 
  getDisciplineTheme 
} from '../lib/clinicalVisuals';
import {
  getOfficialRubricsForProcedure,
  getEvidenceRequirementsForProcedure,
  calculateFixedStagePoints,
  FIXED_STAGE_POINT_PERCENTAGES,
} from '../lib/miuLogbookData';
import { haptic } from '../lib/haptics';

interface ProcedureDetailViewProps {
  procedure: ClinicalProcedure;
  dentalCase: DentalCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onDeleteProcedure: (procedureId: string, procedureSnapshot?: ClinicalProcedure) => void;
  templates: ProcedureTemplate[];
  schedule?: ClinicSession[];
  onNavigateToSchedule?: () => void;
}

export const ProcedureDetailView: React.FC<ProcedureDetailViewProps> = ({
  procedure,
  dentalCase,
  onBack,
  onUpdateCase,
  onDeleteProcedure,
  templates,
  schedule = [],
  onNavigateToSchedule,
}) => {
  // Modals state
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPlanVisitModalOpen, setIsPlanVisitModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Custom Step Modal
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [customStepTitle, setCustomStepTitle] = useState('');

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(procedure.notes || '');

  // Official MIU Rubric Reference UI state
  const [showOfficialRubric, setShowOfficialRubric] = useState(false);
  const [activeRubricIdx, setActiveRubricIdx] = useState(0);

  // Associated teeth formatted
  const teethFormatted = formatTeethDisplay(procedure.toothNumber);
  const displayTitle = cleanProcedureTitle(procedure.title);
  const statusInfo = getProcedureMacroStepStatus(procedure);
  const discTheme = getDisciplineTheme(procedure.discipline);

  // Progressive disclosure for milestones: default to collapsed if all done, expanded if in progress
  const [showMilestones, setShowMilestones] = useState(!statusInfo.isAllDone);

  // Resolve MIU Logbook rubrics, evidence requirements & Fixed stage point weighting
  const officialRubrics = getOfficialRubricsForProcedure(procedure.discipline, displayTitle);
  const requiredEvidenceList = getEvidenceRequirementsForProcedure(procedure);
  const fixedStageInfo = procedure.discipline === 'Fixed' ? calculateFixedStagePoints(procedure) : null;
  const matchedTemplate = templates.find(
    (t) =>
      t.discipline === procedure.discipline &&
      (displayTitle.toLowerCase().includes(t.name.toLowerCase()) ||
        t.name.toLowerCase().includes(displayTitle.toLowerCase()))
  );

  const plannedVisitInfo = resolvePlannedVisit(dentalCase, schedule);
  const isPlannedForThisProc =
    plannedVisitInfo.isPlanned &&
    (plannedVisitInfo.procedureId === procedure.id || (!plannedVisitInfo.procedureId && dentalCase.procedures[0]?.id === procedure.id));

  // Toggle single step completion
  const handleToggleStep = (stepId: string) => {
    let toggledToCompleted = false;
    let allWillBeCompleted = false;

    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      const updatedSteps = p.steps.map((s) => {
        if (s.id !== stepId) return s;
        const newDone = !s.isCompleted;
        toggledToCompleted = newDone;
        return {
          ...s,
          isCompleted: newDone,
          completedDate: newDone ? new Date().toISOString().split('T')[0] : undefined,
        };
      });

      const allStepsDone = updatedSteps.every((s) => s.isCompleted);
      allWillBeCompleted = allStepsDone;
      const hasSignedRubric = p.rubrics.some((r) => r.status === 'Signed');

      let newStatus = p.status;
      if (allStepsDone && hasSignedRubric) {
        newStatus = p.moodleStatus === 'Submitted' ? 'Submitted' : 'Ready for Moodle';
      } else if (allStepsDone && !hasSignedRubric) {
        newStatus = 'Awaiting Signature';
      } else {
        newStatus = 'In Progress';
      }

      return {
        ...p,
        steps: updatedSteps,
        status: newStatus,
      };
    });

    if (toggledToCompleted) {
      if (allWillBeCompleted) {
        haptic.success();
      } else {
        haptic.light();
      }
    } else {
      haptic.selection();
    }

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
      isComprehensive: computeIsComprehensive(updatedProcedures),
    });
  };

  // Add custom step
  const handleAddCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStepTitle.trim()) return;

    const newStep = {
      id: `step-${Date.now()}`,
      title: customStepTitle.trim(),
      isCompleted: false,
    };

    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        steps: [...p.steps, newStep],
      };
    });

    haptic.success();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });

    setCustomStepTitle('');
    setIsAddStepModalOpen(false);
  };

  // Save notes
  const handleSaveNotes = () => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        notes: notesInput.trim(),
      };
    });

    haptic.selection();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
    setIsEditingNotes(false);
  };

  // Toggle Moodle Submission
  const handleToggleMoodle = () => {
    const isCurrentlySubmitted = procedure.moodleStatus === 'Submitted';
    const newMoodleStatus: MoodleStatus = isCurrentlySubmitted ? 'Not Submitted' : 'Submitted';
    const newSubmissionDate = isCurrentlySubmitted ? undefined : new Date().toISOString().split('T')[0];

    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;

      const allStepsDone = p.steps.every((s) => s.isCompleted);
      const hasSignedRubric = p.rubrics.some((r) => r.status === 'Signed');

      let newStatus = p.status;
      if (newMoodleStatus === 'Submitted') {
        newStatus = 'Submitted';
      } else if (allStepsDone && hasSignedRubric) {
        newStatus = 'Ready for Moodle';
      } else if (allStepsDone) {
        newStatus = 'Awaiting Signature';
      } else {
        newStatus = 'In Progress';
      }

      return {
        ...p,
        moodleStatus: newMoodleStatus,
        moodleSubmissionDate: newSubmissionDate,
        status: newStatus,
      };
    });

    if (newMoodleStatus === 'Submitted') {
      haptic.success();
    } else {
      haptic.selection();
    }

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
      isComprehensive: computeIsComprehensive(updatedProcedures),
    });
  };

  // Save rubric
  const handleSaveRubric = (newRubric: RubricDocument) => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      const updatedRubrics = [...p.rubrics, newRubric];
      const hasSigned = updatedRubrics.some((r) => r.status === 'Signed');
      const allStepsDone = p.steps.every((s) => s.isCompleted);

      let newStatus = p.status;
      if (hasSigned && allStepsDone) {
        newStatus = p.moodleStatus === 'Submitted' ? 'Submitted' : 'Ready for Moodle';
      } else if (hasSigned) {
        newStatus = 'Signed';
      }

      return {
        ...p,
        rubrics: updatedRubrics,
        status: newStatus,
      };
    });

    haptic.success();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
      isComprehensive: computeIsComprehensive(updatedProcedures),
    });
  };

  // Save evidence
  const handleSaveEvidence = (newEvidence: EvidenceFile) => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        evidenceFiles: [...p.evidenceFiles, newEvidence],
      };
    });

    haptic.success();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  // Status Badge Formatting
  let statusText = procedure.status;
  let statusStyle = 'text-sky-700 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/70 border-sky-200 dark:border-sky-900';
  let statusDotColor = 'bg-sky-500';

  if (procedure.status === 'Submitted') {
    statusStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900';
    statusDotColor = 'bg-emerald-500';
  } else if (procedure.status === 'Ready for Moodle') {
    statusStyle = 'text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/70 border-purple-200 dark:border-purple-900';
    statusDotColor = 'bg-purple-500';
  } else if (procedure.status === 'Awaiting Signature') {
    statusStyle = 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900';
    statusDotColor = 'bg-amber-500';
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. PROCEDURE HEADER BAR: IDENTITY & TOP ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Back to Case"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Discipline Icon Badge */}
            <div className={`w-11 h-11 rounded-2xl ${discTheme.bg} ${discTheme.text} border ${discTheme.border} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
              {getDisciplineIcon(procedure.discipline, 'w-5 h-5')}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {displayTitle}
              </h2>

              {/* Clean Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{procedure.discipline}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span>Case: <button onClick={onBack} className="text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer">{dentalCase.patientName}</button> (#{dentalCase.fileNumber})</span>
                {teethFormatted && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">🦷 {teethFormatted}</span>
                  </>
                )}
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{procedure.points || 10} pts</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Status Tag, Moodle Toggle & 3-Dots Menu */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${statusStyle} inline-flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
              <span>{statusText}</span>
            </span>

            {/* Moodle Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMoodle}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                procedure.moodleStatus === 'Submitted'
                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Toggle Moodle status"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{procedure.moodleStatus === 'Submitted' ? 'Submitted ✓' : 'Submit to Moodle'}</span>
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
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Procedure options"
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
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsPlanVisitModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Plan Next Visit</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Procedure</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED COMPLETION / PROGRESS STATUS BAR */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-2xl border transition-all ${
        statusInfo.isAllDone
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
          : 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/80 text-sky-950 dark:text-sky-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              statusInfo.isAllDone
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-sky-600 text-white shadow-xs'
            }`}>
              {statusInfo.isAllDone ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {statusInfo.isAllDone
                  ? 'Clinical Procedure Completed'
                  : `Milestone ${statusInfo.completedCount + 1} of ${statusInfo.totalSteps}: ${statusInfo.nextStep?.title || 'Next Step'}`}
              </h4>
              <p className={`text-xs mt-0.5 ${statusInfo.isAllDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                {statusInfo.isAllDone
                  ? `All ${statusInfo.totalSteps} clinical milestones verified · Ready for final rubric signature`
                  : `${statusInfo.completedCount} of ${statusInfo.totalSteps} milestones done (${statusInfo.percent}%)`}
              </p>
            </div>
          </div>

          {!statusInfo.isAllDone && (
            <button
              type="button"
              onClick={() => setIsPlanVisitModalOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isPlannedForThisProc
                  ? `Planned: ${plannedVisitInfo.dayName || plannedVisitInfo.formattedDate}`
                  : 'Plan Next Visit'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MACRO CLINICAL MILESTONES (VERTICAL CONNECTED STEPPER) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMilestones(!showMilestones)}
            className="flex items-center gap-2 text-left cursor-pointer group min-h-[40px]"
          >
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Macro Clinical Milestones
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ({statusInfo.completedCount}/{statusInfo.totalSteps} completed)
            </span>
            {showMilestones ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAddStepModalOpen(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Step</span>
          </button>
        </div>

        {/* Fixed Prosthodontics Stage Weighting Banner (Clean & Compact) */}
        {fixedStageInfo && (
          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 text-xs flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Fixed Stage Progress
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {fixedStageInfo.currentStageLabel}
              </p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {fixedStageInfo.earnedPoints} / {fixedStageInfo.totalPoints} pts ({fixedStageInfo.cumulativePercent}%)
            </span>
          </div>
        )}

        {/* Milestones Vertical Stepper */}
        {showMilestones && (
          <div className="pt-2 animate-in fade-in duration-100 relative">
            <div className="space-y-3">
              {procedure.steps.map((step, idx) => {
                const isDone = step.isCompleted;
                const isNext = !isDone && (idx === 0 || procedure.steps[idx - 1]?.isCompleted);
                const isLast = idx === procedure.steps.length - 1;

                return (
                  <div key={step.id} className="relative flex items-start gap-3.5 group">
                    {/* Connecting vertical line */}
                    {!isLast && (
                      <div
                        className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] transition-colors ${
                          isDone ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    )}

                    {/* Step Circle Indicator */}
                    <button
                      type="button"
                      onClick={() => handleToggleStep(step.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition cursor-pointer z-10 select-none ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : isNext
                          ? 'bg-sky-600 text-white shadow-xs ring-4 ring-sky-500/20 hover:bg-sky-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </button>

                    {/* Step Content Card */}
                    <div
                      onClick={() => handleToggleStep(step.id)}
                      className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none active:scale-[0.99] ${
                        isDone
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800/70 text-slate-500 dark:text-slate-400'
                          : isNext
                          ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-white ring-1 ring-sky-300/50 dark:ring-sky-700/50'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className={`text-xs sm:text-sm font-bold block ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                        }`}>
                          {step.title}
                        </span>
                        {isNext && (
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                            ● Current Milestone
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone && step.completedDate && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                            {step.completedDate}
                          </span>
                        )}
                        <span className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isDone ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. WORKSPACES: RUBRICS & EVIDENCE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Rubrics Workspace */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Signed Rubrics ({procedure.rubrics.length})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsRubricModalOpen(true)}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Scan / Upload</span>
            </button>
          </div>

          {procedure.rubrics.length === 0 ? (
            <div className="py-4 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <FileCheck2 className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No rubric scanned yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Scan your doctor-signed physical evaluation rubric to verify clinical points.
              </p>
              <button
                type="button"
                onClick={() => setIsRubricModalOpen(true)}
                className="mt-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Scan Official Rubric</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {procedure.rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {rubric.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rubric.status === 'Signed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                      >
                        {rubric.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {rubric.instructorName} {rubric.signatureDate && `· ${rubric.signatureDate}`}
                    </p>
                  </div>

                  {rubric.fileDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: rubric.fileDataUrl!, title: rubric.title })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition cursor-pointer shrink-0"
                      title="View rubric image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Official MIU Criteria (Collapsible) */}
          {officialRubrics.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowOfficialRubric(!showOfficialRubric)}
                className="w-full py-1.5 text-left text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Official Logbook Rubric Criteria ({officialRubrics[0]?.totalMarks || 'Reference'})</span>
                {showOfficialRubric ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showOfficialRubric && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs max-h-72 overflow-y-auto">
                  {officialRubrics.map((rubric) => (
                    <div key={rubric.id} className="space-y-1.5">
                      <p className="font-bold text-slate-900 dark:text-white">{rubric.title}</p>
                      {rubric.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{sec.sectionTitle}: </span>
                          <span>{sec.criteria.map((c) => c.name).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Endodontic Radiographic Section (when applicable) */}
        {procedure.discipline === 'Endo' && (
          <EndoRadiographSection
            procedure={procedure}
            dentalCase={dentalCase}
            onUpdateCase={onUpdateCase}
            onOpenPreview={(url, title) => setPreviewImage({ url, title })}
          />
        )}

        {/* Clinical Evidence & Photography Workspace */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Clinical Evidence ({procedure.evidenceFiles.length})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(true)}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evidence</span>
            </button>
          </div>

          {procedure.evidenceFiles.length === 0 ? (
            <div className="py-4 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <Camera className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No clinical photos attached</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Attach pre-op, preparation, or post-op photos for Moodle submission.
              </p>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(true)}
                className="mt-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Clinical Photo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {procedure.evidenceFiles.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => ev.fileDataUrl && setPreviewImage({ url: ev.fileDataUrl, title: `${ev.category}: ${ev.fileName}` })}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition cursor-pointer group"
                >
                  <div className="w-full h-16 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden relative flex items-center justify-center">
                    {ev.fileDataUrl ? (
                      <img
                        src={ev.fileDataUrl}
                        alt={ev.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                    {ev.fileName}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Required Evidence Requirements (Compact Collapsible) */}
          {requiredEvidenceList.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Required: </span>
              <span>{requiredEvidenceList.join(' · ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CLINICAL NOTES SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Procedure Clinical Notes</span>
          </h4>
          {!isEditingNotes ? (
            <button
              type="button"
              onClick={() => {
                setNotesInput(procedure.notes || '');
                setIsEditingNotes(true);
              }}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {procedure.notes ? 'Edit Notes' : '+ Add Notes'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {isEditingNotes ? (
          <textarea
            autoFocus
            rows={3}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Finish lines, shade, adhesive protocol, rotary file size..."
            className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
            {procedure.notes || 'No notes documented for this procedure.'}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DELETE PROCEDURE CONFIRMATION */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <ModalPortal isOpen={isDeleteModalOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-950/50 animate-modal-pop text-slate-900 dark:text-slate-100">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Delete Procedure?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{displayTitle}</strong>
                    {teethFormatted ? ` on ${teethFormatted}` : ''}?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 mb-4 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Removing procedure:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700/90 dark:text-rose-400/90 pl-1 space-y-0.5">
                  <li>All milestone steps and clinical records for this procedure will be removed</li>
                  <li>Other procedures in this case will remain intact</li>
                  <li>You can <strong>Undo</strong> this action to restore the procedure immediately</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.error();
                    setIsDeleteModalOpen(false);
                    onDeleteProcedure(procedure.id, procedure);
                    onBack();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Procedure</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PLAN NEXT VISIT */}
      {/* ========================================================================= */}
      {isPlanVisitModalOpen && (
        <PlanNextVisitModal
          isOpen={isPlanVisitModalOpen}
          onClose={() => setIsPlanVisitModalOpen(false)}
          dentalCase={dentalCase}
          schedule={schedule}
          targetProcedure={procedure}
          onSavePlan={(updatedCase) => {
            onUpdateCase(updatedCase);
            setIsPlanVisitModalOpen(false);
            haptic.success();
          }}
          onNavigateToSchedule={onNavigateToSchedule}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM STEP */}
      {/* ========================================================================= */}
      {isAddStepModalOpen && (
        <ModalPortal isOpen={isAddStepModalOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-modal-pop text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Add Chairside Milestone
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddStepModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomStep} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Milestone Title / Action
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={customStepTitle}
                    onChange={(e) => setCustomStepTitle(e.target.value)}
                    placeholder="e.g. Shade Selection & Rubber Dam Isolation"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStepModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer"
                  >
                    Add Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Rubric Modal */}
      {isRubricModalOpen && (
        <RubricUploadModal
          isOpen={isRubricModalOpen}
          onClose={() => setIsRubricModalOpen(false)}
          procedureTitle={displayTitle}
          discipline={procedure.discipline}
          onSaveRubric={handleSaveRubric}
        />
      )}

      {/* Evidence Modal */}
      {isEvidenceModalOpen && (
        <EvidenceUploadModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          caseId={dentalCase.id}
          procedureId={procedure.id}
          procedureTitle={displayTitle}
          onSaveEvidence={handleSaveEvidence}
        />
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <ModalPortal isOpen={Boolean(previewImage)}>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {previewImage.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-hidden rounded-2xl flex items-center justify-center bg-slate-950">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
