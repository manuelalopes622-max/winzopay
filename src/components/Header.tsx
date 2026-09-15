import React, { useState } from 'react';
import {
  Bell,
  LogIn,
  Home,
  Building2,
  History,
  Wallet,
  ArrowDownLeft,
  Cpu,
  ShoppingBag,
  ArrowUpRight,
  Activity,
  Users,
  Smartphone,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ApkDownloadModal } from './ApkDownloadModal';

export const Header: React.FC = () => {
  const {
    userName,
    isLoggedIn,
    unreadNotificationCount,
    setIsNotificationOpen,
    setIsAuthModalOpen,
    activeTab,
    setActiveTab,
    availableBalance,
    totalMiningInvested,
    activeMiningPlans,
    setIsManageBankOpen,
    setIsTxHistoryOpen,
    vipLevel,
    referralLink,
  } = useApp();

  const { isStandaloneApp } = usePWAInstall();
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [appLinkCopied, setAppLinkCopied] = useState(false);

  const handleShareAppLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = referralLink || (typeof window !== 'undefined' ? window.location.origin : 'https://winzopay-website.onrender.com');
    const shareData = {
      title: 'WinzoPay App',
      text: 'Install WinzoPay App for instant deposits, trading, and fast withdrawals:',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setAppLinkCopied(true);
        setTimeout(() => setAppLinkCopied(false), 3000);
        return;
      } catch {
        // Fallback to clipboard
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

    setAppLinkCopied(true);
    setTimeout(() => setAppLinkCopied(false), 3000);
  };

  return (
    <header className="w-full bg-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      {/* Brand & User Greeting */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveTab('home')}
        >
          <img
            src="/logo.png"
            alt="WinzoPay Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover shadow-md border border-amber-400/40 bg-slate-950 transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none">
                WinzoPay
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold">
                RP Portal
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1 leading-none mt-0.5">
              {isLoggedIn ? (
                <>
                  Hi, <strong className="text-white font-semibold">{userName || 'User'}</strong>
                  {vipLevel > 1 && (
                    <span className="text-amber-300 text-[10px] font-bold flex items-center">
                      ★ VIP{vipLevel}
                    </span>
                  )}
                </>
              ) : (
                'Secure RP Trading Portal'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links (Visible on md & above) */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'home'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'deposit'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => setActiveTab('buy_rp')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'buy_rp'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Buy RP</span>
        </button>

        <button
          onClick={() => setActiveTab('mining')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'mining'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Mining</span>
          {activeMiningPlans.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sell_rp')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sell_rp'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Sell RP</span>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'withdraw'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Withdraw</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>My Team</span>
        </button>

        <button
          onClick={() => setIsTxHistoryOpen(true)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Profile</span>
        </button>
      </nav>

      {/* Right Action Icons & Auth */}
      <div className="flex items-center gap-2">
        {/* Desktop Balance Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
          <Wallet className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 font-medium">Top-Up:</span>
          <span className="font-extrabold text-white">
            Rs. {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Auth Button */}
        {!isLoggedIn ? (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('profile')}
            className="md:hidden w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs"
            title="My Profile"
          >
            {userName ? userName[0].toUpperCase() : 'U'}
          </button>
        )}

        {/* Notification Bell */}
        <button
          id="notification-bell-btn"
          onClick={() => setIsNotificationOpen(true)}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Header Share App Link with Arrow Mark */}
        <button
          type="button"
          onClick={handleShareAppLink}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer border border-slate-700"
          title="Share app link with others"
          aria-label="Share app link"
        >
          {appLinkCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>

        {/* Header Install App Action */}
        {!isStandaloneApp && (
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs cursor-pointer border border-emerald-600/40"
            title="Install WinzoPay App"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}
      </div>

      {/* APK & App Installation Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </header>
  );
};
