import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Filter, 
  Camera, 
  FileCheck2, 
  Clock, 
  Eye, 
  X,
  Archive,
  ArrowRight
} from 'lucide-react';
import { DentalCase, RubricDocument, EvidenceFile } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ModalPortal } from './ModalPortal';
import { getStatusIcon } from '../lib/clinicalVisuals';
import { haptic } from '../lib/haptics';

interface DocumentsArchiveViewProps {
  cases: DentalCase[];
  onSelectCase: (caseId: string) => void;
}

interface FlattenedDoc {
  id: string;
  type: 'rubric' | 'evidence';
  title: string;
  category: string;
  patientName: string;
  fileNumber: string;
  caseId: string;
  discipline: string;
  status?: string;
  instructorName?: string;
  date?: string;
  fileDataUrl?: string;
  fileName?: string;
}

export const DocumentsArchiveView: React.FC<DocumentsArchiveViewProps> = ({ cases, onSelectCase }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<FlattenedDoc | null>(null);

  // Flatten all documents
  const allDocs: FlattenedDoc[] = [];

  cases.forEach((c) => {
    c.procedures.forEach((p) => {
      // Rubrics
      p.rubrics.forEach((r) => {
        allDocs.push({
          id: r.id,
          type: 'rubric',
          title: r.title,
          category: `Rubric (${r.status})`,
          patientName: c.patientName,
          fileNumber: c.fileNumber,
          caseId: c.id,
          discipline: p.discipline,
          status: r.status,
          instructorName: r.instructorName,
          date: r.signatureDate || r.uploadedAt.split('T')[0],
          fileDataUrl: r.fileDataUrl,
          fileName: r.fileName || `${r.title}.jpg`,
        });
      });

      // Evidence files
      p.evidenceFiles.forEach((ev) => {
        allDocs.push({
          id: ev.id,
          type: 'evidence',
          title: `${p.discipline}: ${ev.category}`,
          category: ev.category,
          patientName: c.patientName,
          fileNumber: c.fileNumber,
          caseId: c.id,
          discipline: p.discipline,
          status: 'Evidence',
          date: ev.uploadedAt.split('T')[0],
          fileDataUrl: ev.fileDataUrl,
          fileName: ev.fileName,
        });
      });
    });
  });

  // Filter
  const filteredDocs = allDocs.filter((doc) => {
    if (filterType === 'rubric' && doc.type !== 'rubric') return false;
    if (filterType === 'signed' && (doc.type !== 'rubric' || doc.status !== 'Signed')) return false;
    if (filterType === 'pending' && (doc.type !== 'rubric' || doc.status !== 'Pending')) return false;
    if (filterType === 'xray' && doc.category !== 'X-Ray') return false;
    if (filterType === 'clinical-photo' && !['Pre-Op', 'Intra-Op', 'Post-Op'].includes(doc.category)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = doc.patientName.toLowerCase().includes(q);
      const matchFile = doc.fileNumber.toLowerCase().includes(q);
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchInst = doc.instructorName?.toLowerCase().includes(q);
      if (!matchPatient && !matchFile && !matchTitle && !matchInst) return false;
    }

    return true;
  });

  // Batch Export all filtered documents as ZIP
  const handleBatchExportZip = async () => {
    haptic.selection();
    const zip = new JSZip();
    const folder = zip.folder('DentaTrack_Documents_Archive');
    if (!folder) return;

    filteredDocs.forEach((doc, idx) => {
      if (doc.fileDataUrl && doc.fileDataUrl.includes('base64,')) {
        const base64 = doc.fileDataUrl.split('base64,')[1];
        const safeName = `${String(idx + 1).padStart(2, '0')}_${doc.patientName.replace(/\s+/g, '_')}_${doc.category}_${doc.fileName || 'file.jpg'}`;
        folder.file(safeName, base64, { base64: true });
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'Dental_Clinical_Documents_Archive.zip');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Evidence & Rubric Archive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Repository of all doctor-signed rubrics, radiographs, and clinical photo records
            </p>
          </div>

          <button
            type="button"
            onClick={handleBatchExportZip}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs transition"
          >
            <Archive className="w-4 h-4" />
            <span>Batch Download ZIP</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, File #, Instructor..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 outline-none font-medium"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {[
            { id: 'all', label: `All Files (${allDocs.length})` },
            { id: 'signed', label: 'Signed Rubrics ✓' },
            { id: 'pending', label: 'Pending Signatures ⏳' },
            { id: 'xray', label: 'X-Rays 🩻' },
            { id: 'clinical-photo', label: 'Clinical Photos 📷' },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFilterType(tab.id);
                }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition group"
            >
              <div>
                {/* Thumbnail Preview */}
                <div
                  onClick={() => {
                    haptic.light();
                    setPreviewDoc(doc);
                  }}
                  className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700/80 group-hover:border-sky-300 transition"
                >
                  {doc.fileDataUrl?.startsWith('data:image') ? (
                    <img
                      src={doc.fileDataUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <FileText className="w-8 h-8 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {doc.fileName?.split('.').pop() || 'DOCUMENT'}
                      </span>
                    </div>
                  )}

                  {/* Status badge floating */}
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1 ${
                      doc.status === 'Signed'
                        ? 'bg-emerald-600 text-white'
                        : doc.status === 'Pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-600 text-white'
                    }`}
                  >
                    {getStatusIcon(doc.status === 'Signed' ? 'Completed' : doc.status === 'Pending' ? 'Missing Signatures' : 'In Progress', 'w-2.5 h-2.5 shrink-0')}
                    <span>{doc.status || doc.category}</span>
                  </span>
                </div>

                {/* Info */}
                <div className="mt-2.5">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                    {doc.patientName} (#{doc.fileNumber})
                  </p>
                  {doc.instructorName && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      Signee: {doc.instructorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectCase(doc.caseId)}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Go to Case</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setPreviewDoc(doc);
                    }}
                    className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="View Full Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {doc.fileDataUrl && (
                    <a
                      href={doc.fileDataUrl}
                      download={doc.fileName || 'dental_doc.jpg'}
                      className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No documents found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Take photos of signed rubrics or attach clinical evidence in Today&apos;s Clinic or Cases.
          </p>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewDoc && (
        <ModalPortal isOpen={Boolean(previewDoc)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
            <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-300 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-center mb-2 text-white">
                <p className="font-bold text-base">{previewDoc.title}</p>
                <p className="text-xs text-slate-300">
                  {previewDoc.patientName} (#{previewDoc.fileNumber}) · {previewDoc.category}
                </p>
              </div>
              {previewDoc.fileDataUrl?.startsWith('data:image') ? (
                <img
                  src={previewDoc.fileDataUrl}
                  alt="Document Preview"
                  className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
                />
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-center border border-slate-200 dark:border-slate-800">
                  <p className="font-bold mb-2">Electronic Document File</p>
                  <a
                    href={previewDoc.fileDataUrl}
                    download={previewDoc.fileName || 'document.pdf'}
                    className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download {previewDoc.fileName}
                  </a>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
