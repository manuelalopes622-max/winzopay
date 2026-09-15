import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  RotateCw,
  X,
  Copy,
  CheckCircle,
  ShieldCheck,
  Zap,
  Clock,
  ArrowDownLeft,
  CheckCircle2,
  Wallet,
  AlertCircle,
  HelpCircle,
  History,
  Check,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Sample PKR amounts as specified in requirements
const PRESET_AMOUNTS = [
  { label: 'Rs 1,000', value: 1000 },
  { label: 'Rs 2,000', value: 2000 },
  { label: 'Rs 5,000', value: 5000 },
  { label: 'Rs 10,000', value: 10000 },
  { label: 'Rs 20,000', value: 20000 },
  { label: 'Rs 50,000', value: 50000 },
];

export const DepositView: React.FC = () => {
  const {
    availableBalance,
    submitDeposit,
    config,
    setActiveTab,
    setIsTxHistoryOpen,
    setTxHistoryFilter,
    refreshing,
    triggerRefresh,
    depositRequests,
    transactions,
    userId,
    userPhone,
    checkBelongsToUser,
  } = useApp();

  // Payment method: strictly EasyPaisa or JazzCash
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('1000');
  const [trxId, setTrxId] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & ledger state
  const [showAllDeposits, setShowAllDeposits] = useState(false);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'REJECTED'>('ALL');
  const [depositSearch, setDepositSearch] = useState('');
  const [selectedDepositReceipt, setSelectedDepositReceipt] = useState<{
    id: string;
    amount: number;
    status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'REJECTED';
    utr?: string;
    method?: string;
    accountNumber?: string;
    accountTitle?: string;
    screenshotUrl?: string;
    createdAt: string;
  } | null>(null);

  // Active method config values (fictional / demo Pakistani mobile accounts)
  const currentAccount = useMemo(() => {
    if (paymentMethod === 'EasyPaisa') {
      return {
        name: 'EasyPaisa',
        number: config.easypaisaNumber || '0345-0192837',
        cleanNumber: (config.easypaisaNumber || '0345-0192837').replace(/\D/g, ''),
        title: config.easypaisaTitle || 'WinzoPay Official',
        qrUrl: config.easypaisaQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=03450192837`,
        themeColor: 'emerald',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        activeBorder: 'border-emerald-600 bg-emerald-50/50',
        activePill: 'bg-emerald-700 text-white',
        instructions: 'Open your EasyPaisa app, choose Send Money > EasyPaisa Mobile Account, enter the number below, complete the transfer, and paste the 11-digit TRX ID.'
      };
    }
    return {
      name: 'JazzCash',
      number: config.jazzcashNumber || '0301-9283746',
      cleanNumber: (config.jazzcashNumber || '0301-9283746').replace(/\D/g, ''),
      title: config.jazzcashTitle || 'WinzoPay Official',
      qrUrl: config.jazzcashQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=03019283746`,
      themeColor: 'rose',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      activeBorder: 'border-rose-600 bg-rose-50/50',
      activePill: 'bg-rose-700 text-white',
      instructions: 'Open your JazzCash app, select Money Transfer > JazzCash Account, enter the number below, complete the transfer, and paste the Transaction ID.'
    };
  }, [paymentMethod, config]);

  // Compute user deposits and amounts for Approved, Pending, and Rejected
  const userDeposits = useMemo(() => {
    const reqMap = new Map<
      string,
      {
        id: string;
        amount: number;
        status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'REJECTED';
        utr?: string;
        method?: string;
        accountNumber?: string;
        accountTitle?: string;
        screenshotUrl?: string;
        createdAt: string;
      }
    >();

    const cleanPhone = (userPhone || '').replace(/\D/g, '');

    // 1. Ingest from depositRequests (real-time Firestore synced)
    depositRequests.forEach((req) => {
      if (checkBelongsToUser(req, userId, cleanPhone)) {
        const key = req.utr && req.utr.trim().length >= 4 
          ? `utr_${req.utr.trim().toLowerCase()}` 
          : `id_${req.id}`;
        
        let displayMethod = req.method;
        if (displayMethod === 'QR' || displayMethod === 'UPI' || !displayMethod) {
          displayMethod = 'EasyPaisa';
        }

        reqMap.set(key, {
          id: req.id,
          amount: req.amount,
          status: req.status === 'PROCESSING' ? 'PENDING' : req.status,
          utr: req.utr,
          method: displayMethod,
          accountNumber: req.accountNumber,
          accountTitle: req.accountTitle,
          screenshotUrl: req.screenshotUrl || req.receiptUrl,
          createdAt: req.createdAt,
        });
      }
    });

    // 2. Ingest from ledger transactions of type DEPOSIT or BUY_RP
    transactions
      .filter((t) => (t.type === 'DEPOSIT' || t.type === 'BUY_RP') && checkBelongsToUser(t, userId, cleanPhone))
      .forEach((tx) => {
        const key = tx.utr && tx.utr.trim().length >= 4 
          ? `utr_${tx.utr.trim().toLowerCase()}` 
          : `id_${tx.id}`;
        const existing = reqMap.get(key);
        if (existing) {
          if (tx.status === 'SUCCESS' || existing.status === 'SUCCESS') {
            existing.status = 'SUCCESS';
          } else if (tx.status === 'REJECTED' || existing.status === 'REJECTED') {
            existing.status = 'REJECTED';
          }
        } else {
          let matched = false;
          for (const [, val] of reqMap.entries()) {
            const matchesOrderId = tx.notes && tx.notes.includes(val.id);
            const matchesUtr = val.utr && tx.utr && val.utr.trim().toLowerCase() === tx.utr.trim().toLowerCase();
            if (matchesOrderId || matchesUtr) {
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
            const detectedMethod = tx.notes?.includes('JazzCash') ? 'JazzCash' : 'EasyPaisa';
            reqMap.set(key, {
              id: tx.id,
              amount: tx.amount,
              status: tx.status === 'PROCESSING' ? 'PENDING' : tx.status,
              utr: tx.utr,
              method: detectedMethod,
              createdAt: tx.createdAt || tx.timestamp,
            });
          }
        }
      });

    return Array.from(reqMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [depositRequests, transactions, userId, userPhone, checkBelongsToUser]);

  const filteredUserDeposits = useMemo(() => {
    return userDeposits.filter((dep) => {
      if (depositFilter === 'SUCCESS' && dep.status !== 'SUCCESS') return false;
      if (depositFilter === 'PENDING' && dep.status !== 'PENDING' && dep.status !== 'PROCESSING') return false;
      if (depositFilter === 'REJECTED' && dep.status !== 'REJECTED') return false;

      if (depositSearch.trim()) {
        const q = depositSearch.toLowerCase().trim();
        const matchId = dep.id.toLowerCase().includes(q);
        const matchUtr = dep.utr?.toLowerCase().includes(q);
        const matchMethod = dep.method?.toLowerCase().includes(q);
        const matchAmt = dep.amount.toString().includes(q);
        return matchId || matchUtr || matchMethod || matchAmt;
      }
      return true;
    });
  }, [userDeposits, depositFilter, depositSearch]);

  const totalApprovedDeposits = useMemo(() => {
    return userDeposits
      .filter((d) => d.status === 'SUCCESS')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [userDeposits]);

  const totalPendingDeposits = useMemo(() => {
    return userDeposits
      .filter((d) => d.status === 'PENDING' || d.status === 'PROCESSING')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [userDeposits]);

  const approvedCount = userDeposits.filter((d) => d.status === 'SUCCESS').length;
  const pendingCount = userDeposits.filter((d) => d.status === 'PENDING' || d.status === 'PROCESSING').length;
  const rejectedCount = userDeposits.filter((d) => d.status === 'REJECTED').length;

  const handleAmountChipClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountStr(amount.toString());
    setErrorMessage('');
  };

  const handleInputChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setCustomAmountStr(numeric);
    const num = parseInt(numeric, 10);
    if (!isNaN(num)) {
      setSelectedAmount(num);
    } else {
      setSelectedAmount(0);
    }
    setErrorMessage('');
  };

  const handleClear = () => {
    setCustomAmountStr('');
    setSelectedAmount(0);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Image Upload handler for payment screenshot
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    // Size limit: 3MB
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Screenshot size exceeds 3MB limit. Please upload a smaller image.');
      return;
    }

    setScreenshotName(file.name);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setScreenshotPreview(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Deposit
  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const amt = parseInt(customAmountStr, 10);
    if (!amt || isNaN(amt)) {
      setErrorMessage('Please enter a valid deposit amount in PKR.');
      return;
    }

    if (amt < config.minDeposit) {
      setErrorMessage(`Minimum deposit amount is Rs. ${config.minDeposit.toLocaleString('en-PK')}`);
      return;
    }

    if (amt > config.maxDeposit) {
      setErrorMessage(`Maximum deposit amount is Rs. ${config.maxDeposit.toLocaleString('en-PK')}`);
      return;
    }

    if (!trxId || trxId.trim().length < 6) {
      setErrorMessage('Please enter the valid Transaction ID (TRX ID / TID) from your receipt.');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = submitDeposit(
        amt,
        trxId.trim(),
        paymentMethod,
        currentAccount.number,
        currentAccount.title,
        screenshotPreview || undefined
      );

      if (success) {
        setSubmittedSuccess(true);
        setLastSubmittedId(trxId.trim());
        setTrxId('');
        handleRemoveScreenshot();
      } else {
        setErrorMessage('Failed to submit deposit request. Please check the amount and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing deposit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAmt = parseInt(customAmountStr, 10) || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900" id="deposit-view-container">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            id="deposit-back-btn"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-blue-900" />
              Top-Up Balance (Deposit)
            </h1>
            <p className="text-[11px] text-slate-500">Deposit via EasyPaisa or JazzCash to purchase RP Plans</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            id="deposit-refresh-btn"
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
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Deposit to Top-Up Balance
                  <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Active Step</span>
                </p>
                <p className="text-[11px] text-slate-600">PKR funds credit to your Top-Up wallet for RP Mining Plans</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('buy_rp')}
              className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 cursor-pointer shadow-xs"
            >
              Step 2: Buy RP →
            </button>
          </div>
        </div>

        {/* Current Top-Up Balance Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Wallet className="w-3.5 h-3.5 text-blue-900" />
                Current Top-Up Balance
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                Rs. {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                <span className="text-xs font-semibold text-slate-500 ml-1.5">PKR</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-950 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                Verified Wallet
              </span>
              <span className="text-[11px] text-slate-500">100% Secure Pakistani Rail</span>
            </div>
          </div>
        </div>

        {/* User's Approved & Pending Deposit Money Summary */}
        <div className="grid grid-cols-2 gap-3" id="deposit-approved-pending-summary">
          {/* Approved Money Card */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 shadow-xs relative overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Approved Money
              </span>
              <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                {approvedCount} Done
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              Rs. {totalApprovedDeposits.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Credited to wallet</p>
          </div>

          {/* Pending Money Card */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 shadow-xs relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Pending Money
              </span>
              <span className="text-[10px] font-bold bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                {pendingCount} In Review
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              Rs. {totalPendingDeposits.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting verification</p>
          </div>
        </div>

        {/* Success Feedback Alert */}
        {submittedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Deposit Request Submitted Successfully!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Your <strong className="text-emerald-800">{paymentMethod}</strong> deposit of{' '}
                  <strong className="text-slate-900">Rs. {currentAmt.toLocaleString('en-PK')}</strong> (TRX ID: {lastSubmittedId}) has been saved to the database. Once approved by Admin, your Top-Up balance will update automatically.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSubmittedSuccess(false);
                  setActiveTab('buy_rp');
                }}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm text-center cursor-pointer"
              >
                Go to Buy RP Plans →
              </button>
              <button
                onClick={() => {
                  setSubmittedSuccess(false);
                  setTxHistoryFilter('DEPOSIT');
                  setIsTxHistoryOpen(true);
                }}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition text-center cursor-pointer border border-slate-200"
              >
                View History
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PRIMARY DEPOSIT INTERFACE: EASYPAISA & JAZZCASH */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-5">
          {/* Section Heading & Method Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-900" />
                Select Pakistani Mobile Payment Method
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">100% Zero Fee</span>
            </div>

            {/* The Two Payment Options */}
            <div className="grid grid-cols-2 gap-3" id="deposit-payment-method-selector">
              {/* Option 1: EasyPaisa */}
              <button
                type="button"
                id="deposit-method-easypaisa-btn"
                onClick={() => {
                  setPaymentMethod('EasyPaisa');
                  setErrorMessage('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-start text-left relative cursor-pointer ${
                  paymentMethod === 'EasyPaisa'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="inline-flex items-center gap-1.5 font-black text-sm text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                    EasyPaisa
                  </span>
                  {paymentMethod === 'EasyPaisa' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-600 font-medium">Mobile Account Transfer</span>
                <span className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Instant Verification
                </span>
              </button>

              {/* Option 2: JazzCash */}
              <button
                type="button"
                id="deposit-method-jazzcash-btn"
                onClick={() => {
                  setPaymentMethod('JazzCash');
                  setErrorMessage('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-start text-left relative cursor-pointer ${
                  paymentMethod === 'JazzCash'
                    ? 'border-rose-600 bg-rose-50/60 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="inline-flex items-center gap-1.5 font-black text-sm text-rose-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                    JazzCash
                  </span>
                  {paymentMethod === 'JazzCash' && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-600 font-medium">Mobile Account Transfer</span>
                <span className="text-[10px] text-rose-700 font-bold mt-1 bg-rose-100 px-2 py-0.5 rounded-md">
                  Instant Verification
                </span>
              </button>
            </div>
          </div>

          {/* Official Account Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-900" />
                Official {currentAccount.name} Deposit Details
              </span>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                {showQrCode ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {/* QR Code expansion (if toggled) */}
            {showQrCode && (
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center space-y-2 animate-in fade-in duration-200">
                <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <img
                    src={currentAccount.qrUrl}
                    alt={`${currentAccount.name} QR`}
                    className="w-36 h-36 mx-auto object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Scan via {currentAccount.name} app or enter account number manually below
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account / Number */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Account / Number
                  </span>
                  <span className="text-sm font-mono font-black text-slate-900" id="deposit-account-number-display">
                    {currentAccount.number}
                  </span>
                </div>
                <button
                  type="button"
                  id="deposit-copy-number-btn"
                  onClick={() => handleCopy(currentAccount.cleanNumber, 'number')}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer border border-slate-200"
                >
                  {copiedField === 'number' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account Title */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Account Title
                  </span>
                  <span className="text-xs font-bold text-slate-900" id="deposit-account-title-display">
                    {currentAccount.title}
                  </span>
                </div>
                <button
                  type="button"
                  id="deposit-copy-title-btn"
                  onClick={() => handleCopy(currentAccount.title, 'title')}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer border border-slate-200"
                >
                  {copiedField === 'title' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              💡 {currentAccount.instructions}
            </p>
          </div>

          {/* Form: Amount, Transaction ID, Screenshot, Submit */}
          <form onSubmit={handleSubmitDeposit} className="space-y-4">
            {/* 1. Deposit Amount (PKR) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Deposit Amount (PKR) <span className="text-rose-600">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  Min: Rs. {config.minDeposit.toLocaleString('en-PK')} | Max: Rs. {config.maxDeposit.toLocaleString('en-PK')}
                </span>
              </div>

              {/* Amount Input Box */}
              <div className="relative">
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus-within:border-slate-900 focus-within:bg-white transition-all">
                  <span className="text-base font-bold text-slate-900 mr-2">Rs.</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmountStr}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="0"
                    id="deposit-amount-input"
                    className="w-full bg-transparent text-xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                    required
                  />
                  {customAmountStr && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Preset Amounts (PKR) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleAmountChipClick(preset.value)}
                    id={`deposit-preset-${preset.value}`}
                    className={`py-2 px-1 text-center rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      selectedAmount === preset.value
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Transaction ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Transaction ID (TRX ID / TID) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g. 84920194821 or 12345678901"
                value={trxId}
                onChange={(e) => {
                  setTrxId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  setErrorMessage('');
                }}
                id="deposit-transaction-id-input"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                Enter the 11-digit or 12-digit TID / Transaction ID received from {paymentMethod} SMS or app receipt.
              </p>
            </div>

            {/* 3. Upload Payment Screenshot */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Upload Payment Screenshot
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
                id="deposit-screenshot-file-input"
              />

              {!screenshotPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-900/60 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Click to upload transfer screenshot</div>
                  <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Max 3MB)</p>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={screenshotPreview}
                      alt="Receipt Preview"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                        {screenshotName || 'Payment_Receipt.jpg'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Screenshot Attached
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                    title="Remove screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Deposit Summary Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Selected Method:</span>
                <span className="font-bold text-slate-900">{paymentMethod} Mobile Account</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Deposit Amount:</span>
                <span className="font-bold text-slate-900">Rs. {currentAmt.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Gateway Handling Fee:</span>
                <span className="font-bold text-emerald-700">Rs. 0 (FREE 0%)</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Credited to Top-Up Balance:</span>
                <span className="font-black text-slate-900">Rs. {currentAmt.toLocaleString('en-PK')}</span>
              </div>
            </div>

            {/* 4. Submit Deposit Button */}
            <button
              type="submit"
              id="deposit-submit-btn"
              disabled={isSubmitting || !currentAmt || currentAmt < config.minDeposit}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Submitting Deposit...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Deposit (PKR {currentAmt.toLocaleString('en-PK')})
                </>
              )}
            </button>
          </form>
        </div>

        {/* User's All Deposit Activity & Status Log */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3" id="deposit-recent-status-list">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-900" />
                Your Deposit Activity & History
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {userDeposits.length} Total Top-Up Deposit{userDeposits.length !== 1 ? 's' : ''} on record
              </p>
            </div>
            <button
              type="button"
              id="deposit-view-full-ledger-btn"
              onClick={() => {
                setTxHistoryFilter('DEPOSIT');
                setIsTxHistoryOpen(true);
              }}
              className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-0.5 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              Full Ledger <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {userDeposits.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No deposit history yet. Submit your first EasyPaisa or JazzCash top-up above!
            </div>
          ) : (
            <div className="space-y-3">
              {/* Deposit Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'ALL', label: 'All Deposits', count: userDeposits.length },
                  { id: 'SUCCESS', label: 'Approved', count: approvedCount },
                  { id: 'PENDING', label: 'In Review', count: pendingCount },
                  { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDepositFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      depositFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        depositFilter === tab.id
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Deposit Quick Search Bar if there are multiple items */}
              {userDeposits.length > 3 && (
                <input
                  type="text"
                  placeholder="Search deposits by TRX ID, Order ID, Method..."
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              )}

              {/* Deposit List */}
              <div className="space-y-2">
                {filteredUserDeposits.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">
                    No deposits found matching selected filter.
                  </p>
                ) : (
                  (showAllDeposits ? filteredUserDeposits : filteredUserDeposits.slice(0, 4)).map((dep) => {
                    const isApproved = dep.status === 'SUCCESS';
                    const isPending = dep.status === 'PENDING' || dep.status === 'PROCESSING';
                    return (
                      <div
                        key={dep.id}
                        id={`deposit-item-${dep.id}`}
                        onClick={() => setSelectedDepositReceipt(dep)}
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
                              <span className="text-sm">+Rs. {dep.amount.toLocaleString('en-PK')}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({dep.method || 'EasyPaisa'})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {dep.utr ? `TRX ID: ${dep.utr}` : `Ref: ${dep.id}`}
                            </div>
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
                            {isApproved ? 'Approved' : isPending ? 'In Review' : 'Rejected'}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(dep.createdAt).toLocaleDateString('en-PK', {
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

              {/* Toggle Show All vs Recent */}
              {filteredUserDeposits.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllDeposits(!showAllDeposits)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                >
                  {showAllDeposits
                    ? `Show Less (Top 4)`
                    : `View All ${filteredUserDeposits.length} Deposit Records ↓`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deposit Guidelines */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <HelpCircle className="w-4 h-4 text-blue-900" />
            Top-Up Instructions (EasyPaisa & JazzCash)
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed text-slate-600">
            <li>Send funds directly to our official EasyPaisa or JazzCash account number.</li>
            <li>Double-check the <strong>Account Title</strong> matches before approving transfer in your mobile app.</li>
            <li>Copy the <strong>Transaction ID (TRX ID / TID)</strong> from your transfer confirmation SMS or app receipt.</li>
            <li>Optionally attach a screenshot of your successful transfer for express verification.</li>
            <li>Once confirmed by Admin, your Top-Up balance will be credited instantly in PKR.</li>
            <li>Proceed to <strong>Step 2: Buy RP</strong> to purchase your daily mining plan.</li>
          </ul>
        </div>
      </div>

      {/* Deposit Receipt Modal */}
      {selectedDepositReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Deposit Order Receipt</h3>
              <button
                onClick={() => setSelectedDepositReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-2 ${
                  selectedDepositReceipt.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedDepositReceipt.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedDepositReceipt.status === 'SUCCESS' ? (
                  <Check className="w-6 h-6" />
                ) : selectedDepositReceipt.status === 'REJECTED' ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-slate-900">
                Rs. {selectedDepositReceipt.amount.toLocaleString('en-PK')}
                <span className="text-xs font-semibold text-slate-500 ml-1">PKR</span>
              </div>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedDepositReceipt.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : selectedDepositReceipt.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {selectedDepositReceipt.status === 'SUCCESS'
                  ? 'Deposit Approved & Credited'
                  : selectedDepositReceipt.status === 'REJECTED'
                  ? 'Deposit Rejected'
                  : 'Pending Admin Verification'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDepositReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-900">{selectedDepositReceipt.method || 'EasyPaisa'}</span>
              </div>
              {selectedDepositReceipt.utr && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID (TRX):</span>
                  <span className="font-mono font-bold text-slate-900">{selectedDepositReceipt.utr}</span>
                </div>
              )}
              {selectedDepositReceipt.accountNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant Number:</span>
                  <span className="font-mono text-slate-700">{selectedDepositReceipt.accountNumber}</span>
                </div>
              )}
              {selectedDepositReceipt.screenshotUrl && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Attached Payment Screenshot:</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-black/5 flex items-center justify-center">
                    <img
                      src={selectedDepositReceipt.screenshotUrl}
                      alt="Uploaded Screenshot"
                      className="max-h-48 object-contain"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Created At:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedDepositReceipt.createdAt).toLocaleString('en-PK')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Credited Wallet:</span>
                <span className="font-bold text-blue-900">Top-Up Balance (PKR)</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDepositReceipt(null)}
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
