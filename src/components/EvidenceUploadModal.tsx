import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { EvidenceFile } from '../types';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  procedureId: string;
  procedureTitle: string;
  onSaveEvidence: (evidence: EvidenceFile) => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
  procedureId,
  procedureTitle,
  onSaveEvidence,
}) => {
  const [category, setCategory] = useState<EvidenceFile['category']>('Pre-Op');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
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
    setFileSize(file.size);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fileDataUrl) {
      setError('Please choose or photograph an image/document.');
      return;
    }

    const newEvidence: EvidenceFile = {
      id: `ev-${Date.now()}`,
      caseId,
      procedureId,
      fileName: fileName || `${category}_${Date.now()}.jpg`,
      fileType: fileType || 'image/jpeg',
      fileSize: fileSize || 1024,
      category,
      fileDataUrl,
      uploadedAt: new Date().toISOString(),
      notes: notes.trim(),
    };

    onSaveEvidence(newEvidence);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="frosted-card w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
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
            <h3 className="text-base font-bold text-slate-800">
              Attach Clinical Evidence
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">
              For: {procedureTitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Evidence Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['X-Ray', 'Pre-Op', 'Intra-Op', 'Post-Op', 'Moodle Screenshot', 'Other'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                    category === cat
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'neu-btn text-slate-700 hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Upload and Camera buttons */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Select or Take Photo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="neu-btn py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sky-700 cursor-pointer hover:bg-sky-50"
              >
                <Camera className="w-4 h-4 text-sky-600" />
                <span>📷 Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="neu-btn py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>📎 Attach File</span>
              </button>
            </div>

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

          {/* Preview */}
          {fileDataUrl && (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-3">
              {fileType.startsWith('image/') ? (
                <img
                  src={fileDataUrl}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                  DOC
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{fileName}</p>
                <p className="text-[11px] text-slate-500">{(fileSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Clinical Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Periapical showing apical third radiolucency"
              className="neu-input w-full px-3 py-2 rounded-xl text-xs"
            />
          </div>
        </div>

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
            Attach Evidence
          </button>
        </div>
      </div>
    </div>
  );
};
