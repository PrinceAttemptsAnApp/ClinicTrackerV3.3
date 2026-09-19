import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  X, 
  PlusSquare, 
  Compass, 
  HardDrive, 
  ShieldCheck, 
  ExternalLink,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  forceShowModal?: boolean;
  onCloseModal?: () => void;
  variant?: 'header' | 'settings' | 'standalone';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  forceShowModal = false,
  onCloseModal,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(forceShowModal);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('dentatrack_install_dismissed') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    const isMobile = /android|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    return isMobile ? 'android' : 'desktop';
  });
  const [copied, setCopied] = useState(false);

  // Sync external control of modal if prop passed
  useEffect(() => {
    if (forceShowModal) {
      setShowModal(true);
    }
  }, [forceShowModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseModal) {
      onCloseModal();
    }
  };

  const handleDismissButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('dentatrack_install_dismissed', 'true');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'DentaTrack - 5th Year Dental Clinical Tracker',
      text: 'Track dental requirements, signed rubrics, and Moodle submissions offline on iOS, Android, and PC.',
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share not supported
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Clipboard write failed
      }
    }
  };

  // Detect in-app browser on iOS (e.g. inside Facebook, Instagram, WhatsApp, Gmail, Telegram)
  const isIOSInAppBrowser = isIOS && (
    /fban|fbav|instagram|crios|fxios|opios|edgios|linkedinapp|twitter|snapchat|line/i.test(navigator.userAgent) ||
    !('standalone' in window.navigator)
  );

  // If already running in standalone mode (already installed), we don't render the header button
  if (isInstalled && variant === 'header') {
    return null;
  }

  // If dismissed by user and in header variant, don't show the button
  if (isDismissed && variant === 'header' && !forceShowModal) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <div className="flex items-center group relative">
          {/* If Chromium native install is available (Android / Windows / Chrome) */}
          {isInstallable ? (
            <div className="flex items-center rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm p-0.5">
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold hover:opacity-95 transition cursor-pointer"
                title="Install DentaTrack directly to your Device"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="px-1.5 py-1 text-sky-200 hover:text-white transition cursor-pointer border-l border-sky-500/50"
                title="View Installation & iOS Guide"
              >
                <Info className="w-3 h-3" />
              </button>

              <button
                onClick={handleDismissButton}
                className="p-1 text-sky-200 hover:text-white hover:bg-sky-800/40 rounded-lg transition cursor-pointer border-l border-sky-500/50"
                title="Close / Dismiss install button"
                aria-label="Dismiss install button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* iOS or generic browser button */
            <div className="flex items-center rounded-xl neu-btn p-0.5">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-sky-700 transition cursor-pointer"
                title="Install Guide for iOS, Android & PC"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
              </button>

              <button
                onClick={handleDismissButton}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200/50 rounded-lg transition cursor-pointer border-l border-slate-300/60"
                title="Close / Dismiss install button"
                aria-label="Dismiss install button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guide Modal with Detailed iOS Steps and Offline Local Storage details */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="frosted-card w-full max-w-lg rounded-2xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto shadow-2xl border border-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (X) */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
              title="Close Guide (Esc)"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 flex items-center justify-center text-sky-600 font-bold border border-sky-500/30 flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Install DentaTrack PWA
                </h3>
                <p className="text-xs text-slate-500">
                  100% Offline • Locally Saved • Zero Cloud Server Dependency
                </p>
              </div>
            </div>

            {/* Offline & Local Guarantee Box */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Entirely Offline & Local Storage</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  All patient records, clinical rubrics, step milestones, and photos are stored directly in your device&apos;s internal IndexedDB. No internet connection is needed during clinical sessions.
                </p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex rounded-xl bg-slate-200/60 p-1 mb-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🍎</span>
                <span>iOS (iPhone/iPad)</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🤖</span>
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💻</span>
                <span>PC & Mac</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-3 text-xs text-slate-700">
              {/* iOS Guide */}
              {activeTab === 'ios' && (
                <div className="space-y-3">
                  {isIOSInAppBrowser && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                      <Compass className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">In-App Browser Detected:</strong>
                        Apple iOS only permits home screen installation from <strong>Safari</strong>. Please tap the menu (•••) and select <strong>&quot;Open in Safari&quot;</strong>.
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                      <span className="font-extrabold text-sky-950 flex items-center gap-1.5 text-xs">
                        <span>🍎</span> iOS Safari Step-by-Step Installation
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200/70 text-sky-800">
                        Safari Exclusive
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                          1
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Open in Safari</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Make sure this page is open in Apple&apos;s native <strong>Safari</strong> browser on your iPhone or iPad.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                          2
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Tap the Share Button</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-slate-300 text-sky-600 shadow-2xs">
                              <Share2 className="w-3.5 h-3.5" />
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            • On <strong>iPhone</strong>: Look at the <strong>bottom toolbar</strong> for the square with an arrow pointing up.<br />
                            • On <strong>iPad</strong>: Look at the <strong>top-right toolbar</strong> next to the address bar.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                          3
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Select &quot;Add to Home Screen&quot;</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 shadow-2xs">
                              <PlusSquare className="w-3.5 h-3.5 text-sky-600" />
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Scroll down the action list in the share sheet and tap <strong>Add to Home Screen</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                          4
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Tap &quot;Add&quot; in Top-Right</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Confirm the app name (DentaTrack) and tap <strong>Add</strong> in the top-right corner.
                          </p>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">Done! Launch Full-Screen & Offline</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Find the DentaTrack icon on your home screen. It will open without browser bars and store all clinic patient records securely in local storage.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Android Guide */}
              {activeTab === 'android' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                      <span>🤖</span> Android Installation
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800">
                      Chrome & Edge
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Android supports native 1-click Progressive Web App installation directly through Chrome, Edge, or Samsung Internet.
                  </p>

                  {isInstallable && (
                    <button
                      onClick={() => {
                        install();
                        handleCloseModal();
                      }}
                      className="w-full neu-btn-primary py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Now on this Device</span>
                    </button>
                  )}

                  <div className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                    <p className="font-semibold text-slate-800">Manual Alternative:</p>
                    <p>1. Tap the Chrome menu <strong>(⋮)</strong> in the top-right corner.</p>
                    <p>2. Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
                    <p>3. Tap <strong>Install</strong> to add DentaTrack to your app drawer.</p>
                  </div>
                </div>
              )}

              {/* Desktop Guide */}
              {activeTab === 'desktop' && (
                <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Monitor className="w-4 h-4 text-slate-700" /> Windows PC & Mac
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Chrome / Edge
                    </span>
                  </div>

                  {isInstallable && (
                    <button
                      onClick={() => {
                        install();
                        handleCloseModal();
                      }}
                      className="w-full neu-btn-primary py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install on Windows / Mac</span>
                    </button>
                  )}

                  <div className="text-[11px] text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-800">Browser Address Bar:</p>
                    <p>
                      Look at the right side of your address bar (near the bookmark star) for the <strong>Install icon 💻</strong> or click the browser menu (⋮) → <strong>Install DentaTrack</strong>.
                    </p>
                    <p className="text-slate-500 italic">
                      Opens in its own standalone window with keyboard shortcuts, offline caching, and desktop notifications.
                    </p>
                  </div>
                </div>
              )}

              {/* Share with Dental Clinic Colleagues */}
              <div className="pt-2 border-t border-slate-200/70">
                <button
                  onClick={handleShareApp}
                  className="w-full neu-btn py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sky-700 cursor-pointer hover:bg-sky-50/60 transition text-xs"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-sky-600" />
                      <span>Share Link with Dental Clinic Group</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Actions: Close & Dismiss option */}
            <div className="mt-5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <button
                onClick={() => {
                  setIsDismissed(true);
                  localStorage.setItem('dentatrack_install_dismissed', 'true');
                  handleCloseModal();
                }}
                className="text-slate-400 hover:text-rose-600 hover:underline transition cursor-pointer text-[11px] order-2 sm:order-1"
              >
                Hide install button from header
              </button>

              <button
                onClick={handleCloseModal}
                className="neu-btn px-6 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 cursor-pointer w-full sm:w-auto order-1 sm:order-2"
              >
                Got it, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
