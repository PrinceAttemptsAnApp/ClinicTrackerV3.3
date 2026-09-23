import React, { useState } from 'react';
import { Stethoscope, Sparkles, ArrowRight } from 'lucide-react';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface FirstTimeNameModalProps {
  isOpen: boolean;
  onSaveName: (name: string) => void;
}

export const FirstTimeNameModal: React.FC<FirstTimeNameModalProps> = ({
  isOpen,
  onSaveName,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      haptic.warning();
      setError('Please enter your name or title to proceed.');
      return;
    }
    // Prefix with Dr. if user just entered their first/last name
    const formatted = trimmed.startsWith('Dr.') ? trimmed : `Dr. ${trimmed}`;
    haptic.success();
    onSaveName(formatted);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="frosted-card w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-sky-200/80 animate-modal-pop">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 mb-4 mx-auto">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Welcome to DentaTrack
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your personal 5th-year clinical requirements and chairside tracker. What is your name, Doctor?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Doctor&apos;s Name / Title
            </label>
            <div className="relative">
              <input
                type="text"
                name="student-fullname"
                autoComplete="name"
                inputMode="text"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Sarah Ahmed or Omar"
                className="neu-input w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-400"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1.5">{error}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              We&apos;ll format this nicely on your header, rubrics, and clinical reports.
            </p>
          </div>

          <button
            type="submit"
            className="neu-btn-primary w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/25 transition-all"
          >
            <span>Start Using DentaTrack</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </ModalPortal>
);
};
