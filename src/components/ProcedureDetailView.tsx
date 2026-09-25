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
  AlertCircle
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
  
  // Custom Step Modal
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [customStepTitle, setCustomStepTitle] = useState('');

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(procedure.notes || '');

  // Associated teeth formatted
  const teethFormatted = formatTeethDisplay(procedure.toothNumber);
  const displayTitle = cleanProcedureTitle(procedure.title);
  const statusInfo = getProcedureMacroStepStatus(procedure);

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

  // Add custom step to procedure
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

    haptic.medium();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });

    setCustomStepTitle('');
    setIsAddStepModalOpen(false);
  };

  // Save procedure notes
  const handleSaveNotes = () => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        notes: notesInput.trim() || undefined,
      };
    });

    haptic.medium();
    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
    setIsEditingNotes(false);
  };

  // Toggle Moodle Submission
  const handleToggleMoodle = () => {
    const nextMoodle: MoodleStatus = procedure.moodleStatus === 'Submitted' ? 'Not Submitted' : 'Submitted';
    let nextStatus = procedure.status;

    if (nextMoodle === 'Submitted') {
      nextStatus = 'Submitted';
      haptic.success();
    } else {
      haptic.medium();
      const hasSigned = procedure.rubrics.some((r) => r.status === 'Signed');
      const allStepsDone = procedure.steps.every((s) => s.isCompleted);
      nextStatus = hasSigned && allStepsDone ? 'Ready for Moodle' : 'In Progress';
    }

    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        moodleStatus: nextMoodle,
        moodleSubmissionDate: nextMoodle === 'Submitted' ? new Date().toISOString().split('T')[0] : undefined,
        status: nextStatus,
      };
    });

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  // Save rubric
  const handleSaveRubric = (newRubric: RubricDocument) => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      const filtered = p.rubrics.filter((r) => r.id !== newRubric.id);
      const updatedRubrics = [...filtered, newRubric];
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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. PROCEDURE HEADER BAR */}
      {/* ========================================================================= */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="neu-btn p-2 rounded-xl text-slate-700 hover:text-sky-600 transition cursor-pointer mt-0.5 flex-shrink-0"
              title="Back to Case Details"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              {/* Parent Case Reference & Discipline */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                  {procedure.discipline}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Case: <button onClick={onBack} className="text-slate-800 hover:text-sky-600 underline font-extrabold cursor-pointer">{dentalCase.patientName}</button> (#{dentalCase.fileNumber})
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Clinic {dentalCase.clinicPlace}
                </span>
              </div>

              {/* Procedure Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayTitle}
              </h2>

              {/* Associated Teeth - Visually Owned by the Procedure! */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Associated Teeth:</span>
                {teethFormatted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-900 font-extrabold text-sm border border-sky-200 shadow-2xs">
                    <span className="text-sky-500">🦷</span>
                    <span>{teethFormatted}</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                    General / Arch-Level
                  </span>
                )}

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  Requirement: {procedure.points || 10} pts
                </span>

                <span className="text-xs text-slate-400">
                  Logged: {procedure.date}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Status, Moodle & Delete */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Status Pill */}
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                procedure.status === 'Submitted'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : procedure.status === 'Ready for Moodle'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : procedure.status === 'Awaiting Signature'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-sky-100 text-sky-800 border border-sky-200'
              }`}
            >
              ● {procedure.status}
            </span>

            {/* Moodle Toggle */}
            <button
              type="button"
              onClick={handleToggleMoodle}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                procedure.moodleStatus === 'Submitted'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'neu-btn text-slate-700 hover:text-purple-700'
              }`}
              title="Toggle Moodle submission"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{procedure.moodleStatus === 'Submitted' ? 'Submitted ✓' : 'Submit to Moodle'}</span>
            </button>

            {/* Delete Procedure */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
              title="Delete this procedure"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Procedure</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROCEDURE MACRO PROGRESS HIGHLIGHT CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Step Reached Card */}
        <div className="frosted-card rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            statusInfo.reachedStep ? 'bg-emerald-100 text-emerald-700 shadow-2xs' : 'bg-slate-200 text-slate-500'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500 block">
              Step Dr Has Reached
            </span>
            {statusInfo.reachedStep ? (
              <>
                <p className="font-black text-base text-slate-900 mt-0.5">
                  {statusInfo.reachedStep.title}
                </p>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Milestone {statusInfo.reachedStepIndex + 1} of {statusInfo.totalSteps} Completed
                  {statusInfo.reachedStep.completedDate && ` on ${statusInfo.reachedStep.completedDate}`}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-slate-700 mt-0.5">Not started yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ready to begin Step 1: {procedure.steps[0]?.title || 'Clinical Preparation'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Next Step Card */}
        <div className={`frosted-card rounded-2xl p-4 border shadow-2xs flex items-start gap-3.5 ${
          statusInfo.nextStep ? 'bg-sky-50/80 border-sky-200' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            statusInfo.nextStep ? 'bg-sky-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs'
          }`}>
            {statusInfo.nextStep ? <Sparkles className="w-5 h-5" /> : <Check className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] uppercase font-black tracking-wider text-sky-800 block">
              {statusInfo.nextStep ? 'Next Clinical Step to Perform' : 'Clinical Procedure Completed'}
            </span>
            {statusInfo.nextStep ? (
              <>
                <p className="font-black text-base text-sky-950 mt-0.5">
                  {statusInfo.nextStep.title}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
                  <p className="text-xs text-sky-700 font-bold">
                    Milestone {statusInfo.reachedStepIndex + 2} of {statusInfo.totalSteps}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsPlanVisitModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {isPlannedForThisProc
                        ? `Planned: ${plannedVisitInfo.dayName || plannedVisitInfo.formattedDate} (Clinic ${plannedVisitInfo.clinicPlace})`
                        : 'Plan Next Visit'}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-black text-base text-emerald-900 mt-0.5">
                  All {statusInfo.totalSteps} Clinical Milestones Completed!
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Ready for evaluation signature and Moodle submission.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MACRO MILESTONES WORKSPACE */}
      {/* ========================================================================= */}
      <div className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>Macro Clinical Milestones & Checklist</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tap milestone circles to log completion. Progress auto-syncs to the case.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStepModalOpen(true)}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 border border-sky-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Milestone</span>
          </button>
        </div>

        {/* Milestones list */}
        <div className="space-y-2.5">
          {procedure.steps.map((step, idx) => {
            const isDone = step.isCompleted;
            const isNext = !isDone && (idx === 0 || procedure.steps[idx - 1]?.isCompleted);

            return (
              <div
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.99] touch-manipulation flex items-center justify-between gap-3 select-none ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                    : isNext
                    ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-200 text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs transition-transform duration-150 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                        : isNext
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 animate-checkmark stroke-[2.5]" /> : idx + 1}
                  </div>

                  <div className="min-w-0">
                    <span className={`text-sm font-bold block truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {step.title}
                    </span>
                    {isNext && (
                      <span className="text-[11px] font-extrabold text-sky-700">
                        ⚡ Active / Current Step to Complete
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone && step.completedDate && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Done {step.completedDate}
                    </span>
                  )}
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isDone ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {isDone && <Check className="w-3 h-3" />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. WORKSPACES: RUBRICS & EVIDENCE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rubrics Workspace */}
        <div className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Signed Rubric Documents ({procedure.rubrics.length})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsRubricModalOpen(true)}
              className="neu-btn px-2.5 py-1 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 border border-purple-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Scan / Upload</span>
            </button>
          </div>

          {procedure.rubrics.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
              No rubrics uploaded yet. Scan or upload instructor signature document.
            </div>
          ) : (
            <div className="space-y-2">
              {procedure.rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {rubric.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rubric.status === 'Signed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rubric.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Evaluator: {rubric.instructorName} ({rubric.instructorRole})
                      {rubric.signatureDate && ` • Signed: ${rubric.signatureDate}`}
                    </p>
                  </div>

                  {rubric.fileDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: rubric.fileDataUrl!, title: rubric.title })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer flex-shrink-0"
                      title="View rubric image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Endodontic Radiographic Workflow Section (when applicable) */}
        {procedure.discipline === 'Endo' && (
          <EndoRadiographSection
            procedure={procedure}
            dentalCase={dentalCase}
            onUpdateCase={onUpdateCase}
            onOpenPreview={(url, title) => setPreviewImage({ url, title })}
          />
        )}

        {/* Evidence & Photography Workspace */}
        <div className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Clinical Evidence & Photos ({procedure.evidenceFiles.length})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(true)}
              className="neu-btn px-2.5 py-1 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 border border-sky-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evidence</span>
            </button>
          </div>

          {procedure.evidenceFiles.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
              No clinical photos or X-rays attached. Add Pre-Op, Intra-Op, or Post-Op evidence.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {procedure.evidenceFiles.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => ev.fileDataUrl && setPreviewImage({ url: ev.fileDataUrl, title: `${ev.category}: ${ev.fileName}` })}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition cursor-pointer shadow-2xs group"
                >
                  <div className="w-full h-20 rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center">
                    {ev.fileDataUrl ? (
                      <img
                        src={ev.fileDataUrl}
                        alt={ev.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 truncate mt-1.5">
                    {ev.fileName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CLINICAL NOTES SECTION */}
      {/* ========================================================================= */}
      <div className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>Procedure Clinical Notes</span>
          </h4>
          {!isEditingNotes ? (
            <button
              type="button"
              onClick={() => {
                setNotesInput(procedure.notes || '');
                setIsEditingNotes(true);
              }}
              className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              {procedure.notes ? 'Edit Notes' : '+ Add Notes'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Notes
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
            placeholder="Document finish lines, shade selection, adhesive protocol, rotary file size, etc..."
            className="neu-input w-full p-3 rounded-xl text-xs text-slate-800"
          />
        ) : (
          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
            {procedure.notes || 'No notes documented yet for this procedure.'}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DELETE PROCEDURE CONFIRMATION */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <ModalPortal isOpen={isDeleteModalOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="frosted-card w-full max-w-md rounded-2xl p-6 shadow-xl border border-rose-200 animate-modal-pop">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Delete Procedure?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to delete <strong className="text-slate-800">{displayTitle}</strong>
                    {teethFormatted ? ` on ${teethFormatted}` : ''}?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4 text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>Removing procedure:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700/90 pl-1 space-y-0.5">
                  <li>All milestone steps and clinical records for this procedure will be removed</li>
                  <li>Other procedures in this case will remain intact</li>
                  <li>You can <strong>Undo</strong> this action to restore the procedure immediately</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-slate-700 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.error();
                    setIsDeleteModalOpen(false);
                    onDeleteProcedure(procedure.id, procedure);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
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
      {/* MODAL: ADD CUSTOM MILESTONE STEP */}
      {/* ========================================================================= */}
      {isAddStepModalOpen && (
        <ModalPortal isOpen={isAddStepModalOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="frosted-card w-full max-w-md rounded-2xl p-6 shadow-xl border border-sky-200 animate-modal-pop">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-sky-600" />
                  <span>Add Custom Milestone</span>
                </h3>
                <button
                  onClick={() => setIsAddStepModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomStep} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Milestone Title:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={customStepTitle}
                    onChange={(e) => setCustomStepTitle(e.target.value)}
                    placeholder="e.g. Master cast pouring & die trimming..."
                    className="neu-input w-full p-2.5 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStepModalOpen(false)}
                    className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Add Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RUBRIC UPLOAD */}
      {/* ========================================================================= */}
      {isRubricModalOpen && (
        <RubricUploadModal
          isOpen={isRubricModalOpen}
          onClose={() => setIsRubricModalOpen(false)}
          onSaveRubric={handleSaveRubric}
          discipline={procedure.discipline}
          procedureTitle={procedure.title}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: EVIDENCE UPLOAD */}
      {/* ========================================================================= */}
      {isEvidenceModalOpen && (
        <EvidenceUploadModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          onSaveEvidence={handleSaveEvidence}
          caseId={dentalCase.id}
          procedureId={procedure.id}
          procedureTitle={procedure.title}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMAGE LIGHTBOX PREVIEW */}
      {/* ========================================================================= */}
      {previewImage && (
        <ModalPortal isOpen={Boolean(previewImage)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
            <div className="frosted-card max-w-3xl w-full rounded-2xl p-4 overflow-hidden relative shadow-2xl animate-modal-pop">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                  {previewImage.title}
                </h4>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 max-h-[75vh] flex items-center justify-center bg-slate-900/10 rounded-xl overflow-hidden">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[72vh] max-w-full object-contain rounded-lg"
                />
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
          onSavePlan={onUpdateCase}
          onNavigateToSchedule={onNavigateToSchedule}
        />
      )}
    </div>
  );
};
