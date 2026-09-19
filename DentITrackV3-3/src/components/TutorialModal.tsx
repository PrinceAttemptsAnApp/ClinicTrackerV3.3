import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, ChevronLeft, Award, Camera, FileCheck2, Calendar, Laptop } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to DentaTrack (5th Year)',
      icon: Award,
      badge: 'Getting Started',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            DentaTrack is engineered specifically for 5th-year dental students to monitor your clinical requirements, rubric signatures, photographic evidence, and Moodle submissions.
          </p>
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900">
            <strong>Key Philosophy:</strong> Fast chairside interaction with minimal clicks. Case recognition is anchored by <strong>Patient Name & File #</strong> (no arbitrary case IDs).
          </div>
        </div>
      ),
    },
    {
      title: 'The Comprehensive Case Rule',
      icon: FileCheck2,
      badge: 'Academic Rule',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Our Comprehensive Clinic combines 5 core disciplines: <strong>Operative, Fixed, Endo, Removable, and Perio</strong> (plus Oral Surgery & Pedo).
          </p>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
            <p className="font-semibold mb-1">Automatic 3-Discipline Detection:</p>
            When a case contains procedures from <strong>3 or more disciplines</strong>, DentaTrack automatically badges it as a <strong>Comprehensive Case</strong>.
          </div>
          <p className="text-xs text-slate-500">
            Requirement: You must finish at least 1 comprehensive case each semester, and present your hardest one at year-end.
          </p>
        </div>
      ),
    },
    {
      title: 'Chairside Steps & Multi-Patient Workflow',
      icon: Calendar,
      badge: 'Clinic Session',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            In <strong>Today\'s Clinic</strong>, select your clinic place (<strong>A, C, B, M, N, G</strong>). You can manage <strong>2 patients simultaneously</strong> at your clinic session.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li><strong>General Session Steps:</strong> We track real milestones like <em>Temporization Index, Reduction, Primary Impression</em>, not micro-actions.</li>
            <li><strong>Plan Next Visit:</strong> Quickly set what you\'ll do next time (e.g. Secondary Impression) so you arrive prepared.</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Rubric Scanning & Moodle Submissions',
      icon: Camera,
      badge: 'Rubrics & Evidence',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            When your TA or PhD holder signs off your printed evaluation rubric:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700">
            <li>Tap <strong>Add Rubric / Photo</strong> on the procedure.</li>
            <li>Snap a photo with your phone camera.</li>
            <li>Answer the prompt: <em>&ldquo;Is this document signed?&rdquo;</em> &rarr; <strong>Yes</strong>.</li>
            <li>When Moodle submissions open, click <strong>Export Case PDF</strong> to bundle all signed rubrics ready for upload!</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'PWA on iOS, Android, PC & Mac',
      icon: Laptop,
      badge: 'Offline & Multi-Platform',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            DentaTrack runs directly in the browser and as an installed app. All data is preserved locally in <strong>IndexedDB</strong>, so you can work completely offline in basement clinics.
          </p>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
            <strong>Full Backup & Restore:</strong> Use the Settings tab to export a complete JSON/ZIP backup anytime or transfer your data between devices.
          </div>
        </div>
      ),
    },
  ];

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="frosted-card w-full max-w-lg rounded-2xl p-6 relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <CurrentIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 px-2 py-0.5 rounded-full bg-sky-100/70 border border-sky-200">
              {steps[currentStep].badge}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
              {steps[currentStep].title}
            </h3>
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto py-2">
          {steps[currentStep].content}
        </div>

        {/* Step Indicators & Navigation */}
        <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === i ? 'w-6 bg-sky-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Got it! Start Tracking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
