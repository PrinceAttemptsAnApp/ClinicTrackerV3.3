import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  X,
  ArrowRight,
  Clock,
  ShieldCheck,
  User,
  GraduationCap,
  Building2,
  Check
} from 'lucide-react';
import { ClinicSession } from '../types';
import { extractScheduleFromDoctorPdf, ExtractedScheduleResult } from '../lib/pdfScheduleExtractor';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showUploaderWhenUploaded, setShowUploaderWhenUploaded] = useState(false);

  // Extracted preview state before committing
  const [extractionResult, setExtractionResult] = useState<ExtractedScheduleResult | null>(null);
  const [includeLectures, setIncludeLectures] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setExtractionResult(null);

    const fileName = file.name.toLowerCase();
    const isPdfName = fileName.endsWith('.pdf');
    const isPdfType = file.type === 'application/pdf' || file.type.includes('pdf');

    let isRealPdf = isPdfName || isPdfType;
    if (!isRealPdf) {
      try {
        const slice = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder('latin1').decode(slice);
        if (header.startsWith('%PDF')) {
          isRealPdf = true;
        }
      } catch {
        // ignore
      }
    }

    if (!isRealPdf) {
      setErrorMsg('Please select a valid PDF document (.pdf) of your official timetable.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setErrorMsg(null);
    setSuccessNotice(null);
    setExtractionResult(null);

    try {
      const result = await extractScheduleFromDoctorPdf(selectedFile);
      setExtractionResult(result);
    } catch (err: any) {
      console.error('Schedule PDF extraction error:', err);
      setErrorMsg(
        err.message || 'Failed to extract schedule from this PDF. Please verify the document format.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmApply = () => {
    if (!extractionResult || !selectedFile) return;

    const sessionsToApply =
      includeLectures && extractionResult.allSessions?.length
        ? extractionResult.allSessions
        : extractionResult.sessions;

    const meta = {
      fileName: selectedFile.name,
      uploadedAt: new Date().toISOString(),
      sessionCount: sessionsToApply.length,
      studentName: extractionResult.studentMeta?.studentName,
      studentId: extractionResult.studentMeta?.studentId,
      university: extractionResult.studentMeta?.university,
      faculty: extractionResult.studentMeta?.faculty,
      semester: extractionResult.studentMeta?.semester,
    };

    onScheduleExtracted(sessionsToApply, meta);
    setSuccessNotice(
      `Successfully loaded ${sessionsToApply.length} sessions from "${selectedFile.name}"!`
    );
    setSelectedFile(null);
    setExtractionResult(null);
    setShowUploaderWhenUploaded(false);
  };

  // When already uploaded and not in active re-upload edit mode:
  // Show clean "Update Schedule" presentation (hiding the heavy extractor form as requested)
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
                  Offline PDF Loaded
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {metadata?.fileName ? (
                  <span className="font-semibold text-slate-700">{metadata.fileName}</span>
                ) : (
                  'Doctor Timetable PDF'
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
                    Uploaded {new Date(metadata.uploadedAt).toLocaleDateString()} at{' '}
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
              title="Upload an updated Doctor Schedule PDF"
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

  // Active Extractor / Upload UI (Initial state OR when "Update Schedule" is clicked)
  return (
    <div className="rounded-xl bg-white/80 border border-slate-200/90 p-4 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800">
              {isAlreadyUploaded ? 'Update Schedule' : 'Upload Schedule'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isAlreadyUploaded
                ? 'Select or drop a new Doctor Schedule PDF to update your clinical sessions.'
                : '100% Offline • Designed for university timetable grids (MIU, Egyptian & international dental schedules).'}
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

      {/* Drag and Drop Zone */}
      {!extractionResult && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
            accept=".pdf,application/pdf"
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
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Local Offline Extraction
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
                Click to choose Doctor&apos;s Schedule PDF or drag & drop here
              </p>
              <p className="text-[11px] text-slate-400">
                100% Offline • Processed directly inside your browser on this device
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected file extract trigger */}
      {selectedFile && !extractionResult && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Parsed locally without internet connection • Completely private</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setExtractionResult(null);
              }}
              disabled={isExtracting}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer disabled:opacity-50"
            >
              Clear
            </button>

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

      {/* Interactive Extraction Review & Confirmation Panel */}
      {extractionResult && (
        <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-extrabold text-slate-800">
                Extraction Preview & Verification
              </h5>
            </div>

            <button
              type="button"
              onClick={() => setExtractionResult(null)}
              className="text-[11px] text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
            >
              Change file
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
              {extractionResult.studentMeta.semester && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {extractionResult.studentMeta.semester}
                </span>
              )}
            </div>
          )}

          {/* Extracted Sessions List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700">
                Clinical Sessions Found ({extractionResult.sessions.length}):
              </span>

              {extractionResult.allSessions.length > extractionResult.sessions.length && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLectures}
                    onChange={(e) => setIncludeLectures(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    Include Lectures & Labs ({extractionResult.allSessions.length} total)
                  </span>
                </label>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {(includeLectures ? extractionResult.allSessions : extractionResult.sessions).map(
                (sess, idx) => (
                  <div
                    key={sess.id || idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-slate-100 text-slate-700 min-w-[72px] text-center">
                        {sess.dayOfWeek}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-800">{sess.discipline}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5 truncate">
                          {sess.notes}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-mono text-slate-600 font-semibold">
                        {sess.startTime} - {sess.endTime}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                        Clinic {sess.clinicPlace}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Ready to import{' '}
                {includeLectures
                  ? extractionResult.allSessions.length
                  : extractionResult.sessions.length}{' '}
                sessions
              </span>
            </span>

            <button
              type="button"
              onClick={handleConfirmApply}
              className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                Apply to My Clinical Timetable
              </span>
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
