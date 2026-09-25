import React, { useState } from 'react';
import { Sparkles, Check, CalendarClock, ChevronDown, ChevronUp, History } from 'lucide-react';
import { PATCH_NOTES, APP_VERSION, UPCOMING_FEATURES } from '../lib/patchNotes';
import { haptic } from '../lib/haptics';
import { ModalPortal } from './ModalPortal';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  // Find the entry for the current canonical version
  const currentRelease = PATCH_NOTES.find((entry) => entry.version === APP_VERSION) || PATCH_NOTES[0];
  const previousReleases = PATCH_NOTES.filter((entry) => entry.version !== APP_VERSION);

  const handleGotIt = () => {
    haptic.success();
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300">
        <div 
          className="modal-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 motion-reduce:transition-none motion-reduce:animate-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
        >
          {/* Theme-Aware Semantic Modal Header */}
          <div className="modal-header-hero p-5 sm:p-6 flex-shrink-0 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center justify-center mx-auto mb-3 border border-sky-200/60 dark:border-sky-700/60 shadow-xs">
              <Sparkles className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-pulse motion-reduce:animate-none" />
            </div>
            <span className="badge-info inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-1">
              Application Updated
            </span>
            <h2 id="whats-new-title" className="text-xl sm:text-2xl font-black text-slate-800 dark:text-[#f8fafc]">
              What's New in v{APP_VERSION}
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#cbd5e1] mt-1 font-medium">
              {currentRelease.title}
            </p>
          </div>

          {/* Scrollable Changelog List */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
                Key Enhancements & Mobile Fixes:
              </h3>
              <ul className="space-y-2.5">
                {currentRelease.changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-slate-700 dark:text-[#cbd5e1]">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </span>
                    <span className="text-xs sm:text-[13px] leading-relaxed font-medium">
                      {change}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Previous Versions Toggle */}
            {previousReleases.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setShowHistory(!showHistory);
                  }}
                  className="surface-muted w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold hover:brightness-95 dark:hover:brightness-110 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Previous Release Notes ({previousReleases.length})</span>
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showHistory && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                    {previousReleases.map((rel) => (
                      <div key={rel.version} className="surface-muted p-3.5 rounded-xl border text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="badge-info font-mono font-bold text-[11px] px-2 py-0.5 rounded">
                            v{rel.version}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#94a3b8] font-medium">{rel.date}</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-[#f8fafc] text-xs">{rel.title}</p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-[#cbd5e1] text-[11px]">
                          {rel.changes.map((ch, i) => (
                            <li key={i} className="leading-relaxed">{ch}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming / In Development Feature Section */}
            {UPCOMING_FEATURES.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Upcoming / In Development:
                </h3>
                {UPCOMING_FEATURES.map((feat, idx) => (
                  <div key={idx} className="banner-upcoming p-3.5 rounded-xl text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-[#f8fafc] text-xs">
                        {feat.title}
                      </span>
                      <span className="badge-warning text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {feat.status}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-[#cbd5e1] text-[11px] leading-relaxed">
                      {feat.description}
                    </p>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 italic">
                      {feat.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Button Action */}
          <div className="modal-footer p-4 sm:p-5 flex-shrink-0">
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
