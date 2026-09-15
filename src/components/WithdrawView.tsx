import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCw,
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  QrCode,
  Upload,
  Check,
  Wallet,
  HelpCircle,
  History,
  ChevronRight,
  X,
  ShoppingBag,
  Cpu,
  ArrowDownLeft,
  Coins,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WithdrawView: React.FC = () => {
  const {
    availableBalance,
    topUpBalance,
    withdrawableBalance,
    rpMiningBalance,
    activeMiningPlans,
    completedPlans,
    bankAccounts,
    usdtWallets,
    submitWithdrawal,
    config,
    userName,
    userId,
    userPhone,
    withdrawalRequests,
    transactions,
    setActiveTab,
    setIsAddBankModalOpen,
    setIsManageBankOpen,
    setIsTxHistoryOpen,
    setTxHistoryFilter,
    refreshing,
    triggerRefresh,
    checkBelongsToUser,
  } = useApp();

  const [payoutMethod, setPayoutMethod] = useState<'BANK_TRANSFER' | 'UPI_QR' | 'USDT'>('BANK_TRANSFER');
  const [amountStr, setAmountStr] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    const primary = bankAccounts.find(b => b.isPrimary);
    return primary ? primary.id : bankAccounts[0]?.id || '';
  });

  // USDT payout states
  const [selectedUsdtWalletId, setSelectedUsdtWalletId] = useState<string>(() => {
    const primary = usdtWallets.find(w => w.isPrimary);
    return primary ? primary.id : (usdtWallets[0]?.id || 'custom');
  });
  const [customUsdtAddress, setCustomUsdtAddress] = useState('');
  const [selectedUsdtNetwork, setSelectedUsdtNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');

  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [uploadedQrPreview, setUploadedQrPreview] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [withdrawFilter, setWithdrawFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'REJECTED'>('ALL');
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [selectedWithdrawReceipt, setSelectedWithdrawReceipt] = useState<{
    id: string;
    amount: number;
    status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'REJECTED';
    bankName?: string;
    accountNumber?: string;
    payoutMethod?: string;
    payoutUpiId?: string;
    usdtAddress?: string;
    usdtNetwork?: string;
    usdtAmount?: number;
    createdAt: string;
    rejectedReason?: string;
  } | null>(null);

  // Compute user withdrawals and amounts for Approved, Pending, and Rejected
  const userWithdrawals = useMemo(() => {
    const reqMap = new Map<
      string,
      {
        id: string;
        amount: number;
        status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'REJECTED';
        bankName?: string;
        accountNumber?: string;
        payoutMethod?: string;
        payoutUpiId?: string;
        usdtAddress?: string;
        usdtNetwork?: string;
        usdtAmount?: number;
        createdAt: string;
        rejectedReason?: string;
      }
    >();

    const cleanPhone = (userPhone || '').replace(/\D/g, '');

    // 1. Ingest from withdrawalRequests (real-time Firestore synced, strictly for authenticated user)
    withdrawalRequests.forEach((req) => {
      if (checkBelongsToUser(req, userId, cleanPhone)) {
        reqMap.set(`id_${req.id}`, {
          id: req.id,
          amount: req.amount,
          status: req.status === 'PROCESSING' ? 'PENDING' : req.status,
          bankName: req.bankAccount?.bankName,
          accountNumber: req.bankAccount?.accountNumber,
          payoutMethod: req.payoutMethod,
          payoutUpiId: req.payoutUpiId,
          usdtAddress: req.usdtAddress,
          usdtNetwork: req.usdtNetwork,
          usdtAmount: req.usdtAmount,
          createdAt: req.createdAt,
          rejectedReason: req.rejectedReason,
        });
      }
    });

    // 2. Ingest from ledger transactions of type WITHDRAWAL (strictly for authenticated user)
    transactions
      .filter((t) => t.type === 'WITHDRAWAL' && checkBelongsToUser(t, userId, cleanPhone))
      .forEach((tx) => {
        const key = `id_${tx.id}`;
        const existing = reqMap.get(key);
        if (existing) {
          if (tx.status === 'SUCCESS' || existing.status === 'SUCCESS') {
            existing.status = 'SUCCESS';
          } else if (tx.status === 'REJECTED' || existing.status === 'REJECTED') {
            existing.status = 'REJECTED';
          }
        } else {
          // Check if notes reference an existing withdrawal request ID
          let matched = false;
          for (const [, val] of reqMap.entries()) {
            if (tx.notes && tx.notes.includes(val.id)) {
              if (tx.status === 'SUCCESS' || val.status === 'SUCCESS') {
                val.status = 'SUCCESS';
              } else if (tx.status === 'REJECTED' || val.status === 'REJECTED') {
                val.status = 'REJECTED';
              }
              matched = true;
              break;
            }
          }
          if (!matched) {
            reqMap.set(key, {
              id: tx.id,
              amount: tx.amount,
              status: tx.status === 'PROCESSING' ? 'PENDING' : tx.status,
              bankName: tx.bankDetails?.bankName,
              accountNumber: tx.bankDetails?.accountNumber,
              payoutMethod: tx.payoutMethod,
              payoutUpiId: tx.payoutUpiId,
              usdtAddress: tx.usdtAddress,
              usdtNetwork: tx.usdtNetwork,
              usdtAmount: tx.usdtAmount,
              createdAt: tx.createdAt || tx.timestamp,
              rejectedReason: tx.notes,
            });
          }
        }
      });

    return Array.from(reqMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [withdrawalRequests, transactions, userId, userPhone]);

  const filteredUserWithdrawals = useMemo(() => {
    return userWithdrawals.filter((w) => {
      if (withdrawFilter === 'SUCCESS' && w.status !== 'SUCCESS') return false;
      if (withdrawFilter === 'PENDING' && w.status !== 'PENDING' && w.status !== 'PROCESSING') return false;
      if (withdrawFilter === 'REJECTED' && w.status !== 'REJECTED') return false;

      if (withdrawSearch.trim()) {
        const q = withdrawSearch.toLowerCase().trim();
        const matchId = w.id.toLowerCase().includes(q);
        const matchBank = w.bankName?.toLowerCase().includes(q);
        const matchAcc = w.accountNumber?.toLowerCase().includes(q);
        const matchUpi = w.payoutUpiId?.toLowerCase().includes(q);
        const matchAmt = w.amount.toString().includes(q);
        return matchId || matchBank || matchAcc || matchUpi || matchAmt;
      }
      return true;
    });
  }, [userWithdrawals, withdrawFilter, withdrawSearch]);

  const totalApprovedWithdrawals = useMemo(() => {
    return userWithdrawals
      .filter((w) => w.status === 'SUCCESS')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [userWithdrawals]);

  const totalPendingWithdrawals = useMemo(() => {
    return userWithdrawals
      .filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [userWithdrawals]);

  const approvedCount = userWithdrawals.filter((w) => w.status === 'SUCCESS').length;
  const pendingCount = userWithdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING').length;
  const rejectedCount = userWithdrawals.filter((w) => w.status === 'REJECTED').length;

  const activeBank = bankAccounts.find(b => b.id === selectedBankId) || bankAccounts[0];

  const handleAmountChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setAmountStr(numeric);
    setWithdrawStatus(null);
  };

  const handleQuickPercent = (percent: number) => {
    const calculated = Math.floor((withdrawableBalance * percent) / 100);
    setAmountStr(calculated.toString());
    setWithdrawStatus(null);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedQrPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amountStr, 10);
    if (!num || isNaN(num)) {
      setWithdrawStatus({ success: false, message: 'Please enter a valid withdrawal amount.' });
      return;
    }

    if (num < config.minWithdraw) {
      setWithdrawStatus({ success: false, message: `Minimum withdrawal amount is Rs. ${config.minWithdraw}` });
      return;
    }

    if (num > config.maxWithdraw) {
      setWithdrawStatus({ success: false, message: `Maximum single withdrawal is Rs. ${config.maxWithdraw.toLocaleString('en-PK')}` });
      return;
    }

    if (num > withdrawableBalance) {
      setWithdrawStatus({ success: false, message: 'Insufficient Withdrawable balance. Sell completed mined RP first to generate withdrawable balance.' });
      return;
    }

    if (payoutMethod === 'BANK_TRANSFER' && !activeBank) {
      setWithdrawStatus({ success: false, message: 'Please add a bank account first.' });
      return;
    }

    if (payoutMethod === 'UPI_QR' && !payoutUpiId.trim() && !uploadedQrPreview) {
      setWithdrawStatus({ success: false, message: 'Please enter your Payout Account / ID or upload your Payout QR code.' });
      return;
    }

    let finalUsdtAddress: string | undefined;
    let finalUsdtNetwork: string = selectedUsdtNetwork;

    if (payoutMethod === 'USDT') {
      const chosenWallet = usdtWallets.find((w) => w.id === selectedUsdtWalletId);
      finalUsdtAddress = (chosenWallet ? chosenWallet.address : customUsdtAddress).trim();
      finalUsdtNetwork = chosenWallet ? chosenWallet.network : selectedUsdtNetwork;

      if (!finalUsdtAddress) {
        setWithdrawStatus({ success: false, message: 'Please provide or select a USDT wallet address.' });
        return;
      }

      if (finalUsdtNetwork === 'TRC20' && !finalUsdtAddress.startsWith('T')) {
        setWithdrawStatus({ success: false, message: 'USDT TRC-20 address must start with "T" (Tron Network).' });
        return;
      }

      if (finalUsdtNetwork === 'BEP20' && !finalUsdtAddress.startsWith('0x')) {
        setWithdrawStatus({ success: false, message: 'USDT BEP-20 address must start with "0x" (BNB Smart Chain).' });
        return;
      }

      if (finalUsdtAddress.length < 24) {
        setWithdrawStatus({ success: false, message: 'USDT address is too short. Please verify.' });
        return;
      }
    }

    const res = submitWithdrawal(
      num,
      payoutMethod === 'BANK_TRANSFER' ? activeBank?.id : undefined,
      payoutMethod,
      payoutMethod === 'UPI_QR' ? (payoutUpiId.trim() || undefined) : undefined,
      payoutMethod === 'UPI_QR' ? (uploadedQrPreview || undefined) : undefined,
      payoutMethod === 'USDT' ? finalUsdtAddress : undefined,
      payoutMethod === 'USDT' ? finalUsdtNetwork : undefined
    );

    setWithdrawStatus(res);
    if (res.success) {
      setAmountStr('');
      setUploadedQrPreview(null);
      setCustomUsdtAddress('');
    }
  };

  const numAmount = parseInt(amountStr, 10) || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900" id="withdraw-view">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            id="withdraw-back-btn"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-900" />
              Withdrawal (Bank & QR / Wallet)
            </h1>
            <p className="text-[11px] text-slate-500">Step 6: Withdraw available Withdrawable balance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            className={`p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
              refreshing ? 'animate-spin text-blue-900' : ''
            }`}
            title="Refresh balance"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Step Indicator Banner */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                6
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Step 6: Submit Withdrawal Request
                  <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Admin Approval Required</span>
                </p>
                <p className="text-[11px] text-slate-600">Deducted from Withdrawable Balance & transferred to your bank on Admin approval (Top-Up balance is untouched)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Withdrawable Balance Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                Withdrawable Balance
              </span>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                Rs. {withdrawableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Clock className="w-3.5 h-3.5" />
                24x7 1Link / Raast Fast
              </span>
              <span className="text-[11px] text-slate-500">0% Payout Fee</span>
            </div>
          </div>
        </div>

        {/* Smart Balance Routing Helper when Withdrawable is Low or Zero */}
        {withdrawableBalance === 0 && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                💡
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900">How to load money into Withdrawable Balance?</h4>
                {completedPlans.length > 0 ? (
                  <p className="text-slate-600">
                    You have <strong className="text-amber-800">Rs. {rpMiningBalance.toLocaleString('en-PK')}</strong> in completed RP mining packages ready to sell. Sell them to a merchant desk to credit capital + profit directly into your Withdrawable Balance.
                  </p>
                ) : activeMiningPlans.length > 0 ? (
                  <p className="text-slate-600">
                    You have <strong className="text-blue-900">{activeMiningPlans.length} active mining rig(s)</strong> running. Once mining finishes (300s), sell the RP package in Step 5 to receive your payout here.
                  </p>
                ) : topUpBalance > 0 ? (
                  <p className="text-slate-600">
                    You have <strong className="text-slate-900">Rs. {topUpBalance.toLocaleString('en-PK')}</strong> in your Top-Up balance. Purchase an RP mining plan (Step 2) to start earning mining yield and cash out.
                  </p>
                ) : (
                  <p className="text-slate-600">
                    Deposit funds to Top-Up (Step 1) → Buy RP plan (Step 2) → Mine for 300s (Step 3 & 4) → Sell RP (Step 5) → Withdraw to Bank (Step 6).
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {completedPlans.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('sell_rp')}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Sell Mined RP Now (Step 5) →
                </button>
              ) : topUpBalance > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('buy_rp')}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Buy RP Mining Plan (Step 2) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Deposit Funds (Step 1) →
                </button>
              )}
            </div>
          </div>
        )}

        {/* User's Approved & Pending Withdrawal Money Summary */}
        <div className="grid grid-cols-2 gap-3" id="withdraw-approved-pending-summary">
          {/* Approved Withdrawals Card */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 shadow-xs relative overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Approved Money
              </span>
              <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                {approvedCount} Paid
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              Rs. {totalApprovedWithdrawals.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Settled to your bank/account</p>
          </div>

          {/* Pending Withdrawals Card */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 shadow-xs relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Pending Money
              </span>
              <span className="text-[10px] font-bold bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                {pendingCount} In Process
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              Rs. {totalPendingWithdrawals.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Processing 1Link / Raast payout</p>
          </div>
        </div>

        {/* Withdrawal Status Alert */}
        {withdrawStatus && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-300 ${
              withdrawStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {withdrawStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">
                {withdrawStatus.success ? 'Withdrawal Request Submitted!' : 'Withdrawal Failed'}
              </h4>
              <p className="text-xs mt-1 text-slate-600">{withdrawStatus.message}</p>
              {withdrawStatus.success && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWithdrawStatus(null);
                      setTxHistoryFilter('WITHDRAWAL');
                      setIsTxHistoryOpen(true);
                    }}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    View Status in History →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payout Method Toggle */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setPayoutMethod('BANK_TRANSFER')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              payoutMethod === 'BANK_TRANSFER'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Bank Transfer
          </button>
          <button
            type="button"
            onClick={() => setPayoutMethod('UPI_QR')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              payoutMethod === 'UPI_QR'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR / Wallet
          </button>
          <button
            type="button"
            onClick={() => setPayoutMethod('USDT')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              payoutMethod === 'USDT'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            USDT Crypto
          </button>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {/* Bank Selection or Mobile Wallet / Raast Details */}
          {payoutMethod === 'BANK_TRANSFER' ? (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-900" />
                  Receiving Bank Account
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(true)}
                  className="text-xs text-blue-900 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Bank
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">No bank account linked yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Link Bank Account
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map((bank) => {
                    const isSelected = bank.id === selectedBankId;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/40 border-blue-900 ring-2 ring-blue-900/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs border border-blue-200">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{bank.bankName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              A/C: •••• {bank.accountNumber.slice(-4)} | IBAN/Code: {bank.ifscCode}
                            </p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedBankId(bank.id)}
                          className="w-4 h-4 accent-blue-900"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-900" />
                Receiving QR / Account Details
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Payout Raast ID / Account Number / Wallet
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567 or user@raast"
                  value={payoutUpiId}
                  onChange={(e) => setPayoutUpiId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Or Upload Payout QR Code (Optional)
                </label>
                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                  {uploadedQrPreview ? (
                    <div className="space-y-2">
                      <img
                        src={uploadedQrPreview}
                        alt="Payout QR Preview"
                        className="w-28 h-28 object-contain mx-auto rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedQrPreview(null)}
                        className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Remove QR
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-blue-900 font-bold block">Upload QR Image</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* USDT Crypto Details */}
          {payoutMethod === 'USDT' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-800" />
                  USDT Receiving Wallet
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-usdt-wallet-management'));
                    setIsManageBankOpen(true);
                  }}
                  className="text-xs text-emerald-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manage Wallets
                </button>
              </div>

              {/* Linked Wallets */}
              {usdtWallets.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Select Linked USDT Wallet
                  </label>
                  <div className="space-y-2">
                    {usdtWallets.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedUsdtWalletId(w.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedUsdtWalletId === w.id
                            ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedUsdtWalletId === w.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {selectedUsdtWalletId === w.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{w.label || 'USDT Wallet'}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                                {w.network}
                              </span>
                              {w.isPrimary && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[240px] sm:max-w-[320px]">
                              {w.address}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      onClick={() => setSelectedUsdtWalletId('custom')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        selectedUsdtWalletId === 'custom'
                          ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedUsdtWalletId === 'custom' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {selectedUsdtWalletId === 'custom' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        Use Different / One-time USDT Address
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom address entry or when no wallets are saved */}
              {(usdtWallets.length === 0 || selectedUsdtWalletId === 'custom') && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Blockchain Network *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUsdtNetwork('TRC20')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center ${
                          selectedUsdtNetwork === 'TRC20'
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>TRC-20 (Tron)</span>
                        <span className={`text-[10px] ${selectedUsdtNetwork === 'TRC20' ? 'text-emerald-200' : 'text-slate-400'}`}>
                          Fastest • Low Fee
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUsdtNetwork('BEP20')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center ${
                          selectedUsdtNetwork === 'BEP20'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>BEP-20 (BSC)</span>
                        <span className={`text-[10px] ${selectedUsdtNetwork === 'BEP20' ? 'text-amber-100' : 'text-slate-400'}`}>
                          Binance Smart Chain
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Your USDT ({selectedUsdtNetwork}) Address *
                    </label>
                    <input
                      type="text"
                      placeholder={selectedUsdtNetwork === 'TRC20' ? 'Starts with T... (e.g. TYDzsYUE...)' : 'Starts with 0x...'}
                      value={customUsdtAddress}
                      onChange={(e) => setCustomUsdtAddress(e.target.value.trim())}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                </div>
              )}

              {/* Conversion Calculator Card */}
              <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-emerald-950">
                  <span className="font-semibold text-[11px]">USDT Payout Rate:</span>
                  <span className="font-bold text-xs">1 USDT = Rs. {config.usdtRate || 280}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-950">
                  <span className="font-semibold text-[11px]">Converted Crypto Amount:</span>
                  <span className="font-black text-sm text-emerald-900 font-mono">
                    {numAmount > 0 ? (numAmount / (config.usdtRate || 280)).toFixed(2) : '0.00'} USDT
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200/80 flex justify-between text-[11px] text-emerald-800 font-medium">
                  <span>Network Gas Fee:</span>
                  <span className="font-bold text-emerald-700">0.00 USDT (Sponsored)</span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Withdrawal Amount</h3>
              <span className="text-xs text-slate-500">
                Min: Rs. {config.minWithdraw} | Max: Rs. {config.maxWithdraw.toLocaleString('en-PK')}
              </span>
            </div>

            {withdrawableBalance === 0 && topUpBalance > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold block">Top-Up Balance: Rs. {topUpBalance.toLocaleString('en-PK')}</span>
                  <span className="text-[11px] text-amber-800">Buy & Mine RP to convert funds into 100% Withdrawable Cash.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('buy-rp')}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow-xs"
                >
                  Buy RP Plan →
                </button>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center bg-white rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-900/15 transition-all">
                <span className="text-base font-bold text-blue-900 mr-2">Rs.</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  id="withdraw-amount-input"
                  className="w-full bg-transparent text-xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Percentage Chips */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="py-1.5 text-center rounded-xl font-bold text-xs bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-blue-300 transition cursor-pointer"
                >
                  {pct === 100 ? 'MAX 100%' : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Payout Summary Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Withdrawal Amount:</span>
                <span className="font-bold text-slate-900">Rs. {numAmount.toLocaleString('en-PK')}</span>
              </div>
              {payoutMethod === 'USDT' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">USDT Conversion Rate:</span>
                    <span className="font-bold text-slate-900">1 USDT = Rs. {config.usdtRate || 280}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Crypto Gas Fee:</span>
                    <span className="font-bold text-emerald-700">0.00 USDT (FREE)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-800">You Receive in USDT Wallet:</span>
                    <span className="font-black text-emerald-800 font-mono text-sm">
                      {numAmount > 0 ? (numAmount / (config.usdtRate || 280)).toFixed(2) : '0.00'} USDT
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payout Gateway Fee:</span>
                    <span className="font-bold text-emerald-700">Rs. 0 (FREE)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-800">Amount Received in Bank:</span>
                    <span className="font-black text-slate-900">Rs. {numAmount.toLocaleString('en-PK')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!numAmount || numAmount < config.minWithdraw || numAmount > withdrawableBalance}
              id="withdraw-submit-btn"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              Request Withdrawal (Rs. {numAmount.toLocaleString('en-PK')})
            </button>
          </div>
        </form>

        {/* User's All Withdrawal Activity & Status Log */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3" id="withdraw-recent-status-list">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-900" />
                Your Withdrawal Activity & History
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {userWithdrawals.length} Total Withdrawal Request{userWithdrawals.length !== 1 ? 's' : ''} on record
              </p>
            </div>
            <button
              type="button"
              id="withdraw-view-full-ledger-btn"
              onClick={() => {
                setTxHistoryFilter('WITHDRAWAL');
                setIsTxHistoryOpen(true);
              }}
              className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-0.5 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              Full Ledger <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {userWithdrawals.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No withdrawal history yet. Mined RP can be sold and withdrawn above.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'ALL', label: 'All Withdrawals', count: userWithdrawals.length },
                  { id: 'SUCCESS', label: 'Paid Out', count: approvedCount },
                  { id: 'PENDING', label: 'In Process', count: pendingCount },
                  { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWithdrawFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      withdrawFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        withdrawFilter === tab.id
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              {userWithdrawals.length > 3 && (
                <input
                  type="text"
                  placeholder="Search by Bank, A/C, Ref..."
                  value={withdrawSearch}
                  onChange={(e) => setWithdrawSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              )}

              {/* List of items */}
              <div className="space-y-2">
                {filteredUserWithdrawals.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">
                    No withdrawals found matching selected filter.
                  </p>
                ) : (
                  (showAllWithdrawals ? filteredUserWithdrawals : filteredUserWithdrawals.slice(0, 4)).map((w) => {
                    const isApproved = w.status === 'SUCCESS';
                    const isPending = w.status === 'PENDING' || w.status === 'PROCESSING';
                    return (
                      <div
                        key={w.id}
                        id={`withdraw-item-${w.id}`}
                        onClick={() => setSelectedWithdrawReceipt(w)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 flex items-center justify-between text-xs cursor-pointer transition shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isApproved ? (
                              <Check className="w-4 h-4" />
                            ) : isPending ? (
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="text-sm">Rs. {w.amount.toLocaleString('en-PK')}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({w.payoutMethod === 'USDT' ? `USDT (${w.usdtNetwork || 'TRC20'})` : w.payoutMethod === 'UPI_QR' ? 'QR / Wallet' : 'Bank Transfer'})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {w.payoutMethod === 'USDT'
                                ? `USDT: ${w.usdtAddress ? `${w.usdtAddress.slice(0, 8)}...${w.usdtAddress.slice(-6)}` : 'Wallet'}`
                                : w.payoutMethod === 'UPI_QR'
                                ? (w.payoutUpiId ? `Account: ${w.payoutUpiId}` : 'QR Payout')
                                : (w.bankName ? `${w.bankName} (${w.accountNumber || '••••'})` : 'Primary Bank')}
                            </div>
                            {w.rejectedReason && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                                Reason: {w.rejectedReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isApproved ? 'Paid Out' : isPending ? 'In Process' : 'Rejected'}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(w.createdAt).toLocaleDateString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Toggle Show All */}
              {filteredUserWithdrawals.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllWithdrawals(!showAllWithdrawals)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                >
                  {showAllWithdrawals
                    ? `Show Less (Top 4)`
                    : `View All ${filteredUserWithdrawals.length} Withdrawal Records ↓`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Withdrawal Guidelines */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <HelpCircle className="w-4 h-4 text-blue-900" />
            Withdrawal Guidelines
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed text-slate-600">
            <li>Withdrawal requests are processed via automated 24x7 1Link / Raast banking rails.</li>
            <li>Prorated settlement takes between 5 to 15 minutes.</li>
            <li>Ensure the Beneficiary Account Name matches your registered KYC name.</li>
          </ul>
        </div>
      </div>

      {/* Withdrawal Receipt Modal */}
      {selectedWithdrawReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Withdrawal Order Receipt</h3>
              <button
                onClick={() => setSelectedWithdrawReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-2 ${
                  selectedWithdrawReceipt.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedWithdrawReceipt.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedWithdrawReceipt.status === 'SUCCESS' ? (
                  <Check className="w-6 h-6" />
                ) : selectedWithdrawReceipt.status === 'REJECTED' ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-slate-900">
                Rs. {selectedWithdrawReceipt.amount.toLocaleString('en-PK')}
              </div>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedWithdrawReceipt.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : selectedWithdrawReceipt.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {selectedWithdrawReceipt.status === 'SUCCESS'
                  ? 'Payout Sent & Settled'
                  : selectedWithdrawReceipt.status === 'REJECTED'
                  ? 'Payout Rejected'
                  : 'Processing Bank Disbursement'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Ref:</span>
                <span className="font-mono font-bold text-slate-900">{selectedWithdrawReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-bold text-slate-900">
                  {selectedWithdrawReceipt.payoutMethod === 'USDT'
                    ? `USDT Crypto (${selectedWithdrawReceipt.usdtNetwork || 'TRC20'})`
                    : selectedWithdrawReceipt.payoutMethod === 'UPI_QR'
                    ? 'QR / Raast Transfer'
                    : 'Direct Bank Transfer (1Link / Raast)'}
                </span>
              </div>
              {selectedWithdrawReceipt.payoutMethod === 'USDT' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">USDT Amount:</span>
                    <span className="font-mono font-black text-emerald-800">
                      {selectedWithdrawReceipt.usdtAmount
                        ? `${selectedWithdrawReceipt.usdtAmount.toFixed(2)} USDT`
                        : `${(selectedWithdrawReceipt.amount / (config.usdtRate || 280)).toFixed(2)} USDT`}
                    </span>
                  </div>
                  {selectedWithdrawReceipt.usdtAddress && (
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-slate-500">Receiving Address:</span>
                      <span className="font-mono text-[11px] font-bold text-slate-800 break-all bg-white p-2 rounded-lg border border-slate-200">
                        {selectedWithdrawReceipt.usdtAddress}
                      </span>
                    </div>
                  )}
                </>
              )}
              {selectedWithdrawReceipt.bankName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank / A/C:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedWithdrawReceipt.bankName} (••• {selectedWithdrawReceipt.accountNumber?.slice(-4) || '••••'})
                  </span>
                </div>
              )}
              {selectedWithdrawReceipt.payoutUpiId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Account / ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedWithdrawReceipt.payoutUpiId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Initiated At:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedWithdrawReceipt.createdAt).toLocaleString('en-PK')}
                </span>
              </div>
              {selectedWithdrawReceipt.rejectedReason && (
                <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-slate-200">
                  <span>Rejection Note:</span>
                  <span>{selectedWithdrawReceipt.rejectedReason}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedWithdrawReceipt(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
