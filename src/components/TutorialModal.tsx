import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  Camera, 
  FileCheck2, 
  Calendar, 
  Laptop, 
  Heart, 
  Mail, 
  UserCheck, 
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '../types';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: StudentProfile;
  onUpdateProfile?: (updated: StudentProfile) => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ 
  isOpen, 
  onClose,
  profile
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to DentaTrack',
      icon: Award,
      badge: 'Quick Start',
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>DentaTrack</strong> keeps your clinical requirements, patient cases, and signed rubrics in one spot so nothing gets lost before submission.
          </p>

          {/* Doctor Profile Greeting */}
          <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs sm:text-sm">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>Ready for {profile?.studentName || 'Doctor'}</span>
            </div>
            <p className="text-xs text-slate-600">
              Your cases and requirement dashboard are ready. You can change your targets or tooth numbering anytime in Settings.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong>How it works:</strong> Add your patient, log what procedure you&apos;re doing, and tap steps as you finish them at the chair.
          </div>
        </div>
      ),
    },
    {
      title: 'Fast Chairside Steps',
      icon: Calendar,
      badge: '4 Quick Steps',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Simple workflow designed for quick taps while working in clinic:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">1</span>
              <div>
                <strong>Add your patient:</strong> Tap <em>+ New Case</em>, type their name and file number, and pick your clinic.
              </div>
            </li>
            <li className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">2</span>
              <div>
                <strong>Pick the teeth:</strong> Tap the teeth on the chart, or select upper/lower arch for dentures.
              </div>
            </li>
            <li className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">3</span>
              <div>
                <strong>Tap milestones:</strong> Check off steps (like <em>Prep, Impression, or Delivery</em>) as you finish them.
              </div>
            </li>
            <li className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">4</span>
              <div>
                <strong>Plan next visit:</strong> Save what you&apos;re doing next session so you come to clinic prepared.
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Comprehensive Cases',
      icon: FileCheck2,
      badge: 'Requirements',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            The Comprehensive Clinic combines: <strong>Fixed, Operative, Endo, Removable, and Perio</strong>.
          </p>
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Automatic 3-Discipline Tag</span>
            </p>
            <p className="text-xs">
              When a patient has procedures from <strong>3 or more disciplines</strong>, DentaTrack automatically marks it as a <strong>Comprehensive Case</strong>.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Goal:</strong> You need at least 1 comprehensive case per semester.
          </p>
        </div>
      ),
    },
    {
      title: 'Rubrics & PDF Exports',
      icon: Camera,
      badge: 'Signatures',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Never lose a signed rubric sheet again:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700">
            <li>
              When your doctor or TA signs your rubric paper, open the procedure.
            </li>
            <li>
              Tap <strong>Add Rubric</strong> and take a quick photo with your phone.
            </li>
            <li>
              Mark it as <strong>Signed</strong> so your points count.
            </li>
            <li>
              Attach before/after X-rays and photos to complete your evidence.
            </li>
            <li>
              When it&apos;s time to submit, tap <strong>Export Case PDF</strong> to get your clean file for Moodle.
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Works Offline on Any Device',
      icon: Laptop,
      badge: 'Private & Local',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            DentaTrack works right in your browser and installs on <strong>iPhone, Android, Windows, and Mac</strong>.
          </p>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
            <p className="font-bold">100% Local on Your Phone</p>
            <p>
              Your patient notes and rubric photos stay on your device. It works in clinic basements even with zero signal.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Backup:</strong> Head to <em>Settings</em> anytime to download a backup file of all your cases.
          </p>
        </div>
      ),
    },
    {
      title: 'Made by a Dental Student',
      icon: Heart,
      badge: 'Student Note',
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 space-y-1">
            <p className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Built for 5th Year Dental Students</span>
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              DentaTrack was made to stop lost paper rubrics, messy requirement slips, and end-of-semester stress.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-sky-900">
              <Mail className="w-4 h-4 text-sky-600" />
              <span>Have feedback or found a bug?</span>
            </div>
            <p>
              Send an email directly to:
            </p>
            <div className="p-2 rounded-xl bg-white border border-sky-200 text-center font-mono font-bold text-sky-800 text-xs sm:text-sm select-all">
              amir2101233@miuegypt.edu.eg
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              <strong>Tip:</strong> Include your phone model and a screenshot so anything can be fixed quickly!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const CurrentIcon = steps[currentStep].icon;

  const handleFinish = () => {
    haptic.success();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="frosted-card w-full max-w-lg rounded-2xl p-5 sm:p-6 relative flex flex-col max-h-[92vh] shadow-2xl animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30 flex-shrink-0">
            <CurrentIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 px-2 py-0.5 rounded-full bg-sky-100/80 border border-sky-200">
              {steps[currentStep].badge}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1 leading-snug">
              {steps[currentStep].title}
            </h3>
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto py-2 pr-1">
          {steps[currentStep].content}
        </div>

        {/* Step Indicators & Navigation */}
        <div className="pt-3.5 mt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setCurrentStep(i);
                }}
                aria-label={`Go to step ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === i ? 'w-6 bg-sky-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setCurrentStep((prev) => prev - 1);
                }}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setCurrentStep((prev) => prev + 1);
                }}
                className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Got it! Start Tracking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
};
