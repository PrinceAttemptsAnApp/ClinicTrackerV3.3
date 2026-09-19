import React, { useState } from 'react';
import { UserPlus, X, PlusCircle, AlertCircle, Sparkles, Phone } from 'lucide-react';
import { ClinicPlace, DentalCase, DisciplineType, ProcedureTemplate, Semester, ClinicalProcedure } from '../types';
import { DEFAULT_TEMPLATES, computeIsComprehensive } from '../lib/storage';
import { ToothDiagramSelector } from './ToothDiagramSelector';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSemester: Semester;
  templates: ProcedureTemplate[];
  onCaseCreated: (newCase: DentalCase) => void;
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];

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

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
  isOpen,
  onClose,
  activeSemester,
  templates = DEFAULT_TEMPLATES,
  onCaseCreated,
}) => {
  const [patientName, setPatientName] = useState('');
  const [fileNumber, setFileNumber] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [clinicPlace, setClinicPlace] = useState<ClinicPlace>('A');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineType>('Fixed');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-fixed-reduction');
  const [customProcedureTitle, setCustomProcedureTitle] = useState('');
  const [toothNumber, setToothNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((t) => t.discipline === selectedDiscipline);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient Name is required for case recognition.');
      return;
    }
    if (!fileNumber.trim()) {
      setError('Patient File # is required.');
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    const procTitle = customProcedureTitle.trim() || template?.name || `${selectedDiscipline} Procedure`;

    const steps = template
      ? template.defaultSteps.map((stepTitle, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          title: stepTitle,
          isCompleted: false,
        }))
      : [
          { id: `step-${Date.now()}-1`, title: 'Clinical Examination & Prep', isCompleted: false },
          { id: `step-${Date.now()}-2`, title: 'Procedure Execution', isCompleted: false },
          { id: `step-${Date.now()}-3`, title: 'Evaluation & Finishing', isCompleted: false },
        ];

    const initialProcedure: ClinicalProcedure = {
      id: `proc-${Date.now()}`,
      caseId: `case-${Date.now()}`,
      discipline: selectedDiscipline,
      title: procTitle + (toothNumber.trim() ? ` (${toothNumber.trim()})` : ''),
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
              discipline: selectedDiscipline,
              instructorName: 'Pending Instructor',
              status: 'Pending',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [],
      evidenceFiles: [],
      moodleStatus: 'Not Submitted',
    };

    const newCase: DentalCase = {
      id: `case-${Date.now()}`,
      patientName: patientName.trim(),
      fileNumber: fileNumber.trim(),
      patientPhone: patientPhone.trim() || undefined,
      semester: activeSemester,
      academicYear: '2026–2027',
      clinicPlace,
      status: 'In Progress',
      isComprehensive: computeIsComprehensive([initialProcedure]),
      disciplines: [selectedDiscipline],
      procedures: [initialProcedure],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
    };

    onCaseCreated(newCase);
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
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              New Clinic Case
            </h3>
            <p className="text-xs text-slate-500">
              Fast chairside setup: input patient name & file # then select starting procedure.
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
          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Patient Name <span className="text-sky-600">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ahmed El-Sayed"
                className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                File Number <span className="text-sky-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fileNumber}
                onChange={(e) => setFileNumber(e.target.value)}
                placeholder="e.g. 10482"
                className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="e.g. 01012345678"
                  className="neu-input w-full pl-8 pr-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Clinic Place Selection: A, C, B, M, N, G */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Clinic Place
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CLINICS.map((clinic) => (
                <button
                  key={clinic}
                  type="button"
                  onClick={() => setClinicPlace(clinic)}
                  className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                    clinicPlace === clinic
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'neu-btn text-slate-700 hover:bg-white'
                  }`}
                >
                  Clinic {clinic}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Procedure Discipline */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Starting Discipline
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => {
                    setSelectedDiscipline(disc);
                    const firstMatch = templates.find((t) => t.discipline === disc);
                    if (firstMatch) setSelectedTemplateId(firstMatch.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    selectedDiscipline === disc
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'neu-btn text-slate-700 hover:bg-white'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>

          {/* Procedure Template Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Select Starting Workflow / Procedure
            </label>
            {filteredTemplates.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1">
                {filteredTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setCustomProcedureTitle('');
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedTemplateId === tmpl.id && !customProcedureTitle
                        ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-sm'
                        : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{tmpl.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {tmpl.defaultSteps.length} general steps • {tmpl.rubricTitle}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {tmpl.defaultPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Custom Procedure Title option */}
            <div className="mt-2">
              <input
                type="text"
                value={customProcedureTitle}
                onChange={(e) => setCustomProcedureTitle(e.target.value)}
                placeholder="Or type custom procedure name..."
                className="neu-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Tooth Selection Diagram (Separated into Quadrants) */}
          <ToothDiagramSelector
            value={toothNumber}
            onChange={setToothNumber}
            discipline={selectedDiscipline}
            label="Tooth Selection (Quadrant Diagram)"
          />

          {/* Academic Info Banner */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center gap-2 text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <p className="text-[11px] leading-tight">
              <strong>Comprehensive Case Tracking:</strong> You can add more procedures anytime. When procedures across <strong>3+ disciplines</strong> are added, this case is automatically classed as Comprehensive!
            </p>
          </div>

          {/* Submit buttons */}
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
              <span>Create Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
