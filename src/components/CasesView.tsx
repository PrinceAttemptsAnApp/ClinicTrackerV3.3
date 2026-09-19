import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  FileDown, 
  Archive, 
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  PhoneCall,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { DentalCase, ClinicPlace, Semester } from '../types';
import { generateCaseMoodlePDF, exportCaseAsZip } from '../lib/pdfExport';

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
    <div className="space-y-4">
      {/* Top Header & Search Controls */}
      <div className="frosted-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
              Clinical Cases ({activeSemester})
            </h2>
            <p className="text-xs text-slate-500">
              Identified by Patient Name & File # • Comprehensive 3-discipline tracking
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
              onClick={() => setSelectedClinic('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedClinic === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              All Clinics
            </button>
            {CLINICS.map((clinic) => (
              <button
                key={clinic}
                onClick={() => setSelectedClinic(clinic)}
                className={`w-6 h-6 rounded-lg transition cursor-pointer flex items-center justify-center ${
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
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
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

            // Multi-colored Status Styling
            let statusBadge = {
              text: 'In Progress',
              bg: 'bg-sky-100 text-sky-800 border-sky-200',
              barBg: 'bg-sky-500',
            };
            if (c.status === 'Completed' || c.procedures.every((p) => p.moodleStatus === 'Submitted')) {
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
                className="frosted-card rounded-2xl p-4 sm:p-5 hover:shadow-md transition group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Patient Name, File # & Badges */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 font-extrabold flex items-center justify-center border border-sky-500/30 flex-shrink-0 text-sm">
                      {c.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onSelectCase(c.id)}
                          className="text-base font-extrabold text-slate-800 hover:text-sky-600 transition cursor-pointer"
                        >
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
                            Comprehensive Case ({c.disciplines.length} Disciplines)
                          </span>
                        )}
                      </div>

                      {/* Disciplines & Procedures overview */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-400">Procedures:</span>
                        {c.procedures.map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700 text-[11px]"
                          >
                            <strong>{p.discipline}:</strong> {p.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Status */}
                  <div className="flex items-center gap-3 self-end md:self-center">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          generateCaseMoodlePDF(c);
                        }}
                        className="neu-btn p-2 rounded-xl text-slate-600 hover:text-sky-600 cursor-pointer"
                        title="Export Case Moodle PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      {/* Export ZIP */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportCaseAsZip(c);
                        }}
                        className="neu-btn p-2 rounded-xl text-slate-600 hover:text-sky-600 cursor-pointer"
                        title="Export Case as ZIP folder"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      {/* Delete Case */}
                      {onDeleteCase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCasePendingDelete(c);
                          }}
                          className="neu-btn p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={`Delete Case for ${c.patientName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Open details */}
                      <button
                        type="button"
                        onClick={() => onSelectCase(c.id)}
                        className="neu-btn-primary p-2 rounded-xl text-white cursor-pointer"
                        title="Open Case Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Colored Step Progress Bar */}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in zoom-in-95 duration-150">
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
                <span>This action cannot be undone:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-700/90 pl-1 space-y-0.5">
                <li>All {casePendingDelete.procedures.length} procedure(s) will be permanently deleted</li>
                <li>All rubric attachments, signed evaluations, and milestone steps will be lost</li>
                <li>All clinical photo evidence will be purged from the local database</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCasePendingDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCase && casePendingDelete) {
                    onDeleteCase(casePendingDelete.id);
                  }
                  setCasePendingDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Case</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
