import React from 'react';
import { Sparkles, Info, Check, ShieldAlert } from 'lucide-react';
import { PATCH_NOTES, APP_VERSION } from '../lib/patchNotes';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Find the entry for the current canonical version (v4.2.0)
  const currentRelease = PATCH_NOTES.find((entry) => entry.version === APP_VERSION) || PATCH_NOTES[0];

  const handleGotIt = () => {
    haptic.success();
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="w-full max-w-lg bg-white/95 rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 motion-reduce:transition-none motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        {/* Header with Emerald/Blue accents */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex-shrink-0 text-center relative overflow-hidden bg-radial from-sky-50/40 via-white to-white">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3 border border-sky-200/50 shadow-xs">
            <Sparkles className="w-6 h-6 text-sky-600 animate-pulse motion-reduce:animate-none" />
          </div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full mb-1">
            Application Updated
          </span>
          <h2 id="whats-new-title" className="text-xl sm:text-2xl font-black text-slate-800">
            What's New in v{APP_VERSION}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Clinical Companion Update • Mobile PDF & Schedule Overhaul
          </p>
        </div>

        {/* Scrollable Changelog List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Key Enhancements & Mobile Fixes:
            </h3>
            <ul className="space-y-2.5">
              {currentRelease.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2.5 text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </span>
                  <span className="text-xs sm:text-[13px] leading-relaxed font-medium">
                    {change}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Button Action */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleGotIt}
            className="w-full flex items-center justify-center h-12 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 text-white font-bold text-sm tracking-wide shadow-md shadow-sky-600/20 active:scale-[0.98] transition-transform duration-100 cursor-pointer"
          >
            Got It, Let's Go
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
);
};
