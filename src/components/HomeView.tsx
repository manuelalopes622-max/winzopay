import React, { useState } from 'react';
import {
  RotateCw,
  Wallet,
  History,
  Building2,
  CreditCard,
  User as UserIcon,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Calculator,
  Cpu,
  ShoppingBag,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  Flame,
  Download,
  Smartphone,
  RefreshCw,
  ArrowDownToLine,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlansSection } from './PlansSection';
import { VERIFIED_SELLERS } from '../data/plans';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ApkDownloadModal } from './ApkDownloadModal';

export const HomeView: React.FC = () => {
  const {
    totalBalance,
    topUpBalance,
    withdrawableBalance,
    pendingWithdrawal,
    activeMiningInvested,
    totalMiningInvested,
    rpMiningBalance,
    todayCommission,
    userPlans,
    activeMiningPlans,
    completedPlans,
    totalMiningProfits,
    bankAccounts,
    addBankAccount,
    setIsManageBankOpen,
    setIsTxHistoryOpen,
    setTxHistoryFilter,
    setActiveTab,
    refreshing,
    triggerRefresh,
    transactions,
    config,
    referralLink,
  } = useApp();

  const {
    isInstallable,
    install,
    isInstalled,
    isDownloaded,
    isDownloadedOrInstalled,
  } = usePWAInstall();
  const [showBalance, setShowBalance] = useState(true);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [appInstalledToast, setAppInstalledToast] = useState(false);
  const [appLinkCopied, setAppLinkCopied] = useState(false);
  const [appCopiedToast, setAppCopiedToast] = useState(false);

  const handleShareAppLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        setAppCopiedToast(true);
        setTimeout(() => {
          setAppLinkCopied(false);
          setAppCopiedToast(false);
        }, 4000);
        return;
      } catch {
        // Fallback to clipboard if share sheet dismissed or not allowed
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
    setAppCopiedToast(true);
    setTimeout(() => {
      setAppLinkCopied(false);
      setAppCopiedToast(false);
    }, 4000);
  };

  const handleDirectInstallApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await install();
    if (result === 'installed') {
      setAppInstalledToast(true);
      setTimeout(() => setAppInstalledToast(false), 5000);
    } else if (result === 'guide' || result === 'dismissed') {
      setIsApkModalOpen(true);
    }
  };

  // Bank Form State
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const primaryBank = bankAccounts.find(b => b.isPrimary) || bankAccounts[0];
  const hasLinkedBank = bankAccounts.length > 0;

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!holderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setFormError('Please fill in all bank details.');
      return;
    }

    if (accountNumber.length < 8) {
      setFormError('Account number must be at least 8 digits.');
      return;
    }

    if (ifscCode.length < 4) {
      setFormError('Please enter a valid IBAN or Branch code (e.g. MEZN0001).');
      return;
    }

    addBankAccount({
      accountHolderName: holderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      isPrimary: bankAccounts.length === 0,
    });

    setFormSuccess(true);
    setHolderName('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');

    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);
  };

  const handleOpenBuyHistory = () => {
    setTxHistoryFilter('PLAN_PURCHASE');
    setIsTxHistoryOpen(true);
  };

  const handleOpenSellHistory = () => {
    setTxHistoryFilter('SELL_RP');
    setIsTxHistoryOpen(true);
  };

  const handleOpenDepositHistory = () => {
    setTxHistoryFilter('DEPOSIT');
    setIsTxHistoryOpen(true);
  };

  const handleOpenWithdrawHistory = () => {
    setTxHistoryFilter('WITHDRAWAL');
    setIsTxHistoryOpen(true);
  };

  const handleOpenAllHistory = () => {
    setTxHistoryFilter('ALL');
    setIsTxHistoryOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-12 flex flex-col gap-6" id="home-view-container">
      {/* Responsive Grid: 1 Col on Mobile, 12-Col on Tablet & Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN (lg:col-span-6 xl:col-span-6): Wallet, Stats & Actions */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-4">
          
          {/* 1. Main Financial Overview Card */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 shadow-md">
            {/* Top row of card */}
            <div className="flex items-center justify-between relative z-10 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                  Top-Up Balance (For RP Purchase)
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
                  title={showBalance ? 'Hide balance' : 'Show balance'}
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerRefresh}
                  className={`text-slate-300 hover:text-white transition-transform cursor-pointer p-1.5 rounded-lg hover:bg-slate-800 ${
                    refreshing ? 'animate-spin text-blue-400' : ''
                  }`}
                  title="Refresh Balance"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold tracking-wider text-slate-200 flex items-center gap-1">
                  Rs. PKR
                </span>
              </div>
            </div>

            {/* Top-Up Balance Display */}
            <div className="relative z-10 my-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-bold opacity-90 text-blue-300">Rs.</span>
                    {showBalance
                      ? topUpBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '••••••'}
                  </h1>
                  <span className="text-[11px] text-blue-300 font-semibold flex items-center gap-1 mt-0.5">
                    Step 1 • Deposited Funds Ready to Buy RP Plans
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Lifecycle Grid (Withdrawable Balance, Mining Capital & RP Yield) */}
            <div className="relative z-10 mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col bg-slate-950/60 p-3 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5" />
                  Withdrawable
                </span>
                <span className="font-black text-white text-base mt-1">
                  Rs. {showBalance ? withdrawableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 }) : '••••'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Step 5: Ready to Withdraw</span>
              </div>

              <div className="flex flex-col bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-blue-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5" />
                  Mining Capital
                </span>
                <span className="font-black text-white text-base mt-1">
                  Rs. {showBalance ? activeMiningInvested.toLocaleString('en-PK', { minimumFractionDigits: 2 }) : '••••'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Step 2 & 3: Active Rigs</span>
              </div>

              <div className="flex flex-col bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  RP Balance
                </span>
                <span className="font-black text-amber-300 text-base mt-1">
                  Rs. {showBalance ? rpMiningBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 }) : '••••'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Step 4: Ready to Sell</span>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* DASHBOARD ANDROID APK & APP DOWNLOAD BANNER (Hides once downloaded/installed) */}
          {/* ============================================================= */}
          {!isDownloadedOrInstalled && (
            <div
              id="dashboard-apk-download-banner"
              className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-sm border border-slate-700 shrink-0 flex items-center justify-center">
                    <img src="/logo.png" alt="WinzoPay App Logo" className="w-full h-full object-contain rounded-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">WinzoPay App</h3>
                      <span className="bg-emerald-800 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-700">
                        Official App
                      </span>
                      {/* Arrow mark to copy and send app link */}
                      <button
                        type="button"
                        onClick={handleShareAppLink}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-white transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                        title="Copy app link to send to others"
                        aria-label="Copy and send app link to others"
                      >
                        {appLinkCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Always updated • Future website updates auto-sync directly</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDirectInstallApp}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-300" />
                    Install App
                  </button>

                  <button
                    type="button"
                    id="share-app-link-btn"
                    onClick={handleShareAppLink}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                    title="Copy & send app link to others"
                  >
                    {appLinkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <span>Share</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Auto-updating highlight tag */}
              <div className="mt-3 pt-3 border-t border-slate-800/90 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <RefreshCw className="w-3 h-3" />
                  Auto-Updating Enabled: No re-download needed on future updates
                </span>
                <button
                  onClick={() => setIsApkModalOpen(true)}
                  className="text-blue-300 hover:text-white font-bold hover:underline cursor-pointer"
                >
                  Guide & Options →
                </button>
              </div>

              {/* Toast when link is copied */}
              {appCopiedToast && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>App link copied! You can now send it to others on WhatsApp, Telegram, or SMS.</span>
                </div>
              )}

              {/* Toast when installed directly */}
              {appInstalledToast && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WinzoPay App successfully installed to your device!</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* 4 SEPARATE ACTION BUTTONS: DEPOSIT, BUY RP, SELL RP, WITHDRAW */}
          {/* ============================================================= */}
          <div className="grid grid-cols-2 gap-3" id="four-main-actions-grid">
            {/* 1. SEPARATE DEPOSIT BUTTON */}
            <button
              id="action-btn-deposit"
              onClick={() => setActiveTab('deposit')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">Deposit</p>
                  <p className="text-[10px] text-slate-500 font-medium">Top-Up Balance</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Step 1
              </span>
            </button>

            {/* 2. SEPARATE BUY RP BUTTON */}
            <button
              id="action-btn-buy-rp"
              onClick={() => setActiveTab('buy_rp')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">Buy RP</p>
                  <p className="text-[10px] text-slate-500 font-medium">RP Mining Plan</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Step 2
              </span>
            </button>

            {/* 3. SEPARATE SELL RP BUTTON */}
            <button
              id="action-btn-sell-rp"
              onClick={() => setActiveTab('sell_rp')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">Sell RP</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {completedPlans.length > 0 ? `${completedPlans.length} RP Ready` : 'Sell to Seller'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Step 5
              </span>
            </button>

            {/* 4. SEPARATE WITHDRAW BUTTON */}
            <button
              id="action-btn-withdraw"
              onClick={() => setActiveTab('withdraw')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">Withdraw</p>
                  <p className="text-[10px] text-slate-500 font-medium">Withdrawable Bal</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Step 6
              </span>
            </button>
          </div>

          {/* Active Mining Rigs Banner (if any) */}
          {activeMiningPlans.length > 0 && (
            <div
              onClick={() => setActiveTab('mining')}
              className="bg-white border border-blue-200 rounded-2xl p-4 cursor-pointer hover:border-blue-300 transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {activeMiningPlans.length} RP Mining {activeMiningPlans.length === 1 ? 'Rig' : 'Rigs'} In Progress
                    <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">LIVE</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Invested: Rs. {totalMiningInvested.toLocaleString('en-PK')} • Hashrate: Active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-900">
                View Rigs <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Quick Transaction History Navigation */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transaction Records</h2>
            <div className="grid grid-cols-4 gap-2">
              <button
                id="quick-deposit-history-btn"
                onClick={handleOpenDepositHistory}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 text-center leading-tight">
                  Deposits
                </span>
              </button>

              <button
                id="quick-buy-history-btn"
                onClick={handleOpenBuyHistory}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 text-center leading-tight">
                  Plan Purchases
                </span>
              </button>

              <button
                id="quick-sell-history-btn"
                onClick={handleOpenSellHistory}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 text-center leading-tight">
                  RP Sales
                </span>
              </button>

              <button
                id="quick-withdraw-history-btn"
                onClick={handleOpenWithdrawHistory}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 text-center leading-tight">
                  Withdrawals
                </span>
              </button>
            </div>
          </div>

          {/* Quick Bank Account Status / Add Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linked Payout Bank Account
                </h3>
              </div>
              <button
                onClick={() => setIsManageBankOpen(true)}
                className="text-[11px] text-blue-900 hover:underline font-bold transition-colors"
              >
                Manage ({bankAccounts.length})
              </button>
            </div>

            {hasLinkedBank ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-950 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{primaryBank?.bankName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      A/C: •••• {primaryBank?.accountNumber.slice(-4)} | IBAN/Code: {primaryBank?.ifscCode}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-950 px-2 py-0.5 rounded-md border border-blue-200">
                  Primary
                </span>
              </div>
            ) : (
              <form onSubmit={handleBankSubmit} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Link your bank account to enable withdrawals and activate full balance visibility.
                </p>
                {formError && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    Bank account linked successfully!
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. Meezan, HBL, UBL)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="IBAN / Branch Code (e.g. MEZN0001)"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Link Bank Account
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN (lg:col-span-6 xl:col-span-6): Plans & Calculator   */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-4">
          {/* Plans Section */}
          <PlansSection onSelectPlan={() => setActiveTab('buy_rp')} />

          {/* Verified Buyers / Sellers Marketplace Desk */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Verified RP Buyers & Desks
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('sell_rp')}
                className="text-[11px] text-blue-900 hover:underline font-bold"
              >
                Sell RP →
              </button>
            </div>

            <div className="space-y-2">
              {VERIFIED_SELLERS.slice(0, 2).map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => setActiveTab('sell_rp')}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{seller.name}</span>
                      <span className="bg-blue-100 text-blue-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        {seller.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ★ {seller.rating} • {seller.completedTrades.toLocaleString('en-PK')} trades • {seller.fillRate} Fill
                    </p>
                  </div>
                  <span className="text-xs text-blue-900 font-bold">Sell Now →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* APK & App Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
};
