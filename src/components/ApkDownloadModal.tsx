import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
  Share2,
  PlusSquare,
  AlertCircle,
  ExternalLink,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const {
    isInstallable,
    isInstalled,
    isDownloaded,
    isDownloadedOrInstalled,
    isIOS,
    isAndroid,
    install,
  } = usePWAInstall();
  const { referralLink } = useApp();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [modalLinkCopied, setModalLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  if (!isOpen) return null;

  const handleShareAppLink = async () => {
    const shareUrl = referralLink || (typeof window !== 'undefined' ? window.location.origin : 'https://winzopay-website.onrender.com');
    const shareData = {
      title: 'WinzoPay App',
      text: 'Install WinzoPay App for instant deposits, trading, and fast withdrawals:',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setModalLinkCopied(true);
        setTimeout(() => setModalLinkCopied(false), 3000);
        return;
      } catch {
        // Fallback
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setModalLinkCopied(true);
    setTimeout(() => setModalLinkCopied(false), 3000);
  };

  const handleInstallClick = async () => {
    const res = await install();
    if (res === 'installed' || res === 'iframe_redirect') {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      id="apk-download-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="apk-download-modal"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-slate-700 flex items-center justify-center">
              <img src="/logo.png" alt="WinzoPay Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black text-white">WinzoPay App</h3>
                <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                  Official App
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install Directly to Home Screen
              </p>
            </div>
          </div>

          {/* Auto Update Highlight Banner */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-2.5 text-xs text-emerald-300">
            <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="font-bold text-white">Live Auto-Updating:</span> Any future website updates automatically apply to this app!
            </div>
          </div>
        </div>

        {/* Tab switch for Android vs iOS */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'android'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Android
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'ios'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
            iOS (Apple Safari)
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs">
          {activeTab === 'android' ? (
            <>
              {/* Primary Action Section */}
              {isDownloadedOrInstalled && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>App Running in Standalone Mode</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    You are running the official app with live auto-updates.
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                {/* 1. Direct App Installation */}
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  1-Tap Install App (Direct)
                </button>

                {/* 2. Arrow Mark Share / Copy App Link */}
                <button
                  type="button"
                  onClick={handleShareAppLink}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
                >
                  {modalLinkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">App Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <span>Copy App Link to Send to Others</span>
                      <ArrowUpRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>

              {installSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>WinzoPay App successfully installed to your home screen!</span>
                </div>
              )}

              {/* How future updates work */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-800" />
                  Zero-Maintenance Live Updates
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  WinzoPay connects directly to our cloud deployment. When the administrator updates the portal, your installed app <strong>instantly loads the latest version upon launch</strong>.
                </p>
              </div>

              {/* Step-by-step Installation Instructions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Installation Guide
                </h4>
                
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 text-[11px] block">
                    Instant Browser Install (Google Chrome or Samsung Internet)
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Open this page in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone. Tap the <strong>⋮ Menu</strong> (top right) and choose <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>

              {/* App Features List */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Virus & Malware Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Instant RP & Withdrawal Alerts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Smooth Full-Screen Mode</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                  <span>Automatic Background Sync</span>
                </div>
              </div>
            </>
          ) : (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 text-xs">For iPhone & iPad Users</span>
                <p className="text-[11px] text-amber-800">
                  Apple iOS does not use APK files. Instead, install WinzoPay directly via Safari in 2 simple steps:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Tap the Share Button</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      In Safari toolbar (at the bottom or top of your screen), tap the <strong>Share</strong> icon (square with arrow pointing up).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Select "Add to Home Screen"</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Scroll down in the action sheet and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong> at top right.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-xl text-center">
                ✨ The WinzoPay app icon will appear on your iOS home screen and auto-updates with every future portal update!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
