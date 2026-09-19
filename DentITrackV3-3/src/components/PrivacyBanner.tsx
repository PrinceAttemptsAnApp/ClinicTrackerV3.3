import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('dentatrack_privacy_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('dentatrack_privacy_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="mx-4 sm:mx-6 my-2 p-2.5 sm:px-4 rounded-xl bg-slate-900 text-white shadow-sm flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <p className="font-medium text-slate-200">
          <strong className="text-white">Academic Privacy Notice:</strong> Store only the minimum patient identifiers necessary (Patient Name & File #) for your 5th-year academic records. All data remains strictly local on your device.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
