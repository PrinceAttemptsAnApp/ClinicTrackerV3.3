import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  User,
  Layers,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import { DentalCase, StudentProfile } from '../types';
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
          type: 'signature',
          message: `${p.title}: Instructor signature missing (${pendingRubric.instructorName || 'Rubric'})`,
        });
      } else if (p.status === 'Ready for Moodle' || (p.status === 'Signed' && p.moodleStatus !== 'Submitted')) {
        actionItems.push({
          caseId: c.id,
          patientName: c.patientName,
          fileNumber: c.fileNumber,
          type: 'moodle',
          message: `${p.title}: Signed & ready for Moodle submission`,
        });
      }
    });
  });

  return (
    <div className="space-y-5">
      {/* Top Clinical Progress & Points Card */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-700 border border-sky-500/30">
                {activeSemester} Overview
              </span>
              {comprehensiveCases >= 1 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1+ Comprehensive Case Met
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                  Target: 1 Comprehensive Case Needed
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-2">
              Clinical Requirements Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accumulating points across disciplines • Monitored for year-end presentation
            </p>
          </div>

          {/* Points Badge */}
          <div className="neu-btn px-5 py-3 rounded-2xl flex items-center gap-4 bg-white/70">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Points</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-sky-600">{pointsAcquired}</span>
                <span className="text-xs font-semibold text-slate-400">/ {pointsTarget} pts</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 font-black flex items-center justify-center text-sm border border-sky-200">
              {overallPercent}%
            </div>
          </div>
        </div>

        {/* Clinical Points Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Overall Clinical Progress</span>
            <span className="text-sky-700 font-bold">{overallPercent}% completed ({pointsAcquired}/{pointsTarget} pts)</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-200/80 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-500 shadow-sm"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Today's Clinical Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <div className="flex justify-between font-semibold text-slate-600 mb-1">
              <span>Today&apos;s Clinic Chairside Progress</span>
              <span>{todayProgressPercent}% ({todayStepsCompleted}/{todaySteps.length || 0} steps today)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              haptic.light();
              onNavigateToToday();
            }}
            className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer flex-shrink-0 active:scale-95"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Open Today&apos;s Clinic</span>
          </button>
        </div>
      </div>

      {/* Interactive Metric Buttons (Clickable filters taking user directly to the list!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Awaiting Signature */}
        <button
          onClick={() => {
            haptic.light();
            onNavigateToCases('awaiting-signature');
          }}
          className="neu-btn p-4 rounded-2xl text-left transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{awaitingSignatures}</p>
          <p className="text-xs font-semibold text-amber-700">Awaiting Signature</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Click to view cases</p>
        </button>

        {/* Ready for Moodle */}
        <button
          onClick={() => {
            haptic.light();
            onNavigateToCases('ready-moodle');
          }}
          className="neu-btn p-4 rounded-2xl text-left transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{readyForMoodle}</p>
          <p className="text-xs font-semibold text-purple-700">Ready for Moodle</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Signed & ready to export</p>
        </button>

        {/* Completed / Submitted */}
        <button
          onClick={() => {
            haptic.light();
            onNavigateToCases('submitted');
          }}
          className="neu-btn p-4 rounded-2xl text-left transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{fullySubmitted}</p>
          <p className="text-xs font-semibold text-emerald-700">Moodle Submitted</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Archived & uploaded</p>
        </button>

        {/* Comprehensive Cases */}
        <button
          onClick={() => {
            haptic.light();
            onNavigateToCases('comprehensive');
          }}
          className="neu-btn p-4 rounded-2xl text-left transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{comprehensiveCases}</p>
          <p className="text-xs font-semibold text-sky-700">Comprehensive Cases</p>
          <p className="text-[10px] text-slate-400 mt-0.5">3+ disciplines combined</p>
        </button>
      </div>

      {/* Action Required List & Discipline Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Action Required Column */}
        <div className="lg:col-span-2 frosted-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Action Required Chairside
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {actionItems.length} items needing attention
            </span>
          </div>

          {actionItems.length > 0 ? (
            <div className="space-y-2">
              {actionItems.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    haptic.light();
                    onSelectCase(item.caseId);
                  }}
                  className="p-3 rounded-xl bg-white/75 border border-slate-200/80 hover:border-sky-300 transition flex items-center justify-between gap-3 cursor-pointer group shadow-2xs active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm">
                      {item.type === 'signature' ? '🟡' : item.type === 'moodle' ? '🟣' : '⚪'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs truncate">
                          {item.patientName}
                        </p>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          #{item.fileNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-white/50 border border-slate-200/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-xs">All signatures and submissions up to date!</p>
              <p className="text-[11px] text-slate-400 mt-1">No overdue clinical rubrics or Moodle uploads pending.</p>
            </div>
          )}
        </div>

        {/* Discipline / Course Progress */}
        <div className="frosted-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              Course Progress
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">{disciplines.length} Courses</span>
          </div>

          <div className="space-y-3 text-xs">
            {disciplineStats.map((stat) => (
              <div key={stat.name} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700 text-[11px]">
                  <span>{stat.name}</span>
                  <span className="text-slate-500">
                    {stat.completed} completed ({stat.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-600 transition-all duration-300"
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
