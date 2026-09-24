import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  FileDown, 
  Archive, 
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  PhoneCall,
  Trash2,
  AlertTriangle,
  X,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { DentalCase, ClinicPlace, Semester } from '../types';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';
import { 
  getCaseInvolvedTeeth, 
  formatTeethDisplay, 
  getProcedureMacroStepStatus, 
  cleanProcedureTitle 
} from '../lib/macroSteps';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface CasesViewProps {
  cases: DentalCase[];
  initialFilter?: string;
  activeSemester: Semester;
  onSelectCase: (caseId: string) => void;
  onOpenAddCaseModal: () => void;
  onDeleteCase?: (caseId: string) => void;
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  initialFilter = 'all',
  activeSemester,
  onSelectCase,
  onOpenAddCaseModal,
  onDeleteCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<string>(initialFilter);
  const [casePendingDelete, setCasePendingDelete] = useState<DentalCase | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const handleExportPdf = async (e: React.MouseEvent, c: DentalCase) => {
    e.stopPropagation();
    if (exportingKey) return;
    const key = `${c.id}_pdf`;
    setExportingKey(key);
    haptic.selection();
    try {
      await generateCaseMoodlePDF(c);
    } catch (err) {
      console.error('PDF Export error:', err);
      alert('Failed to export PDF report. Please try again.');
    } finally {
      setExportingKey(null);
    }
  };

  const handleExportZip = async (e: React.MouseEvent, c: DentalCase) => {
    e.stopPropagation();
    if (exportingKey) return;
    const key = `${c.id}_zip`;
    setExportingKey(key);
    haptic.selection();
    try {
      await exportCaseAsZip(c);
    } catch (err) {
      console.error('ZIP Export error:', err);
      alert('Failed to export ZIP archive. Please try again.');
    } finally {
      setExportingKey(null);
    }
  };

  // Filter cases
  const filteredCases = cases.filter((c) => {
    // Semester
    if (c.semester !== activeSemester) return false;

    // Clinic
    if (selectedClinic !== 'all' && c.clinicPlace !== selectedClinic) return false;

    // Search query (Patient Name & File Number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.patientName.toLowerCase().includes(q);
      const matchFile = c.fileNumber.toLowerCase().includes(q);
      const matchDisc = c.disciplines.some((d) => d.toLowerCase().includes(q));
      if (!matchName && !matchFile && !matchDisc) return false;
    }

    // Status Tab filter
    if (filterTab === 'in-progress') {
      return c.status === 'In Progress';
    }
    if (filterTab === 'awaiting-signature') {
      return (
        c.status === 'Finished (Awaiting Signatures)' ||
        c.procedures.some((p) => p.rubrics.some((r) => r.status === 'Pending'))
      );
    }
    if (filterTab === 'ready-moodle') {
      return (
        c.status === 'Ready for Moodle' ||
        c.procedures.some(
          (p) => p.status === 'Ready for Moodle' || (p.status === 'Signed' && p.moodleStatus !== 'Submitted')
        )
      );
    }
    if (filterTab === 'submitted') {
      return c.status === 'Completed' || c.procedures.every((p) => p.moodleStatus === 'Submitted');
    }
    if (filterTab === 'comprehensive') {
      return c.isComprehensive;
    }

    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header & Search Controls */}
      <div className="frosted-card rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Clinical Cases ({activeSemester})
            </h2>
            <p className="text-xs text-slate-500">
              Select any case to open Case Details and manage procedures, milestones, and evaluations.
            </p>
          </div>

          <button
            onClick={onOpenAddCaseModal}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search bar */}
          <div className="neu-input flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name or File # (e.g. Ahmed, 10482)..."
              className="w-full bg-transparent border-none outline-none font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Clinic Place Filter */}
          <div className="flex items-center gap-1 neu-input p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => {
                haptic.selection();
                setSelectedClinic('all');
              }}
              className={`px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer ${
                selectedClinic === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              All Clinics
            </button>
            {CLINICS.map((clinic) => (
              <button
                key={clinic}
                onClick={() => {
                  haptic.selection();
                  setSelectedClinic(clinic);
                }}
                className={`w-6 h-6 rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center ${
                  selectedClinic === clinic ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                {clinic}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'awaiting-signature', label: 'Awaiting Signatures 🟡' },
            { id: 'ready-moodle', label: 'Ready for Moodle 🟣' },
            { id: 'submitted', label: 'Completed / Submitted 🟢' },
            { id: 'comprehensive', label: 'Comprehensive Cases ⭐' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                haptic.selection();
                setFilterTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition active:scale-95 cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'neu-btn text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredCases.length > 0 ? (
          filteredCases.map((c) => {
            // Compute procedure steps counts
            const allSteps = c.procedures.flatMap((p) => p.steps);
            const completedSteps = allSteps.filter((s) => s.isCompleted).length;
            const progressPct = allSteps.length > 0 ? Math.round((completedSteps / allSteps.length) * 100) : 0;

            // Rubrics count
            const allRubrics = c.procedures.flatMap((p) => p.rubrics);
            const signedRubrics = allRubrics.filter((r) => r.status === 'Signed').length;

            // Involved teeth across this case
            const involvedTeeth = getCaseInvolvedTeeth(c.procedures);

            // Find next immediate milestone across procedures
            const nextMilestoneProc = c.procedures.find((p) => {
              const status = getProcedureMacroStepStatus(p);
              return status.nextStep !== null;
            });
            const nextUpcomingStep = nextMilestoneProc ? getProcedureMacroStepStatus(nextMilestoneProc).nextStep : null;

            // Multi-colored Status Styling
            let statusBadge = {
              text: 'In Progress',
              bg: 'bg-sky-100 text-sky-800 border-sky-200',
              barBg: 'bg-sky-500',
            };
            if (c.status === 'Completed' || (c.procedures.length > 0 && c.procedures.every((p) => p.moodleStatus === 'Submitted'))) {
              statusBadge = {
                text: 'Completed & Submitted',
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                barBg: 'bg-emerald-500',
              };
            } else if (
              c.status === 'Finished (Awaiting Signatures)' ||
              c.procedures.some((p) => p.rubrics.some((r) => r.status === 'Pending'))
            ) {
              statusBadge = {
                text: 'Missing Signatures',
                bg: 'bg-amber-100 text-amber-900 border-amber-300',
                barBg: 'bg-amber-500',
              };
            } else if (c.status === 'Ready for Moodle') {
              statusBadge = {
                text: 'Ready for Moodle',
                bg: 'bg-purple-100 text-purple-800 border-purple-200',
                barBg: 'bg-purple-500',
              };
            }

            return (
              <div
                key={c.id}
                onClick={() => {
                  haptic.light();
                  onSelectCase(c.id);
                }}
                className="frosted-card rounded-2xl p-4 sm:p-5 hover:shadow-md transition active:scale-[0.99] group border border-slate-200/80 cursor-pointer select-none"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Patient Name, File # & Badges */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 font-extrabold flex items-center justify-center border border-sky-500/30 flex-shrink-0 text-sm">
                      {c.patientName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition">
                          {c.patientName}
                        </h3>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          #{c.fileNumber}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Clinic {c.clinicPlace}
                        </span>

                        {c.patientPhone && (
                          <a
                            href={`tel:${c.patientPhone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer"
                            title={`Dial patient (${c.patientPhone})`}
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>{c.patientPhone}</span>
                          </a>
                        )}

                        {c.isComprehensive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Comprehensive ({c.disciplines.length} Disciplines)
                          </span>
                        )}

                        {c.isDemo && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Demo Case
                          </span>
                        )}
                      </div>

                      {/* Involved Teeth & Procedures Summary */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {/* Involved teeth chips */}
                        {involvedTeeth.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Teeth:</span>
                            <span className="font-extrabold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md text-[11px]">
                              🦷 {involvedTeeth.join(' · ')}
                            </span>
                          </div>
                        )}

                        {/* Procedures list with their teeth */}
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                          <span className="font-medium text-slate-400">Procedures:</span>
                          {c.procedures.length > 0 ? (
                            c.procedures.map((p) => {
                              const pTeeth = formatTeethDisplay(p.toothNumber);
                              const pTitle = cleanProcedureTitle(p.title);
                              return (
                                <span
                                  key={p.id}
                                  className="px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-slate-700 text-[11px] shadow-2xs"
                                >
                                  <strong>{p.discipline}:</strong> {pTitle}
                                  {pTeeth && <span className="text-sky-700 font-bold ml-1">({pTeeth})</span>}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No procedures logged</span>
                          )}
                        </div>
                      </div>

                      {/* Next Visit / Next Action Row */}
                      <div className="mt-2 text-xs flex flex-wrap items-center gap-2 text-slate-500">
                        {c.targetNextVisitDate ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/70">
                            <Calendar className="w-3 h-3 text-sky-600" />
                            <span>Next Visit: {c.targetNextVisitDate} {c.targetNextVisitPlan && `• ${c.targetNextVisitPlan}`}</span>
                          </span>
                        ) : nextUpcomingStep ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <ArrowRight className="w-3 h-3 text-sky-600" />
                            <span>Next Milestone: {nextUpcomingStep.title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No pending visit scheduled</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress, Status & Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                      >
                        {statusBadge.text}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {signedRubrics}/{allRubrics.length} Rubrics Signed • {progressPct}% Steps
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Export PDF */}
                      <button
                        type="button"
                        disabled={Boolean(exportingKey)}
                        onClick={(e) => handleExportPdf(e, c)}
                        className="neu-btn p-2 rounded-xl text-slate-600 hover:text-sky-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Export Case Moodle PDF"
                      >
                        {exportingKey === `${c.id}_pdf` ? (
                          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                      </button>

                      {/* Export ZIP */}
                      <button
                        type="button"
                        disabled={Boolean(exportingKey)}
                        onClick={(e) => handleExportZip(e, c)}
                        className="neu-btn p-2 rounded-xl text-slate-600 hover:text-sky-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Export Case as ZIP folder"
                      >
                        {exportingKey === `${c.id}_zip` ? (
                          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete Case */}
                      {onDeleteCase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.warning();
                            setCasePendingDelete(c);
                          }}
                          className="neu-btn p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                          title={`Delete Case for ${c.patientName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Open details arrow */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          onSelectCase(c.id);
                        }}
                        className="neu-btn-primary p-2 rounded-xl text-white cursor-pointer active:scale-95"
                        title="Open Case Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step Progress Bar */}
                <div className="mt-3 w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusBadge.barBg} transition-all duration-500`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="frosted-card rounded-2xl p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No cases found</h3>
            <p className="text-xs text-slate-500">
              No matching clinical cases found with the current search query or filter.
            </p>
          </div>
        )}
      </div>

      {/* In-App Delete Case Confirmation Modal */}
      {casePendingDelete && (
        <ModalPortal isOpen={Boolean(casePendingDelete)}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-modal-pop">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => setCasePendingDelete(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Delete Clinical Case?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to permanently delete the case for{' '}
                <strong className="text-slate-900 font-bold">{casePendingDelete.patientName}</strong>{' '}
                (File #{casePendingDelete.fileNumber}, Clinic {casePendingDelete.clinicPlace})?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>Removing clinical case:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-700/90 pl-1 space-y-0.5">
                <li>All {casePendingDelete.procedures.length} procedure(s) and milestone steps will be removed</li>
                <li>All rubric attachments and clinical photos will be removed</li>
                <li>You will have an <strong>Undo</strong> window to restore this case if deleted by mistake</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCasePendingDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.error();
                  if (onDeleteCase && casePendingDelete) {
                    onDeleteCase(casePendingDelete.id);
                  }
                  setCasePendingDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Case</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
  );
};
