import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  Layers,
  TrendingUp,
  Stethoscope,
  Check
} from 'lucide-react';
import { DentalCase, StudentProfile } from '../types';
import { 
  getPatientInitials, 
  getPatientAvatarTheme, 
  getDisciplineIcon, 
  getDisciplineTheme 
} from '../lib/clinicalVisuals';
import { haptic } from '../lib/haptics';

interface DashboardViewProps {
  cases: DentalCase[];
  profile: StudentProfile;
  activeSemester: string;
  onNavigateToCases: (filter?: string) => void;
  onSelectCase: (caseId: string) => void;
  onNavigateToToday: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  profile,
  activeSemester,
  onNavigateToCases,
  onSelectCase,
  onNavigateToToday,
}) => {
  // Filter cases by active semester
  const semesterCases = cases.filter((c) => c.semester === activeSemester);

  // Compute metrics
  const totalProcedures = semesterCases.flatMap((c) => c.procedures);
  
  // Total acquired points
  const pointsAcquired = totalProcedures
    .filter((p) => p.status === 'Completed' || p.status === 'Signed' || p.status === 'Ready for Moodle' || p.status === 'Submitted')
    .reduce((acc, curr) => acc + (curr.points || 10), 0);

  const pointsTarget = profile.pointsTarget || 200;
  const overallPercent = Math.min(100, Math.round((pointsAcquired / pointsTarget) * 100));

  // Today's clinic progress calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayProcedures = totalProcedures.filter((p) => p.date === todayStr);
  const todaySteps = todayProcedures.flatMap((p) => p.steps);
  const todayStepsCompleted = todaySteps.filter((s) => s.isCompleted).length;
  const todayProgressPercent = todaySteps.length > 0 
    ? Math.round((todayStepsCompleted / todaySteps.length) * 100) 
    : 0;

  // Counts for clickable interactive metric buttons
  const awaitingSignatures = totalProcedures.filter(
    (p) => p.status === 'Awaiting Signature' || p.rubrics.some((r) => r.status === 'Pending')
  ).length;

  const readyForMoodle = totalProcedures.filter(
    (p) => (p.status === 'Ready for Moodle' || (p.status === 'Signed' && p.moodleStatus !== 'Submitted'))
  ).length;

  const fullySubmitted = totalProcedures.filter((p) => p.moodleStatus === 'Submitted').length;
  const comprehensiveCases = semesterCases.filter((c) => c.isComprehensive).length;

  // Discipline breakdown
  const disciplines = ['Fixed', 'Operative', 'Endo', 'Removable', 'Perio', 'Oral Surgery'] as const;
  const disciplineStats = disciplines.map((disc) => {
    const discProcs = totalProcedures.filter((p) => p.discipline === disc);
    const completed = discProcs.filter(
      (p) => p.status === 'Completed' || p.status === 'Signed' || p.status === 'Ready for Moodle' || p.status === 'Submitted'
    ).length;
    const total = discProcs.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: disc, completed, total, pct };
  });

  // Action required items (cases missing signatures or ready for moodle)
  const actionItems: {
    caseId: string;
    patientName: string;
    fileNumber: string;
    discipline?: string;
    type: 'signature' | 'moodle' | 'incomplete';
    message: string;
  }[] = [];

  semesterCases.forEach((c) => {
    c.procedures.forEach((p) => {
      const pendingRubric = p.rubrics.find((r) => r.status === 'Pending');
      if (pendingRubric) {
        actionItems.push({
          caseId: c.id,
          patientName: c.patientName,
          fileNumber: c.fileNumber,
          discipline: p.discipline,
          type: 'signature',
          message: `${p.title}: Instructor signature missing (${pendingRubric.instructorName || 'Rubric'})`,
        });
      } else if (p.status === 'Ready for Moodle' || (p.status === 'Signed' && p.moodleStatus !== 'Submitted')) {
        actionItems.push({
          caseId: c.id,
          patientName: c.patientName,
          fileNumber: c.fileNumber,
          discipline: p.discipline,
          type: 'moodle',
          message: `${p.title}: Signed & ready for Moodle submission`,
        });
      }
    });
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. CLINICAL PROGRESS & POINTS HERO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {activeSemester} Overview
              </span>
              {comprehensiveCases >= 1 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1+ Comprehensive Case Met
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Target: 1 Comprehensive Case Needed
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              Clinical Requirements Progress
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Accumulating points across disciplines · MIU Practical Logbook 2026–2027
            </p>
          </div>

          {/* Points Badge */}
          <div className="px-5 py-3 rounded-2xl flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Points</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono tabular-nums">{pointsAcquired}</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/ {pointsTarget} pts</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-black flex items-center justify-center text-sm border border-sky-200 dark:border-sky-800">
              {overallPercent}%
            </div>
          </div>
        </div>

        {/* Clinical Points Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Overall Clinical Progress</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">{overallPercent}% ({pointsAcquired}/{pointsTarget} pts)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-sky-600 dark:bg-sky-500 transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Today's Clinical Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span>Today&apos;s Chairside Progress</span>
              <span>{todayProgressPercent}% ({todayStepsCompleted}/{todaySteps.length || 0} steps today)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onNavigateToToday();
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Open Today&apos;s Clinic</span>
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Awaiting Signature */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onNavigateToCases('awaiting-signature');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left hover:border-amber-400 dark:hover:border-amber-600 transition shadow-xs cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">{awaitingSignatures}</p>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Missing Signatures</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Physical rubric pending</p>
        </button>

        {/* Ready for Moodle */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onNavigateToCases('ready-moodle');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left hover:border-purple-400 dark:hover:border-purple-600 transition shadow-xs cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">{readyForMoodle}</p>
          <p className="text-xs font-bold text-purple-700 dark:text-purple-400">Ready for Moodle</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Signed & ready to export</p>
        </button>

        {/* Completed / Submitted */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onNavigateToCases('submitted');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left hover:border-emerald-400 dark:hover:border-emerald-600 transition shadow-xs cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">{fullySubmitted}</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Completed & Uploaded</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Verified on Moodle</p>
        </button>

        {/* Comprehensive Cases */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onNavigateToCases('comprehensive');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left hover:border-sky-400 dark:hover:border-sky-600 transition shadow-xs cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">{comprehensiveCases}</p>
          <p className="text-xs font-bold text-sky-700 dark:text-sky-400">Comprehensive Cases</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">3+ disciplines linked</p>
        </button>
      </div>

      {/* 3. ACTION REQUIRED & DISCIPLINE PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Action Required Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Action Required Chairside</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {actionItems.length} items needing attention
            </span>
          </div>

          {actionItems.length > 0 ? (
            <div className="space-y-2">
              {actionItems.slice(0, 6).map((item, idx) => {
                const initials = getPatientInitials(item.patientName);
                const avatarTheme = getPatientAvatarTheme(item.patientName);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      haptic.light();
                      onSelectCase(item.caseId);
                    }}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-sky-400 dark:hover:border-sky-600 transition flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.995]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${avatarTheme.bg} ${avatarTheme.text} border ${avatarTheme.border} font-bold text-[11px] flex items-center justify-center shrink-0`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-sky-600 transition-colors">
                            {item.patientName}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            #{item.fileNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            item.type === 'signature'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                          }`}>
                            {item.type === 'signature' ? 'Signature' : 'Moodle'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          {item.message}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto stroke-[1.8]" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">All signatures & submissions up to date!</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No pending instructor rubrics or unsubmitted Moodle cases.</p>
            </div>
          )}
        </div>

        {/* Discipline / Course Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Disciplines</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{disciplines.length} Areas</span>
          </div>

          <div className="space-y-3 text-xs">
            {disciplineStats.map((stat) => {
              const discTheme = getDisciplineTheme(stat.name);

              return (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={discTheme.accent}>
                        {getDisciplineIcon(stat.name, 'w-3.5 h-3.5')}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{stat.name}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono tabular-nums">
                      {stat.completed}/{stat.total} ({stat.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stat.pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
