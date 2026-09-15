import React, { useState } from 'react';
import {
  Building2,
  HelpCircle,
  Headphones,
  KeyRound,
  MessageSquare,
  ChevronRight,
  Award,
  LogOut,
  ExternalLink,
  Sparkles,
  LogIn,
  UserPlus,
  History,
  Users,
  ShieldCheck,
  Gift,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfileView: React.FC = () => {
  const {
    userId,
    userName,
    userPhone,
    totalBalance,
    todayCommission,
    vipLevel,
    isLoggedIn,
    bankAccounts,
    usdtWallets,
    referralCode,
    referredBy,
    referrerName,
    joinedViaReferralCode,
    joinedViaReferralLink,
    teamMembers,
    setActiveTab,
    logout,
    setIsAuthModalOpen,
    setIsManageBankOpen,
    setIsSupportOpen,
    setIsResetPasswordOpen,
    setIsFaqOpen,
    setIsTxHistoryOpen,
    config,
  } = useApp();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copiedMyCode, setCopiedMyCode] = useState(false);

  const handleOpenTelegram = () => {
    window.open(config.officialChannel, '_blank');
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedMyCode(true);
    setTimeout(() => setCopiedMyCode(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12 text-slate-900">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN (lg:col-span-5): Profile Identity & Balance Snapshot */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* User Profile Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
            {isLoggedIn && userName ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 p-0.5 shadow-xs">
                    <div className="w-full h-full rounded-[22px] bg-blue-900 flex items-center justify-center text-white font-black text-xl">
                      {userName ? userName[0].toUpperCase() : 'U'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {userName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 border border-amber-200">
                        <Award className="w-3 h-3 text-amber-600" /> VIP {vipLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{userPhone || 'Verified User'}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">UID: {userId || '74920194'}</p>
                  </div>
                </div>

                {/* VIP Status Bar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-amber-800 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> VIP Tier Level {vipLevel}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">0.5% Commission Boost</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-900 h-full rounded-full w-3/4" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Sign Up / Login</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Enter your name, mobile, and bank details</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Create Account
                </button>
              </div>
            )}

            {/* Wallet Overview Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Wallet Balance</span>
                <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
                  {bankAccounts.length > 0
                    ? `Rs. ${totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                    : 'Rs. --'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Commission</span>
                <span className="text-base sm:text-lg font-black text-blue-900 mt-1 block">
                  {bankAccounts.length > 0
                    ? `Rs. ${todayCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                    : 'Rs. --'}
                </span>
              </div>
            </div>

            {/* Referral Info Card */}
            {isLoggedIn && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-blue-900" />
                    <span className="text-xs font-black text-slate-900">Referral ID & Origin</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="text-[11px] text-blue-900 hover:underline font-bold cursor-pointer"
                  >
                    View Team →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">My Code</span>
                      <span className="font-mono font-bold text-blue-900 truncate">{referralCode || 'WZP-DIRECT'}</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy my referral code"
                    >
                      {copiedMyCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Joined Via</span>
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {joinedViaReferralCode || referredBy || 'Direct Signup'}
                    </span>
                  </div>
                </div>

                {referrerName && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Invited by: <strong className="text-slate-900">{referrerName}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Logout / Switch Button */}
            {isLoggedIn && (
              <button
                id="profile-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Switch Account
              </button>
            )}
          </div>

        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN (lg:col-span-7): Interactive Settings & Services Grid */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Services & Account Settings</h3>
              <span className="text-xs text-slate-500 font-medium">Quick Access</span>
            </div>

            {/* Interactive Grid of Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Referral Team */}
              <button
                id="profile-referral-team-btn"
                onClick={() => setActiveTab('team')}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-blue-200/80 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs bg-gradient-to-br from-blue-50/40 via-white to-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      My Referral Team
                    </span>
                    <span className="text-[11px] text-blue-900 font-semibold">
                      {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'} Joined
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
              </button>

              {/* 2. Bank Card */}
              <button
                id="profile-bank-card-btn"
                onClick={() => setIsManageBankOpen(true)}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Manage Bank Cards
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {bankAccounts.length > 0 ? `${bankAccounts.length} Linked Accounts` : '0 Added'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
              </button>

              {/* 2b. USDT Wallets */}
              <button
                id="profile-usdt-wallet-btn"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-usdt-wallet-management'));
                  setIsManageBankOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-emerald-200/80 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        USDT Wallets
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        Crypto
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      {usdtWallets.length > 0 ? `${usdtWallets.length} Linked (TRC20/BEP20)` : '0 Added (Link for Crypto)'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 transition-colors" />
              </button>

              {/* 3. Transaction History */}
              <button
                onClick={() => setIsTxHistoryOpen(true)}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Ledger & History
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      View all transactions
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </button>

              {/* 4. 24/7 Live Support */}
              <button
                id="profile-online-service-btn"
                onClick={() => setIsSupportOpen(true)}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Online 24/7 Service
                    </span>
                    <span className="text-[11px] text-blue-900 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900 animate-pulse" /> Live Desk
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
              </button>

              {/* 5. Common Problem FAQ */}
              <button
                id="profile-common-problem-btn"
                onClick={() => setIsFaqOpen(true)}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Common FAQs
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Trading & UTR questions
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </button>

              {/* 6. Reset Password */}
              <button
                id="profile-reset-password-btn"
                onClick={() => setIsResetPasswordOpen(true)}
                className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between group text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Reset Password
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Update account security
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </button>

            </div>

            {/* Official Telegram / Community Channel */}
            <button
              id="profile-official-channel-btn"
              onClick={handleOpenTelegram}
              className="w-full bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-center justify-between transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                    Join Official Community Channel
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Daily trade signals & updates on Telegram
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-900 font-bold text-xs">
                <span>Join</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </button>

          </div>

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Sign Out</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to sign out? You can sign back in anytime.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                }}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-xs cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
