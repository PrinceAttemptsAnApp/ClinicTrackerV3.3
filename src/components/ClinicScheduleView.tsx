import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Stethoscope, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  User, 
  ArrowRight, 
  CalendarDays, 
  Settings, 
  FileText, 
  X, 
  Check, 
  Upload,
  CalendarCheck,
  Phone,
  PhoneCall,
  Edit3,
  Building2,
  RefreshCw
} from 'lucide-react';
import { ToothIcon } from '../lib/clinicalVisuals';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { 
  ClinicSession, 
  ClinicPlace, 
  DisciplineType, 
  StudentProfile, 
  DentalCase, 
  ClinicalProcedure, 
  ProcedureTemplate 
} from '../types';
import { SchedulePdfUploader } from './SchedulePdfUploader';
import { PlanNextVisitModal } from './PlanNextVisitModal';
import { ModalPortal } from './ModalPortal';
import { formatTeethDisplay, cleanProcedureTitle, getProcedureMacroStepStatus } from '../lib/macroSteps';
import { resolvePlannedVisit, getNextActionForCase } from '../lib/visitPlanner';
import { haptic } from '../lib/haptics';

interface ClinicScheduleViewProps {
  schedule: ClinicSession[];
  cases?: DentalCase[];
  templates?: ProcedureTemplate[];
  onUpdateSchedule: (newSchedule: ClinicSession[]) => void;
  onUpdateCase?: (updatedCase: DentalCase) => void;
  onNavigateToClinic: (place: ClinicPlace) => void;
  onSelectCase?: (caseId: string) => void;
  onSelectProcedure?: (caseId: string, procedureId: string) => void;
  onOpenAddCaseModal?: () => void;
  profile?: StudentProfile;
  onUpdateProfile?: (profile: StudentProfile) => void;
  onNavigateToSettings?: () => void;
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const WEEKDAY_COLUMNS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type FilterType = 'all' | 'clinic' | 'cases';

export const ClinicScheduleView: React.FC<ClinicScheduleViewProps> = ({
  schedule = [],
  cases = [],
  templates = [],
  onUpdateSchedule,
  onUpdateCase,
  onNavigateToClinic,
  onSelectCase,
  onSelectProcedure,
  onOpenAddCaseModal,
  profile,
  onUpdateProfile,
  onNavigateToSettings,
}) => {
  // Current calendar view month/year
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [today]);

  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [filter, setFilter] = useState<FilterType>('all');

