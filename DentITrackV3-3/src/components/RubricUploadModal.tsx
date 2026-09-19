import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { RubricDocument, SignatureStatus } from '../types';

interface RubricUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureTitle: string;
  discipline: string;
  onSaveRubric: (rubric: RubricDocument) => void;
}

export const RubricUploadModal: React.FC<RubricUploadModalProps> = ({
  isOpen,
  onClose,
  procedureTitle,
  discipline,
  onSaveRubric,
}) => {
  const [rubricTitle, setRubricTitle] = useState(`${discipline} Evaluation Rubric`);
  const [instructorName, setInstructorName] = useState('');
  const [instructorRole, setInstructorRole] = useState<'Teaching Assistant (TA)' | 'PhD Holder' | 'Staff Doctor'>('Teaching Assistant (TA)');
  const [isSigned, setIsSigned] = useState<boolean | null>(null);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.type);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fileDataUrl) {
      setError('Please upload or photograph the clinical rubric first.');
      return;
    }
    if (isSigned === null) {
      setError('Please answer: Is this document signed?');
      return;
    }

    const newRubric: RubricDocument = {
      id: `rub-${Date.now()}`,
      title: rubricTitle || `${discipline} Rubric`,
      discipline,
      instructorName: instructorName.trim() || (isSigned ? 'Clinical Instructor' : 'Pending Instructor'),
      instructorRole,
      status: (isSigned ? 'Signed' : 'Pending') as SignatureStatus,
      signatureDate: isSigned ? signatureDate : undefined,
      fileName,
      fileDataUrl,
      uploadedAt: new Date().toISOString(),
      notes: notes.trim(),
    };

    onSaveRubric(newRubric);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="frosted-card w-full max-w-lg rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Scan / Upload Clinical Rubric
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">
              For: <span className="font-semibold text-slate-700">{procedureTitle}</span> ({discipline})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* File Upload / Camera Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Photograph Rubric (Chairside) or Upload Document
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="neu-btn py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sky-700 hover:bg-sky-50/50 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-600" />
                <span>📷 Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="neu-btn py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>📎 Choose File</span>
              </button>
            </div>

            {/* Hidden native inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* File Preview if uploaded */}
          {fileDataUrl && (
            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center gap-3">
              {fileType.startsWith('image/') ? (
                <img
                  src={fileDataUrl}
                  alt="Rubric preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs border border-sky-200">
                  PDF
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{fileName || 'Clinical Rubric'}</p>
                <p className="text-[11px] text-slate-500">File attached successfully</p>
                <button
                  onClick={() => {
                    setFileDataUrl(null);
                    setFileName('');
                  }}
                  className="text-rose-600 hover:underline text-[11px] mt-1 cursor-pointer"
                >
                  Change file
                </button>
              </div>
            </div>
          )}

          {/* THE MANDATORY USER QUESTION: "Is this document signed?" */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <label className="block font-bold text-slate-800 mb-2">
              Is this document signed?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSigned(true)}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSigned === true
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'neu-btn text-slate-700 hover:bg-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Signed</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSigned(false)}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSigned === false
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'neu-btn text-slate-700 hover:bg-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Needs Signature</span>
              </button>
            </div>
          </div>

          {/* Instructor & Signature Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Instructor Name
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="e.g. Dr. Tarek / Dr. Mona"
                className="neu-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Instructor Role
              </label>
              <select
                value={instructorRole}
                onChange={(e) => setInstructorRole(e.target.value as any)}
                className="neu-input w-full px-3 py-2 rounded-xl text-xs bg-white/80"
              >
                <option value="Teaching Assistant (TA)">Teaching Assistant (TA)</option>
                <option value="PhD Holder">PhD Holder</option>
                <option value="Staff Doctor">Staff Doctor</option>
              </select>
            </div>
          </div>

          {isSigned && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Signature Date
              </label>
              <input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="neu-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Rubric / Evaluation Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified margin prep, rubber dam isolation clean"
              className="neu-input w-full px-3 py-2 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onClose}
            className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer"
          >
            Save Rubric to Case
          </button>
        </div>
      </div>
    </div>
  );
};
