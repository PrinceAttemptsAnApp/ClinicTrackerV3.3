import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  ArrowRight,
  Clock,
  ShieldCheck,
  User,
  GraduationCap,
  Building2,
  Check,
  Plus,
  Trash2,
  Edit3,
  AlignLeft,
  FileCode
} from 'lucide-react';
import { ClinicSession, ClinicPlace, DisciplineType } from '../types';
import { 
  extractScheduleFromDoctorPdf, 
  extractScheduleFromText, 
  ExtractedScheduleResult,
  CLINICS,
  DAYS
} from '../lib/pdfScheduleExtractor';
import { haptic } from '../lib/haptics';

const DISCIPLINES: DisciplineType[] = [
  'Operative',
  'Fixed',
  'Endo',
  'Removable',
  'Perio',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Orthodontics',
];

interface SchedulePdfUploaderProps {
  onScheduleExtracted: (
    sessions: ClinicSession[],
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
  ) => void;
  isAlreadyUploaded?: boolean;
  metadata?: {
    fileName: string;
    uploadedAt: string;
    sessionCount: number;
    studentName?: string;
    studentId?: string;
    university?: string;
    faculty?: string;
    semester?: string;
  };
  variant?: 'settings' | 'schedule';
  onNavigateToSchedule?: () => void;
}

