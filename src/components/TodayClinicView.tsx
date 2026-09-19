import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Camera, 
  Clock, 
  FileCheck2, 
  User, 
  ChevronRight, 
  CalendarDays,
  Sparkles,
  PlusCircle,
  FileText,
  PhoneCall,
  ArrowRight
} from 'lucide-react';
import { DentalCase, ClinicPlace, ClinicalProcedure, ClinicalStep, ProcedureTemplate } from '../types';
import { RubricUploadModal } from './RubricUploadModal';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { AddProcedureModal } from './AddProcedureModal';
import { generateCaseMoodlePDF } from '../lib/pdfExport';
import { getProcedureMacroStepStatus, resolveToothInfo } from '../lib/macroSteps';
import confetti from 'canvas-confetti';

interface TodayClinicViewProps {
  cases: DentalCase[];
  activeClinicPlace: ClinicPlace;
  onChangeClinicPlace: (place: ClinicPlace) => void;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onOpenAddCaseModal: () => void;
  onSelectCase: (caseId: string) => void;
  templates: ProcedureTemplate[];
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];

export const TodayClinicView: React.FC<TodayClinicViewProps> = ({
  cases,
  activeClinicPlace,
  onChangeClinicPlace,
  onUpdateCase,
  onOpenAddCaseModal,
  onSelectCase,
  templates,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [chairMode, setChairMode] = useState<'all' | 'dual'>('dual');
  const [selectedClinicFilter, setSelectedClinicFilter] = useState<ClinicPlace | 'ALL'>('ALL');
  
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

  // Next visit quick modal
  const [nextVisitModalData, setNextVisitModalData] = useState<{
    isOpen: boolean;
    dentalCase: DentalCase | null;
    date: string;
    plan: string;
  }>({ isOpen: false, dentalCase: null, date: '', plan: '' });

  // Filter cases: include all clinics by default!
  const inProgressCases = cases.filter((c) => c.status === 'In Progress');
  const basePool = inProgressCases.length > 0 ? inProgressCases : cases;
  const displayedCases = selectedClinicFilter === 'ALL'
    ? basePool
    : basePool.filter((c) => c.clinicPlace === selectedClinicFilter);

  // Toggle step completion chairside
  const handleToggleStep = (c: DentalCase, procId: string, stepId: string) => {
    const updatedProcedures = c.procedures.map((p) => {
      if (p.id !== procId) return p;
      const updatedSteps = p.steps.map((s) => {
        if (s.id !== stepId) return s;
        const newCompleted = !s.isCompleted;
        if (newCompleted) {
          try {
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
          } catch {}
        }
        return {
          ...s,
          isCompleted: newCompleted,
          completedDate: newCompleted ? selectedDate : undefined,
        };
      });

      // Auto update procedure status
      const allStepsDone = updatedSteps.every((s) => s.isCompleted);
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
    onUpdateCase({
      ...targetCase,
      procedures: updatedProcedures,
    });
  };

  // Save Next Visit Plan
  const handleSaveNextVisit = () => {
    if (!nextVisitModalData.dentalCase) return;
    const updatedCase: DentalCase = {
      ...nextVisitModalData.dentalCase,
      targetNextVisitDate: nextVisitModalData.date,
      targetNextVisitPlan: nextVisitModalData.plan,
    };
    onUpdateCase(updatedCase);
    setNextVisitModalData({ isOpen: false, dentalCase: null, date: '', plan: '' });
  };

  return (
    <div className="space-y-4">
      {/* Clinic & Session Bar */}
      <div className="frosted-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Date & Clinic indicator */}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                Today&apos;s Clinic Session
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-xs font-bold">
                {selectedClinicFilter === 'ALL' ? 'All Clinics' : `Clinic ${selectedClinicFilter}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chairside patient management • Rapid step checkboxes & rubric scanning
            </p>
          </div>

          {/* Right: Date selector, Clinic Place buttons & Add Case */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date input */}
            <div className="flex items-center gap-1.5 neu-input px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-medium cursor-pointer"
              />
            </div>

            {/* Clinic Place Pills (All clinics by default) */}
            <div className="flex items-center gap-1 neu-input p-1 rounded-xl">
              <button
                onClick={() => setSelectedClinicFilter('ALL')}
                className={`px-2.5 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedClinicFilter === 'ALL'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show all clinics by default"
              >
                All
              </button>
              {CLINICS.map((clinic) => (
                <button
                  key={clinic}
                  onClick={() => {
                    setSelectedClinicFilter(clinic);
                    onChangeClinicPlace(clinic);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    selectedClinicFilter === clinic
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Filter by Clinic ${clinic}`}
                >
                  {clinic}
                </button>
              ))}
            </div>

            {/* Chair Mode Toggle (Support having 2 patients at once chairside!) */}
            <div className="hidden sm:flex items-center gap-1 neu-input p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChairMode('dual')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chairMode === 'dual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600'
                }`}
                title="Dual Chair View (2 Patients at once)"
              >
                2 Chairs
              </button>
              <button
                onClick={() => setChairMode('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chairMode === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                All
              </button>
            </div>

            {/* Add Case Button */}
            <button
              onClick={onOpenAddCaseModal}
              className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Patient Cards Section */}
      {displayedCases.length > 0 ? (
        <div
          className={`grid gap-4 ${
            chairMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {displayedCases.slice(0, chairMode === 'dual' ? 2 : displayedCases.length).map((c, index) => {
            const hasNextVisit = c.targetNextVisitPlan || c.targetNextVisitDate;
            return (
              <div key={c.id} className="frosted-card rounded-2xl p-5 relative flex flex-col justify-between">
                {/* Chairside Patient Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center font-black text-sm border border-sky-500/30">
                        {chairMode === 'dual' ? `C${index + 1}` : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => onSelectCase(c.id)}
                            className="text-base font-extrabold text-slate-800 hover:text-sky-600 transition cursor-pointer"
                          >
                            {c.patientName}
                          </h3>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            #{c.fileNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>Clinic {c.clinicPlace}</span>
                          <span>•</span>
                          <span>{c.semester}</span>
                          {c.isComprehensive && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-purple-100 text-purple-800">
                              <Sparkles className="w-3 h-3" /> Comprehensive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Case Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {c.patientPhone && (
                        <a
                          href={`tel:${c.patientPhone.replace(/\s+/g, '')}`}
                          className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 cursor-pointer flex items-center gap-1 transition"
                          title={`Dial patient (${c.patientPhone})`}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                      )}

                      <button
                        onClick={() =>
                          setNextVisitModalData({
                            isOpen: true,
                            dentalCase: c,
                            date: c.targetNextVisitDate || '',
                            plan: c.targetNextVisitPlan || '',
                          })
                        }
                        className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-700 cursor-pointer flex items-center gap-1"
                        title="Plan Next Visit"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                        <span className="hidden sm:inline">Next Visit</span>
                      </button>

                      <button
                        onClick={() => onSelectCase(c.id)}
                        className="neu-btn p-1.5 rounded-xl text-slate-600 hover:text-sky-600 cursor-pointer"
                        title="Open Full Case Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Next Visit Plan Banner if set */}
                  {hasNextVisit && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <div className="truncate">
                        <strong>Next Visit ({c.targetNextVisitDate || 'TBD'}):</strong> {c.targetNextVisitPlan || 'General procedure continuation'}
                      </div>
                    </div>
                  )}

                  {/* Procedures List */}
                  <div className="mt-4 space-y-3">
                    {c.procedures.map((proc) => {
                      const signedRubric = proc.rubrics.find((r) => r.status === 'Signed');
                      const pendingRubric = proc.rubrics.find((r) => r.status === 'Pending');
                      const statusInfo = getProcedureMacroStepStatus(proc);
                      const toothInfo = proc.toothNumber ? resolveToothInfo(proc.toothNumber) : null;

                      return (
                        <div
                          key={proc.id}
                          className="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {toothInfo && toothInfo.isSpecificTooth && (
                                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                    {toothInfo.display}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                                  {proc.discipline}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800">{proc.title}</h4>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                proc.status === 'Submitted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : proc.status === 'Ready for Moodle'
                                  ? 'bg-purple-100 text-purple-800'
                                  : proc.status === 'Awaiting Signature'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {proc.status}
                            </span>
                          </div>

                          {/* Step Reached & Next Step Summary */}
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-bold text-slate-500">Reached:</span>
                              <span className="font-bold text-emerald-700">
                                {statusInfo.reachedStep ? statusInfo.reachedStep.title : 'Not started'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-sky-700">Next:</span>
                              <span className="font-bold text-sky-900">
                                {statusInfo.nextStep ? statusInfo.nextStep.title : 'All Milestones Completed ✓'}
                              </span>
                            </div>

                            {statusInfo.nextStep && (
                              <button
                                type="button"
                                onClick={() => handleToggleStep(c, proc.id, statusInfo.nextStep!.id)}
                                className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer flex items-center gap-1"
                              >
                                <span>Advance: {statusInfo.nextStep.title} ✓</span>
                              </button>
                            )}
                          </div>

                          {/* Chairside Macro Steps Checkboxes */}
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-semibold text-slate-500">Tracked Macro Milestones:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {proc.steps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() => handleToggleStep(c, proc.id, step.id)}
                                  className={`p-2 rounded-xl text-left text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                                    step.isCompleted
                                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/80'
                                      : statusInfo.nextStep?.id === step.id
                                      ? 'bg-sky-50 text-sky-950 border border-sky-400 font-bold'
                                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-white'
                                  }`}
                                >
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{step.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Chairside Action Buttons: Scan Rubric, Add Photo, PDF */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                            {/* Rubric Status */}
                            <div className="text-xs">
                              {signedRubric ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  Signed by {signedRubric.instructorName}
                                </span>
                              ) : pendingRubric ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  Rubric pending signature
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">No rubric attached</span>
                              )}
                            </div>

                            {/* Quick Chairside Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  setRubricModalData({
                                    isOpen: true,
                                    caseId: c.id,
                                    procedure: proc,
                                  })
                                }
                                className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-700 flex items-center gap-1 cursor-pointer"
                                title="Scan & Upload Signed Rubric"
                              >
                                <Camera className="w-3 h-3 text-sky-600" />
                                <span>Scan Rubric</span>
                              </button>

                              <button
                                onClick={() =>
                                  setEvidenceModalData({
                                    isOpen: true,
                                    caseId: c.id,
                                    procedure: proc,
                                  })
                                }
                                className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                                title="Attach X-Ray or Clinical Photo"
                              >
                                <span>📷 Photo / X-Ray</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer of Patient Card: Add Procedure & Export Moodle PDF */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setAddProcModalData({ isOpen: true, caseId: c.id })}
                    className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                    <span>+ Add Procedure</span>
                  </button>

                  <button
                    onClick={() => generateCaseMoodlePDF(c)}
                    className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Generate PDF of all signed rubrics ready for Moodle"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Moodle PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="frosted-card rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {selectedClinicFilter === 'ALL'
              ? 'No active cases in progress across clinics'
              : `No active cases in Clinic ${selectedClinicFilter}`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Receive a patient, tap &ldquo;+ Add Case&rdquo; to input their name and file number, or select another clinic filter above.
          </p>
          <button
            onClick={onOpenAddCaseModal}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Patient Case
          </button>
        </div>
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

      {/* Next Visit Scheduling Modal */}
      {nextVisitModalData.isOpen && nextVisitModalData.dentalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="frosted-card w-full max-w-md rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-800 mb-1">Plan Next Clinical Visit</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set date and what you will do next session for{' '}
              <strong>{nextVisitModalData.dentalCase.patientName}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Next Visit Date</label>
                <input
                  type="date"
                  value={nextVisitModalData.date}
                  onChange={(e) =>
                    setNextVisitModalData({ ...nextVisitModalData, date: e.target.value })
                  }
                  className="neu-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Planned Clinical Procedure
                </label>
                <input
                  type="text"
                  value={nextVisitModalData.plan}
                  onChange={(e) =>
                    setNextVisitModalData({ ...nextVisitModalData, plan: e.target.value })
                  }
                  placeholder="e.g. Secondary impression for lower arch"
                  className="neu-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() =>
                  setNextVisitModalData({ isOpen: false, dentalCase: null, date: '', plan: '' })
                }
                className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNextVisit}
                className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
              >
                Save Next Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
