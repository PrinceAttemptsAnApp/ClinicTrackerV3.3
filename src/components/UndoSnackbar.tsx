import React, { useEffect, useState } from 'react';
import { Undo2, X, Trash2 } from 'lucide-react';
import { DentalCase, ClinicalProcedure } from '../types';

export interface UndoNotification {
  id: string;
  type: 'case' | 'procedure';
  title: string;
  subtitle?: string;
  snapshot: DentalCase | ClinicalProcedure;
  caseId?: string;
  durationMs?: number;
}

interface UndoSnackbarProps {
  notification: UndoNotification | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  notification,
  onUndo,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) {
      setProgress(100);
      return;
    }

    const duration = notification.durationMs || 6500;
    const intervalMs = 50;
    const step = (intervalMs / duration) * 100;

    setProgress(100);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [notification?.id, notification?.durationMs, onDismiss]);

  if (!notification) return null;

  return (
    <div
      id="dentatrack-undo-snackbar"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md">
        <div className="p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                Deleted {notification.type === 'case' ? 'Case' : 'Procedure'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {notification.title}
                {notification.subtitle ? ` • ${notification.subtitle}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              id="btn-undo-deletion"
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              id="btn-dismiss-undo"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic countdown line showing remaining undo time window */}
        <div className="h-1 w-full bg-slate-800/80">
          <div
            className="h-full bg-sky-400/90 transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
