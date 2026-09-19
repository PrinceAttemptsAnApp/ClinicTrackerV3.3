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
  Globe,
  Copy,
  Calendar
} from 'lucide-react';
import { StudentProfile, ProcedureTemplate, DentalCase, ClinicSession } from '../types';
import { exportAllDataBackup, importDataBackup, resetToDefaultDemoData } from '../lib/storage';
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
}) => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [studentName, setStudentName] = useState(profile.studentName);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [pointsTarget, setPointsTarget] = useState(profile.pointsTarget || 200);
  const [university, setUniversity] = useState(profile.university || 'Faculty of Dentistry');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installDismissed, setInstallDismissed] = useState<boolean>(() => {
    return localStorage.getItem('dentatrack_install_dismissed') === 'true';
  });
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    profile.studentName === 'Dental Student' ||
                    profile.studentName.includes('Amir'))
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

      {/* GitHub Repository & Free Sharing with Friends Card */}
      <div className="frosted-card rounded-2xl p-5 sm:p-6 border border-sky-200/60">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Share Free with Friends & Classmates
            </h3>
            <p className="text-xs text-slate-500">
              Deployable for free on GitHub Pages, Vercel, or Netlify with zero server costs
            </p>
          </div>
        </div>

        <div className="mt-3 p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700 space-y-2.5">
          <p className="leading-relaxed">
            DentaTrack has been streamlined with a pre-configured <strong>GitHub Actions</strong> workflow (<code className="text-sky-800 font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200">.github/workflows/deploy.yml</code>), <strong>Vercel</strong> configuration (<code className="text-sky-800 font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200">vercel.json</code>), and <strong>Netlify</strong> configuration (<code className="text-sky-800 font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200">netlify.toml</code>).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-800 block">1. Push to GitHub</span>
              <span className="text-slate-500 block leading-normal">
                Upload your code to a new GitHub repo. Everything compiles automatically with relative asset links.
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-800 block">2. Turn on GitHub Pages</span>
              <span className="text-slate-500 block leading-normal">
                In GitHub: <em>Settings → Pages → Source: GitHub Actions</em>. Your free HTTPS link deploys in 60 seconds!
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-800 block">3. Friends Install & Test</span>
              <span className="text-slate-500 block leading-normal">
                Classmates open the link on iOS Safari or Android Chrome and install it directly to their home screen offline.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const cmd = 'git init && git add . && git commit -m "Initial commit of DentaTrack" && git branch -M main';
                navigator.clipboard.writeText(cmd);
                setCopiedGitCmd(true);
                setTimeout(() => setCopiedGitCmd(false), 2500);
              }}
              className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedGitCmd ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Git Push Commands!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Git Push Commands</span>
                </>
              )}
            </button>

            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'DentaTrack - 5th Year Dental Clinical Tracker',
                      text: 'Track dental requirements, signed rubrics, and Moodle submissions offline on iOS, Android, and PC.',
                      url: window.location.origin,
                    });
                  } catch {
                    // user cancelled
                  }
                } else {
                  await navigator.clipboard.writeText(window.location.origin);
                  alert('App link copied to clipboard!');
                }
              }}
              className="neu-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App Link with Colleagues</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset to Default Demo Data */}
      <div className="frosted-card rounded-2xl p-5 border border-rose-200/50">
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
            className="neu-btn px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer flex-shrink-0"
          >
            Reset to Demo Set
          </button>
        </div>
      </div>
    </div>
  );
};