export const SchedulePdfUploader: React.FC<SchedulePdfUploaderProps> = ({
  onScheduleExtracted,
  isAlreadyUploaded = false,
  metadata,
  variant = 'schedule',
  onNavigateToSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showUploaderWhenUploaded, setShowUploaderWhenUploaded] = useState(false);

  // Extracted preview state before committing
  const [extractionResult, setExtractionResult] = useState<ExtractedScheduleResult | null>(null);
  const [editableSessions, setEditableSessions] = useState<ClinicSession[]>([]);
  const [includeLectures, setIncludeLectures] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setExtractionResult(null);
    setSelectedFile(file);
    haptic.medium();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExtract = async () => {
    if (activeTab === 'upload' && !selectedFile) return;
    if (activeTab === 'paste' && !pastedText.trim()) return;

    haptic.light();
    setIsExtracting(true);
    setErrorMsg(null);
    setSuccessNotice(null);
    setExtractionResult(null);

    try {
      let result: ExtractedScheduleResult;
      if (activeTab === 'upload' && selectedFile) {
        if (selectedFile.name.toLowerCase().endsWith('.txt') || selectedFile.type.includes('text')) {
          const text = await selectedFile.text();
          result = extractScheduleFromText(text, selectedFile.name);
        } else {
          result = await extractScheduleFromDoctorPdf(selectedFile);
        }
      } else {
        result = extractScheduleFromText(pastedText, 'Pasted_Schedule.txt');
      }

      haptic.success();
      setExtractionResult(result);
      setEditableSessions(result.sessions);
    } catch (err: any) {
      console.error('Schedule extraction error:', err);
      haptic.error();
      setErrorMsg(
        err.message || 'Failed to extract schedule. Please check the file or paste plain text.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleIncludeLectures = (checked: boolean) => {
    setIncludeLectures(checked);
    if (extractionResult) {
      setEditableSessions(checked ? extractionResult.allSessions : extractionResult.sessions);
    }
  };

  const handleSessionChange = (index: number, field: keyof ClinicSession, value: any) => {
    setEditableSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSession = () => {
    const newSession: ClinicSession = {
      id: `sess-manual-${Date.now()}`,
      dayOfWeek: 'Sunday',
      startTime: '08:00',
      endTime: '10:00',
      clinicPlace: 'A',
      discipline: 'Operative',
      chairCount: 2,
      notes: 'Manually added session',
    };
    setEditableSessions((prev) => [...prev, newSession]);
  };

  const handleDeleteSession = (index: number) => {
    setEditableSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmApply = () => {
    if (editableSessions.length === 0) {
      setErrorMsg('Please keep at least one valid session before applying.');
      return;
    }

    // Validate that times are valid HH:MM
    for (let i = 0; i < editableSessions.length; i++) {
      const s = editableSessions[i];
      if (!/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime)) {
        setErrorMsg(`Session #${i + 1} (${s.discipline}) has invalid times. Please use HH:MM format.`);
        return;
      }
    }

    const sourceName =
      activeTab === 'upload' && selectedFile ? selectedFile.name : 'Pasted Schedule Text';

    const meta = {
      fileName: sourceName,
      uploadedAt: new Date().toISOString(),
      sessionCount: editableSessions.length,
      studentName: extractionResult?.studentMeta?.studentName,
      studentId: extractionResult?.studentMeta?.studentId,
      university: extractionResult?.studentMeta?.university,
      faculty: extractionResult?.studentMeta?.faculty,
      semester: extractionResult?.studentMeta?.semester,
    };

    haptic.success();
    onScheduleExtracted(editableSessions, meta);
    setSuccessNotice(`Successfully saved ${editableSessions.length} sessions to your clinical timetable!`);
    setSelectedFile(null);
    setPastedText('');
    setExtractionResult(null);
    setShowUploaderWhenUploaded(false);
  };

  // When already uploaded and not in active re-upload edit mode
  if (isAlreadyUploaded && !showUploaderWhenUploaded) {
    return (
      <div className="rounded-xl bg-sky-50/80 border border-sky-200/80 p-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30 flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-800">
                  Doctor&apos;s Clinical Schedule Active
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                  Offline Schedule Loaded
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {metadata?.fileName ? (
                  <span className="font-semibold text-slate-700">{metadata.fileName}</span>
                ) : (
                  'Doctor Timetable'
                )}{' '}
                • {metadata?.sessionCount ?? 'Configured'} clinical sessions mapped
              </p>
              {metadata?.studentName && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-800">
                    <User className="w-3 h-3" />
                    {metadata.studentName}
                  </span>
                  {metadata.studentId && (
                    <span className="text-slate-400">({metadata.studentId})</span>
                  )}
                  {metadata.university && (
                    <span className="text-slate-500">• {metadata.university}</span>
                  )}
                </p>
              )}
              {metadata?.uploadedAt && (
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Loaded {new Date(metadata.uploadedAt).toLocaleDateString()} at{' '}
                    {new Date(metadata.uploadedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setShowUploaderWhenUploaded(true);
                setExtractionResult(null);
                setSelectedFile(null);
              }}
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-100/70 border border-sky-300/70 flex items-center gap-1.5 transition cursor-pointer"
              title="Upload or paste an updated Doctor Schedule"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Schedule</span>
            </button>

            {variant === 'settings' && onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
                title="View full schedule timetable"
              >
                <span>View Timetable</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {successNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </div>
    );
  }

  // Active Extractor / Upload UI
  return (
    <div className="rounded-xl bg-white/80 border border-slate-200/90 p-4 transition-all">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800">
              {isAlreadyUploaded ? 'Update Schedule' : 'Import Clinical Schedule'}
            </h4>
            <p className="text-[11px] text-slate-500">
              100% Offline • Processed locally on this device without internet connection.
            </p>
          </div>
        </div>

        {isAlreadyUploaded && (
          <button
            type="button"
            onClick={() => {
              setShowUploaderWhenUploaded(false);
              setSelectedFile(null);
              setExtractionResult(null);
              setErrorMsg(null);
            }}
            className="neu-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Cancel update"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs: PDF Upload vs Paste Text */}
      {!extractionResult && (
        <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (PDF / TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Paste Schedule Text</span>
          </button>
        </div>
      )}

      {/* Drag and Drop File Zone */}
      {!extractionResult && activeTab === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-sky-500 bg-sky-50/70'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Offline Extraction
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setExtractionResult(null);
                  setErrorMsg(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 ml-2"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-7 h-7 mx-auto text-sky-600 mb-1" />
              <p className="text-xs font-bold text-slate-700">
                Click to select Schedule PDF or drag & drop here
              </p>
              <p className="text-[11px] text-slate-400">
                Supports Egyptian & international university timetable PDFs (MIU, Cairo, Ain Shams, etc.)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paste Schedule Text Area */}
      {!extractionResult && activeTab === 'paste' && (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={5}
            placeholder={`Paste schedule text here, for example:\nSaturday 08:00 - 10:00 Operative Clinic A\nSunday 10:00 - 12:00 Endo Clinic B\nMonday 12:00 - 02:00 Oral Surgery Clinic C`}
            className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
          />
          <p className="text-[11px] text-slate-400">
            Paste raw schedule lines copied from portal or email. Extractor will parse days, times, and clinics.
          </p>
        </div>
      )}

      {/* Extraction trigger button */}
      {!extractionResult && ((activeTab === 'upload' && selectedFile) || (activeTab === 'paste' && pastedText.trim())) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Parsed 100% on-device • Completely private</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Offline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Extraction Review & Verification Safety Barrier */}
      {extractionResult && (
        <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-extrabold text-slate-800">
                Schedule Verification & Interactive Preview
              </h5>
            </div>

            <button
              type="button"
              onClick={() => setExtractionResult(null)}
              className="text-[11px] text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
            >
              Re-extract / Change input
            </button>
          </div>

          {/* Student metadata banner if detected */}
          {extractionResult.studentMeta && (
            <div className="p-2.5 rounded-lg bg-white border border-sky-100 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
              {extractionResult.studentMeta.studentName && (
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>{extractionResult.studentMeta.studentName}</span>
                </div>
              )}
              {extractionResult.studentMeta.studentId && (
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>ID: {extractionResult.studentMeta.studentId}</span>
                </div>
              )}
              {extractionResult.studentMeta.university && (
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{extractionResult.studentMeta.university}</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Editable Sessions Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700">
                Verify Clinical Sessions ({editableSessions.length}):
              </span>

              <div className="flex items-center gap-3">
                {extractionResult.allSessions.length > extractionResult.sessions.length && (
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLectures}
                      onChange={(e) => handleToggleIncludeLectures(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      Include Lectures ({extractionResult.allSessions.length} total)
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleAddSession}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Session</span>
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {editableSessions.map((sess, idx) => (
                <div
                  key={sess.id || idx}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                    {/* Day Dropdown */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Day</label>
                      <select
                        value={sess.dayOfWeek}
                        onChange={(e) => handleSessionChange(idx, 'dayOfWeek', e.target.value as any)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Start</label>
                      <input
                        type="text"
                        value={sess.startTime}
                        onChange={(e) => handleSessionChange(idx, 'startTime', e.target.value)}
                        placeholder="08:00"
                        className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">End</label>
                      <input
                        type="text"
                        value={sess.endTime}
                        onChange={(e) => handleSessionChange(idx, 'endTime', e.target.value)}
                        placeholder="10:00"
                        className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
                      />
                    </div>

                    {/* Clinic Place */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Clinic Place</label>
                      <select
                        value={sess.clinicPlace}
                        onChange={(e) => handleSessionChange(idx, 'clinicPlace', e.target.value as ClinicPlace)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
                      >
                        {CLINICS.map((c) => (
                          <option key={c} value={c}>
                            Clinic {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discipline Dropdown */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Discipline</label>
                      <select
                        value={sess.discipline}
                        onChange={(e) => handleSessionChange(idx, 'discipline', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-800"
                      >
                        {DISCIPLINES.map((disc) => (
                          <option key={disc} value={disc}>
                            {disc}
                          </option>
                        ))}
                        <option value="Comprehensive Clinic">Comprehensive Clinic</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes & Delete Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sess.notes || ''}
                      onChange={(e) => handleSessionChange(idx, 'notes', e.target.value)}
                      placeholder="Notes / Room info..."
                      className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to save {editableSessions.length} verified sessions</span>
            </span>

            <button
              type="button"
              onClick={handleConfirmApply}
              className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to My Clinical Timetable</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback notices */}
      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successNotice && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
};