  // Timetable management modal / drawer
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSessionDay, setNewSessionDay] = useState<(typeof DAYS_OF_WEEK)[number]>('Sunday');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('12:30');
  const [newDiscipline, setNewDiscipline] = useState<DisciplineType>('Fixed');
  const [newClinicPlace, setNewClinicPlace] = useState<ClinicPlace>('A');
  const [newNotes, setNewNotes] = useState('');

  // Plan next visit modal target
  const [planVisitTargetCase, setPlanVisitTargetCase] = useState<DentalCase | null>(null);
  const [planTargetProcedure, setPlanTargetProcedure] = useState<ClinicalProcedure | null>(null);
  const [isCasePickerOpen, setIsCasePickerOpen] = useState(false);

  // Google Calendar Integration
  const {
    isConnected: isGCalConnected,
    syncCase: syncGCalCase,
    checkCaseEventStatus: checkGCalEventStatus,
  } = useGoogleCalendar();
  const [syncingCaseId, setSyncingCaseId] = useState<string | null>(null);
  const [gcalToast, setGcalToast] = useState<string | null>(null);

  const handleSyncCase = async (c: DentalCase) => {
    haptic.selection();
    setSyncingCaseId(c.id);
    try {
      const res = await syncGCalCase(c, schedule);
      if (res.success) {
        haptic.success();
        setGcalToast(`✓ Synced ${c.patientName}'s visit to Google Calendar.`);
      } else {
        haptic.warning();
        setGcalToast(res.error || 'Failed to sync with Google Calendar.');
      }
    } catch (err: any) {
      haptic.warning();
      setGcalToast(err.message || 'Sync failed.');
    } finally {
      setSyncingCaseId(null);
      setTimeout(() => setGcalToast(null), 4000);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    haptic.selection();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    haptic.selection();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleGoToToday = () => {
    haptic.selection();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Month title formatted (e.g. "September 2026")
  const monthTitle = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Build the 7-column Month Grid cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Monday column is 0, Sunday is 6:
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    interface CalendarCell {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      dayOfWeekName: string;
      clinicSessions: ClinicSession[];
      plannedCases: {
        dentalCase: DentalCase;
        procedure?: ClinicalProcedure;
        actionText: string;
        isPlannedVisit: boolean;
        isLoggedProc: boolean;
      }[];
    }

    const cells: CalendarCell[] = [];

    // Helper to generate clinical data for a given date
    const buildDayData = (y: number, m: number, d: number, isCur: boolean) => {
      const dateObj = new Date(y, m, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayIndex = dateObj.getDay();
      const dayOfWeekName = DAYS_OF_WEEK[dayIndex];

      // 1. University clinic sessions for this day of week
      const matchingClinicSessions = schedule.filter(
        (s) => s.dayOfWeek.toLowerCase() === dayOfWeekName.toLowerCase()
      );

      // 2. Personal clinical work: planned case visits or procedures logged on this date
      const matchingPlannedCases: CalendarCell['plannedCases'] = [];

      for (const c of cases) {
        const plannedVisit = resolvePlannedVisit(c, schedule);
        const isPlannedForDate = plannedVisit.isPlanned && plannedVisit.date === dateStr;

        if (isPlannedForDate) {
          const matchedProc = plannedVisit.procedureId
            ? c.procedures.find((p) => p.id === plannedVisit.procedureId)
            : c.procedures[0];

          matchingPlannedCases.push({
            dentalCase: c,
            procedure: matchedProc,
            actionText: plannedVisit.actionText || 'Clinical treatment',
            isPlannedVisit: true,
            isLoggedProc: false,
          });
        } else {
          // Check if any procedure was performed / logged on this date
          const procsOnDate = c.procedures.filter((p) => p.date === dateStr);
          for (const p of procsOnDate) {
            matchingPlannedCases.push({
              dentalCase: c,
              procedure: p,
              actionText: cleanProcedureTitle(p.title),
              isPlannedVisit: false,
              isLoggedProc: true,
            });
          }
        }
      }

      return {
        dateStr,
        dayNum: d,
        isCurrentMonth: isCur,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        dayOfWeekName,
        clinicSessions: matchingClinicSessions,
        plannedCases: matchingPlannedCases,
      };
    };

    // 1. Leading days from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push(buildDayData(prevYear, prevMonthIdx, dayNum, false));
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push(buildDayData(viewYear, viewMonth, d, true));
    }

    // 3. Trailing days from next month to complete rows (35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    const targetTotal = cells.length + remaining < 35 ? 35 : cells.length + remaining;
    const trailingNeeded = targetTotal - cells.length;

    for (let d = 1; d <= trailingNeeded; d++) {
      const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push(buildDayData(nextYear, nextMonthIdx, d, false));
    }

    return cells;
  }, [viewYear, viewMonth, todayStr, selectedDateStr, schedule, cases]);

  // Selected cell data
  const selectedCell = useMemo(() => {
    return (
      calendarCells.find((c) => c.dateStr === selectedDateStr) || {
        dateStr: selectedDateStr,
        dayNum: parseInt(selectedDateStr.split('-')[2] || '1', 10),
        isCurrentMonth: true,
        isToday: selectedDateStr === todayStr,
        isSelected: true,
        dayOfWeekName: 'Clinical Day',
        clinicSessions: [],
        plannedCases: [],
      }
    );
  }, [calendarCells, selectedDateStr, todayStr]);

  // Formatted selected date header (e.g. "Saturday, September 12, 2026")
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map((num) => parseInt(num, 10));
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  // Timetable Add Session Handler
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: ClinicSession = {
      id: `sess-${Date.now()}`,
      dayOfWeek: newSessionDay,
      startTime: newStartTime,
      endTime: newEndTime,
      discipline: newDiscipline,
      clinicPlace: newClinicPlace,
      chairCount: 2,
      notes: newNotes.trim(),
    };
    onUpdateSchedule([...schedule, newSession]);
    setIsAddingSession(false);
    setNewNotes('');
    haptic.success();
  };

  const handleDeleteSession = (id: string) => {
    onUpdateSchedule(schedule.filter((s) => s.id !== id));
    haptic.selection();
  };

  const handleScheduleExtracted = (
    newSessions: ClinicSession[],
    meta: {
      fileName: string;
      uploadedAt: string;
      sessionCount: number;
      studentName?: string;
      studentId?: string;
      university?: string;
      faculty?: string;
      semester?: string;
    }
  ) => {
    onUpdateSchedule(newSessions);
    if (profile && onUpdateProfile) {
      const updatedProfile: StudentProfile = {
        ...profile,
        schedulePdfUploaded: true,
        schedulePdfMeta: meta,
      };

      if (meta.studentName && (!profile.studentName || profile.studentName === 'Dental Student')) {
        updatedProfile.studentName = meta.studentName;
      }
      if (meta.studentId && !profile.studentId) {
        updatedProfile.studentId = meta.studentId;
      }
      if (meta.university && (!profile.university || profile.university === 'Dental Faculty')) {
        updatedProfile.university = meta.university;
      }

      onUpdateProfile(updatedProfile);
    }
    haptic.success();
  };

  // Quick Plan Visit for Selected Day
  const handlePlanVisitForDate = (targetCase: DentalCase) => {
    setIsCasePickerOpen(false);
    setPlanVisitTargetCase(targetCase);
    setPlanTargetProcedure(targetCase.procedures[0] || null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MONTH NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Clinical Calendar
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly clinical schedule & planned patient workflows
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Action: Manage Timetable / Timetable Settings */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsTimetableModalOpen(true);
                haptic.selection();
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Manage Weekly Clinic Timetable"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Timetable ({schedule.length})</span>
            </button>

            {onOpenAddCaseModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenAddCaseModal();
                  haptic.selection();
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Navigation & Filter Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month Switcher ‹ Month Year › */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/80 dark:border-slate-800"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white px-2 tracking-tight min-w-[140px] text-center">
              {monthTitle}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/80 dark:border-slate-800"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoToToday}
              className="min-h-[38px] px-3 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800/80 transition cursor-pointer ml-1"
            >
              Today
            </button>
          </div>

          {/* Compact Category Filter */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                haptic.selection();
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('clinic');
                haptic.selection();
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'clinic'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Clinics</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('cases');
                haptic.selection();
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'cases'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ToothIcon className="w-3.5 h-3.5 shrink-0" />
              <span>My Cases</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE 7-COLUMN MONTH CALENDAR GRID */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Weekday Column Headers (Mon ... Sun) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center">
          {WEEKDAY_COLUMNS.map((col, idx) => (
            <div
              key={col}
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
            >
              {col}
            </div>
          ))}
        </div>

        {/* 7-Column Day Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell) => {
            const hasClinic = cell.clinicSessions.length > 0 && filter !== 'cases';
            const hasCases = cell.plannedCases.length > 0 && filter !== 'clinic';
            const totalVisibleEvents = (hasClinic ? cell.clinicSessions.length : 0) + (hasCases ? cell.plannedCases.length : 0);

            // Display events inside cell (up to 2 preview chips)
            const previewItems: { id: string; type: 'clinic' | 'case'; label: string; sub?: string }[] = [];
            
            if (hasClinic) {
              for (const s of cell.clinicSessions) {
                previewItems.push({
                  id: s.id,
                  type: 'clinic',
                  label: `Clinic ${s.clinicPlace}`,
                  sub: s.discipline,
                });
              }
            }
            if (hasCases) {
              for (const pc of cell.plannedCases) {
                const toothStr = pc.procedure?.toothNumber ? formatTeethDisplay(pc.procedure.toothNumber) : '';
                previewItems.push({
                  id: pc.dentalCase.id + (pc.procedure?.id || ''),
                  type: 'case',
                  label: pc.dentalCase.patientName.split(' ')[0],
                  sub: toothStr ? `${cleanProcedureTitle(pc.procedure?.title || '')} · ${toothStr}` : pc.actionText,
                });
              }
            }

            const visibleChips = previewItems.slice(0, 2);
            const extraCount = previewItems.length - visibleChips.length;

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  setSelectedDateStr(cell.dateStr);
                  // If tapping a cell from prev/next month, auto switch month view
                  const [y, m] = cell.dateStr.split('-').map((n) => parseInt(n, 10));
                  if (y !== viewYear || m - 1 !== viewMonth) {
                    setViewYear(y);
                    setViewMonth(m - 1);
                  }
                  haptic.selection();
                }}
                className={`min-h-[72px] sm:min-h-[96px] p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between transition cursor-pointer select-none text-left ${
                  cell.isSelected
                    ? 'ring-2 ring-sky-500 bg-sky-50/60 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-xs'
                    : cell.isToday
                    ? 'bg-white dark:bg-slate-900 border-sky-400 dark:border-sky-600 shadow-2xs'
                    : cell.isCurrentMonth
                    ? 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900 opacity-40 hover:opacity-75'
                }`}
              >
                {/* Cell Header: Day Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm transition ${
                      cell.isToday
                        ? 'w-6 h-6 rounded-full bg-sky-600 text-white font-black flex items-center justify-center shadow-xs'
                        : cell.isSelected
                        ? 'w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black flex items-center justify-center shadow-2xs'
                        : cell.isCurrentMonth
                        ? 'font-bold text-slate-800 dark:text-slate-200 pl-0.5'
                        : 'font-normal text-slate-400 dark:text-slate-600 pl-0.5'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Compact indicator dot if mobile has multiple events */}
                  {totalVisibleEvents > 0 && (
                    <div className="flex items-center gap-0.5 pr-0.5 sm:hidden">
                      {hasClinic && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                      {hasCases && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  )}
                </div>

                {/* Event Chips inside Cell */}
                <div className="mt-1 space-y-1 flex-1 flex flex-col justify-end">
                  {visibleChips.map((chip, idx) => (
                    <div
                      key={chip.id + idx}
                      className={`text-[10px] sm:text-[11px] font-semibold px-1 sm:px-1.5 py-0.5 rounded truncate leading-tight transition flex items-center gap-1 ${
                        chip.type === 'clinic'
                          ? 'bg-sky-100/80 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60'
                          : 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                      }`}
                      title={chip.sub ? `${chip.label} — ${chip.sub}` : chip.label}
                    >
                      {chip.type === 'clinic' ? (
                        <Building2 className="w-2.5 h-2.5 shrink-0 opacity-75" />
                      ) : (
                        <ToothIcon className="w-2.5 h-2.5 shrink-0 opacity-75" />
                      )}
                      <span className="truncate">{chip.label}</span>
                    </div>
                  ))}

                  {extraCount > 0 && (
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-0.5">
                      +{extraCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SELECTED DAY DETAIL VIEW (PROGRESSIVE DISCLOSURE PANEL) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Selected Date Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formattedSelectedDate}
              </h3>
              {selectedCell.isToday && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  TODAY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedCell.clinicSessions.length} clinic duty session(s) · {selectedCell.plannedCases.length} case workflow(s)
            </p>
          </div>

          {/* Quick Plan Button for Selected Date */}
          {cases.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsCasePickerOpen(true);
                haptic.selection();
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800/80 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Plan Case Visit Here</span>
            </button>
          )}
        </div>

        {/* SECTION A: UNIVERSITY CLINIC SCHEDULE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>University Clinic Duty</span>
            </h4>
            <span className="text-[11px] font-medium text-slate-400">
              {selectedCell.dayOfWeekName} Timetable
            </span>
          </div>

          {selectedCell.clinicSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedCell.clinicSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {sess.discipline}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70">
                      Clinic {sess.clinicPlace}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sess.startTime} – {sess.endTime}</span>
                    <span>•</span>
                    <span>2 Chairs Assigned</span>
                  </div>

                  {sess.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {sess.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onNavigateToClinic(sess.clinicPlace)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Open Today&apos;s Clinic (Clinic {sess.clinicPlace}) &rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-400 italic">
              No recurring university clinic duty scheduled on {selectedCell.dayOfWeekName}s.
            </div>
          )}
        </div>

        {/* SECTION B: YOUR CLINICAL WORK (CASES & PROCEDURES) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ToothIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Your Clinical Work & Planned Patients</span>
            </h4>
            <span className="text-[11px] font-medium text-slate-400">
              {selectedCell.plannedCases.length} Patient(s)
            </span>
          </div>

          {selectedCell.plannedCases.length > 0 ? (
            <div className="space-y-2.5">
              {selectedCell.plannedCases.map((item, idx) => {
                const c = item.dentalCase;
                const proc = item.procedure;
                const teethFormatted = proc?.toothNumber ? formatTeethDisplay(proc.toothNumber) : '';
                const procStatus = proc ? getProcedureMacroStepStatus(proc) : null;

                return (
                  <div
                    key={c.id + (proc?.id || '') + idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-2.5 hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    {/* Patient & Clinic Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {c.patientName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            #{c.fileNumber}
                          </span>
                        </div>

                        {/* Procedure and Tooth Info */}
                        {proc && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {cleanProcedureTitle(proc.title)}
                            </span>
                            {teethFormatted && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-sky-600 dark:text-sky-400 font-bold inline-flex items-center gap-1">
                                  <ToothIcon className="w-3 h-3 shrink-0" />
                                  <span>{teethFormatted}</span>
                                </span>
                              </>
                            )}
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-slate-500 dark:text-slate-400">{proc.discipline}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600 shrink-0">
                        Clinic {c.clinicPlace}
                      </span>
                    </div>

                    {/* Planned Clinical Action / Milestone Notice */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-emerald-900 dark:text-emerald-200">
                          {item.actionText}
                        </div>
                        {procStatus && !procStatus.isAllDone && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                            Milestone {procStatus.completedCount + 1} of {procStatus.totalSteps} in progress
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {onSelectCase && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCase(c.id);
                              haptic.selection();
                            }}
                            className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Open Case</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {proc && onSelectProcedure && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProcedure(c.id, proc.id);
                              haptic.selection();
                            }}
                            className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Open Procedure</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Reschedule / Edit Plan */}
                      <button
                        type="button"
                        onClick={() => {
                          setPlanVisitTargetCase(c);
                          setPlanTargetProcedure(proc || null);
                          haptic.selection();
                        }}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Reschedule / Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 italic">
                No patient visits or procedures scheduled for {formattedSelectedDate}.
              </p>
              {cases.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCasePickerOpen(true);
                    haptic.selection();
                  }}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800/60 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Plan a Patient for this Date</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: TIMETABLE & PDF MANAGEMENT */}
      {/* ========================================================================= */}
      <ModalPortal isOpen={isTimetableModalOpen}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  University Timetable Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weekly clinical duties, clinic stations & schedule import
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Uploader / Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <SchedulePdfUploader
                isAlreadyUploaded={Boolean(profile?.schedulePdfUploaded)}
                metadata={profile?.schedulePdfMeta}
                onScheduleExtracted={handleScheduleExtracted}
                variant="schedule"
              />
            </div>

            {/* Add Weekly Session Action */}
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Sessions ({schedule.length})
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingSession(!isAddingSession)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/70 hover:bg-sky-100 transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingSession ? 'Close Form' : 'Add Weekly Session'}</span>
              </button>
            </div>

            {/* Add Session Form */}
            {isAddingSession && (
              <form onSubmit={handleAddSession} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700 space-y-3 text-xs animate-in fade-in">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">New Clinical Session</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                    <select
                      value={newSessionDay}
                      onChange={(e) => setNewSessionDay(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Clinic Place</label>
                    <select
                      value={newClinicPlace}
                      onChange={(e) => setNewClinicPlace(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      {CLINICS.map((c) => (
                        <option key={c} value={c}>Clinic {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Discipline</label>
                    <select
                      value={newDiscipline}
                      onChange={(e) => setNewDiscipline(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Fixed">Fixed Prosthodontics</option>
                      <option value="Operative">Operative Dentistry</option>
                      <option value="Endo">Endodontics</option>
                      <option value="Removable">Removable Prosthodontics</option>
                      <option value="Perio">Periodontics</option>
                      <option value="Oral Surgery">Oral Surgery</option>
                      <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                      <option value="Orthodontics">Orthodontics</option>
                      <option value="Comprehensive Clinic">Comprehensive Clinic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. 2 chairs, bring typodont"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSession(false)}
                    className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold shadow-xs hover:bg-sky-700"
                  >
                    Save Session
                  </button>
                </div>
              </form>
            )}

            {/* List of Recurring Sessions */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {schedule.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {sess.dayOfWeek}
                      </span>
                      <span className="font-bold text-sky-700 dark:text-sky-300">
                        Clinic {sess.clinicPlace}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {sess.discipline}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {sess.startTime} – {sess.endTime} {sess.notes && `• ${sess.notes}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(sess.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ========================================================================= */}
      {/* 5. MODAL: CASE PICKER (TO PLAN VISIT ON SELECTED DATE) */}
      {/* ========================================================================= */}
      <ModalPortal isOpen={isCasePickerOpen}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Select Case for {formattedSelectedDate}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose which active clinical case you want to schedule
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCasePickerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePlanVisitForDate(c)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/30 transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {c.patientName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      File #{c.fileNumber} · Clinic {c.clinicPlace} · {c.procedures.length} procedure(s)
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCasePickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ========================================================================= */}
      {/* 6. MODAL: PLAN NEXT VISIT MODAL */}
      {/* ========================================================================= */}
      {planVisitTargetCase && (
        <PlanNextVisitModal
          isOpen={Boolean(planVisitTargetCase)}
          onClose={() => {
            setPlanVisitTargetCase(null);
            setPlanTargetProcedure(null);
          }}
          dentalCase={planVisitTargetCase}
          schedule={schedule}
          targetProcedure={planTargetProcedure}
          onSavePlan={(updatedCase) => {
            if (onUpdateCase) {
              onUpdateCase(updatedCase);
            }
            setPlanVisitTargetCase(null);
            setPlanTargetProcedure(null);
            haptic.success();
          }}
          onNavigateToSchedule={() => {}}
        />
      )}
    </div>
  );
};
