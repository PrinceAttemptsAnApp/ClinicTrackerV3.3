import React, { useState, useEffect, useCallback } from 'react';
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
  getStudentProfile, 
  saveStudentProfile, 
  getClinicSchedule, 
  saveClinicSchedule, 
  getProcedureTemplates,
  DEFAULT_TEMPLATES 
} from './lib/storage';

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

  // Modals
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all initial data from IndexedDB
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

        // Check if student name needs to be prompted
        if (!dbProfile.studentName || dbProfile.studentName.trim() === '' || dbProfile.studentName === 'Dr. Amir') {
          setIsNameModalOpen(true);
        }
      } else {
        setIsNameModalOpen(true);
      }
      if (dbSchedule.length > 0) setSchedule(dbSchedule);
      if (dbTemplates.length > 0) setTemplates(dbTemplates);
    } catch (err) {
      console.error('Failed to load clinical data from IndexedDB', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Check if first-time user tutorial prompt
    const hasSeenTutorial = localStorage.getItem('dentatrack_tutorial_shown');
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true);
      localStorage.setItem('dentatrack_tutorial_shown', 'true');
    }
  }, [refreshData]);

  const handleSaveFirstTimeName = async (name: string) => {
    const updated: StudentProfile = {
      ...profile,
      studentName: name,
    };
    setProfile(updated);
    await saveStudentProfile(updated);
    setIsNameModalOpen(false);
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

  // Handle Case Deletion
  const handleDeleteCase = async (caseId: string) => {
    setCases((prev) => prev.filter((c) => c.id !== caseId));
    await removeCaseFromDb(caseId);
    setSelectedCaseId(null);
    setActiveTab('cases');
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
                    if (item.id === 'cases' && activeTab === 'case-detail') {
                      // remain on case detail or go to cases
                    }
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
            <>
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
            </>
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
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl min-w-[54px] min-h-[44px] transition cursor-pointer ${
                isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
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
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* First-Time Doctor Name Prompt */}
      {isNameModalOpen && !isTutorialOpen && (
        <FirstTimeNameModal
          isOpen={isNameModalOpen}
          onSaveName={handleSaveFirstTimeName}
        />
      )}
    </div>
  );
}
