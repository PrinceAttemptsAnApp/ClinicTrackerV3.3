import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Briefcase, 
  FileText, 
  Calendar, 
  Settings, 
  Plus, 
  Sparkles,
  Award
} from 'lucide-react';
import { 
  DentalCase, 
  ClinicalProcedure,
  ClinicPlace, 
  Semester, 
  StudentProfile, 
  ClinicSession, 
  ProcedureTemplate 
} from './types';
import { 
  getAllCases, 
  saveCase, 
  deleteCase as removeCaseFromDb, 
  restoreCase,
  deleteProcedureFromCase,
  restoreProcedureToCase,
  getStudentProfile, 
  saveStudentProfile, 
  getClinicSchedule, 
  saveClinicSchedule, 
  getProcedureTemplates,
  DEFAULT_TEMPLATES,
  safeLocalStorage,
  initStorage
} from './lib/storage';
import { haptic } from './lib/haptics';

import { HeaderBar } from './components/HeaderBar';
import { PrivacyBanner } from './components/PrivacyBanner';
import { TutorialModal } from './components/TutorialModal';
import { FirstTimeNameModal } from './components/FirstTimeNameModal';
import { AddCaseModal } from './components/AddCaseModal';
import { DashboardView } from './components/DashboardView';
import { TodayClinicView } from './components/TodayClinicView';
import { CasesView } from './components/CasesView';
import { CaseDetailView } from './components/CaseDetailView';
import { DocumentsArchiveView } from './components/DocumentsArchiveView';
import { ClinicScheduleView } from './components/ClinicScheduleView';
import { SettingsView } from './components/SettingsView';
import { UndoSnackbar, UndoNotification } from './components/UndoSnackbar';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'today' | 'cases' | 'case-detail' | 'documents' | 'schedule' | 'settings'
  >('dashboard');
  const [casesFilter, setCasesFilter] = useState<string>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // App Data State
  const [cases, setCases] = useState<DentalCase[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    studentName: '',
    academicYear: '2026–2027',
    currentSemester: 'Semester 1',
    pointsTarget: 200,
    toothNotation: 'palmer',
  });
  const [schedule, setSchedule] = useState<ClinicSession[]>([]);
  const [templates, setTemplates] = useState<ProcedureTemplate[]>(DEFAULT_TEMPLATES);
  const [activeClinicPlace, setActiveClinicPlace] = useState<ClinicPlace>('A');
  const [activeSemester, setActiveSemester] = useState<Semester>('Semester 1');

  // Modals & Startup State
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Undo System State
  const [undoNotification, setUndoNotification] = useState<UndoNotification | null>(null);
  const pendingCaseDeletionsRef = useRef<Map<string, { timer: NodeJS.Timeout; snapshot: DentalCase }>>(new Map());
  const pendingProcedureDeletionsRef = useRef<Map<string, { timer: NodeJS.Timeout; caseId: string; snapshot: ClinicalProcedure }>>(new Map());

  // Flush any pending deletions on unmount so data is cleanly committed
  useEffect(() => {
    return () => {
      pendingCaseDeletionsRef.current.forEach(({ timer, snapshot }) => {
        clearTimeout(timer);
        removeCaseFromDb(snapshot.id);
      });
      pendingProcedureDeletionsRef.current.forEach(({ timer, caseId, snapshot }) => {
        clearTimeout(timer);
        deleteProcedureFromCase(caseId, snapshot.id);
      });
    };
  }, []);

  // Reload clinical data into React state without re-evaluating startup modals
  const refreshData = useCallback(async () => {
    try {
      const [dbCases, dbProfile, dbSchedule, dbTemplates] = await Promise.all([
        getAllCases(),
        getStudentProfile(),
        getClinicSchedule(),
        getProcedureTemplates(),
      ]);
      setCases(dbCases);
      if (dbProfile) {
        setProfile(dbProfile);
        setActiveSemester(dbProfile.currentSemester || 'Semester 1');
      }
      if (dbSchedule.length > 0) setSchedule(dbSchedule);
      if (dbTemplates.length > 0) setTemplates(dbTemplates);
    } catch (err) {
      console.error('Failed to reload clinical data from IndexedDB', err);
    }
  }, []);

  // Single authoritative startup session flow
  const initAppSession = useCallback(async () => {
    try {
      setLoading(true);
      await initStorage();

      const [dbCases, dbProfile, dbSchedule, dbTemplates] = await Promise.all([
        getAllCases(),
        getStudentProfile(),
        getClinicSchedule(),
        getProcedureTemplates(),
      ]);

      setCases(dbCases);
      if (dbSchedule.length > 0) setSchedule(dbSchedule);
      if (dbTemplates.length > 0) setTemplates(dbTemplates);

      const activeProfile = dbProfile || {
        studentName: '',
        academicYear: '2026–2027',
        currentSemester: 'Semester 1',
        pointsTarget: 200,
        toothNotation: 'palmer',
      };
      setProfile(activeProfile);
      setActiveSemester(activeProfile.currentSemester || 'Semester 1');

      // Authoritative evaluation:
      const hasName = Boolean(activeProfile.studentName && activeProfile.studentName.trim().length > 0);
      const isOnboardingComplete = Boolean(
        activeProfile.onboardingCompleted ||
        safeLocalStorage.getItem('dentatrack_onboarding_completed') === 'true' ||
        safeLocalStorage.getItem('dentatrack_tutorial_shown') === 'true'
      );

      if (!hasName) {
        // Step 1: Prompt for name first. Do NOT open tutorial yet.
        setIsNameModalOpen(true);
        setIsTutorialOpen(false);
      } else if (!isOnboardingComplete) {
        // Step 2: Name exists but onboarding guide not completed yet
        setIsNameModalOpen(false);
        setIsTutorialOpen(true);
      } else {
        // Step 3: Returning user ready to work
        setIsNameModalOpen(false);
        setIsTutorialOpen(false);
      }
    } catch (err) {
      console.error('Failed to initialize app session', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAppSession();
  }, [initAppSession]);

  const handleSaveFirstTimeName = async (name: string) => {
    const trimmed = name.trim();
    const updated: StudentProfile = {
      ...profile,
      studentName: trimmed,
    };
    setProfile(updated);
    await saveStudentProfile(updated);
    safeLocalStorage.setItem('dentatrack_student_name', trimmed);

    // Dismiss name modal
    setIsNameModalOpen(false);

    // Transition cleanly to onboarding guide if not already completed
    const isOnboardingComplete = Boolean(
      updated.onboardingCompleted ||
      safeLocalStorage.getItem('dentatrack_onboarding_completed') === 'true' ||
      safeLocalStorage.getItem('dentatrack_tutorial_shown') === 'true'
    );

    if (!isOnboardingComplete) {
      setIsTutorialOpen(true);
    }
  };

  const handleCloseTutorial = async () => {
    setIsTutorialOpen(false);
    safeLocalStorage.setItem('dentatrack_onboarding_completed', 'true');
    safeLocalStorage.setItem('dentatrack_tutorial_shown', 'true');
    if (!profile.onboardingCompleted) {
      const updated: StudentProfile = {
        ...profile,
        onboardingCompleted: true,
      };
      setProfile(updated);
      await saveStudentProfile(updated);
    }
  };

  // Handle Case Update
  const handleUpdateCase = async (updatedCase: DentalCase) => {
    // Optimistic state update
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    await saveCase(updatedCase);
  };

  // Handle Case Creation
  const handleCaseCreated = async (newCase: DentalCase) => {
    setCases((prev) => [newCase, ...prev]);
    await saveCase(newCase);
    setSelectedCaseId(newCase.id);
    setActiveTab('case-detail');
  };

  // Handle Case Deletion with Undo
  const handleDeleteCase = (caseId: string) => {
    // 1. Locate case snapshot before removing
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    // Deep clone snapshot so it cannot be mutated
    const caseSnapshot: DentalCase = JSON.parse(JSON.stringify(targetCase));

    // 2. Clear any active undo notification and commit previous pending deletion immediately
    if (undoNotification) {
      if (undoNotification.type === 'case') {
        const prevPending = pendingCaseDeletionsRef.current.get(undoNotification.id);
        if (prevPending) {
          clearTimeout(prevPending.timer);
          removeCaseFromDb(prevPending.snapshot.id);
          pendingCaseDeletionsRef.current.delete(undoNotification.id);
        }
      } else if (undoNotification.type === 'procedure') {
        const prevPending = pendingProcedureDeletionsRef.current.get(undoNotification.id);
        if (prevPending) {
          clearTimeout(prevPending.timer);
          deleteProcedureFromCase(prevPending.caseId, prevPending.snapshot.id);
          pendingProcedureDeletionsRef.current.delete(undoNotification.id);
        }
      }
    }

    // 3. Immediately update UI (optimistic deletion)
    setCases((prev) => prev.filter((c) => c.id !== caseId));
    if (selectedCaseId === caseId) {
      setSelectedCaseId(null);
      setActiveTab('cases');
    }

    // 4. Schedule IndexedDB deletion after 6.5s window
    const timer = setTimeout(async () => {
      try {
        await removeCaseFromDb(caseId);
      } catch (err) {
        console.error('Error committing case deletion to IndexedDB:', err);
      } finally {
        pendingCaseDeletionsRef.current.delete(caseId);
      }
    }, 6500);

    pendingCaseDeletionsRef.current.set(caseId, { timer, snapshot: caseSnapshot });

    // 5. Present the Undo notification
    setUndoNotification({
      id: caseId,
      type: 'case',
      title: caseSnapshot.patientName || `Case #${caseSnapshot.fileNumber}`,
      subtitle: `Patient: ${caseSnapshot.patientName} (${caseSnapshot.procedures.length} procedure${caseSnapshot.procedures.length === 1 ? '' : 's'})`,
      snapshot: caseSnapshot,
      durationMs: 6500,
    });
  };

  // Handle Procedure Deletion with Undo
  const handleDeleteProcedure = (procId: string, snapshot?: ClinicalProcedure) => {
    // Determine procedure and its parent case
    let targetProcedure = snapshot;
    let parentCase = selectedCaseId ? cases.find((c) => c.id === selectedCaseId) : undefined;

    if (!parentCase) {
      // Search all cases if not in selectedCaseId
      parentCase = cases.find((c) => c.procedures.some((p) => p.id === procId));
    }

    if (!parentCase) return;

    if (!targetProcedure) {
      targetProcedure = parentCase.procedures.find((p) => p.id === procId);
    }

    if (!targetProcedure) return;

    // Deep clone snapshot
    const procedureSnapshot: ClinicalProcedure = JSON.parse(JSON.stringify(targetProcedure));
    const targetCaseId = parentCase.id;

    // Clear any previous undo notification and finalize its pending deletion
    if (undoNotification) {
      if (undoNotification.type === 'case') {
        const prevPending = pendingCaseDeletionsRef.current.get(undoNotification.id);
        if (prevPending) {
          clearTimeout(prevPending.timer);
          removeCaseFromDb(prevPending.snapshot.id);
          pendingCaseDeletionsRef.current.delete(undoNotification.id);
        }
      } else if (undoNotification.type === 'procedure') {
        const prevPending = pendingProcedureDeletionsRef.current.get(undoNotification.id);
        if (prevPending) {
          clearTimeout(prevPending.timer);
          deleteProcedureFromCase(prevPending.caseId, prevPending.snapshot.id);
          pendingProcedureDeletionsRef.current.delete(undoNotification.id);
        }
      }
    }

    // Immediately remove from parent case in memory
    const updatedProcedures = parentCase.procedures.filter((p) => p.id !== procId);
    const updatedCase: DentalCase = {
      ...parentCase,
      procedures: updatedProcedures,
      disciplines: Array.from(new Set(updatedProcedures.map((p) => p.discipline))),
    };

    setCases((prev) => prev.map((c) => (c.id === targetCaseId ? updatedCase : c)));

    // Schedule IndexedDB deletion after 6.5s window
    const timer = setTimeout(async () => {
      try {
        await deleteProcedureFromCase(targetCaseId, procId);
      } catch (err) {
        console.error('Error committing procedure deletion to IndexedDB:', err);
      } finally {
        pendingProcedureDeletionsRef.current.delete(procId);
      }
    }, 6500);

    pendingProcedureDeletionsRef.current.set(procId, {
      timer,
      caseId: targetCaseId,
      snapshot: procedureSnapshot,
    });

    // Present the Undo notification
    setUndoNotification({
      id: procId,
      type: 'procedure',
      title: procedureSnapshot.title,
      subtitle: `${procedureSnapshot.discipline}${procedureSnapshot.toothNumber ? ` • Tooth #${procedureSnapshot.toothNumber}` : ''}`,
      snapshot: procedureSnapshot,
      caseId: targetCaseId,
      durationMs: 6500,
    });
  };

  // Perform Undo Restoration
  const handleUndo = async () => {
    if (!undoNotification) return;

    haptic.success();

    if (undoNotification.type === 'case') {
      const pending = pendingCaseDeletionsRef.current.get(undoNotification.id);
      const caseToRestore: DentalCase = undoNotification.snapshot as DentalCase;

      if (pending) {
        clearTimeout(pending.timer);
        pendingCaseDeletionsRef.current.delete(undoNotification.id);
      }

      // 1. Immediately restore to UI state
      setCases((prev) => {
        const exists = prev.some((c) => c.id === caseToRestore.id);
        if (exists) return prev;
        return [caseToRestore, ...prev];
      });

      // 2. Persist cleanly back into IndexedDB
      try {
        await restoreCase(caseToRestore);
      } catch (err) {
        console.error('Failed to restore case in IndexedDB:', err);
      }
    } else if (undoNotification.type === 'procedure') {
      const pending = pendingProcedureDeletionsRef.current.get(undoNotification.id);
      const procToRestore: ClinicalProcedure = undoNotification.snapshot as ClinicalProcedure;
      const targetCaseId = undoNotification.caseId || (pending ? pending.caseId : undefined);

      if (pending) {
        clearTimeout(pending.timer);
        pendingProcedureDeletionsRef.current.delete(undoNotification.id);
      }

      if (targetCaseId) {
        // 1. Restore to UI state
        setCases((prev) =>
          prev.map((c) => {
            if (c.id !== targetCaseId) return c;
            const exists = c.procedures.some((p) => p.id === procToRestore.id);
            if (exists) return c;
            const updatedProcs = [...c.procedures, procToRestore];
            return {
              ...c,
              procedures: updatedProcs,
              disciplines: Array.from(new Set(updatedProcs.map((p) => p.discipline))),
            };
          })
        );

        // 2. Persist to IndexedDB
        try {
          await restoreProcedureToCase(targetCaseId, procToRestore);
        } catch (err) {
          console.error('Failed to restore procedure in IndexedDB:', err);
        }
      }
    }

    setUndoNotification(null);
  };

  // Dismiss Undo snackbar without waiting (or when time expires)
  const handleDismissUndo = () => {
    if (!undoNotification) return;

    // Immediately commit the pending deletion in IndexedDB
    if (undoNotification.type === 'case') {
      const pending = pendingCaseDeletionsRef.current.get(undoNotification.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingCaseDeletionsRef.current.delete(undoNotification.id);
        removeCaseFromDb(undoNotification.id).catch(console.error);
      }
    } else if (undoNotification.type === 'procedure') {
      const pending = pendingProcedureDeletionsRef.current.get(undoNotification.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingProcedureDeletionsRef.current.delete(undoNotification.id);
        deleteProcedureFromCase(pending.caseId, undoNotification.id).catch(console.error);
      }
    }

    setUndoNotification(null);
  };

  // Handle Profile Update
  const handleUpdateProfile = async (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile);
    await saveStudentProfile(updatedProfile);
  };

  // Handle Schedule Update
  const handleUpdateSchedule = async (newSchedule: ClinicSession[]) => {
    setSchedule(newSchedule);
    await saveClinicSchedule(newSchedule);
  };

  // Switch Semester
  const handleSemesterChange = (sem: Semester) => {
    setActiveSemester(sem);
    const updated = { ...profile, currentSemester: sem };
    setProfile(updated);
    saveStudentProfile(updated);
  };

  // Selected case
  const currentCase = cases.find((c) => c.id === selectedCaseId);

  // Navigation Items
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today', label: "Today's Clinic", icon: Stethoscope },
    { id: 'cases', label: 'Cases', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-6">
      {/* Top Header Bar */}
      <HeaderBar
        profile={profile}
        activeSemester={activeSemester}
        onSemesterChange={handleSemesterChange}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* High-Contrast Non-Obnoxious Privacy Banner */}
      <PrivacyBanner />

      {/* Main Layout Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0">
          <div className="frosted-glass rounded-2xl p-3 border border-white/60 sticky top-20 space-y-1.5 shadow-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'cases' && activeTab === 'case-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    haptic.selection();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Quick Add Case Action in Sidebar */}
            <div className="pt-3 mt-3 border-t border-slate-200/70">
              <button
                onClick={() => setIsAddCaseModalOpen(true)}
                className="w-full neu-btn-primary py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Clinic Case</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Views */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="frosted-card rounded-2xl p-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto mb-3" />
              Loading 5th-Year Clinical Database...
            </div>
          ) : (
            <div key={activeTab + (activeTab === 'case-detail' ? `-${selectedCaseId}` : '')} className="animate-view-enter">
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  cases={cases}
                  profile={profile}
                  activeSemester={activeSemester}
                  onNavigateToCases={(filter) => {
                    setCasesFilter(filter || 'all');
                    setActiveTab('cases');
                  }}
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveTab('case-detail');
                  }}
                  onNavigateToToday={() => setActiveTab('today')}
                />
              )}

              {/* Today's Clinic Session View */}
              {activeTab === 'today' && (
                <TodayClinicView
                  cases={cases}
                  activeClinicPlace={activeClinicPlace}
                  onChangeClinicPlace={setActiveClinicPlace}
                  onUpdateCase={handleUpdateCase}
                  onOpenAddCaseModal={() => setIsAddCaseModalOpen(true)}
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveTab('case-detail');
                  }}
                  templates={templates}
                />
              )}

              {/* Cases List View */}
              {activeTab === 'cases' && (
                <CasesView
                  cases={cases}
                  initialFilter={casesFilter}
                  activeSemester={activeSemester}
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveTab('case-detail');
                  }}
                  onOpenAddCaseModal={() => setIsAddCaseModalOpen(true)}
                  onDeleteCase={handleDeleteCase}
                />
              )}

              {/* Dedicated Case Detail View */}
              {activeTab === 'case-detail' && currentCase && (
                <CaseDetailView
                  dentalCase={currentCase}
                  onBack={() => setActiveTab('cases')}
                  onUpdateCase={handleUpdateCase}
                  onDeleteCase={handleDeleteCase}
                  onDeleteProcedure={handleDeleteProcedure}
                  templates={templates}
                />
              )}

              {/* Documents & Rubric Archive Gallery */}
              {activeTab === 'documents' && (
                <DocumentsArchiveView
                  cases={cases}
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveTab('case-detail');
                  }}
                />
              )}

              {/* Clinic Schedule / Timetable */}
              {activeTab === 'schedule' && (
                <ClinicScheduleView
                  schedule={schedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onNavigateToClinic={(place) => {
                    setActiveClinicPlace(place);
                    setActiveTab('today');
                  }}
                  profile={profile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {/* Settings & Backup/Restore View */}
              {activeTab === 'settings' && (
                <SettingsView
                  profile={profile}
                  templates={templates}
                  cases={cases}
                  schedule={schedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onUpdateProfile={handleUpdateProfile}
                  onRefreshData={refreshData}
                  onNavigateToSchedule={() => setActiveTab('schedule')}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for quick one-thumb access chairside!) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 frosted-glass border-t border-white/80 py-1.5 px-2 flex justify-around items-center shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'cases' && activeTab === 'case-detail');
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.selection();
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl min-w-[54px] min-h-[44px] transition-all duration-150 cursor-pointer active:scale-90 ${
                isActive ? 'text-sky-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] mt-0.5 font-semibold">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-sky-600 mt-0.5 animate-checkmark" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Global Add Case Modal */}
      {isAddCaseModalOpen && (
        <AddCaseModal
          isOpen={isAddCaseModalOpen}
          onClose={() => setIsAddCaseModalOpen(false)}
          activeSemester={activeSemester}
          templates={templates}
          onCaseCreated={handleCaseCreated}
        />
      )}

      {/* Global Interactive Clinical Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen && !isNameModalOpen}
        onClose={handleCloseTutorial}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* First-Time Doctor Name Prompt */}
      {isNameModalOpen && (
        <FirstTimeNameModal
          isOpen={isNameModalOpen}
          onSaveName={handleSaveFirstTimeName}
        />
      )}

      {/* Global Clinical Undo Notification Snackbar */}
      <UndoSnackbar
        notification={undoNotification}
        onUndo={handleUndo}
        onDismiss={handleDismissUndo}
      />
    </div>
  );
}
