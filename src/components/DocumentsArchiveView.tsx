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
  Archive
} from 'lucide-react';
import { DentalCase, RubricDocument, EvidenceFile } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ModalPortal } from './ModalPortal';

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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="frosted-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
              Evidence & Rubric Archive
            </h2>
            <p className="text-xs text-slate-500">
              Centralized repository of all evaluation rubrics, X-rays, and clinical photographs
            </p>
          </div>

          <button
            onClick={handleBatchExportZip}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Archive className="w-4 h-4" />
            <span>Batch Download ZIP</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="neu-input flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, File #, Instructor..."
              className="w-full bg-transparent border-none outline-none font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
          {[
            { id: 'all', label: `All Files (${allDocs.length})` },
            { id: 'signed', label: 'Signed Rubrics ✓' },
            { id: 'pending', label: 'Pending Signatures ⏳' },
            { id: 'xray', label: 'X-Rays 🩻' },
            { id: 'clinical-photo', label: 'Clinical Photos 📷' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'neu-btn text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="frosted-card rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition group"
            >
              <div>
                {/* Thumbnail Preview */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative cursor-pointer flex items-center justify-center border border-slate-200 group-hover:border-sky-300 transition"
                >
                  {doc.fileDataUrl?.startsWith('data:image') ? (
                    <img
                      src={doc.fileDataUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <FileText className="w-8 h-8 text-sky-600 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {doc.fileName?.split('.').pop() || 'DOCUMENT'}
                      </span>
                    </div>
                  )}

                  {/* Status badge floating */}
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                      doc.status === 'Signed'
                        ? 'bg-emerald-600 text-white'
                        : doc.status === 'Pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-800/80 text-white'
                    }`}
                  >
                    {doc.status || doc.category}
                  </span>
                </div>

                {/* Info */}
                <div className="mt-2.5">
                  <p className="font-bold text-xs text-slate-800 truncate" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {doc.patientName} (#{doc.fileNumber})
                  </p>
                  {doc.instructorName && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Signee: {doc.instructorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => onSelectCase(doc.caseId)}
                  className="text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer"
                >
                  Go to Case &rarr;
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="neu-btn p-1.5 rounded-lg text-slate-600 hover:text-sky-600 cursor-pointer"
                    title="View Full Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {doc.fileDataUrl && (
                    <a
                      href={doc.fileDataUrl}
                      download={doc.fileName || 'dental_doc.jpg'}
                      className="neu-btn p-1.5 rounded-lg text-slate-600 hover:text-sky-600 cursor-pointer"
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
        <div className="frosted-card rounded-2xl p-10 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No documents found</p>
          <p className="text-xs text-slate-400">
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
              onClick={() => setPreviewDoc(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-300 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-2 text-white">
              <p className="font-bold text-base">{previewDoc.title}</p>
              <p className="text-xs text-slate-300">
                {previewDoc.patientName} (#{previewDoc.fileNumber}) • {previewDoc.category}
              </p>
            </div>
            {previewDoc.fileDataUrl?.startsWith('data:image') ? (
              <img
                src={previewDoc.fileDataUrl}
                alt="Document Preview"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-white/20"
              />
            ) : (
              <div className="p-8 rounded-xl bg-white text-slate-800 text-center">
                <p className="font-bold mb-2">Electronic Document File</p>
                <a
                  href={previewDoc.fileDataUrl}
                  download={previewDoc.fileName || 'document.pdf'}
                  className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
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
