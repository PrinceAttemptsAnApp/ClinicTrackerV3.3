import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Eye, Plus, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ClinicalProcedure, DentalCase, EvidenceFile } from '../types';
import { ENDO_STAGES, EndoStageKey, parseProcedureTeeth } from '../lib/macroSteps';
import { haptic } from '../lib/haptics';

interface EndoRadiographSectionProps {
  procedure: ClinicalProcedure;
  dentalCase: DentalCase;
  onUpdateCase: (updatedCase: DentalCase) => void;
  onOpenPreview: (url: string, title: string) => void;
}

export const EndoRadiographSection: React.FC<EndoRadiographSectionProps> = ({
  procedure,
  dentalCase,
  onUpdateCase,
  onOpenPreview,
}) => {
  const teeth = parseProcedureTeeth(procedure.toothNumber);
  const [activeUploadSlot, setActiveUploadSlot] = useState<{ tooth: string; stage: EndoStageKey } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSlotFileSelect = (tooth: string, stage: EndoStageKey) => {
    setActiveUploadSlot({ tooth, stage });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSlot) return;

    const { tooth, stage } = activeUploadSlot;
    const stageConfig = ENDO_STAGES.find((s) => s.key === stage)!;

    haptic.medium();

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newEv: EvidenceFile = {
        id: `ev-endo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        caseId: procedure.caseId,
        procedureId: procedure.id,
        fileName: file.name || `${tooth}_${stageConfig.shortLabel}_XRay.jpg`,
        fileType: file.type || 'image/jpeg',
        fileSize: file.size || 1024,
        category: stageConfig.category,
        fileDataUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
        notes: `${tooth} • ${stageConfig.label}`,
        endoToothNumber: tooth,
        endoStage: stage,
      };

      // Filter out any existing evidence for this specific tooth and stage slot
      const existingFiltered = procedure.evidenceFiles.filter(
        (ev) => !(ev.endoToothNumber === tooth && ev.endoStage === stage)
      );

      const updatedProcedures = dentalCase.procedures.map((p) => {
        if (p.id !== procedure.id) return p;
        return {
          ...p,
          evidenceFiles: [...existingFiltered, newEv],
        };
      });

      haptic.success();
      onUpdateCase({
        ...dentalCase,
        procedures: updatedProcedures,
      });

      setActiveUploadSlot(null);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteSlotRadiograph = (tooth: string, stage: EndoStageKey) => {
    haptic.warning();
    const updatedProcedures = dentalCase.procedures.map((p) => {
      if (p.id !== procedure.id) return p;
      return {
        ...p,
        evidenceFiles: p.evidenceFiles.filter(
          (ev) => !(ev.endoToothNumber === tooth && ev.endoStage === stage)
        ),
      };
    });

    onUpdateCase({
      ...dentalCase,
      procedures: updatedProcedures,
    });
  };

  return (
    <div className="frosted-card rounded-2xl p-5 border border-sky-200/80 bg-gradient-to-br from-sky-50/40 via-white to-slate-50 shadow-sm space-y-5">
      {/* Hidden input for slot direct uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
              <span>ENDODONTIC RADIOGRAPHS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {teeth.length} {teeth.length === 1 ? 'Tooth' : 'Teeth'} Record
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Structured 4-stage radiographic workflow for clinical Moodle evaluation
            </p>
          </div>
        </div>
      </div>

      {/* Render 4 radiograph slots for each involved tooth */}
      <div className="space-y-6">
        {teeth.map((toothLabel) => {
          return (
            <div
              key={toothLabel}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs tracking-wide">
                    {toothLabel}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Endodontic Radiographic Stages
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ENDO_STAGES.map((stage) => {
                  // Find matching radiograph for this tooth and stage
                  const radiograph = procedure.evidenceFiles.find((ev) => {
                    if (ev.endoToothNumber && ev.endoStage) {
                      return ev.endoToothNumber === toothLabel && ev.endoStage === stage.key;
                    }
                    // Fallback for single-tooth existing attachments matching stage
                    if (teeth.length === 1 && ev.endoStage === stage.key) {
                      return true;
                    }
                    return false;
                  });

                  return (
                    <div
                      key={stage.key}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        radiograph
                          ? 'bg-slate-50/80 border-slate-200 hover:border-sky-300'
                          : 'bg-white border-dashed border-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 truncate">
                            {stage.label}
                          </span>
                        </div>

                        {radiograph ? (
                          <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-950 h-32 flex items-center justify-center">
                            {radiograph.fileDataUrl && radiograph.fileDataUrl.startsWith('data:image') ? (
                              <img
                                src={radiograph.fileDataUrl}
                                alt={`${toothLabel} ${stage.label}`}
                                className="w-full h-full object-contain cursor-pointer transition group-hover:scale-105"
                                onClick={() =>
                                  onOpenPreview(
                                    radiograph.fileDataUrl,
                                    `${toothLabel} • ${stage.label}`
                                  )
                                }
                              />
                            ) : (
                              <div
                                onClick={() =>
                                  onOpenPreview(
                                    radiograph.fileDataUrl,
                                    `${toothLabel} • ${stage.label}`
                                  )
                                }
                                className="text-center p-2 text-slate-300 cursor-pointer"
                              >
                                <Camera className="w-6 h-6 mx-auto mb-1 text-sky-400" />
                                <span className="text-[10px] font-semibold block truncate">
                                  {radiograph.fileName}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay controls */}
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenPreview(
                                    radiograph.fileDataUrl,
                                    `${toothLabel} • ${stage.label}`
                                  )
                                }
                                className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition cursor-pointer"
                                title="Preview Radiograph"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSlotFileSelect(toothLabel, stage.key)}
                                className="p-1.5 rounded-lg bg-sky-500/80 text-white hover:bg-sky-500 transition cursor-pointer"
                                title="Replace Radiograph"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlotRadiograph(toothLabel, stage.key)}
                                className="p-1.5 rounded-lg bg-rose-500/80 text-white hover:bg-rose-500 transition cursor-pointer"
                                title="Remove Radiograph"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleSlotFileSelect(toothLabel, stage.key)}
                            className="h-32 rounded-lg bg-slate-50 border border-dashed border-slate-200 hover:bg-sky-50/50 hover:border-sky-300 transition cursor-pointer flex flex-col items-center justify-center text-center p-2 space-y-1.5 group"
                          >
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-sky-700">
                              Upload X-ray
                            </span>
                            <span className="text-[9px] text-slate-400">
                              JPG, PNG, WEBP
                            </span>
                          </div>
                        )}
                      </div>

                      {radiograph && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[120px] font-medium">
                            {radiograph.fileName}
                          </span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            ✓ Ready
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
