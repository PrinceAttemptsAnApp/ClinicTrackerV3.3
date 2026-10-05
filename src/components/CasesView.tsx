import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
  Loader2,
  MoreVertical,
  FolderHeart,
  Layers,
  Award
} from 'lucide-react';
import { DentalCase, ClinicPlace, Semester } from '../types';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';
import { ExportToast, ToastMessage } from './ExportToast';
import { 
  formatTeethDisplay, 
  getProcedureMacroStepStatus, 
  cleanProcedureTitle 
} from '../lib/macroSteps';
import { 
  getPatientInitials, 
  getPatientAvatarTheme, 
  getDisciplineIcon, 
  getDisciplineTheme,
  getStatusIcon
} from '../lib/clinicalVisuals';
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
  const [expandedCaseProcedures, setExpandedCaseProcedures] = useState<Record<string, boolean>>({});
  const [activeMenuCaseId, setActiveMenuCaseId] = useState<string | null>(null);
  const [casePendingDelete, setCasePendingDelete] = useState<DentalCase | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Close active dropdown menu when clicking anywhere else
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuCaseId(null);
    };
    if (activeMenuCaseId) {
      window.addEventListener('click', handleDocumentClick);
    }
    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, [activeMenuCaseId]);

  const toggleExpandProcedures = (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    haptic.selection();
    setExpandedCaseProcedures((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const handleExportPdf = async (e: React.MouseEvent, c: DentalCase) => {
    e.stopPropagation();
    setActiveMenuCaseId(null);
    if (exportingKey) return;
    const key = `${c.id}_pdf`;
    setExportingKey(key);
    haptic.selection();
    try {
      const result = await generateCaseMoodlePDF(c);
      if (result.success) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        const message = (isMobile && result.method !== 'download') ? 'PDF ready' : 'PDF downloaded successfully';
        setToast({ id: Date.now().toString(), type: 'success', message });
      }
    } catch (err) {
      console.error('PDF Export error:', err);
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to export PDF report. Please try again.' });
    } finally {
      setExportingKey(null);
    }
  };

  const handleExportZip = async (e: React.MouseEvent, c: DentalCase) => {
    e.stopPropagation();
    setActiveMenuCaseId(null);
    if (exportingKey) return;
    const key = `${c.id}_zip`;
    setExportingKey(key);
    haptic.selection();
    try {
      await exportCaseAsZip(c);
      setToast({ id: Date.now().toString(), type: 'success', message: 'ZIP archive downloaded successfully' });
    } catch (err) {
      console.error('ZIP Export error:', err);
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to export ZIP archive. Please try again.' });
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

    // Search query (Patient Name, File Number, or Discipline)
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
      return c.status === 'Completed' || (c.procedures.length > 0 && c.procedures.every((p) => p.moodleStatus === 'Submitted'));
    }
    if (filterTab === 'comprehensive') {
      return c.isComprehensive;
    }

    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SEARCH CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800/60 shrink-0">
              <FolderHeart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Clinical Cases
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeSemester} · {filteredCases.length} active {filteredCases.length === 1 ? 'patient' : 'patients'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddCaseModal}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm shadow-sky-600/25"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Case</span>
          </button>
        </div>

        {/* Search & Compact Clinic Filter */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white min-h-[42px] focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient name, file #, or discipline..."
              className="w-full bg-transparent border-none outline-none font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Single-Row Compact Clinic Selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 touch-pan-x">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedClinic('all');
              }}
              className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedClinic === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Clinics
            </button>
            {CLINICS.map((clinic) => {
              const isSelected = selectedClinic === clinic;
              return (
                <button
                  key={clinic}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSelectedClinic(clinic);
                  }}
                  className={`min-h-[38px] w-9 rounded-xl text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-2xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {clinic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter Tabs (Single-Row Horizontal Scroll) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x text-xs">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'awaiting-signature', label: 'Awaiting Signatures' },
            { id: 'ready-moodle', label: 'Ready for Moodle' },
            { id: 'submitted', label: 'Completed' },
            { id: 'comprehensive', label: 'Comprehensive ⭐' },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFilterTab(tab.id);
                }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CASE CARDS LIST */}
      {/* ========================================================================= */}
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

            // Next upcoming milestone
            const nextMilestoneProc = c.procedures.find((p) => {
              const status = getProcedureMacroStepStatus(p);
              return status.nextStep !== null;
            });
            const nextUpcomingStep = nextMilestoneProc ? getProcedureMacroStepStatus(nextMilestoneProc).nextStep : null;

            // Patient avatar theme
            const initials = getPatientInitials(c.patientName);
            const avatarTheme = getPatientAvatarTheme(c.patientName);

            // Standard Status Tag & Indicator Styling
            let statusText = 'In Progress';
            let statusStyle = 'text-sky-700 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/70 border-sky-200 dark:border-sky-900';
            let statusDotColor = 'bg-sky-500';
            let progressBarColor = 'bg-sky-500';

            if (c.status === 'Completed' || (c.procedures.length > 0 && c.procedures.every((p) => p.moodleStatus === 'Submitted'))) {
              statusText = 'Completed';
              statusStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900';
              statusDotColor = 'bg-emerald-500';
              progressBarColor = 'bg-emerald-500';
            } else if (
              c.status === 'Finished (Awaiting Signatures)' ||
              c.procedures.some((p) => p.rubrics.some((r) => r.status === 'Pending'))
            ) {
              statusText = 'Missing Signatures';
              statusStyle = 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900';
              statusDotColor = 'bg-amber-500';
              progressBarColor = 'bg-amber-500';
            } else if (c.status === 'Ready for Moodle') {
              statusText = 'Ready for Moodle';
              statusStyle = 'text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/70 border-purple-200 dark:border-purple-900';
              statusDotColor = 'bg-purple-500';
              progressBarColor = 'bg-purple-500';
            }

            const isMenuOpen = activeMenuCaseId === c.id;
            const isProceduresExpanded = Boolean(expandedCaseProcedures[c.id]);
            const visibleProcedures = isProceduresExpanded ? c.procedures : c.procedures.slice(0, 2);
            const remainingCount = c.procedures.length - 2;

            return (
              <div
                key={c.id}
                onClick={() => {
                  haptic.light();
                  onSelectCase(c.id);
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition shadow-xs cursor-pointer group select-none relative space-y-3 active:scale-[0.995]"
              >
                {/* 1. PATIENT IDENTITY HEADER ROW */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Patient Initials Avatar Circle */}
                    <div
                      className={`w-10 h-10 rounded-2xl ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs tracking-tight select-none`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Patient Name */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {c.patientName}
                      </h3>

                      {/* Clean Secondary Metadata with · separators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        <span className="font-mono">#{c.fileNumber}</span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Clinic {c.clinicPlace}</span>
                        {c.isComprehensive && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-0.5">
                              <Award className="w-3 h-3" />
                              <span>Comprehensive</span>
                            </span>
                          </>
                        )}
                        {c.patientPhone && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <a
                              href={`tel:${c.patientPhone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-600 dark:text-slate-300 hover:text-sky-600 font-medium inline-flex items-center gap-1"
                              title={`Call ${c.patientPhone}`}
                            >
                              <PhoneCall className="w-3 h-3 text-slate-400" />
                              <span>{c.patientPhone}</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Tag & 3-Dots Action Menu */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${statusStyle} whitespace-nowrap inline-flex items-center gap-1.5`}>
                      {getStatusIcon(statusText, 'w-3 h-3 shrink-0')}
                      <span>{statusText}</span>
                    </span>

                    {/* Overflow Actions Menu Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.selection();
                          setActiveMenuCaseId(isMenuOpen ? null : c.id);
                        }}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Case options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={(e) => handleExportPdf(e, c)}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            {exportingKey === `${c.id}_pdf` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>Export PDF Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleExportZip(e, c)}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            {exportingKey === `${c.id}_zip` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>Export ZIP Archive</span>
                          </button>

                          {onDeleteCase && (
                            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuCaseId(null);
                                  haptic.warning();
                                  setCasePendingDelete(c);
                                }}
                                className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Case</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors shrink-0" />
                  </div>
                </div>

                {/* 2. CARE SUMMARY: Contextual Procedure Badges with Discipline Icons */}
                <div className="space-y-1.5">
                  {c.procedures.length > 0 ? (
                    <>
                      {visibleProcedures.map((p) => {
                        const pTeeth = formatTeethDisplay(p.toothNumber);
                        const pTitle = cleanProcedureTitle(p.title);
                        const discTheme = getDisciplineTheme(p.discipline);

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className={`p-1 rounded-lg ${discTheme.bg} ${discTheme.text} shrink-0`}>
                                {getDisciplineIcon(p.discipline, 'w-3.5 h-3.5')}
                              </span>
                              <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                <strong className="text-slate-900 dark:text-white font-bold">{p.discipline}:</strong> {pTitle}
                                {pTeeth && <span className="text-sky-600 dark:text-sky-400 font-semibold ml-1">({pTeeth})</span>}
                              </span>
                            </div>

                            <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {p.points || 10} pts
                            </span>
                          </div>
                        );
                      })}

                      {/* Compact "+N more" Disclosure Button */}
                      {remainingCount > 0 && !isProceduresExpanded && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpandProcedures(e, c.id)}
                          className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline pt-0.5 cursor-pointer flex items-center gap-1"
                        >
                          <span>+{remainingCount} more {remainingCount === 1 ? 'procedure' : 'procedures'}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}

                      {isProceduresExpanded && remainingCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpandProcedures(e, c.id)}
                          className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:underline pt-0.5 cursor-pointer flex items-center gap-1"
                        >
                          <span>Show less</span>
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 italic text-xs py-1">No clinical procedures logged yet</p>
                  )}
                </div>

                {/* 3. ATTENTION / NEXT ACTION (Contextual highlight surface) */}
                {(c.targetNextVisitDate || nextUpcomingStep) && (
                  <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/50 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {c.targetNextVisitDate ? (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-sky-900 dark:text-sky-200">Next Visit:</strong> {c.targetNextVisitDate}
                            {c.targetNextVisitPlan && ` · ${c.targetNextVisitPlan}`}
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-sky-900 dark:text-sky-200">Next Milestone:</strong> {nextUpcomingStep?.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. UNIFIED PROGRESS BAR & SUMMARY */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>
                      <strong className="text-slate-900 dark:text-white font-bold tabular-nums">{progressPct}%</strong> complete
                    </span>
                    <span className="font-mono tabular-nums">
                      {signedRubrics}/{allRubrics.length} Rubrics Signed
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressBarColor} transition-all duration-500`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No cases found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No cases match this search. Tap below to add a patient.
            </p>
            <button
              type="button"
              onClick={onOpenAddCaseModal}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Patient Case</span>
            </button>
          </div>
        )}
      </div>

      {/* In-App Delete Case Confirmation Modal */}
      {casePendingDelete && (
        <ModalPortal isOpen={Boolean(casePendingDelete)}>
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/50 space-y-4 animate-modal-pop text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <button
                  type="button"
                  onClick={() => setCasePendingDelete(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Delete this case?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to remove the case for{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">{casePendingDelete.patientName}</strong>{' '}
                  (File #{casePendingDelete.fileNumber})?
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>What will happen:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700/90 dark:text-rose-400/90 pl-1 space-y-0.5">
                  <li>All {casePendingDelete.procedures.length} procedure(s) and milestones will be removed</li>
                  <li>Attached rubrics and photos will be removed</li>
                  <li>You&apos;ll have a few seconds to tap Undo if you change your mind</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCasePendingDelete(null)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
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
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Case</span>
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
