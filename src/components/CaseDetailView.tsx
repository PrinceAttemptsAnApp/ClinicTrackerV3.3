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
  AlertTriangle,
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
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DentalCase, ClinicalProcedure, ProcedureTemplate, RubricDocument, EvidenceFile, MoodleStatus } from '../types';
import { ProcedureDetailView } from './ProcedureDetailView';
import { AddProcedureModal } from './AddProcedureModal';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';
import { computeIsComprehensive } from '../lib/storage';
import { 
  getProcedureMacroStepStatus, 
  formatTeethDisplay, 
  getCaseInvolvedTeeth, 
  cleanProcedureTitle 
} from '../lib/macroSteps';
import { haptic } from '../lib/haptics';

interface CaseDetailViewProps {
  dentalCase: DentalCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onDeleteCase: (caseId: string) => void;
  onDeleteProcedure?: (procedureId: string, deletedProcedure?: ClinicalProcedure) => void;
  templates: ProcedureTemplate[];
  initialProcedureId?: string | null;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  dentalCase,
  onBack,
  onUpdateCase,
  onDeleteCase,
  onDeleteProcedure,
  templates,
  initialProcedureId = null,
}) => {
  // Navigation: which procedure is currently selected (null = Case Details page)
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(initialProcedureId);

  // Modals state
  const [isAddProcOpen, setIsAddProcOpen] = useState(false);
  const [isDeleteCaseModalOpen, setIsDeleteCaseModalOpen] = useState(false);
  const [procedurePendingDelete, setProcedurePendingDelete] = useState<{
    id: string;
    title: string;
    discipline: string;
    toothNumber?: string;
  } | null>(null);

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

  useEffect(() => {
    setNextVisitDate(dentalCase.targetNextVisitDate || '');
    setNextVisitPlan(dentalCase.targetNextVisitPlan || '');
  }, [dentalCase.targetNextVisitDate, dentalCase.targetNextVisitPlan]);

  // Selected procedure object (Level 3)
  const selectedProcedure = dentalCase.procedures.find((p) => p.id === selectedProcedureId);

  // If a procedure is selected, render the dedicated Level 3 Procedure Details View!
  if (selectedProcedureId && selectedProcedure) {
    return (
      <ProcedureDetailView
        procedure={selectedProcedure}
        dentalCase={dentalCase}
        onBack={() => setSelectedProcedureId(null)}
        onUpdateCase={onUpdateCase}
        onDeleteProcedure={(procId, snapshot) => {
          handleDeleteProcedure(procId, snapshot);
          setSelectedProcedureId(null);
        }}
        templates={templates}
      />
    );
  }

  // --- Handlers for Case Details (Level 2) ---

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

  const handleSaveNextVisit = () => {
    onUpdateCase({
      ...dentalCase,
      targetNextVisitDate: nextVisitDate || undefined,
      targetNextVisitPlan: nextVisitPlan.trim() || undefined,
      updatedAt: new Date().toISOString(),
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
    // Immediately open the newly created procedure details for seamless workflow
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

  // Calculations for Case Overview
  const involvedTeeth = getCaseInvolvedTeeth(dentalCase.procedures);
  const allSteps = dentalCase.procedures.flatMap((p) => p.steps);
  const completedSteps = allSteps.filter((s) => s.isCompleted);
  const totalMilestones = allSteps.length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedSteps.length / totalMilestones) * 100) : 0;

  const allRubrics = dentalCase.procedures.flatMap((p) => p.rubrics);
  const signedRubrics = allRubrics.filter((r) => r.status === 'Signed');

  const allEvidence = dentalCase.procedures.flatMap((p) => p.evidenceFiles);
  const submittedProcedures = dentalCase.procedures.filter((p) => p.moodleStatus === 'Submitted');

  // Find next upcoming milestone across all procedures
  const nextMilestoneProc = dentalCase.procedures.find((p) => {
    const status = getProcedureMacroStepStatus(p);
    return status.nextStep !== null;
  });
  const nextUpcomingStep = nextMilestoneProc ? getProcedureMacroStepStatus(nextMilestoneProc).nextStep : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. CASE HEADER: WHO IS THE PATIENT & WHAT IS THIS CASE */}
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
                  {dentalCase.semester} • {dentalCase.academicYear}
                </span>
                {dentalCase.isDemo && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Demo Case
                  </span>
                )}
              </div>

              {/* Patient Phone & Dialer */}
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
                        className="px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="px-2 py-1.5 rounded-lg text-slate-500 text-xs hover:text-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {dentalCase.patientPhone ? (
                      <>
                        <a
                          href={`tel:${dentalCase.patientPhone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-2xs transition cursor-pointer"
                          title="Call patient"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{dentalCase.patientPhone}</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsEditingPhone(true)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer"
                          title="Edit phone number"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Add Patient Phone Number</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Export PDF */}
            <button
              onClick={() => generateCaseMoodlePDF(dentalCase)}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Export complete case summary as Moodle PDF"
            >
              <FileDown className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Export ZIP */}
            <button
              onClick={() => exportCaseAsZip(dentalCase)}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download all signed rubrics and photo evidence in ZIP"
            >
              <Archive className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">ZIP Archive</span>
            </button>

            {/* Delete Case Button - Prominently accessible */}
            <button
              type="button"
              onClick={() => setIsDeleteCaseModalOpen(true)}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/90 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Delete this entire clinical case"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Case</span>
            </button>
          </div>
        </div>

        {/* Comprehensive Case Status Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
            {dentalCase.isComprehensive ? (
              <span className="font-bold text-purple-900">
                ⭐ <strong>Comprehensive Case Verified:</strong> Features {dentalCase.disciplines.length} disciplines ({dentalCase.disciplines.join(', ')}). Valid for requirements presentation!
              </span>
            ) : (
              <span className="text-slate-600">
                Current disciplines: <strong className="text-slate-800">{dentalCase.disciplines.join(', ') || 'None'}</strong>. Add procedures from {Math.max(1, 3 - dentalCase.disciplines.length)} more discipline(s) to achieve Comprehensive status.
              </span>
            )}
          </div>

          {/* Quick Add Procedure Button in Header */}
          <button
            onClick={() => setIsAddProcOpen(true)}
            className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Procedure</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CASE AT A GLANCE: INVOLVED TEETH, PROGRESS & WHAT HAPPENS NEXT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Involved Teeth */}
        <div className="frosted-card rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[11px] uppercase font-black tracking-wider text-slate-400 block flex items-center gap-1.5">
            <span>🦷</span>
            <span>Involved Teeth</span>
          </span>
          {involvedTeeth.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {involvedTeeth.map((tooth) => (
                <span
                  key={tooth}
                  className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 font-extrabold text-xs border border-sky-200 shadow-2xs"
                >
                  {tooth}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 pt-1">No teeth associated with current procedures.</p>
          )}
          <p className="text-[11px] text-slate-400">
            {dentalCase.procedures.length} procedure{dentalCase.procedures.length === 1 ? '' : 's'} across {dentalCase.disciplines.length} discipline{dentalCase.disciplines.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Card 2: Overall Progress */}
        <div className="frosted-card rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400 block">
              Overall Case Progress
            </span>
            <span className="text-xs font-black text-slate-900">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-sky-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>{completedSteps.length} of {totalMilestones} Milestones</span>
            <span>{signedRubrics.length}/{allRubrics.length} Rubrics Signed</span>
          </div>
        </div>

        {/* Card 3: What Happens Next */}
        <div className="frosted-card rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2 bg-gradient-to-br from-white to-sky-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-sky-800 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Next Visit & Next Step</span>
            </span>
            <button
              onClick={() => setIsEditingNextVisit(true)}
              className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
            >
              {dentalCase.targetNextVisitDate ? 'Edit' : '+ Schedule'}
            </button>
          </div>

          {dentalCase.targetNextVisitDate ? (
            <div>
              <p className="font-extrabold text-xs text-slate-900">
                📅 {dentalCase.targetNextVisitDate}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 truncate">
                {dentalCase.targetNextVisitPlan || 'Clinical session planned'}
              </p>
            </div>
          ) : nextUpcomingStep ? (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Immediate Milestone:</span>
              <p className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                ⚡ {nextUpcomingStep.title}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No scheduled visit or pending clinical steps.</p>
          )}
        </div>
      </div>

      {/* Next Visit Edit Form (Expandable) */}
      {isEditingNextVisit && (
        <div className="frosted-card rounded-2xl p-4 border border-sky-200 bg-sky-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-sky-600" />
              <span>Plan Next Clinical Session</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingNextVisit(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Date:</label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="neu-input w-full p-2 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Plan / Agenda:</label>
              <input
                type="text"
                value={nextVisitPlan}
                onChange={(e) => setNextVisitPlan(e.target.value)}
                placeholder="e.g. Tooth #14 post cementation & core build-up"
                className="neu-input w-full p-2 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingNextVisit(false)}
              className="px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNextVisit}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PROCEDURES SECTION - CLEAR CARD PER PROCEDURE (LEVEL 2 TO LEVEL 3) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              <span>Procedures ({dentalCase.procedures.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Each procedure owns its associated teeth, milestones, rubrics, and clinical photography. Tap any procedure to open details.
            </p>
          </div>

          <button
            onClick={() => {
              haptic.light();
              setIsAddProcOpen(true);
            }}
            className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Procedure</span>
          </button>
        </div>

        {dentalCase.procedures.length === 0 ? (
          <div className="frosted-card rounded-2xl p-8 text-center border border-dashed border-slate-200">
            <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No clinical procedures added yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by adding a procedure (Fixed, Operative, Endo, Perio, Removable, Surgery).
            </p>
            <button
              onClick={() => {
                haptic.light();
                setIsAddProcOpen(true);
              }}
              className="mt-4 neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add First Procedure</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dentalCase.procedures.map((proc) => {
              const statusInfo = getProcedureMacroStepStatus(proc);
              const teethDisplay = formatTeethDisplay(proc.toothNumber);
              const displayTitle = cleanProcedureTitle(proc.title);

              return (
                <div
                  key={proc.id}
                  onClick={() => {
                    haptic.light();
                    setSelectedProcedureId(proc.id);
                  }}
                  className="frosted-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-sky-300 hover:shadow-md transition active:scale-[0.99] cursor-pointer group select-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Discipline, Title & Associated Teeth (Prominently visually owned by procedure) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                          {proc.discipline}
                        </span>

                        {/* Associated Teeth display: e.g. "UR4 · UR5" */}
                        {teethDisplay ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-200/80 shadow-2xs">
                            <span>🦷</span>
                            <span>{teethDisplay}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            General / Arch
                          </span>
                        )}

                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          {proc.points || 10} pts
                        </span>
                      </div>

                      {/* Procedure Title */}
                      <h4 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition">
                        {displayTitle}
                      </h4>

                      {/* Milestone Summary & Next Step */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-bold text-slate-700">
                          Milestones: {statusInfo.completedCount} of {statusInfo.totalSteps} completed ({statusInfo.percent}%)
                        </span>

                        {statusInfo.nextStep ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                            <ArrowRight className="w-3 h-3" />
                            <span>Next: {statusInfo.nextStep.title}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            <Check className="w-3 h-3" />
                            <span>All Milestones Complete</span>
                          </span>
                        )}

                        <span className="text-slate-400">
                          • {proc.rubrics.length} rubric{proc.rubrics.length === 1 ? '' : 's'} • {proc.evidenceFiles.length} photo{proc.evidenceFiles.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Pill, Open Button & Delete Action */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
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
                        ● {proc.status}
                      </span>

                      {/* Delete Procedure Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.warning();
                          setProcedurePendingDelete({
                            id: proc.id,
                            title: displayTitle,
                            discipline: proc.discipline,
                            toothNumber: teethDisplay,
                          });
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                        title="Delete this procedure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* View Procedure Chevron */}
                      <div className="p-1 text-slate-400 group-hover:text-sky-600 transition">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CASE CLINICAL NOTES SECTION */}
      {/* ========================================================================= */}
      <div className="frosted-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>Overall Case Clinical Notes</span>
          </h4>
          {!isEditingNotes ? (
            <button
              type="button"
              onClick={() => {
                setNotesInput(dentalCase.notes || '');
                setIsEditingNotes(true);
              }}
              className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              {dentalCase.notes ? 'Edit Notes' : '+ Add Notes'}
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
            placeholder="Medical history alerts, allergy notes, treatment plan presentation remarks..."
            className="neu-input w-full p-3 rounded-xl text-xs text-slate-800"
          />
        ) : (
          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
            {dentalCase.notes || 'No overall clinical notes recorded for this patient case.'}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* IN-APP MODAL: CONFIRM DELETE PROCEDURE */}
      {/* ========================================================================= */}
      {procedurePendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-200 animate-modal-pop">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Procedure?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{procedurePendingDelete.title}</strong>
                  {procedurePendingDelete.toothNumber ? ` (${procedurePendingDelete.toothNumber})` : ''} from this case?
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
                <li>You will have an <strong>Undo</strong> option to restore this procedure</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProcedurePendingDelete(null)}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-slate-700 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.error();
                  handleDeleteProcedure(procedurePendingDelete.id);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
              >
                Delete Procedure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP MODAL: CONFIRM DELETE ENTIRE CASE */}
      {/* ========================================================================= */}
      {isDeleteCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-200 animate-modal-pop">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Entire Clinical Case?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Patient: <strong className="text-slate-800">{dentalCase.patientName}</strong> (File #{dentalCase.fileNumber})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 mb-4 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>Removing clinical case:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-700/90 pl-1 space-y-0.5">
                <li>All {dentalCase.procedures.length} procedure(s) and milestone steps will be removed</li>
                <li>All rubric documents and clinical photos will be removed</li>
                <li>You will have an <strong>Undo</strong> window to restore this case immediately</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteCaseModalOpen(false)}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-slate-700 active:scale-95 cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
              >
                Delete Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROCEDURE MODAL */}
      {/* ========================================================================= */}
      {isAddProcOpen && (
        <AddProcedureModal
          isOpen={isAddProcOpen}
          onClose={() => setIsAddProcOpen(false)}
          caseId={dentalCase.id}
          onProcedureAdded={handleProcedureAdded}
          templates={templates}
        />
      )}
    </div>
  );
};
