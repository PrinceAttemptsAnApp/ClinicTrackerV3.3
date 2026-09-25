import { ClinicSession, DentalCase, ClinicalProcedure, ClinicalStep, ClinicPlace } from '../types';
import { getProcedureMacroStepStatus } from './macroSteps';

export interface UpcomingClinicOccurrence {
  occurrenceId: string;
  session: ClinicSession;
  date: string; // YYYY-MM-DD
  dayName: string; // "Saturday"
  formattedDate: string; // "Saturday, Sep 26"
  formattedShortDate: string; // "Sat, Sep 26"
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  clinicPlace: ClinicPlace; // "N"
  discipline: string; // "Fixed Prosthodontics"
  isToday: boolean;
  isTomorrow: boolean;
  daysFromToday: number;
  isRecommended?: boolean;
}

export interface PlannedVisitInfo {
  isPlanned: boolean;
  actionText: string;
  date?: string;
  dayName?: string;
  formattedDate?: string;
  time?: string;
  clinicPlace?: ClinicPlace;
  discipline?: string;
  sessionId?: string;
  procedureId?: string;
  stepId?: string;
  isToday?: boolean;
  isUpcoming?: boolean;
  isPast?: boolean;
  isStale?: boolean; // When referenced session can no longer be verified
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generates concrete chronological calendar occurrences from recurring weekly schedule sessions.
 * Default looks ahead 14 days.
 */
export function getUpcomingClinicOccurrences(
  schedule: ClinicSession[] = [],
  options: { daysAhead?: number; fromDate?: Date; dentalCase?: DentalCase; procedure?: ClinicalProcedure } = {}
): UpcomingClinicOccurrence[] {
  if (!schedule || schedule.length === 0) return [];

  const daysAhead = options.daysAhead || 14;
  const fromDate = options.fromDate || new Date();
  
  // Normalize fromDate to local midnight
  const baseYear = fromDate.getFullYear();
  const baseMonth = fromDate.getMonth();
  const baseDate = fromDate.getDate();
  const todayMidnight = new Date(baseYear, baseMonth, baseDate, 0, 0, 0, 0);

  const occurrences: UpcomingClinicOccurrence[] = [];

  for (let d = 0; d <= daysAhead; d++) {
    const targetDateObj = new Date(todayMidnight);
    targetDateObj.setDate(todayMidnight.getDate() + d);

    const targetDayIndex = targetDateObj.getDay();
    const targetDayName = DAYS_OF_WEEK[targetDayIndex];

    const matchingSessions = schedule.filter(
      (s) => s.dayOfWeek.toLowerCase() === targetDayName.toLowerCase()
    );

    const yyyy = targetDateObj.getFullYear();
    const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const formattedDate = targetDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const formattedShortDate = targetDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    for (const session of matchingSessions) {
      // If today, check if session has already ended
      if (d === 0) {
        const now = new Date();
        const [endHour, endMin] = session.endTime.split(':').map((n) => parseInt(n, 10) || 0);
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const endMins = endHour * 60 + endMin;
        if (currentMins > endMins) {
          // Already passed today
          continue;
        }
      }

      const isRecommended = isSessionRecommended(session, options.dentalCase, options.procedure);

      occurrences.push({
        occurrenceId: `${session.id}_${dateStr}`,
        session,
        date: dateStr,
        dayName: targetDayName,
        formattedDate,
        formattedShortDate,
        startTime: session.startTime,
        endTime: session.endTime,
        clinicPlace: session.clinicPlace,
        discipline: session.discipline,
        isToday: d === 0,
        isTomorrow: d === 1,
        daysFromToday: d,
        isRecommended,
      });
    }
  }

  // Sort chronologically by date and start time
  occurrences.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });

  return occurrences;
}

/**
 * Determines if a session is recommended for a given case / procedure.
 */
export function isSessionRecommended(
  session: ClinicSession,
  dentalCase?: DentalCase,
  procedure?: ClinicalProcedure
): boolean {
  if (!dentalCase && !procedure) return false;

  const discipline = procedure?.discipline || dentalCase?.disciplines[0] || '';
  const clinicPlace = dentalCase?.clinicPlace;

  const sessionDiscLower = (session.discipline || '').toLowerCase();
  const discLower = discipline.toLowerCase();

  // Match discipline keyword
  if (discLower && sessionDiscLower.includes(discLower)) {
    return true;
  }
  if (discLower === 'fixed' && (sessionDiscLower.includes('fixed') || sessionDiscLower.includes('crown') || sessionDiscLower.includes('bridge'))) {
    return true;
  }
  if (discLower === 'operative' && (sessionDiscLower.includes('operative') || sessionDiscLower.includes('restorative'))) {
    return true;
  }
  if (discLower === 'endo' && (sessionDiscLower.includes('endo') || sessionDiscLower.includes('root'))) {
    return true;
  }
  if (discLower === 'removable' && (sessionDiscLower.includes('removable') || sessionDiscLower.includes('prostho') || sessionDiscLower.includes('denture'))) {
    return true;
  }
  if (discLower === 'perio' && (sessionDiscLower.includes('perio') || sessionDiscLower.includes('scaling'))) {
    return true;
  }
  if (discLower === 'oral surgery' && (sessionDiscLower.includes('surgery') || sessionDiscLower.includes('extraction'))) {
    return true;
  }

  // Match clinic place assignment
  if (clinicPlace && session.clinicPlace === clinicPlace) {
    return true;
  }

  return false;
}

