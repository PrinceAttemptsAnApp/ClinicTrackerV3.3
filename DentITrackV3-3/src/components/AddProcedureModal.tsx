import React, { useState } from 'react';
import { PlusCircle, X, AlertCircle } from 'lucide-react';
import { ClinicalProcedure, DisciplineType, ProcedureTemplate } from '../types';
import { DEFAULT_TEMPLATES } from '../lib/storage';
import { ToothDiagramSelector } from './ToothDiagramSelector';

interface AddProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  templates: ProcedureTemplate[];
  onProcedureAdded: (procedure: ClinicalProcedure) => void;
  defaultToothNumber?: string;
  defaultDiscipline?: DisciplineType;
}

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

export const AddProcedureModal: React.FC<AddProcedureModalProps> = ({
  isOpen,
  onClose,
  caseId,
  templates = DEFAULT_TEMPLATES,
  onProcedureAdded,
  defaultToothNumber,
  defaultDiscipline,
}) => {
  const [discipline, setDiscipline] = useState<DisciplineType>(defaultDiscipline || 'Fixed');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-fixed-single-crown');
  const [customTitle, setCustomTitle] = useState('');
  const [toothNumber, setToothNumber] = useState(defaultToothNumber || '');
  const [error, setError] = useState<string | null>(null);

  // Sync defaultToothNumber when modal opens or changes
  React.useEffect(() => {
    if (defaultToothNumber !== undefined) {
      setToothNumber(defaultToothNumber);
    }
  }, [defaultToothNumber, isOpen]);

  React.useEffect(() => {
    if (defaultDiscipline) {
      setDiscipline(defaultDiscipline);
      const match = templates.find((t) => t.discipline === defaultDiscipline);
      if (match) setSelectedTemplateId(match.id);
    }
  }, [defaultDiscipline, isOpen]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((t) => t.discipline === discipline);
  const currentSelectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find((t) => t.id === selectedTemplateId);
    const title = customTitle.trim() || template?.name || `${discipline} Procedure`;

    if (!title) {
      setError('Please provide or select a procedure.');
      return;
    }

    const steps = template
      ? template.defaultSteps.map((s, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          title: s,
          isCompleted: false,
        }))
      : [
          { id: `step-${Date.now()}-1`, title: 'Clinical Preparation & Isolation', isCompleted: false },
          { id: `step-${Date.now()}-2`, title: 'Clinical Execution', isCompleted: false },
          { id: `step-${Date.now()}-3`, title: 'Final Finishing & Polish', isCompleted: false },
        ];

    const newProc: ClinicalProcedure = {
      id: `proc-${Date.now()}`,
      caseId,
      discipline,
      title: title + (toothNumber.trim() ? ` (${toothNumber.trim()})` : ''),
      toothNumber: toothNumber.trim() || undefined,
      points: template?.defaultPoints || 10,
      status: 'In Progress',
      date: new Date().toISOString().split('T')[0],
      steps,
      rubrics: template?.rubricTitle
        ? [
            {
              id: `rub-${Date.now()}`,
              title: template.rubricTitle,
              discipline,
              instructorName: 'Pending Instructor',
              status: 'Pending',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [],
      evidenceFiles: [],
      moodleStatus: 'Not Submitted',
    };

    onProcedureAdded(newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="frosted-card w-full max-w-2xl rounded-2xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Add Procedure to Case
            </h3>
            <p className="text-xs text-slate-500">
              Select discipline and procedure workflow to track chairside steps and rubrics.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Discipline tabs */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Select Discipline
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => {
                    setDiscipline(disc);
                    const match = templates.find((t) => t.discipline === disc);
                    if (match) setSelectedTemplateId(match.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    discipline === disc
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'neu-btn text-slate-700 hover:bg-white'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>

          {/* Procedure templates */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Choose Standard Workflow
            </label>
            {filteredTemplates.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-1">
                {filteredTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setCustomTitle('');
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedTemplateId === tmpl.id && !customTitle
                        ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-sm'
                        : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{tmpl.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {tmpl.defaultSteps.length} chairside steps • {tmpl.rubricTitle}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {tmpl.defaultPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            {currentSelectedTemplate && !customTitle && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">
                    Tracked Macro Milestones ({currentSelectedTemplate.defaultSteps.length} stages)
                  </span>
                  <span className="text-[10px] text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded font-medium">
                    Macro Steps Only
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentSelectedTemplate.defaultSteps.map((stepTitle, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-2xs"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      {stepTitle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Or type custom procedure name..."
                className="neu-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Tooth Selection Diagram (Separated into Quadrants) */}
          <ToothDiagramSelector
            value={toothNumber}
            onChange={setToothNumber}
            discipline={discipline}
            label="Tooth Selection (Quadrant Diagram)"
          />

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Procedure</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
