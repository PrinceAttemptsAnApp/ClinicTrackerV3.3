import React, { useState } from 'react';
import { UserPlus, X, PlusCircle, AlertCircle, Sparkles, Phone, Check } from 'lucide-react';
import { ClinicPlace, DentalCase, DisciplineType, ProcedureTemplate, Semester, ClinicalProcedure, RemovableCaseConfig } from '../types';
import { DEFAULT_TEMPLATES, computeIsComprehensive } from '../lib/storage';
import { ToothDiagramSelector } from './ToothDiagramSelector';
import { RemovableSelector, getDefaultRemovableConfig, formatRemovableSummary, validateRemovableConfig } from './RemovableSelector';
import { getDisciplineIcon, getDisciplineTheme } from '../lib/clinicalVisuals';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSemester: Semester;
  templates?: ProcedureTemplate[];
  onCaseCreated: (newCase: DentalCase) => void;
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];

const DISCIPLINES: DisciplineType[] = [
  'Fixed',
  'Operative',
  'Endo',
  'Removable',
  'Perio',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Orthodontics',
  'Comprehensive Clinic',
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-fixed-single-crown');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customProcedureTitle, setCustomProcedureTitle] = useState('');
  const [customPoints, setCustomPoints] = useState<number>(10);
  const [toothNumber, setToothNumber] = useState('');
  const [removableConfig, setRemovableConfig] = useState<RemovableCaseConfig>(getDefaultRemovableConfig());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((t) => t.discipline === selectedDiscipline);

  const handleDisciplineChange = (disc: DisciplineType) => {
    haptic.selection();
    setSelectedDiscipline(disc);
    const firstMatch = templates.find((t) => t.discipline === disc);
    if (firstMatch) setSelectedTemplateId(firstMatch.id);
  };

  const handleSelectTemplate = (id: string) => {
    haptic.selection();
    setSelectedTemplateId(id);
    setIsCustomMode(false);
    setCustomProcedureTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      haptic.warning();
      setError('Patient Name is required.');
      return;
    }
    if (!fileNumber.trim()) {
      haptic.warning();
      setError('Patient File # is required.');
      return;
    }

    // If Removable discipline is selected, validate removable arch configuration
    if (selectedDiscipline === 'Removable') {
      const validation = validateRemovableConfig(removableConfig);
      if (!validation.isValid) {
        haptic.warning();
        setError(validation.errorMessage || 'Invalid removable prosthodontics configuration.');
        return;
      }
    }

    const template = !isCustomMode ? templates.find((t) => t.id === selectedTemplateId) : undefined;
    const procTitle = isCustomMode ? customProcedureTitle.trim() : template?.name || `${selectedDiscipline} Procedure`;

    const finalToothNumber =
      selectedDiscipline === 'Removable'
        ? formatRemovableSummary(removableConfig)
        : toothNumber.trim() || undefined;

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

    const points = isCustomMode ? Number(customPoints) || 10 : template?.defaultPoints || 10;

    const initialProcedure: ClinicalProcedure = {
      id: `proc-${Date.now()}`,
      caseId: `case-${Date.now()}`,
      discipline: selectedDiscipline,
      title: procTitle.trim() + (finalToothNumber ? ` (${finalToothNumber})` : ''),
      toothNumber: finalToothNumber,
      removable: selectedDiscipline === 'Removable' ? removableConfig : undefined,
      points,
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
      clinicPlace,
      semester: activeSemester,
      academicYear: '2026–2027',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isComprehensive: computeIsComprehensive([initialProcedure]),
      disciplines: [selectedDiscipline],
      procedures: [initialProcedure],
    };

    haptic.success();
    onCaseCreated(newCase);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
        <div 
          role="dialog" 
          aria-modal="true"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden animate-modal-pop text-slate-900 dark:text-slate-100"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold truncate text-slate-900 dark:text-white">
                  New Clinic Case
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  MIU Clinical Logbook 2026–2027
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unified Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-5 flex-1 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Patient Details */}
            <div className="space-y-3">
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                1. Patient Information
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Name <span className="text-sky-600 dark:text-sky-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ahmed El-Sayed"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    File Number <span className="text-sky-600 dark:text-sky-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                    placeholder="e.g. 10482"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Phone</span>
                    <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full min-h-[44px] pl-8 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Clinic Place (Compact Single-Row Selector) */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-2">
                2. Clinic Place
              </label>
              
              <div className="grid grid-cols-6 gap-1.5">
                {CLINICS.map((clinic) => {
                  const isActive = clinicPlace === clinic;
                  return (
                    <button
                      key={clinic}
                      type="button"
                      onClick={() => {
                        setClinicPlace(clinic);
                        haptic.selection();
                      }}
                      className={`min-h-[44px] rounded-xl font-bold text-xs transition cursor-pointer text-center flex items-center justify-center ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
                      }`}
                    >
                      Clinic {clinic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Starting Discipline (Single-Row Horizontal Selector) */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-2">
                3. Starting Discipline
              </label>
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar touch-pan-x">
                {DISCIPLINES.map((disc) => {
                  const isActive = selectedDiscipline === disc;
                  return (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => handleDisciplineChange(disc)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-700/70'
                      }`}
                    >
                      <span>{getDisciplineIcon(disc, 'w-3.5 h-3.5')}</span>
                      <span>{disc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Starting Procedure (Clean List, No Nested Scrollbar) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  4. Starting Procedure
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(!isCustomMode);
                    haptic.selection();
                  }}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer min-h-[36px] flex items-center"
                >
                  {isCustomMode ? '← Pick from Logbook' : '+ Custom Procedure'}
                </button>
              </div>

              {!isCustomMode ? (
                <div className="space-y-2">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      const discTheme = getDisciplineTheme(tmpl.discipline);
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleSelectTemplate(tmpl.id)}
                          role="button"
                          tabIndex={0}
                          className={`min-h-[56px] p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between gap-3 active:scale-[0.99] ${
                            isSelected
                              ? 'bg-sky-50/80 dark:bg-sky-950/80 border-sky-500 dark:border-sky-400 text-slate-950 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-xl ${discTheme.bg} ${discTheme.text} border ${discTheme.border} flex items-center justify-center shrink-0`}>
                              {getDisciplineIcon(tmpl.discipline, 'w-4 h-4')}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {tmpl.name}
                              </p>
                              <p className={`text-[11px] mt-0.5 ${
                                isSelected ? 'text-sky-700 dark:text-sky-300 font-medium' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {tmpl.defaultSteps.length} milestones · {tmpl.rubricTitle || selectedDiscipline}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl tabular-nums ${
                              isSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}>
                              {tmpl.defaultPoints} pts
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
                      No templates for {selectedDiscipline}. Click "+ Custom Procedure" to add one.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Custom Procedure Name <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={customProcedureTitle}
                      onChange={(e) => setCustomProcedureTitle(e.target.value)}
                      placeholder="e.g. Incisional Biopsy, Emergency Pulpotomy..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Points Weight
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customPoints}
                      onChange={(e) => setCustomPoints(Number(e.target.value))}
                      className="w-24 min-h-[44px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono tabular-nums focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STEP 5: Tooth Selection / Arch Config */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-2">
                5. {selectedDiscipline === 'Removable' ? 'Arch & Prosthesis Specification' : 'Tooth Location'}
              </label>

              {selectedDiscipline === 'Removable' ? (
                <RemovableSelector
                  config={removableConfig}
                  onChange={setRemovableConfig}
                />
              ) : (
                <ToothDiagramSelector
                  value={toothNumber}
                  onChange={setToothNumber}
                  discipline={selectedDiscipline}
                  label="Select Tooth (Optional for General Case Setup)"
                />
              )}
            </div>
          </form>

          {/* Sticky Bottom Action Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-end gap-2.5 sticky bottom-0 z-20">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Case</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