/**
 * Derives the next clinical action for a case or specific procedure.
 */
export function getNextActionForCase(
  dentalCase: DentalCase,
  targetProcedureId?: string
): {
  actionTitle: string;
  procedure: ClinicalProcedure | null;
  step: ClinicalStep | null;
} {
  if (!dentalCase.procedures || dentalCase.procedures.length === 0) {
    return { actionTitle: 'General Clinical Session', procedure: null, step: null };
  }

  const targetProc = targetProcedureId
    ? dentalCase.procedures.find((p) => p.id === targetProcedureId)
    : null;

  if (targetProc) {
    const status = getProcedureMacroStepStatus(targetProc);
    if (status.nextStep) {
      return { actionTitle: status.nextStep.title, procedure: targetProc, step: status.nextStep };
    }
    const hasSigned = targetProc.rubrics.some((r) => r.status === 'Signed');
    if (!hasSigned && status.isAllDone) {
      return { actionTitle: 'Get rubric signature', procedure: targetProc, step: null };
    }
    return { actionTitle: `${targetProc.title} follow-up`, procedure: targetProc, step: null };
  }

  // Search across procedures for first uncompleted milestone
  for (const proc of dentalCase.procedures) {
    const status = getProcedureMacroStepStatus(proc);
    if (status.nextStep) {
      return { actionTitle: status.nextStep.title, procedure: proc, step: status.nextStep };
    }
  }

  // Fallback to first procedure
  const firstProc = dentalCase.procedures[0];
  return { actionTitle: firstProc ? `${firstProc.title}` : 'Clinical treatment session', procedure: firstProc || null, step: null };
}

/**
 * Resolves the planned visit status from dentalCase metadata and available schedule.
 */
export function resolvePlannedVisit(
  dentalCase: DentalCase,
  schedule: ClinicSession[] = []
): PlannedVisitInfo {
  const planDate = dentalCase.targetNextVisitDate || dentalCase.plannedSessionDate;
  const planAction = dentalCase.targetNextVisitPlan || dentalCase.plannedAction || '';

  if (!planDate && !planAction && !dentalCase.plannedSessionId) {
    return { isPlanned: false, actionText: '' };
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const isToday = planDate === todayStr;
  const isPast = planDate ? planDate < todayStr : false;
  const isUpcoming = planDate ? planDate >= todayStr : true;

  // Format date if present
  let formattedDate = planDate;
  let dayName: string | undefined;
  if (planDate && /^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
    const [y, m, d] = planDate.split('-').map((num) => parseInt(num, 10));
    const dObj = new Date(y, m - 1, d);
    formattedDate = dObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Look up referenced schedule session if ID or attributes exist
  let matchingSession: ClinicSession | undefined;
  if (dentalCase.plannedSessionId && schedule.length > 0) {
    matchingSession = schedule.find((s) => s.id === dentalCase.plannedSessionId);
  }
  if (!matchingSession && schedule.length > 0 && dayName && dentalCase.plannedSessionClinic) {
    matchingSession = schedule.find(
      (s) => s.dayOfWeek.toLowerCase() === dayName?.toLowerCase() && s.clinicPlace === dentalCase.plannedSessionClinic
    );
  }

  const isStale = Boolean(dentalCase.plannedSessionId && schedule.length > 0 && !matchingSession);

  return {
    isPlanned: true,
    actionText: planAction || 'Clinical session',
    date: planDate,
    dayName: dayName || dentalCase.plannedSessionDay,
    formattedDate,
    time: dentalCase.plannedSessionTime || (matchingSession ? `${matchingSession.startTime}–${matchingSession.endTime}` : undefined),
    clinicPlace: dentalCase.plannedSessionClinic || matchingSession?.clinicPlace || dentalCase.clinicPlace,
    discipline: dentalCase.plannedSessionDiscipline || matchingSession?.discipline,
    sessionId: dentalCase.plannedSessionId,
    procedureId: dentalCase.plannedProcedureId,
    stepId: dentalCase.plannedStepId,
    isToday,
    isUpcoming,
    isPast,
    isStale,
  };
}
