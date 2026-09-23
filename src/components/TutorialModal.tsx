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
      badge: 'Overview',
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>DentaTrack</strong> is an all-in-one clinical requirements tracker and academic portfolio designed specifically for 5th-year dental students. It helps you monitor chairside procedure milestones, track signed rubrics, log photographic evidence, and prepare Moodle submissions without hassle.
          </p>

          {/* Doctor Profile Greeting */}
          <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs sm:text-sm">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>Personalized for {profile?.studentName || 'Doctor'}</span>
            </div>
            <p className="text-xs text-slate-600">
              Your clinical dashboard, rubric records, and export reports are ready. You can adjust your student ID, targets, and notation anytime in Settings.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong>Key Philosophy:</strong> Minimal clicks chairside. Every case is instantly recognized by <strong>Patient Name & File Number</strong> rather than confusing auto-generated identifiers.
          </div>
        </div>
      ),
    },
    {
      title: 'How to Use & Fast Chairside Workflow',
      icon: Calendar,
      badge: 'Chairside Guide',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            DentaTrack is optimized for fast use while wearing gloves at the dental chair:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">1</span>
              <div>
                <strong>Create Patient Case:</strong> Tap <em>+ New Case</em>, type the patient name and clinic file number, choose clinic place (A, C, B, M, N, G), and select your starting discipline.
              </div>
            </li>
            <li className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">2</span>
              <div>
                <strong>Removable vs. Tooth Selection:</strong> For Removable Prosthodontics, procedures are automatically assigned to entire jaws (Maxillary Arch or Mandibular Arch). For Fixed, Endo, and Operative, tap individual teeth using the interactive quadrant chart.
              </div>
            </li>
            <li className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">3</span>
              <div>
                <strong>Macro Milestones:</strong> Track meaningful milestones (like <em>Reduction, Secondary Impression, Try-in, Delivery</em>) rather than micro-steps. Mark them done with a single tap.
              </div>
            </li>
            <li className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">4</span>
              <div>
                <strong>Plan Next Visit:</strong> Log what you will do next session so you come to clinic completely prepared.
              </div>
            </li>
          </ul>
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
            The Comprehensive Clinic integrates core specialties: <strong>Fixed Prosthodontics, Operative Dentistry, Endodontics, Removable Prosthodontics, and Periodontics</strong> (plus Pedo and Oral Surgery).
          </p>
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Automatic 3-Discipline Detection</span>
            </p>
            <p className="text-xs">
              Whenever a patient case contains procedures spanning <strong>3 or more distinct dental disciplines</strong>, DentaTrack automatically badges it as a <strong>Comprehensive Case</strong>.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Target:</strong> You need to complete at least 1 comprehensive case per semester and present your primary comprehensive case at the end-of-year examination.
          </p>
        </div>
      ),
    },
    {
      title: 'Rubric Scanning & Moodle Submissions',
      icon: Camera,
      badge: 'Signatures & Evidence',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Safeguard your hard-earned clinical requirements against lost paper sheets:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700">
            <li>
              When your Teaching Assistant (TA) or PhD staff doctor signs your physical rubric sheet, open the procedure in DentaTrack.
            </li>
            <li>
              Tap <strong>Add Rubric / Photo</strong> and capture the signed sheet with your phone camera.
            </li>
            <li>
              Confirm <em>&ldquo;Is this document signed?&rdquo;</em> &rarr; <strong>Yes</strong> to mark the rubric as officially signed.
            </li>
            <li>
              Attach before/after radiographs and intra-oral photographs to build your portfolio.
            </li>
            <li>
              When Moodle requirement submission windows open, tap <strong>Export Case PDF</strong> to generate a clean summary bundle ready for upload.
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Offline Mode & Multi-Platform PWA',
      icon: Laptop,
      badge: 'Zero Cloud Server',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            DentaTrack runs directly in modern browsers and can be installed as an offline Progressive Web App (PWA) on <strong>iOS (iPhone/iPad), Android, Windows, and Mac</strong>.
          </p>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
            <p className="font-bold">100% Local & Private</p>
            <p>
              All patient records, rubric photographs, and clinical progress are stored safely inside your device&apos;s local <strong>IndexedDB</strong>. It continues working even in hospital basements with zero cellular reception.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Backup & Restore:</strong> Head to the <em>Settings</em> tab anytime to download a full JSON backup of all your cases or transfer your data to a new phone or computer.
          </p>
        </div>
      ),
    },
    {
      title: 'Solo Passion Project & Feedback',
      icon: Heart,
      badge: 'Developer Note',
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 space-y-1">
            <p className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Built by a Dental Student, for Dental Students</span>
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              DentaTrack was created as a solo passion project by a 5th-year dental student to solve the daily chaos of paper rubrics, lost requirement slips, and frantic end-of-semester calculations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-sky-900">
              <Mail className="w-4 h-4 text-sky-600" />
              <span>Direct Bug Reports & Feature Suggestions</span>
            </div>
            <p>
              Found a bug, visual glitch, or have an idea to improve the app? Please send an email directly to:
            </p>
            <div className="p-2 rounded-xl bg-white border border-sky-200 text-center font-mono font-bold text-sky-800 text-xs sm:text-sm select-all">
              amir2101233@miuegypt.edu.eg
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              <strong>Tip:</strong> Please include your <strong>device specifications</strong> (e.g. iPhone 13 / iOS 17 or Samsung Galaxy S23 / Android 14) along with <strong>screenshots</strong> so any issues can be reproduced and resolved quickly!
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
