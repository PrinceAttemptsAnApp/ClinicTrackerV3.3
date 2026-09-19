import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CalendarDays, 
  PlusCircle, 
  FileDown, 
  Archive, 
  CheckCircle2, 
  Circle, 
  Camera, 
  Clock, 
  FileCheck2, 
  Send, 
  Trash2,
  Eye,
  X,
  Phone,
  PhoneCall,
  Copy,
  Check,
  Edit3,
  ChevronRight,
  Stethoscope,
  ArrowRight,
  Layers
} from 'lucide-react';
import { DentalCase, ClinicalProcedure, ProcedureTemplate, RubricDocument, EvidenceFile, MoodleStatus } from '../types';
import { RubricUploadModal } from './RubricUploadModal';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { AddProcedureModal } from './AddProcedureModal';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';
import { computeIsComprehensive } from '../lib/storage';
import { getProcedureMacroStepStatus, groupProceduresByTooth, resolveToothInfo } from '../lib/macroSteps';
import confetti from 'canvas-confetti';

interface CaseDetailViewProps {
  dentalCase: DentalCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onDeleteCase: (caseId: string) => void;
  templates: ProcedureTemplate[];
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  dentalCase,
  onBack,
  onUpdateCase,
  onDeleteCase,
  templates,
}) => {
  // Modals
  const [rubricModalProc, setRubricModalProc] = useState<ClinicalProcedure | null>(null);
  const [evidenceModalProc, setEvidenceModalProc] = useState<ClinicalProcedure | null>(null);
  const [isAddProcOpen, setIsAddProcOpen] = useState(false);
  const [targetToothForAdd, setTargetToothForAdd] = useState<string | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Next Visit Editor
  const [isEditingNextVisit, setIsEditingNextVisit] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState(dentalCase.targetNextVisitDate || '');
  const [nextVisitPlan, setNextVisitPlan] = useState(dentalCase.targetNextVisitPlan || '');

  // Patient Phone State & Editor
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(dentalCase.patientPhone || '');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Case Notes Editor
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(dentalCase.notes || '');

  useEffect(() => {
    setPhoneInput(dentalCase.patientPhone || '');
  }, [dentalCase.patientPhone]);

  useEffect(() => {
    setNotesInput(dentalCase.notes || '');
  }, [dentalCase.notes]);

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
      notes: notesInput.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingNotes(false);
  };

  // Toggle Step Checkbox
  const handleToggleStep = (procId: string, stepId: string) => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procId) return p;
      const updatedSteps = p.steps.map((s) => {
        if (s.id !== stepId) return s;
        const newDone = !s.isCompleted;
        if (newDone) {
          try {
            confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
          } catch {}
        }
        return {
          ...s,
          isCompleted: newDone,
          completedDate: newDone ? new Date().toISOString().split('T')[0] : undefined,
        };
      });

      const allStepsDone = updatedSteps.every((s) => s.isCompleted);
      const hasSigned = p.rubrics.some((r) => r.status === 'Signed');
      let newStatus = p.status;
      if (allStepsDone && hasSigned && p.moodleStatus === 'Submitted') {
        newStatus = 'Submitted';
      } else if (allStepsDone && hasSigned) {
        newStatus = 'Ready for Moodle';
      } else if (allStepsDone && !hasSigned) {
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

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
      isComprehensive: computeIsComprehensive(updatedProcedures),
    });
  };

  // Advance to next step directly
  const handleAdvanceNextStep = (proc: ClinicalProcedure) => {
    const status = getProcedureMacroStepStatus(proc);
    if (!status.nextStep) return;
    handleToggleStep(proc.id, status.nextStep.id);
  };

  // Add Step to Procedure
  const handleAddCustomStep = (procId: string) => {
    const title = window.prompt('Enter new macro milestone step title (e.g. Try-in, Occlusion Check):');
    if (!title?.trim()) return;

    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procId) return p;
      return {
        ...p,
        steps: [
          ...p.steps,
          {
            id: `step-${Date.now()}`,
            title: title.trim(),
            isCompleted: false,
          },
        ],
      };
    });

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  // Remove Procedure
  const handleRemoveProcedure = (procId: string, procTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove procedure "${procTitle}" from this case?`)) return;
    const updated = dentalCase.procedures.filter(p => p.id !== procId);
    const disciplines = Array.from(new Set(updated.map((p) => p.discipline)));
    onUpdateCase({
      ...dentalCase,
      procedures: updated,
      disciplines,
      isComprehensive: computeIsComprehensive(updated),
    });
  };

  // Save Rubric
  const handleSaveRubric = (newRubric: RubricDocument) => {
    if (!rubricModalProc) return;
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== rubricModalProc.id) return p;
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

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
      isComprehensive: computeIsComprehensive(updatedProcedures),
    });
  };

  // Save Evidence
  const handleSaveEvidence = (newEvidence: EvidenceFile) => {
    if (!evidenceModalProc) return;
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== evidenceModalProc.id) return p;
      return {
        ...p,
        evidenceFiles: [...p.evidenceFiles, newEvidence],
      };
    });

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  // Toggle Moodle Status
  const handleToggleMoodle = (procId: string) => {
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procId) return p;
      const nextMoodle: MoodleStatus = p.moodleStatus === 'Submitted' ? 'Not Submitted' : 'Submitted';
      let nextStatus = p.status;
      if (nextMoodle === 'Submitted') {
        nextStatus = 'Submitted';
        try {
          confetti({ particleCount: 40, spread: 80, origin: { y: 0.6 } });
        } catch {}
      } else {
        const hasSigned = p.rubrics.some((r) => r.status === 'Signed');
        const allStepsDone = p.steps.every((s) => s.isCompleted);
        nextStatus = hasSigned && allStepsDone ? 'Ready for Moodle' : 'In Progress';
      }

      return {
        ...p,
        moodleStatus: nextMoodle,
        moodleSubmittedDate: nextMoodle === 'Submitted' ? new Date().toISOString().split('T')[0] : undefined,
        status: nextStatus,
      };
    });

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  // Save Next Visit
  const handleSaveNextVisit = () => {
    onUpdateCase({
      ...dentalCase,
      targetNextVisitDate: nextVisitDate,
      targetNextVisitPlan: nextVisitPlan,
    });
    setIsEditingNextVisit(false);
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
  };

  const openAddProcedureForTooth = (toothNumber?: string) => {
    setTargetToothForAdd(toothNumber);
    setIsAddProcOpen(true);
  };

  // Group procedures by tooth
  const toothGroups = groupProceduresByTooth(dentalCase.procedures);
  const treatedTeethList = toothGroups
    .filter(g => g.toothNumber && g.toothNumber !== 'General')
    .map(g => g.toothNumber);

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. CASE HEADER: Patient Name, File Number & Mobile Number */}
      {/* ========================================================================= */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={onBack}
              className="neu-btn p-2 rounded-xl text-slate-700 hover:text-sky-600 transition cursor-pointer mt-0.5 sm:mt-0 flex-shrink-0"
              title="Back to Cases list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {/* Patient Name, File Number & Clinic Place */}
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {dentalCase.patientName}
                </h2>
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-2xs">
                  File #{dentalCase.fileNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                  Clinic {dentalCase.clinicPlace}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {dentalCase.semester}
                </span>
              </div>

              {/* Mobile Number & Dialer Row */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                {isEditingPhone ? (
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-sky-50 border border-sky-200 shadow-2xs">
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="tel"
                        autoFocus
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePhone();
                          if (e.key === 'Escape') setIsEditingPhone(false);
                        }}
                        placeholder="e.g. 01019283746"
                        className="neu-input pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 w-48 sm:w-56"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Save
                    </button>
                    {dentalCase.patientPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCase({
                            ...dentalCase,
                            patientPhone: undefined,
                            updatedAt: new Date().toISOString(),
                          });
                          setIsEditingPhone(false);
                        }}
                        className="neu-btn px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        title="Remove phone number"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="neu-btn px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : dentalCase.patientPhone ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Primary Dialer Button */}
                    <a
                      href={`tel:${dentalCase.patientPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer group"
                      title="Open device dialer and call patient"
                    >
                      <PhoneCall className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>Mobile: {dentalCase.patientPhone}</span>
                    </a>

                    {/* Copy Phone Button */}
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      title="Copy phone number to clipboard"
                    >
                      {copiedPhone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Edit Phone Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(dentalCase.patientPhone || '');
                        setIsEditingPhone(true);
                      }}
                      className="neu-btn p-1.5 rounded-xl text-slate-500 hover:text-sky-600 cursor-pointer"
                      title="Edit phone number"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput('');
                      setIsEditingPhone(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50/80 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-xs font-semibold transition cursor-pointer"
                    title="Add mobile phone number for chairside calling"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>+ Add Patient Mobile Number</span>
                  </button>
                )}

                {/* Summary pills */}
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-medium">
                  {treatedTeethList.length > 0 ? (
                    <>Teeth treated: <strong className="text-slate-800">{treatedTeethList.join(', ')}</strong></>
                  ) : (
                    <>{dentalCase.procedures.length} procedures recorded</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Export Moodle PDF & ZIP */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => generateCaseMoodlePDF(dentalCase)}
              className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Export all signed rubrics as PDF for Moodle"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Moodle PDF</span>
            </button>

            <button
              onClick={() => exportCaseAsZip(dentalCase)}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
              title="Download entire case documents as ZIP"
            >
              <Archive className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">ZIP</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete case for ${dentalCase.patientName} (#${dentalCase.fileNumber})?`)) {
                  onDeleteCase(dentalCase.id);
                  onBack();
                }
              }}
              className="neu-btn p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Delete Case"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comprehensive Case Tag */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
            {dentalCase.isComprehensive ? (
              <span className="font-bold text-purple-900">
                ⭐ <strong>Comprehensive Case Verified:</strong> Features {dentalCase.disciplines.length} disciplines ({dentalCase.disciplines.join(', ')}). Valid for requirements presentation!
              </span>
            ) : (
              <span className="text-slate-600">
                Current disciplines: <strong className="text-slate-800">{dentalCase.disciplines.join(', ')}</strong>. Add procedures from {Math.max(1, 3 - dentalCase.disciplines.length)} more discipline(s) to achieve Comprehensive status.
              </span>
            )}
          </div>

          <button
            onClick={() => openAddProcedureForTooth()}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Add Procedure</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TEETH CURRENTLY BEING TREATED & PROCEDURES PERFORMED ON THEM */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>Teeth Under Treatment & Macro Milestone Progress</span>
            </h3>
            <p className="text-xs text-slate-500">
              Procedures are organized by tooth. Track macro steps reached, next clinical milestones, and concurrent procedures.
            </p>
          </div>

          <button
            onClick={() => openAddProcedureForTooth()}
            className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Procedure to Tooth</span>
          </button>
        </div>

        {/* Render Tooth Groups */}
        {toothGroups.map((group) => {
          return (
            <div 
              key={group.key}
              className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
            >
              {/* Tooth Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                    {group.toothNumber.startsWith('#') ? group.toothNumber.replace('#', '') : '🦷'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        {group.isSpecificTooth ? `Tooth ${group.toothNumber}` : group.name}
                      </h4>
                      {group.isSpecificTooth && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200/80">
                          {group.name}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {group.quadrant}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {group.procedures.length} {group.procedures.length === 1 ? 'procedure running' : 'procedures running concurrently on this tooth'}
                    </p>
                  </div>
                </div>

                {/* Option to start another procedure on this specific tooth */}
                <button
                  type="button"
                  onClick={() => openAddProcedureForTooth(group.isSpecificTooth ? group.toothNumber : undefined)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border border-sky-200/70"
                  title={`Start another procedure on ${group.toothNumber}`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>+ Add Procedure to {group.isSpecificTooth ? `Tooth ${group.toothNumber}` : 'Tooth'}</span>
                </button>
              </div>

              {/* Procedures performed on this tooth */}
              <div className="space-y-4">
                {group.procedures.map((proc) => {
                  const statusInfo = getProcedureMacroStepStatus(proc);
                  const signedRubrics = proc.rubrics.filter((r) => r.status === 'Signed');
                  const pendingRubrics = proc.rubrics.filter((r) => r.status === 'Pending');

                  return (
                    <div
                      key={proc.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-2xs space-y-4 hover:border-sky-300 transition"
                    >
                      {/* Procedure Top Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                            {proc.discipline}
                          </span>
                          <div>
                            <h5 className="text-sm sm:text-base font-extrabold text-slate-900">
                              {proc.title}
                            </h5>
                            <p className="text-xs text-slate-500">
                              Logged: {proc.date} • Requirement Points: {proc.points || 10} pts
                            </p>
                          </div>
                        </div>

                        {/* Status & Quick Moodle Toggle */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              proc.status === 'Submitted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : proc.status === 'Ready for Moodle'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : proc.status === 'Awaiting Signature'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {proc.status}
                          </span>

                          <button
                            onClick={() => handleToggleMoodle(proc.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              proc.moodleStatus === 'Submitted'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'neu-btn text-slate-700 hover:text-purple-700'
                            }`}
                            title="Toggle Moodle Submission status"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{proc.moodleStatus === 'Submitted' ? 'Submitted ✓' : 'Moodle'}</span>
                          </button>

                          <button
                            onClick={() => handleRemoveProcedure(proc.id, proc.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove procedure"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* MACRO MILESTONE HIGHLIGHT: STEP REACHED & NEXT STEP */}
                      {/* ========================================================= */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Step Reached Card */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            statusInfo.reachedStep ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                              Step Dr Has Reached
                            </span>
                            {statusInfo.reachedStep ? (
                              <>
                                <p className="font-extrabold text-sm text-slate-900 truncate">
                                  {statusInfo.reachedStep.title}
                                </p>
                                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                  Milestone {statusInfo.reachedStepIndex + 1} of {statusInfo.totalSteps} Completed
                                  {statusInfo.reachedStep.completedDate && ` on ${statusInfo.reachedStep.completedDate}`}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-sm text-slate-700">Not started yet</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Ready to perform Step 1: {proc.steps[0]?.title || 'Preparation'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Next Step Card */}
                        <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                          statusInfo.nextStep
                            ? 'bg-sky-50/80 border-sky-200 text-sky-950'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              statusInfo.nextStep ? 'bg-sky-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs'
                            }`}>
                              {statusInfo.nextStep ? <ArrowRight className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 block">
                                {statusInfo.nextStep ? 'Next Clinical Step to Perform' : 'Procedure Status'}
                              </span>
                              {statusInfo.nextStep ? (
                                <>
                                  <p className="font-extrabold text-sm text-sky-950 truncate">
                                    {statusInfo.nextStep.title}
                                  </p>
                                  <p className="text-[11px] text-sky-700 font-semibold mt-0.5">
                                    Milestone {(statusInfo.reachedStepIndex + 2)} of {statusInfo.totalSteps}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-extrabold text-sm text-emerald-900">
                                    All Macro Milestones Completed!
                                  </p>
                                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                    Ready for instructor rubric evaluation & delivery
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick 1-click Advance button */}
                          {statusInfo.nextStep && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceNextStep(proc)}
                              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                              title={`Mark "${statusInfo.nextStep.title}" as completed`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Complete Step</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* MACRO STEP PROGRESSION PIPELINE */}
                      {/* ========================================================= */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                            <span>Tracked Macro Steps:</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              ({statusInfo.completedCount} of {statusInfo.totalSteps} completed)
                            </span>
                          </p>
                          <button
                            onClick={() => handleAddCustomStep(proc.id)}
                            className="text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer"
                          >
                            + Add Milestone
                          </button>
                        </div>

                        {/* Interactive Macro Step Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {proc.steps.map((step, idx) => {
                            const isNext = statusInfo.nextStep?.id === step.id;

                            return (
                              <button
                                key={step.id}
                                onClick={() => handleToggleStep(proc.id, step.id)}
                                className={`p-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-2 transition cursor-pointer relative ${
                                  step.isCompleted
                                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                                    : isNext
                                    ? 'bg-sky-50 text-sky-950 border-2 border-sky-500 shadow-2xs'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-white'
                                }`}
                              >
                                {step.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                ) : isNext ? (
                                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-xs">{step.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {step.isCompleted ? (
                                      <span className="text-emerald-700 font-medium">Done {step.completedDate || '✓'}</span>
                                    ) : isNext ? (
                                      <span className="text-sky-700 font-bold">Current Target</span>
                                    ) : (
                                      <span>Step {idx + 1}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rubrics & Clinical Evidence Section */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        {/* Rubric Status */}
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                          <div>
                            {signedRubrics.length > 0 ? (
                              <span className="font-bold text-emerald-700">
                                Signed Rubric: {signedRubrics[0].instructorName} ({signedRubrics[0].instructorRole || 'TA'}) on {signedRubrics[0].signatureDate || 'verified'}
                              </span>
                            ) : pendingRubrics.length > 0 ? (
                              <span className="font-semibold text-amber-700">
                                Evaluation rubric awaiting signature ({pendingRubrics[0].instructorName})
                              </span>
                            ) : (
                              <span className="text-slate-500">No evaluation rubric attached</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions: Scan Rubric & Add Photo */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => setRubricModalProc(proc)}
                            className="neu-btn px-2.5 py-1 rounded-lg text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-sky-600" />
                            <span>Scan Rubric</span>
                          </button>

                          <button
                            onClick={() => setEvidenceModalProc(proc)}
                            className="neu-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Attach Photo</span>
                          </button>

                          {/* Photos Thumbnail Count */}
                          {proc.evidenceFiles.length > 0 && (
                            <div className="flex items-center gap-1 pl-1">
                              {proc.evidenceFiles.slice(0, 2).map((ev) => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => ev.fileDataUrl && setPreviewImage({ url: ev.fileDataUrl, title: `${ev.category} - ${ev.fileName}` })}
                                  className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 hover:scale-105 transition cursor-pointer"
                                  title={`View ${ev.fileName}`}
                                >
                                  {ev.fileDataUrl?.startsWith('data:image') ? (
                                    <img src={ev.fileDataUrl} alt={ev.fileName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-sky-100 text-[8px] font-bold text-sky-700 flex items-center justify-center">
                                      IMG
                                    </div>
                                  )}
                                </button>
                              ))}
                              {proc.evidenceFiles.length > 2 && (
                                <span className="text-[10px] font-bold text-slate-500">+{proc.evidenceFiles.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* 3. OPTION TO ADD A PROCEDURE TO A TOOTH (START CONCURRENT PROCEDURE) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-purple-500/10 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Start Another Procedure on a Tooth
              </h4>
              <p className="text-xs text-slate-600">
                The Dr can run procedures in parallel (e.g. start a cavity prep on tooth #15 alongside a post placement or crown on tooth #14).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openAddProcedureForTooth()}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Start Procedure on a Tooth</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THE REST OF THE DETAILS OF THE CASE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Clinical Visit Planning Card */}
        <div className="frosted-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-600" />
              <h4 className="font-bold text-slate-900 text-sm">Next Clinical Visit Planning</h4>
            </div>
            {!isEditingNextVisit && (
              <button
                onClick={() => setIsEditingNextVisit(true)}
                className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
              >
                {dentalCase.targetNextVisitPlan ? 'Edit Plan' : '+ Schedule Plan'}
              </button>
            )}
          </div>

          {isEditingNextVisit ? (
            <div className="space-y-3 text-xs pt-1">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Visit Date</label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  className="neu-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Milestone Plan (e.g. Secondary impression for #14)
                </label>
                <input
                  type="text"
                  value={nextVisitPlan}
                  onChange={(e) => setNextVisitPlan(e.target.value)}
                  placeholder="e.g. Secondary impression for tooth #14 + Post placement check"
                  className="neu-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingNextVisit(false)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNextVisit}
                  className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  Save Visit Plan
                </button>
              </div>
            </div>
          ) : dentalCase.targetNextVisitPlan || dentalCase.targetNextVisitDate ? (
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs space-y-1">
              <p className="font-bold text-sky-950">
                Target Date: {dentalCase.targetNextVisitDate || 'Next scheduled session'}
              </p>
              <p className="text-slate-700">
                <strong>Plan:</strong> {dentalCase.targetNextVisitPlan || 'General procedure continuation'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No specific next visit scheduled. Tap &ldquo;+ Schedule Plan&rdquo; to define which milestone to execute next.
            </p>
          )}
        </div>

        {/* Case Clinical Notes & Findings Card */}
        <div className="frosted-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Clinical Case Notes & Findings</h4>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
              >
                {dentalCase.notes ? 'Edit Notes' : '+ Add Notes'}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2 text-xs">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Enter patient medical history, pre-op findings, periodontal diagnosis, etc..."
                rows={3}
                className="neu-input w-full p-2.5 rounded-xl text-xs font-medium"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              {dentalCase.notes || 'No case notes entered yet. Document diagnosis, caries extent, and treatment plan here.'}
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Rubric Modal */}
      {rubricModalProc && (
        <RubricUploadModal
          isOpen={!!rubricModalProc}
          onClose={() => setRubricModalProc(null)}
          procedureTitle={rubricModalProc.title}
          discipline={rubricModalProc.discipline}
          onSaveRubric={handleSaveRubric}
        />
      )}

      {/* Evidence Modal */}
      {evidenceModalProc && (
        <EvidenceUploadModal
          isOpen={!!evidenceModalProc}
          onClose={() => setEvidenceModalProc(null)}
          caseId={dentalCase.id}
          procedureId={evidenceModalProc.id}
          procedureTitle={evidenceModalProc.title}
          onSaveEvidence={handleSaveEvidence}
        />
      )}

      {/* Add Procedure Modal (Supports pre-filled tooth) */}
      {isAddProcOpen && (
        <AddProcedureModal
          isOpen={isAddProcOpen}
          onClose={() => setIsAddProcOpen(false)}
          caseId={dentalCase.id}
          templates={templates}
          onProcedureAdded={handleProcedureAdded}
          defaultToothNumber={targetToothForAdd}
        />
      )}

      {/* Full-Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-300 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-white font-bold text-sm mb-2 truncate max-w-full text-center">
              {previewImage.title}
            </p>
            <img
              src={previewImage.url}
              alt="Clinical Document"
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
