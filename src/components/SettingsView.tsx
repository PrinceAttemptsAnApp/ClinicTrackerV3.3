import React, { useState, useRef } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Sparkles,
  Award,
  Layers,
  Archive,
  Smartphone,
  HardDrive,
  ShieldCheck,
  RotateCcw,
  Share2,
  Calendar,
  Trash2,
  Binary,
  Check,
  ExternalLink
} from 'lucide-react';
import { StudentProfile, ProcedureTemplate, DentalCase, ClinicSession, Semester } from '../types';
import { exportAllDataBackup, importDataBackup, resetToDefaultDemoData, clearAllData } from '../lib/storage';
import { safeLocalStorage } from '../lib/safeStorage';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SchedulePdfUploader } from './SchedulePdfUploader';

interface SettingsViewProps {
  profile: StudentProfile;
  templates: ProcedureTemplate[];
  cases: DentalCase[];
  schedule?: ClinicSession[];
  onUpdateSchedule?: (newSchedule: ClinicSession[]) => void;
  onUpdateProfile: (profile: StudentProfile) => void;
  onRefreshData: () => Promise<void>;
  onNavigateToSchedule?: () => void;
  activeSemester?: Semester;
  onSemesterChange?: (sem: Semester) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  templates,
  cases,
  schedule,
  onUpdateSchedule,
  onUpdateProfile,
  onRefreshData,
  onNavigateToSchedule,
  activeSemester,
  onSemesterChange,
}) => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [studentName, setStudentName] = useState(profile.studentName);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [pointsTarget, setPointsTarget] = useState(profile.pointsTarget || 200);
  const [university, setUniversity] = useState(profile.university || 'Faculty of Dentistry');
  const [currentSemester, setCurrentSemester] = useState<Semester>(
    activeSemester || profile.currentSemester || 'Semester 1'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installDismissed, setInstallDismissed] = useState<boolean>(() => {
    return localStorage.getItem('dentatrack_install_dismissed') === 'true';
  });
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dental Notation preference state
  const [toothNotation, setToothNotation] = useState<'palmer' | 'fdi'>(() => {
    return profile.toothNotation || (safeLocalStorage.getItem('dentatrack_notation') === 'fdi' ? 'fdi' : 'palmer');
  });
  const [notationSuccess, setNotationSuccess] = useState(false);

  // Delete all data modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleNotationChange = (system: 'palmer' | 'fdi') => {
    setToothNotation(system);
    safeLocalStorage.setItem('dentatrack_notation', system);
    onUpdateProfile({
      ...profile,
      toothNotation: system,
    });
    setNotationSuccess(true);
    setTimeout(() => setNotationSuccess(false), 2500);
  };

  const handleSemesterToggle = (sem: Semester) => {
    setCurrentSemester(sem);
    if (onSemesterChange) onSemesterChange(sem);
    onUpdateProfile({
      ...profile,
      currentSemester: sem,
    });
  };

  const handleDeleteAllData = async () => {
    setIsDeletingAll(true);
    try {
      await clearAllData();
      await onRefreshData();
      setShowDeleteAllModal(false);
      setDeleteConfirmText('');
      alert('All clinical records, patient cases, uploaded evidence, and schedule have been permanently erased.');
    } catch (err) {
      console.error('Error clearing data:', err);
      alert('Failed to erase data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Compute local stats
  let totalRubrics = 0;
  let totalEvidence = 0;
  cases.forEach((c) => {
    c.procedures.forEach((p) => {
      totalRubrics += p.rubrics.length;
      totalEvidence += p.evidenceFiles.length;
    });
  });

  const handleRestoreInstallButton = () => {
    localStorage.removeItem('dentatrack_install_dismissed');
    setInstallDismissed(false);
    window.location.reload();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...profile,
      studentName: studentName.trim(),
      academicYear: academicYear.trim(),
      pointsTarget: Number(pointsTarget) || 200,
      university: university.trim(),
    };
    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackupDownload = async () => {
    await exportAllDataBackup();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        await importDataBackup(jsonContent);
        await onRefreshData();
        setImportNotice('Successfully restored complete clinical database and files!');
        setTimeout(() => setImportNotice(null), 5000);
      } catch (err) {
        alert('Invalid backup file. Please provide a valid DentaTrack JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset to initial 5th-year demonstration data? All current local changes will be replaced.'
      )
    ) {
      await resetToDefaultDemoData();
      await onRefreshData();
      alert('Data reset to initial 5th-year demo set.');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Profile & Academic Target Settings */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
              Student & Academic Settings
            </h2>
            <p className="text-xs text-slate-500">
              Personalize student greeting, target clinical points (200), and academic year
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile and target points updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Student Name / Title
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Dr. Amir"
                className="neu-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Faculty / University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Faculty of Dentistry"
                className="neu-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026–2027"
                className="neu-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Clinical Points for Year
              </label>
              <input
                type="number"
                value={pointsTarget}
                onChange={(e) => setPointsTarget(Number(e.target.value))}
                min={50}
                max={500}
                className="neu-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Default requirement: 200 points</p>
            </div>
          </div>

          {/* Current Semester Slider */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Active Semester (Sets Case & Points View)
            </label>
            <div className="flex items-center gap-2 p-1 neu-input rounded-xl bg-slate-100/80 max-w-sm">
              <button
                type="button"
                onClick={() => handleSemesterToggle('Semester 1')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentSemester === 'Semester 1'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Semester 1</span>
                {currentSemester === 'Semester 1' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleSemesterToggle('Semester 2')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentSemester === 'Semester 2'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Semester 2</span>
                {currentSemester === 'Semester 2' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Controls case requirements, point tallies, and active clinic sessions.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Academic Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dental Tooth Notation Preference */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center border border-purple-500/30">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                Dental Tooth Notation System
              </h2>
              <p className="text-xs text-slate-500">
                Choose your preferred notation for odontograms, tooth selectors, and clinical logs
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            Active: {toothNotation === 'fdi' ? 'FDI Two-Digit' : 'Digital Palmer (UL3, LL5, LR6)'}
          </span>
        </div>

        {notationSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Notation system preference saved and updated across all odontograms!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Digital Palmer Notation Card */}
          <button
            type="button"
            onClick={() => handleNotationChange('palmer')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              toothNotation === 'palmer'
                ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/30 shadow-sm'
                : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-800">Digital Palmer Notation</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200">
                    Clinical Standard
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    toothNotation === 'palmer'
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {toothNotation === 'palmer' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Modern text-safe Palmer system using quadrant letters (<strong>UR, UL, LL, LR</strong>) followed by tooth number <strong>1 to 8</strong> for permanent adult teeth (e.g. <strong>UL3, LL5, LR6</strong>) and <strong>A to E</strong> for deciduous teeth.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Permanent: <strong className="font-mono text-sky-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">UL3, LL5, LR6</strong></span>
              <span>Pediatric: <strong className="font-mono text-sky-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">URD, ULA</strong></span>
            </div>
          </button>

          {/* FDI Notation Card */}
          <button
            type="button"
            onClick={() => handleNotationChange('fdi')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              toothNotation === 'fdi'
                ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-800">FDI Two-Digit System</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                    ISO 3950
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    toothNotation === 'fdi'
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {toothNotation === 'fdi' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Two-digit international standard. Uses quadrant prefixes (<strong>1–4</strong> for permanent, <strong>5–8</strong> for primary) followed by the tooth position (e.g. 16 for upper right first molar).
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Permanent: <strong className="font-mono text-purple-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">#16</strong></span>
              <span>Pediatric: <strong className="font-mono text-purple-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">#54</strong></span>
            </div>
          </button>
        </div>
      </div>

      {/* Doctor's Timetable: Upload / Update Schedule Card */}
      {(() => {
        const isScheduleExtracted = Boolean(
          profile.schedulePdfUploaded ||
          profile.schedulePdfMeta ||
          (schedule && schedule.length > 0)
        );
        const activeScheduleMeta = profile.schedulePdfMeta || (schedule && schedule.length > 0 ? {
          fileName: 'Doctor Clinical Timetable',
          uploadedAt: new Date().toISOString(),
          sessionCount: schedule.length,
          studentName: profile.studentName,
          studentId: profile.studentId,
          university: profile.university,
        } : undefined);

        return (
          <div className="frosted-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isScheduleExtracted 
                  ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 shadow-sm' 
                  : 'bg-sky-500/15 text-sky-600 border-sky-500/30'
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {isScheduleExtracted ? 'Update Schedule' : 'Upload Schedule'}
                  </h3>
                  {isScheduleExtracted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isScheduleExtracted
                    ? "Doctor's clinical timetable active • Click Update Schedule to import a new schedule PDF"
                    : "Upload Doctor's Schedule PDF to automatically extract clinical duty timetable"}
                </p>
              </div>
            </div>

            <SchedulePdfUploader
              isAlreadyUploaded={isScheduleExtracted}
              metadata={activeScheduleMeta}
              onScheduleExtracted={(newSessions, meta) => {
                if (onUpdateSchedule) onUpdateSchedule(newSessions);
                const updatedProfile: StudentProfile = {
                  ...profile,
                  schedulePdfUploaded: true,
                  schedulePdfMeta: meta,
                };
                if (
                  meta.studentName &&
                  (!profile.studentName ||
                    profile.studentName === 'Dental Student')
                ) {
                  updatedProfile.studentName = meta.studentName;
                }
                if (meta.studentId && !profile.studentId) {
                  updatedProfile.studentId = meta.studentId;
                }
                if (meta.university && (!profile.university || profile.university === 'Dental Faculty')) {
                  updatedProfile.university = meta.university;
                }
                onUpdateProfile(updatedProfile);
              }}
              variant="settings"
              onNavigateToSchedule={onNavigateToSchedule}
            />
          </div>
        );
      })()}

      {/* Offline Architecture & PWA Installation Card */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Offline Mode & Local Storage
            </h3>
            <p className="text-xs text-slate-500">
              Zero cloud server reliance • Fully self-contained inside your device
            </p>
          </div>
        </div>

        {/* Local Storage Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          <div className="p-3 rounded-xl bg-white/70 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Database</span>
            <span className="font-extrabold text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              IndexedDB
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Cases</span>
            <span className="font-extrabold text-xs text-slate-800 block mt-0.5">
              {cases.length} cases
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rubrics Stored</span>
            <span className="font-extrabold text-xs text-slate-800 block mt-0.5">
              {totalRubrics} documents
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photos / X-Rays</span>
            <span className="font-extrabold text-xs text-slate-800 block mt-0.5">
              {totalEvidence} files
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          DentaTrack uses local browser IndexedDB storage and a Workbox Service Worker. All patient data, rubric signature photographs, and clinical progress are stored 100% locally on your machine or mobile device and remain accessible when offline in clinics.
        </p>

        {/* Installation Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 text-xs">
          <button
            onClick={() => setShowInstallGuide(true)}
            className="neu-btn-primary px-4 py-2 rounded-xl font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open PWA & iOS Installation Guide</span>
          </button>

          {installDismissed && (
            <button
              onClick={handleRestoreInstallButton}
              className="neu-btn px-3 py-2 rounded-xl font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer"
              title="Re-show the install button in the top header bar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Header Install Button</span>
            </button>
          )}

          <div className="text-[11px] text-slate-500 ml-auto flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isInstalled ? 'Running in Standalone App Mode' : 'Running in Browser Mode'}</span>
          </div>
        </div>
      </div>

      {/* Guide Modal when opened from Settings */}
      {showInstallGuide && (
        <PWAInstallButton
          forceShowModal={true}
          onCloseModal={() => setShowInstallGuide(false)}
          variant="settings"
        />
      )}

      {/* Database Backup & Transfer Card */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center border border-purple-500/30">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Full Backup & Device Sync
            </h3>
            <p className="text-xs text-slate-500">
              Export everything to transfer between your Windows PC, Android phone, Mac, or iPad
            </p>
          </div>
        </div>

        {importNotice && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importNotice}</span>
          </div>
        )}

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p>
            All data (patient names, file numbers, chairside step milestones, photographed rubrics, signatures, and X-rays) is stored securely in your device&apos;s local IndexedDB.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBackupDownload}
              className="neu-btn-primary py-2.5 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Backup Everything (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="neu-btn py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 hover:text-sky-600 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Restore Backup File</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Share DentaTrack with Friends & Classmates Card */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6 border border-sky-200/60">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Share DentaTrack
            </h3>
            <p className="text-xs text-slate-500">
              Free and accessible from any smartphone, tablet, or laptop
            </p>
          </div>
        </div>

        <div className="mt-3 p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700 space-y-3.5">
          <p className="leading-relaxed text-slate-600">
            DentaTrack is freely hosted on GitHub Pages, making it easy to share with classmates and access from any supported device without requiring downloads or purchases.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={async () => {
                const currentAppUrl = window.location.href.split('#')[0].split('?')[0] || window.location.origin;
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'DentaTrack - 5th Year Dental Clinical Tracker',
                      text: 'Track dental requirements, signed rubrics, and clinical cases on your phone, tablet, or PC.',
                      url: currentAppUrl,
                    });
                    return;
                  } catch (err: unknown) {
                    // If user cancelled, don't fallback to clipboard
                    if (err instanceof Error && err.name === 'AbortError') {
                      return;
                    }
                  }
                }

                // Fallback to clipboard
                try {
                  await navigator.clipboard.writeText(currentAppUrl);
                  setShareLinkCopied(true);
                  setTimeout(() => setShareLinkCopied(false), 2500);
                } catch {
                  // Fallback prompt if clipboard API blocked
                  window.prompt('Copy DentaTrack URL:', currentAppUrl);
                }
              }}
              className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs transition hover:brightness-105 active:scale-[0.98]"
            >
              {shareLinkCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share DentaTrack</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-500 italic text-center sm:text-left">
              DentaTrack is free to use and can be installed as a PWA from your browser.
            </span>
          </div>

          <div className="pt-1 border-t border-sky-200/50 flex items-center justify-start">
            <a
              href="https://github.com/PrinceAttemptsAnApp/ClinicTrackerV3.3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-sky-700 transition py-1"
            >
              <span>View DentaTrack on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Reset to Default Demo Data */}
      <div className="frosted-card rounded-2xl p-5 border border-amber-200/60 bg-amber-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Reset Demonstration Data
            </h4>
            <p className="text-slate-500 mt-0.5">
              Reload default 5th-year clinical cases (Ahmed El-Sayed, Mona Hassan, Mahmoud Fawzy).
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            className="neu-btn px-4 py-2 rounded-xl text-amber-700 hover:bg-amber-50 font-semibold cursor-pointer flex-shrink-0"
          >
            Reset to Demo Set
          </button>
        </div>
      </div>

      {/* Danger Zone: Erase All Data */}
      <div className="frosted-card rounded-2xl p-5 border border-rose-300/80 bg-rose-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <h4 className="font-extrabold text-rose-800 text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Erase All Clinical Data
            </h4>
            <p className="text-slate-600 mt-0.5 max-w-xl leading-relaxed">
              Permanently delete all patient cases, clinical procedures, photographed rubrics, radiographic evidence, and timetable schedules. Resets the application to a completely empty state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteAllModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Data</span>
          </button>
        </div>
      </div>

      {/* Delete All Data Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="frosted-card w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-rose-300">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>

            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Permanently Delete All Data?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will irreversibly wipe <strong>all clinical patient cases</strong>, <strong>photographed rubrics</strong>, <strong>evidence images</strong>, and <strong>schedules</strong> from this device. This action cannot be undone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4 text-xs text-rose-900 space-y-1">
              <p className="font-semibold">Before you proceed:</p>
              <p>Consider downloading a full backup using the <strong>Export Complete Clinical Backup</strong> button above so you don&apos;t lose your records.</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type <span className="font-mono text-rose-600 font-extrabold select-all">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="neu-input w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAll}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAllData}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAll ? 'Erasing Data...' : 'Permanently Erase All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
