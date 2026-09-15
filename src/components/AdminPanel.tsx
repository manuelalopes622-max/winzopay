import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Users,
  Wallet,
  TrendingUp,
  X,
  Plus,
  Minus,
  Save,
  Search,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  Database,
  SlidersHorizontal,
  ExternalLink,
  Check,
  Headphones,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Globe,
  Copy,
  Radio,
  Eye,
  EyeOff,
  Building2,
  CreditCard,
  KeyRound,
  Trash2,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRecord, BankAccount } from '../types';

interface AdminPanelProps {
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isDbConnected,
    depositRequests,
    withdrawalRequests,
    transactions,
    allTransactions,
    submitDeposit,
    submitWithdrawal,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    config,
    updateConfig,
    availableBalance,
    topUpBalance,
    withdrawableBalance,
    pendingWithdrawal,
    activeMiningInvested,
    rpMiningBalance,
    todayCommission,
    totalBalance,
    adjustUserBalance,
    adjustSpecificUserBalance,
    adminUpdateUserBankDetails,
    adminDeleteUserBank,
    adminSetPrimaryUserBank,
    deleteUser,
    wipeAllUsers,
    cleanEntireDatabase,
    allUsers,
    allTeams,
    userEmail,
    userId,
    userName,
    userPhone,
    bankAccounts,
  } = useApp();

  // Admin authentication state for dedicated portal
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wzp_admin_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeAdminTab, setActiveAdminTab] = useState<'OVERVIEW' | 'DEPOSITS' | 'WITHDRAWALS' | 'LEDGER' | 'USERS' | 'TEAMS' | 'SUPPORT' | 'GATEWAY'>('OVERVIEW');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [selectedTeamHeadId, setSelectedTeamHeadId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<{ id: string; type: 'DEP' | 'WTH' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'REJECTED'>('ALL');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'PLAN_PURCHASE' | 'SELL_RP' | 'MINING_PROFIT' | 'ADJUSTMENT'>('ALL');

  // Gateway Config state
  const [upiIdInput, setUpiIdInput] = useState(config.upiId);
  const [upiNameInput, setUpiNameInput] = useState(config.upiName);
  const [easypaisaNumberInput, setEasypaisaNumberInput] = useState(config.easypaisaNumber || '0345-0192837');
  const [easypaisaTitleInput, setEasypaisaTitleInput] = useState(config.easypaisaTitle || 'WinzoPay Official');
  const [jazzcashNumberInput, setJazzcashNumberInput] = useState(config.jazzcashNumber || '0301-9283746');
  const [jazzcashTitleInput, setJazzcashTitleInput] = useState(config.jazzcashTitle || 'WinzoPay Official');
  const [minDepInput, setMinDepInput] = useState(config.minDeposit.toString());
  const [maxDepInput, setMaxDepInput] = useState(config.maxDeposit.toString());
  const [minWthInput, setMinWthInput] = useState(config.minWithdraw.toString());
  const [maxWthInput, setMaxWthInput] = useState(config.maxWithdraw.toString());
  const [startTimeInput, setStartTimeInput] = useState(config.sellRpStartTime);
  const [endTimeInput, setEndTimeInput] = useState(config.sellRpEndTime);

  // Telegram & Customer Service State
  const [telegramSupportInput, setTelegramSupportInput] = useState(config.supportTelegram || '');
  const [telegramChannelInput, setTelegramChannelInput] = useState(config.officialChannel || '');
  const [supportWhatsappInput, setSupportWhatsappInput] = useState(config.supportWhatsapp || '');
  const [supportEmailInput, setSupportEmailInput] = useState(config.supportEmail || '');
  const [supportPhoneInput, setSupportPhoneInput] = useState(config.supportPhone || '');
  const [supportNoticeInput, setSupportNoticeInput] = useState(config.supportNotice || '');
  const [configSaved, setConfigSaved] = useState(false);
  const [supportSaved, setSupportSaved] = useState(false);

  // Manual Balance Adjustment state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustBalanceType, setAdjustBalanceType] = useState<'topUp' | 'withdrawable'>('topUp');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  // User Accounts & Credentials Management state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userBankFilter, setUserBankFilter] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedPasswordIds, setRevealedPasswordIds] = useState<Set<string>>(new Set());
  const [revealedAccountIds, setRevealedAccountIds] = useState<Set<string>>(new Set());
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<UserRecord | null>(null);
  const [selectedUserModal, setSelectedUserModal] = useState<UserRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Direct Bank Account Link & Edit State
  const [bankEditUser, setBankEditUser] = useState<UserRecord | null>(null);
  const [bankEditBankId, setBankEditBankId] = useState<string | null>(null);
  const [bankEditName, setBankEditName] = useState('');
  const [bankEditAccNum, setBankEditAccNum] = useState('');
  const [bankEditIfsc, setBankEditIfsc] = useState('');
  const [bankEditHolder, setBankEditHolder] = useState('');
  const [bankEditUpi, setBankEditUpi] = useState('');
  const [bankEditIsPrimary, setBankEditIsPrimary] = useState(true);
  const [bankEditLoading, setBankEditLoading] = useState(false);
  const [bankEditSuccess, setBankEditSuccess] = useState('');
  const [bankEditError, setBankEditError] = useState('');

  const openBankEditModal = (user: UserRecord, bank?: BankAccount) => {
    setBankEditUser(user);
    if (bank) {
      setBankEditBankId(bank.id);
      setBankEditName(bank.bankName || 'Meezan Bank');
      setBankEditAccNum(bank.accountNumber || '');
      setBankEditIfsc(bank.ifscCode || 'MEZN0001234');
      setBankEditHolder(bank.accountHolderName || user.userName || '');
      setBankEditUpi(bank.upiId || '');
      setBankEditIsPrimary(!!bank.isPrimary);
    } else {
      const userBanks = (user.bankAccounts && user.bankAccounts.length > 0) ? user.bankAccounts : [];
      const primary = userBanks.find(b => b.isPrimary) || userBanks[0];
      if (primary) {
        setBankEditBankId(primary.id);
        setBankEditName(primary.bankName || 'Meezan Bank');
        setBankEditAccNum(primary.accountNumber || '');
        setBankEditIfsc(primary.ifscCode || 'MEZN0001234');
        setBankEditHolder(primary.accountHolderName || user.userName || '');
        setBankEditUpi(primary.upiId || '');
        setBankEditIsPrimary(true);
      } else if (user.accountNumber && user.bankName && user.bankName !== 'No Bank Linked') {
        setBankEditBankId(null);
        setBankEditName(user.bankName);
        setBankEditAccNum(user.accountNumber);
        setBankEditIfsc(user.ifscCode || 'MEZN0001234');
        setBankEditHolder(user.accountHolderName || user.userName || '');
        setBankEditUpi(user.upiId || '');
        setBankEditIsPrimary(true);
      } else {
        setBankEditBankId(null);
        setBankEditName('Meezan Bank');
        setBankEditAccNum('');
        setBankEditIfsc('MEZN0001234');
        setBankEditHolder(user.userName || '');
        setBankEditUpi('');
        setBankEditIsPrimary(true);
      }
    }
    setBankEditSuccess('');
    setBankEditError('');
  };

  const openBankAddModal = (user: UserRecord) => {
    setBankEditUser(user);
    setBankEditBankId(null);
    setBankEditName('Meezan Bank');
    setBankEditAccNum('');
    setBankEditIfsc('MEZN0001234');
    setBankEditHolder(user.userName || '');
    setBankEditUpi('');
    const hasAnyBank = (user.bankAccounts && user.bankAccounts.length > 0) || (user.bankName && user.bankName !== 'No Bank Linked' && user.accountNumber);
    setBankEditIsPrimary(!hasAnyBank);
    setBankEditSuccess('');
    setBankEditError('');
  };

  const handleSaveUserBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankEditUser) return;
    if (!bankEditName.trim() || !bankEditAccNum.trim() || !bankEditIfsc.trim() || !bankEditHolder.trim()) {
      setBankEditError('Please fill in Bank Name, Account Number, IBAN/Branch Code, and Account Holder Name.');
      return;
    }
    setBankEditLoading(true);
    setBankEditError('');
    setBankEditSuccess('');
    try {
      const res = await adminUpdateUserBankDetails(bankEditUser.userPhone || bankEditUser.userId, {
        id: bankEditBankId || undefined,
        bankName: bankEditName.trim(),
        accountNumber: bankEditAccNum.trim(),
        ifscCode: bankEditIfsc.trim().toUpperCase(),
        accountHolderName: bankEditHolder.trim(),
        upiId: bankEditUpi.trim(),
        isPrimary: bankEditIsPrimary,
      });
      if (res.success) {
        setBankEditSuccess(res.message || 'Bank account saved to database successfully!');
        if (selectedUserModal && selectedUserModal.userId === bankEditUser.userId) {
          const freshTarget = allUsers.find(u => u.userId === bankEditUser.userId || u.userPhone === bankEditUser.userPhone);
          if (freshTarget) setSelectedUserModal(freshTarget);
        }
        setTimeout(() => {
          setBankEditUser(null);
          setBankEditSuccess('');
        }, 1200);
      } else {
        setBankEditError(res.message || 'Failed to save bank details.');
      }
    } catch (err: any) {
      setBankEditError(err?.message || 'Error updating bank details.');
    } finally {
      setBankEditLoading(false);
    }
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAccountReveal = (id: string) => {
    setRevealedAccountIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullUserDetails = (u: UserRecord) => {
    const banks: BankAccount[] = (u.bankAccounts && u.bankAccounts.length > 0)
      ? u.bankAccounts
      : (u.accountNumber && u.bankName && u.bankName !== 'No Bank Linked' ? [{
          id: `b-1`,
          bankName: u.bankName,
          accountNumber: u.accountNumber,
          ifscCode: u.ifscCode || 'N/A',
          accountHolderName: u.accountHolderName || u.userName,
          upiId: u.upiId || '',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }] : []);

    const bankDetailsText = banks.length > 0
      ? banks.map((b, idx) => `Bank #${idx + 1}${b.isPrimary ? ' [PRIMARY]' : ''}:
- Bank Name: ${b.bankName}
- Account Number: ${b.accountNumber}
- IBAN / Branch Code: ${b.ifscCode || 'N/A'}
- Account Holder: ${b.accountHolderName || u.userName}
- Account / Raast ID: ${b.upiId || 'N/A'}`).join('\n\n')
      : 'No Bank Accounts Linked';

    const text = `User Name: ${u.userName}
Mobile Number: +92 ${u.userPhone}
User ID: ${u.userId}
Email: ${u.email}
Password: ${u.password}

=== LINKED BANK ACCOUNTS (${banks.length}) ===
${bankDetailsText}

=== BALANCES ===
Top-Up Balance: Rs. ${(u.topUpBalance ?? u.availableBalance ?? 0).toLocaleString('en-PK')}
Withdrawable Balance: Rs. ${(u.withdrawableBalance ?? 0).toLocaleString('en-PK')}
Today Commission: Rs. ${(u.todayCommission || 0).toLocaleString('en-PK')}`;
    copyText(text, `full-${u.userId}`);
  };

  // Master Users list strictly reflecting Firestore registered users
  const displayUsers = useMemo(() => {
    let list: UserRecord[] = [...allUsers];

    // Search query filter
    const q = userSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        u =>
          (u.userName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.userPhone || '').toLowerCase().includes(q) ||
          (u.userId || '').toLowerCase().includes(q) ||
          (u.bankName || '').toLowerCase().includes(q) ||
          (u.ifscCode || '').toLowerCase().includes(q) ||
          (u.accountNumber || '').toLowerCase().includes(q) ||
          (u.accountHolderName || '').toLowerCase().includes(q) ||
          (u.password || '').toLowerCase().includes(q) ||
          (u.bankAccounts && u.bankAccounts.some(b =>
            (b.bankName || '').toLowerCase().includes(q) ||
            (b.accountNumber || '').toLowerCase().includes(q) ||
            (b.ifscCode || '').toLowerCase().includes(q) ||
            (b.accountHolderName || '').toLowerCase().includes(q) ||
            (b.upiId || '').toLowerCase().includes(q)
          ))
      );
    }

    // Bank status filter
    if (userBankFilter === 'LINKED') {
      list = list.filter(
        u =>
          (u.bankAccounts && u.bankAccounts.length > 0) ||
          (u.bankName && u.bankName !== 'No Bank Linked' && u.accountNumber)
      );
    } else if (userBankFilter === 'UNLINKED') {
      list = list.filter(
        u =>
          (!u.bankAccounts || u.bankAccounts.length === 0) &&
          (!u.bankName || u.bankName === 'No Bank Linked' || !u.accountNumber)
      );
    }

    return list;
  }, [
    allUsers,
    userPhone,
    userId,
    userName,
    userEmail,
    topUpBalance,
    withdrawableBalance,
    availableBalance,
    todayCommission,
    bankAccounts,
    userSearchQuery,
    userBankFilter,
  ]);

  // Keep config in sync if changed
  useEffect(() => {
    setUpiIdInput(config.upiId);
    setUpiNameInput(config.upiName);
    setMinDepInput(config.minDeposit.toString());
    setMaxDepInput(config.maxDeposit.toString());
    setMinWthInput(config.minWithdraw.toString());
    setMaxWthInput(config.maxWithdraw.toString());
    setStartTimeInput(config.sellRpStartTime);
    setEndTimeInput(config.sellRpEndTime);
    setTelegramSupportInput(config.supportTelegram || '');
    setTelegramChannelInput(config.officialChannel || '');
    setSupportWhatsappInput(config.supportWhatsapp || '');
    setSupportEmailInput(config.supportEmail || '');
    setSupportPhoneInput(config.supportPhone || '');
    setSupportNoticeInput(config.supportNotice || '');
  }, [config]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminUsername.trim().toLowerCase() === 'admin' && adminPassword === '112211') ||
      adminPassword === '112211'
    ) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('wzp_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Please enter the correct admin passcode.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('wzp_admin_auth');
  };

  const handleExitPortal = () => {
    if (window.location.hash === '#admin') {
      window.location.hash = '';
    }
    if (window.location.search.includes('portal=admin') || window.location.search.includes('admin=true')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setIsAdminOpen(false);
    if (onClose) onClose();
  };

  const pendingDeposits = depositRequests.filter(d => d.status === 'PENDING');
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'PROCESSING' || w.status === 'PENDING');

  // Filtered deposits for Database Table
  const filteredDeposits = useMemo(() => {
    return depositRequests.filter(req => {
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        req.id.toLowerCase().includes(query) ||
        req.userName.toLowerCase().includes(query) ||
        req.utr.toLowerCase().includes(query) ||
        req.amount.toString().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [depositRequests, statusFilter, searchQuery]);

  // Filtered withdrawals for Database Table
  const filteredWithdrawals = useMemo(() => {
    return withdrawalRequests.filter(req => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        req.status === statusFilter ||
        (statusFilter === 'PENDING' && (req.status === 'PROCESSING' || req.status === 'PENDING')) ||
        (statusFilter === 'PROCESSING' && (req.status === 'PROCESSING' || req.status === 'PENDING'));
      const query = searchQuery.toLowerCase().trim();
      const bankName = req.bankAccount?.bankName || '';
      const accNum = req.bankAccount?.accountNumber || '';
      const upi = req.payoutUpiId || '';
      const phone = req.userPhone || '';
      const matchesSearch =
        !query ||
        req.id.toLowerCase().includes(query) ||
        (req.userName && req.userName.toLowerCase().includes(query)) ||
        phone.includes(query) ||
        bankName.toLowerCase().includes(query) ||
        accNum.includes(query) ||
        upi.toLowerCase().includes(query) ||
        req.amount.toString().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [withdrawalRequests, statusFilter, searchQuery]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      upiId: upiIdInput.trim(),
      upiName: upiNameInput.trim(),
      easypaisaNumber: easypaisaNumberInput.trim(),
      easypaisaTitle: easypaisaTitleInput.trim(),
      jazzcashNumber: jazzcashNumberInput.trim(),
      jazzcashTitle: jazzcashTitleInput.trim(),
      minDeposit: parseInt(minDepInput, 10) || 100,
      maxDeposit: parseInt(maxDepInput, 10) || 100000,
      minWithdraw: parseInt(minWthInput, 10) || 100,
      maxWithdraw: parseInt(maxWthInput, 10) || 500000,
      sellRpStartTime: startTimeInput.trim(),
      sellRpEndTime: endTimeInput.trim(),
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  const handleSaveSupport = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      supportTelegram: telegramSupportInput.trim(),
      officialChannel: telegramChannelInput.trim(),
      supportWhatsapp: supportWhatsappInput.trim(),
      supportEmail: supportEmailInput.trim(),
      supportPhone: supportPhoneInput.trim(),
      supportNotice: supportNoticeInput.trim(),
    });
    setSupportSaved(true);
    setTimeout(() => setSupportSaved(false), 2500);
  };

  const handleExecuteAdjust = async (isAdd: boolean) => {
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) return;
    
    const balanceLabel = adjustBalanceType === 'topUp' ? 'Top-Up Balance' : 'Withdrawable Balance';

    if (selectedUserForAdjust) {
      await adjustSpecificUserBalance(
        selectedUserForAdjust.userPhone || selectedUserForAdjust.userId,
        num,
        isAdd,
        adjustNote || `Admin ${balanceLabel} adjustment for ${selectedUserForAdjust.userName}`,
        adjustBalanceType
      );
      setAdjustSuccess(`Successfully ${isAdd ? 'credited' : 'debited'} Rs. ${num.toLocaleString('en-PK')} (${balanceLabel}) for ${selectedUserForAdjust.userName}`);
    } else {
      adjustUserBalance(
        num,
        isAdd,
        adjustNote || `Admin manual ${balanceLabel} adjustment`,
        adjustBalanceType
      );
      setAdjustSuccess(`Successfully ${isAdd ? 'credited' : 'debited'} Rs. ${num.toLocaleString('en-PK')} (${balanceLabel})`);
    }

    setAdjustAmount('');
    setAdjustNote('');
    setTimeout(() => setAdjustSuccess(''), 4000);
  };

  const handleApproveDepositClick = async (id: string) => {
    setActionLoading(id);
    try {
      await approveDeposit(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawalClick = async (id: string) => {
    setActionLoading(id);
    try {
      await approveWithdrawal(id);
    } finally {
      setActionLoading(null);
    }
  };

  // If not authenticated, display standalone Secure Login Gate for the Admin Portal
  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs text-slate-900 z-50 overflow-y-auto flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="WinzoPay Logo"
                className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-amber-400/40 bg-slate-950"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Admin Database Portal</h1>
                <p className="text-xs text-slate-500">Master Approval & Ledger Console</p>
              </div>
            </div>
            <button
              onClick={handleExitPortal}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Return to User App"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Admin Username</label>
              <input
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Master Passcode / PIN</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Sign In to Database Console
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Firestore Realtime DB Active
            </span>
            <button
              onClick={handleExitPortal}
              className="text-blue-900 hover:underline font-semibold"
            >
              Exit to Customer App →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 text-slate-900 z-50 overflow-y-auto flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Admin Header Bar */}
      <header className="bg-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="WinzoPay Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-xs border border-amber-400/40 bg-slate-950"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                WinzoPay Admin Database
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE FIRESTORE DB
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:block">Real-time Approval & Ledger Management</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAdminLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Lock Admin Session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          <button
            onClick={handleExitPortal}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit to App</span>
          </button>
        </div>
      </header>

      {/* Admin Tab Switcher */}
      <div className="bg-white px-4 sm:px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Dashboard', badge: null },
          { id: 'DEPOSITS', label: 'Deposit Queue', badge: pendingDeposits.length },
          { id: 'WITHDRAWALS', label: 'Withdrawal Queue', badge: pendingWithdrawals.length },
          { id: 'LEDGER', label: 'All Database Transactions', badge: transactions.length },
          { id: 'USERS', label: 'User Details & Accounts', badge: displayUsers.length },
          { id: 'TEAMS', label: 'Referral Teams', badge: allTeams.length },
          { id: 'SUPPORT', label: 'Telegram & Support', badge: null },
          { id: 'GATEWAY', label: 'Gateway Settings', badge: null },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveAdminTab(t.id as any);
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            {t.badge !== null && t.badge > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeAdminTab === t.id ? 'bg-white text-slate-900 font-extrabold' : 'bg-rose-500 text-white'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Admin Content Container */}
      <main className="p-4 sm:p-6 max-w-4xl w-full mx-auto flex-1 flex flex-col gap-5">
        {/* Tab 1: OVERVIEW */}
        {activeAdminTab === 'OVERVIEW' && (
          <div className="flex flex-col gap-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Pending Deposits in DB</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingDeposits.length}</span>
                <button
                  onClick={() => {
                    setActiveAdminTab('DEPOSITS');
                    setStatusFilter('PENDING');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-blue-900 hover:underline mt-2 font-bold block"
                >
                  Approve Deposits →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Pending Withdrawals in DB</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{pendingWithdrawals.length}</span>
                <button
                  onClick={() => {
                    setActiveAdminTab('WITHDRAWALS');
                    setStatusFilter('PENDING');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-blue-900 hover:underline mt-2 font-bold block"
                >
                  Approve Payouts →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Database Records</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">
                  {depositRequests.length + withdrawalRequests.length}
                </span>
                <button
                  onClick={() => setActiveAdminTab('LEDGER')}
                  className="text-[11px] text-blue-900 hover:underline mt-2 font-bold block"
                >
                  View Database Ledger →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Registered Users</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {allUsers.length}
                </span>
                <button
                  onClick={() => setActiveAdminTab('USERS')}
                  className="text-[11px] text-blue-900 hover:underline mt-2 font-bold block"
                >
                  Manage Users ({allUsers.length}) →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Referral Teams</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">
                  {allTeams.length}
                </span>
                <button
                  onClick={() => setActiveAdminTab('TEAMS')}
                  className="text-[11px] text-blue-900 hover:underline mt-2 font-bold block"
                >
                  View Referral Teams ({allTeams.reduce((sum, t) => sum + t.totalMembers, 0)} Members) →
                </button>
              </div>
            </div>

            {/* Quick Test Injections into Database */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-900" /> Database Live Test Actions
              </h3>
              <p className="text-xs text-slate-500">
                Instantly inject test requests into the database to verify real-time user-to-admin approval flow:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    const demoUtr = `4289${Math.floor(10000000 + Math.random() * 90000000)}`;
                    submitDeposit(1000, demoUtr, 'QR');
                    setActiveAdminTab('DEPOSITS');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Inject Rs. 1,000 Pending Deposit in DB
                </button>
                <button
                  onClick={() => {
                    adjustUserBalance(500, true, 'Test Balance for Withdrawal', 'withdrawable');
                    submitWithdrawal(500, undefined, 'UPI_QR', '03001234567');
                    setActiveAdminTab('WITHDRAWALS');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 border border-slate-200"
                >
                  <Plus className="w-4 h-4" /> Inject Rs. 500 Pending Withdrawal in DB
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to completely clean and wipe all records from the database? This action cannot be undone.')) {
                      setActionLoading('cleaning-db');
                      const res = await cleanEntireDatabase();
                      setActionLoading(null);
                      alert(res.message);
                    }
                  }}
                  disabled={actionLoading === 'cleaning-db'}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 border border-rose-200"
                >
                  <Trash2 className="w-4 h-4" /> {actionLoading === 'cleaning-db' ? 'Cleaning Database...' : 'Clean Database Completely'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DEPOSIT APPROVALS */}
        {activeAdminTab === 'DEPOSITS' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Deposit Transactions Database</span>
                  <span className="text-xs text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                    {filteredDeposits.length} Records
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Review 12-digit UTRs and approve wallet credits</p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                {[
                  { id: 'ALL' as const, label: 'ALL', count: depositRequests.length },
                  { id: 'PENDING' as const, label: 'PENDING', count: depositRequests.filter(d => d.status === 'PENDING').length },
                  { id: 'SUCCESS' as const, label: 'SUCCESS', count: depositRequests.filter(d => d.status === 'SUCCESS').length },
                  { id: 'REJECTED' as const, label: 'REJECTED', count: depositRequests.filter(d => d.status === 'REJECTED').length },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === st.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by Transaction ID, User Name, Amount, or Request ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400 shadow-xs"
              />
            </div>

            {filteredDeposits.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
                No deposit records found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDeposits.map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{req.userName}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700 border border-slate-200">
                            {req.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Method: {req.method} • {new Date(req.createdAt).toLocaleString('en-PK')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-extrabold text-emerald-600">
                          +Rs. {req.amount.toLocaleString('en-PK')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
                      <span className="text-slate-600">
                        Transaction ID: <strong className="text-blue-950 font-black">{req.utr}</strong>
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                        req.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {(req.screenshotUrl || req.receiptUrl) && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Payment Screenshot Attached
                        </span>
                        <a
                          href={req.screenshotUrl || req.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-blue-900 flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>View Screenshot</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {req.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => handleApproveDepositClick(req.id)}
                          className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          {actionLoading === req.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Approve & Credit Balance</span>
                        </button>
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => setRejectingId({ id: req.id, type: 'DEP' })}
                          className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: WITHDRAWAL APPROVALS */}
        {activeAdminTab === 'WITHDRAWALS' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Withdrawal Payouts Database</span>
                  <span className="text-xs text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                    {filteredWithdrawals.length} Records
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Live Payouts Ledger • Direct user withdrawals & outgoing 1Link / Raast records</p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                {[
                  { id: 'ALL' as const, label: 'ALL', count: withdrawalRequests.length },
                  { id: 'PENDING' as const, label: 'PENDING', count: withdrawalRequests.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING').length },
                  { id: 'SUCCESS' as const, label: 'SUCCESS', count: withdrawalRequests.filter(w => w.status === 'SUCCESS').length },
                  { id: 'REJECTED' as const, label: 'REJECTED', count: withdrawalRequests.filter(w => w.status === 'REJECTED').length },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === st.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by Bank, Account Number, User Name, or Request ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400 shadow-xs"
              />
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs">
                No withdrawal records found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredWithdrawals.map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{req.userName}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700 border border-slate-200">
                            {req.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(req.createdAt).toLocaleString('en-PK')}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-extrabold text-rose-600">
                          -Rs. {req.amount.toLocaleString('en-PK')}
                        </span>
                      </div>
                    </div>

                    {/* Bank Details or Mobile Wallet / Raast Card */}
                    {req.payoutMethod === 'UPI_QR' || req.payoutUpiId || req.payoutQrUrl ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payout Method:</span>
                          <span className="font-bold text-blue-900">QR / Wallet</span>
                        </div>
                        {req.payoutUpiId && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Payout Account / Raast ID:</span>
                            <span className="font-mono font-bold text-slate-900">{req.payoutUpiId}</span>
                          </div>
                        )}
                        {req.payoutQrUrl && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-500">Beneficiary QR:</span>
                            <a
                              href={req.payoutQrUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                            >
                              <span>View Uploaded QR</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Beneficiary Bank:</span>
                          <span className="font-bold text-slate-900">{req.bankAccount?.bankName || 'Direct 1Link / Raast'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Number:</span>
                          <span className="font-mono font-bold text-slate-900">{req.bankAccount?.accountNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IBAN / Branch Code:</span>
                          <span className="font-mono text-slate-700">{req.bankAccount?.ifscCode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Holder:</span>
                          <span className="text-slate-900 font-semibold">{req.bankAccount?.accountHolderName || req.userName}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Database Status:</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {(req.status === 'PROCESSING' || req.status === 'PENDING') && (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => handleApproveWithdrawalClick(req.id)}
                          className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          {actionLoading === req.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Approve Payout (1Link / Raast Dispatched)</span>
                        </button>
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => setRejectingId({ id: req.id, type: 'WTH' })}
                          className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject & Refund</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: MASTER DATABASE TRANSACTION LEDGER */}
        {activeAdminTab === 'LEDGER' && (() => {
          const masterLedgerList = allTransactions && allTransactions.length > 0 ? allTransactions : transactions;
          
          // Metrics
          const totalDeposited = masterLedgerList
            .filter(t => (t.type === 'DEPOSIT' || t.type === 'BUY_RP') && t.status === 'SUCCESS')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const totalWithdrawn = masterLedgerList
            .filter(t => t.type === 'WITHDRAWAL' && t.status === 'SUCCESS')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const totalRPSold = masterLedgerList
            .filter(t => t.type === 'SELL_RP')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const totalMiningProfits = masterLedgerList
            .filter(t => t.type === 'MINING_PROFIT')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const filteredLedger = masterLedgerList.filter(tx => {
            // Type filter
            if (ledgerTypeFilter === 'DEPOSIT' && tx.type !== 'DEPOSIT' && tx.type !== 'BUY_RP') return false;
            if (ledgerTypeFilter === 'WITHDRAWAL' && tx.type !== 'WITHDRAWAL') return false;
            if (ledgerTypeFilter === 'PLAN_PURCHASE' && tx.type !== 'PLAN_PURCHASE') return false;
            if (ledgerTypeFilter === 'SELL_RP' && tx.type !== 'SELL_RP') return false;
            if (ledgerTypeFilter === 'MINING_PROFIT' && tx.type !== 'MINING_PROFIT') return false;
            if (ledgerTypeFilter === 'ADJUSTMENT' && tx.type !== 'ADJUSTMENT' && tx.type !== 'COMMISSION' && tx.type !== 'REWARD') return false;

            // Search query
            if (ledgerSearchQuery.trim()) {
              const q = ledgerSearchQuery.toLowerCase();
              const matchId = tx.id?.toLowerCase().includes(q);
              const matchUser = tx.userName?.toLowerCase().includes(q);
              const matchPhone = tx.userPhone?.toLowerCase().includes(q);
              const matchUid = tx.userId?.toLowerCase().includes(q);
              const matchUtr = tx.utr?.toLowerCase().includes(q);
              const matchTitle = tx.title?.toLowerCase().includes(q);
              const matchNotes = tx.notes?.toLowerCase().includes(q);
              const matchBank = tx.bankDetails?.bankName?.toLowerCase().includes(q);
              return matchId || matchUser || matchPhone || matchUid || matchUtr || matchTitle || matchNotes || matchBank;
            }

            return true;
          });

          return (
            <div className="flex flex-col gap-4">
              {/* Top Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">Total Deposited</span>
                  <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                    +Rs. {totalDeposited.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">Total Withdrawn</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5 block">
                    -Rs. {totalWithdrawn.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">Total RP Sold</span>
                  <span className="text-lg font-black text-blue-900 mt-0.5 block">
                    Rs. {totalRPSold.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block">Mining Yields Distributed</span>
                  <span className="text-lg font-black text-amber-600 mt-0.5 block">
                    +Rs. {totalMiningProfits.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Title & Filter Header */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-900" />
                      <span>Master Platform Ledger</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                        {masterLedgerList.length} Total Records
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time synchronized history of deposits, withdrawals, RP trading, mining profits & payouts
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'ALL', label: 'All Records' },
                    { id: 'DEPOSIT', label: 'Deposits' },
                    { id: 'WITHDRAWAL', label: 'Withdrawals' },
                    { id: 'PLAN_PURCHASE', label: 'RP Purchases' },
                    { id: 'SELL_RP', label: 'Sold RP' },
                    { id: 'MINING_PROFIT', label: 'Mining Profits' },
                    { id: 'ADJUSTMENT', label: 'Adjustments' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setLedgerTypeFilter(tab.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        ledgerTypeFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search ledger by User Name, Phone, UID, Tx ID, UTR, Bank details, Notes..."
                    value={ledgerSearchQuery}
                    onChange={e => setLedgerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  {ledgerSearchQuery && (
                    <button
                      onClick={() => setLedgerSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Master Table */}
              {filteredLedger.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-xs flex flex-col items-center gap-2">
                  <Database className="w-8 h-8 text-slate-400" />
                  <p className="font-bold text-slate-700">No Ledger Transactions Found</p>
                  <p className="text-slate-400">Try changing the filter or search keywords.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[840px]">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Tx ID & Date</th>
                          <th className="p-3">User & Contact</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Amount (Rs.)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Reference / Bank / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLedger.map(tx => {
                          const isCredit = tx.type === 'DEPOSIT' || tx.type === 'SELL_RP' || tx.type === 'MINING_PROFIT' || tx.type === 'COMMISSION' || tx.type === 'REWARD';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 align-top">
                                <span className="font-mono font-bold text-blue-900 block">{tx.id}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{tx.timestamp}</span>
                              </td>

                              <td className="p-3 align-top">
                                <span className="font-extrabold text-slate-900 block">
                                  {tx.userName || 'Trader'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono block">
                                  {tx.userPhone ? `+92 ${tx.userPhone}` : (tx.userId || 'N/A')}
                                </span>
                              </td>

                              <td className="p-3 align-top">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-extrabold text-slate-800 border border-slate-200 inline-block">
                                  {tx.type}
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[140px]">
                                  {tx.title}
                                </span>
                              </td>

                              <td className="p-3 align-top text-right">
                                <span className={`font-black text-sm block ${isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {isCredit ? '+' : '-'}Rs. {Math.abs(tx.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                </span>
                                {tx.profitAmount !== undefined && (
                                  <span className="text-[10px] text-emerald-600 font-bold block">
                                    Profit: Rs. {tx.profitAmount.toLocaleString('en-PK')}
                                  </span>
                                )}
                              </td>

                              <td className="p-3 align-top text-center">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                  tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  tx.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>

                              <td className="p-3 align-top text-slate-600 text-[11px]">
                                {tx.utr && (
                                  <div className="font-mono text-emerald-700 font-bold text-[11px]">
                                    UTR: {tx.utr}
                                  </div>
                                )}
                                {tx.bankDetails && (
                                  <div className="text-slate-800 font-medium text-[11px]">
                                    {tx.bankDetails.bankName} • {tx.bankDetails.accountNumber} ({tx.bankDetails.accountHolderName})
                                  </div>
                                )}
                                {tx.sellerName && (
                                  <div className="text-blue-900 font-medium text-[10px]">
                                    Seller: {tx.sellerName}
                                  </div>
                                )}
                                {tx.notes && (
                                  <div className="text-slate-500 text-[10px] mt-0.5 max-w-xs">
                                    {tx.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 5: USER DETAILS, CREDENTIALS & BANK ACCOUNTS DIRECTORY */}
        {activeAdminTab === 'USERS' && (
          <div className="flex flex-col gap-5">
            {/* Top Overview Metric Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Total Registered Users</span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">{displayUsers.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Bank Accounts Linked</span>
                  <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                    {displayUsers.filter(u => u.bankName && u.bankName !== 'No Bank Linked' && u.accountNumber).length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Total User Balances in DB</span>
                  <span className="text-2xl font-black text-blue-900 mt-0.5 block">
                    Rs. {displayUsers.reduce((sum, u) => sum + (u.availableBalance || 0), 0).toLocaleString('en-PK')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Direct Balance Override Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {selectedUserForAdjust ? `Target User: ${selectedUserForAdjust.userName}` : 'Active User Balance Management'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Direct administrative credit or debit with instant database sync</p>
                  </div>
                </div>

                {selectedUserForAdjust && (
                  <button
                    onClick={() => setSelectedUserForAdjust(null)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Clear Selection
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {selectedUserForAdjust ? selectedUserForAdjust.userName : userName || 'Active User'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedUserForAdjust
                      ? `+92 ${selectedUserForAdjust.userPhone} • UID: ${selectedUserForAdjust.userId} • Email: ${selectedUserForAdjust.email}`
                      : `${userPhone ? `+92 ${userPhone}` : 'No Phone'} • UID: ${userId || 'Unassigned'} • Email: ${userEmail || 'Active'}`}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Top-Up Bal</span>
                    <span className="font-extrabold text-blue-900 text-sm">
                      Rs. {(selectedUserForAdjust ? (selectedUserForAdjust.topUpBalance ?? selectedUserForAdjust.availableBalance ?? 0) : topUpBalance).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Withdrawable Bal</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      Rs. {(selectedUserForAdjust ? (selectedUserForAdjust.withdrawableBalance ?? 0) : withdrawableBalance).toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>
              </div>

              {adjustSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {adjustSuccess}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Target Balance Type & Amount (Rs.)</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdjustBalanceType('topUp')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adjustBalanceType === 'topUp'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Top-Up Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustBalanceType('withdrawable')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adjustBalanceType === 'withdrawable'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Withdrawable Balance
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Enter amount in Rs. (e.g. 500)"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Reason / Note (e.g. Direct Admin Topup)"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleExecuteAdjust(true)}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" /> Credit Funds (+)
                  </button>
                  <button
                    onClick={() => handleExecuteAdjust(false)}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Minus className="w-4 h-4" /> Debit Funds (-)
                  </button>
                </div>
              </div>
            </div>

            {/* Master User Directory Table and Cards */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Registered Users & Accounts Directory</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                      {displayUsers.length} Users
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View user names, emails, login passwords, and linked bank accounts
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete and wipe ALL user accounts from the database? This action cannot be undone.')) {
                        setActionLoading('wipe-users');
                        const res = await wipeAllUsers();
                        setActionLoading(null);
                        alert(res.message);
                      }
                    }}
                    disabled={actionLoading === 'wipe-users' || allUsers.length === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{actionLoading === 'wipe-users' ? 'Wiping...' : 'Clean Users Table'}</span>
                  </button>
                  <button
                    onClick={() => setShowAllPasswords(!showAllPasswords)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      showAllPasswords
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {showAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAllPasswords ? 'Hide Passwords' : 'Show All Passwords'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, email, password, phone, bank name, account no, IBAN..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setUserBankFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userBankFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({allUsers.length || 1})
                  </button>
                  <button
                    onClick={() => setUserBankFilter('LINKED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userBankFilter === 'LINKED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Bank Linked
                  </button>
                  <button
                    onClick={() => setUserBankFilter('UNLINKED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userBankFilter === 'UNLINKED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    No Bank
                  </button>
                </div>
              </div>

              {/* Table of User Records */}
              {displayUsers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-slate-400" />
                  <p className="text-xs text-slate-500 font-bold">No user accounts found matching "{userSearchQuery}"</p>
                  <button
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserBankFilter('ALL');
                    }}
                    className="text-xs text-blue-900 font-bold hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="p-3">User & Contact</th>
                        <th className="p-3">Credentials (Email & Password)</th>
                        <th className="p-3">Linked Bank Name & Details</th>
                        <th className="p-3 text-right">Balance</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {displayUsers.map((u, idx) => {
                        const isPasswordVisible = showAllPasswords || revealedPasswordIds.has(u.userId);
                        const isAccountVisible = revealedAccountIds.has(u.userId);
                        const userBanks: BankAccount[] = (u.bankAccounts && u.bankAccounts.length > 0)
                          ? u.bankAccounts
                          : (u.accountNumber && u.bankName && u.bankName !== 'No Bank Linked' ? [{
                              id: `bank-def-${u.userId}`,
                              bankName: u.bankName,
                              accountNumber: u.accountNumber,
                              ifscCode: u.ifscCode || '',
                              accountHolderName: u.accountHolderName || u.userName,
                              upiId: u.upiId || '',
                              isPrimary: true,
                              createdAt: u.createdAt || new Date().toISOString(),
                            }] : []);
                        const hasBank = userBanks.length > 0;
                        const isSelected = selectedUserForAdjust?.userId === u.userId;

                        return (
                          <tr
                            key={u.userId || idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-blue-50/60 font-medium' : ''
                            }`}
                          >
                            {/* User & Contact */}
                            <td className="p-3 align-top">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 mt-0.5">
                                  {(u.userName || 'U').charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900 text-sm">{u.userName || 'Unnamed User'}</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                      VIP {u.vipLevel || 1}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>+92 {u.userPhone || 'N/A'}</span>
                                    <button
                                      onClick={() => copyText(u.userPhone || '', `phone-${u.userId}`)}
                                      title="Copy Phone"
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    >
                                      {copiedField === `phone-${u.userId}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                                    <span>UID: {u.userId}</span>
                                    {u.referralCode && (
                                      <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 font-bold border border-blue-200">
                                        Code: {u.referralCode}
                                      </span>
                                    )}
                                  </div>

                                  {/* Joined via referral details in DB & Dashboard */}
                                  <div className="mt-1 flex flex-col gap-0.5">
                                    <div className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                      <span className="text-slate-400 font-bold">Joined Via Code:</span>
                                      <span className="font-mono font-bold text-blue-900">
                                        {u.joinedViaReferralCode || u.referredBy || 'Direct Registration'}
                                      </span>
                                      {u.referrerName && (
                                        <span className="text-slate-500 font-medium">({u.referrerName})</span>
                                      )}
                                    </div>

                                    {(u.joinedViaReferralLink || u.joinedViaReferralCode) && (
                                      <div className="text-[9px] text-slate-500 font-mono bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center justify-between gap-1">
                                        <span className="truncate max-w-[180px]" title={u.joinedViaReferralLink || `https://winzopay-website.onrender.com/signup?ref=${u.joinedViaReferralCode}`}>
                                          Link: {u.joinedViaReferralLink || `.../signup?ref=${u.joinedViaReferralCode}`}
                                        </span>
                                        <button
                                          onClick={() => copyText(u.joinedViaReferralLink || `https://winzopay-website.onrender.com/signup?ref=${u.joinedViaReferralCode}`, `reflink-${u.userId}`)}
                                          title="Copy Registration Referral Link"
                                          className="text-blue-900 hover:text-blue-950 cursor-pointer shrink-0"
                                        >
                                          {copiedField === `reflink-${u.userId}` ? (
                                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-2.5 h-2.5" />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Credentials: Email & Password */}
                            <td className="p-3 align-top">
                              <div className="flex flex-col gap-1.5">
                                {/* Email */}
                                <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
                                  <Mail className="w-3 h-3 text-blue-900 shrink-0" />
                                  <span className="font-medium text-slate-800 truncate max-w-[180px]" title={u.email}>
                                    {u.email || `${u.userPhone || 'user'}@winzopay.com`}
                                  </span>
                                  <button
                                    onClick={() => copyText(u.email || `${u.userPhone || 'user'}@winzopay.com`, `email-${u.userId}`)}
                                    title="Copy Email"
                                    className="ml-auto text-slate-400 hover:text-slate-700 cursor-pointer"
                                  >
                                    {copiedField === `email-${u.userId}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>

                                {/* Password */}
                                <div className="flex items-center gap-1.5 text-[11px] bg-amber-50/70 border border-amber-200/70 px-2 py-1 rounded-lg">
                                  <KeyRound className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span className="font-mono font-bold text-slate-900 tracking-wider">
                                    {isPasswordVisible ? (u.password || '••••••') : '••••••••'}
                                  </span>
                                  <div className="ml-auto flex items-center gap-1">
                                    <button
                                      onClick={() => togglePasswordReveal(u.userId)}
                                      title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    >
                                      {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button
                                      onClick={() => copyText(u.password || '', `pass-${u.userId}`)}
                                      title="Copy Password"
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    >
                                      {copiedField === `pass-${u.userId}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Linked Bank Name & Details */}
                            <td className="p-3 align-top min-w-[240px]">
                              {hasBank ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-emerald-700" />
                                      {userBanks.length} {userBanks.length === 1 ? 'Bank Linked' : 'Banks Linked'}
                                    </span>
                                    <button
                                      onClick={() => openBankAddModal(u)}
                                      title="Add another bank account for this user"
                                      className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                    >
                                      <Plus className="w-2.5 h-2.5" /> Add Bank
                                    </button>
                                  </div>

                                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                                    {userBanks.map((b, bIdx) => (
                                      <div
                                        key={b.id || b.accountNumber || bIdx}
                                        className={`p-2 rounded-xl border text-[11px] flex flex-col gap-1 ${
                                          b.isPrimary
                                            ? 'bg-emerald-50/60 border-emerald-200/80 shadow-2xs'
                                            : 'bg-slate-50 border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1 font-extrabold text-slate-900">
                                            <Building2 className={`w-3 h-3 ${b.isPrimary ? 'text-emerald-600' : 'text-slate-500'}`} />
                                            <span className="truncate max-w-[130px]" title={b.bankName}>{b.bankName}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {b.isPrimary ? (
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-200 text-emerald-900">
                                                PRIMARY
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => adminSetPrimaryUserBank(u.userPhone || u.userId, b.id || b.accountNumber)}
                                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 cursor-pointer transition"
                                                title="Make this bank account primary"
                                              >
                                                Set Primary
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 font-mono text-slate-700 text-[10px]">
                                          <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>
                                            {isAccountVisible
                                              ? b.accountNumber
                                              : b.accountNumber
                                              ? `•••• ${b.accountNumber.slice(-4)}`
                                              : 'N/A'}
                                          </span>
                                          {b.accountNumber && (
                                            <button
                                              onClick={() => toggleAccountReveal(u.userId)}
                                              className="text-slate-400 hover:text-slate-600 text-[10px]"
                                            >
                                              {isAccountVisible ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                                            </button>
                                          )}
                                          {b.accountNumber && (
                                            <button
                                              onClick={() => copyText(b.accountNumber, `acc-${u.userId}-${bIdx}`)}
                                              title="Copy Account Number"
                                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                              {copiedField === `acc-${u.userId}-${bIdx}` ? (
                                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                              ) : (
                                                <Copy className="w-2.5 h-2.5" />
                                              )}
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                          <span>IBAN: <span className="font-mono font-bold text-slate-700">{b.ifscCode || 'N/A'}</span></span>
                                          {b.accountHolderName && (
                                            <span className="truncate max-w-[100px] text-slate-600">({b.accountHolderName})</span>
                                          )}
                                        </div>

                                        {b.upiId && (
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            ID: <span className="text-slate-700">{b.upiId}</span>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-slate-200/60">
                                          <button
                                            onClick={() => openBankEditModal(u, b)}
                                            className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold cursor-pointer transition-colors"
                                          >
                                            Edit
                                          </button>
                                          {userBanks.length > 1 && (
                                            <button
                                              onClick={async () => {
                                                if (window.confirm(`Remove bank ${b.bankName} (${b.accountNumber.slice(-4)}) for user ${u.userName}?`)) {
                                                  await adminDeleteUserBank(u.userPhone || u.userId, b.id || b.accountNumber);
                                                }
                                              }}
                                              className="px-1.5 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer transition-colors ml-auto"
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 items-start">
                                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500 w-full">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>No Bank Account Linked</span>
                                  </div>
                                  <button
                                    onClick={() => openBankAddModal(u)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1"
                                  >
                                    <Building2 className="w-3 h-3" /> Link Bank
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Balance */}
                            <td className="p-3 align-top text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-bold">Top-Up:</span>
                                  <span className="font-extrabold text-blue-900 text-xs">
                                    Rs. {(u.topUpBalance ?? u.availableBalance ?? 0).toLocaleString('en-PK')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-bold">Withdrawable:</span>
                                  <span className="font-black text-emerald-600 text-xs">
                                    Rs. {(u.withdrawableBalance ?? 0).toLocaleString('en-PK')}
                                  </span>
                                </div>
                                {(u.todayCommission || 0) > 0 && (
                                  <span className="text-[9px] text-amber-700 font-bold">
                                    +Rs. {(u.todayCommission || 0).toLocaleString('en-PK')} comm
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 align-top text-center">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedUserForAdjust(u)}
                                  title="Adjust this user's balance"
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                                >
                                  Adjust
                                </button>
                                <button
                                  onClick={() => copyFullUserDetails(u)}
                                  title="Copy All User Details"
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                >
                                  {copiedField === `full-${u.userId}` ? (
                                    <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                                      <Check className="w-3 h-3" /> Copied
                                    </span>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setSelectedUserModal(u)}
                                  title="Inspect Full Profile & Accounts"
                                  className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Delete user account for "${u.userName}" (+92 ${u.userPhone}) from database?`)) {
                                      setActionLoading(`del-${u.userId}`);
                                      const res = await deleteUser(u.userPhone || u.userId);
                                      setActionLoading(null);
                                      alert(res.message);
                                    }
                                  }}
                                  disabled={actionLoading === `del-${u.userId}`}
                                  title="Delete User Account"
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-all disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inspect User Full Details Modal */}
            {selectedUserModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs text-slate-900 z-50 overflow-y-auto flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center uppercase">
                        {(selectedUserModal.userName || 'U').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{selectedUserModal.userName}</h3>
                        <p className="text-xs text-slate-500">UID: {selectedUserModal.userId} • VIP {selectedUserModal.vipLevel || 1}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUserModal(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Complete Credentials */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Credentials</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold block">USER NAME</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{selectedUserModal.userName}</span>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold block">MOBILE NUMBER</span>
                        <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">+92 {selectedUserModal.userPhone}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold block">EMAIL ADDRESS</span>
                        <span className="font-mono font-bold text-blue-900 text-xs mt-0.5 block truncate">{selectedUserModal.email}</span>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-700 font-bold block">LOGIN PASSWORD</span>
                        <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">{selectedUserModal.password || '••••••'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Linked Bank Accounts */}
                  <div className="flex flex-col gap-2.5">
                    {(() => {
                      const modalBanks: BankAccount[] = (selectedUserModal.bankAccounts && selectedUserModal.bankAccounts.length > 0)
                        ? selectedUserModal.bankAccounts
                        : (selectedUserModal.accountNumber && selectedUserModal.bankName && selectedUserModal.bankName !== 'No Bank Linked' ? [{
                            id: `modal-bank-1`,
                            bankName: selectedUserModal.bankName,
                            accountNumber: selectedUserModal.accountNumber,
                            ifscCode: selectedUserModal.ifscCode || '',
                            accountHolderName: selectedUserModal.accountHolderName || selectedUserModal.userName,
                            upiId: selectedUserModal.upiId || '',
                            isPrimary: true,
                            createdAt: selectedUserModal.createdAt || new Date().toISOString(),
                          }] : []);

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Bank Accounts</h4>
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {modalBanks.length}
                              </span>
                            </div>
                            <button
                              onClick={() => openBankAddModal(selectedUserModal)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Plus className="w-3 h-3" /> Add Bank Account
                            </button>
                          </div>

                          {modalBanks.length > 0 ? (
                            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                              {modalBanks.map((b, bIdx) => (
                                <div
                                  key={b.id || b.accountNumber || bIdx}
                                  className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-2 ${
                                    b.isPrimary
                                      ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                      <Building2 className={`w-4 h-4 ${b.isPrimary ? 'text-emerald-600' : 'text-slate-500'}`} />
                                      {b.bankName}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {b.isPrimary ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold">
                                          PRIMARY BANK
                                        </span>
                                      ) : (
                                        <button
                                          onClick={async () => {
                                            await adminSetPrimaryUserBank(selectedUserModal.userPhone || selectedUserModal.userId, b.id || b.accountNumber);
                                            const fresh = allUsers.find(u => u.userId === selectedUserModal.userId);
                                            if (fresh) setSelectedUserModal(fresh);
                                          }}
                                          className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 text-[10px] font-bold cursor-pointer transition"
                                        >
                                          Set As Primary
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block">Account Number</span>
                                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                                        <span>{b.accountNumber || 'N/A'}</span>
                                        {b.accountNumber && (
                                          <button
                                            onClick={() => copyText(b.accountNumber, `m-acc-${bIdx}`)}
                                            title="Copy"
                                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                          >
                                            {copiedField === `m-acc-${bIdx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 block">IBAN / Branch Code</span>
                                      <span className="font-mono font-bold text-slate-900">{b.ifscCode || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 block">Account Holder</span>
                                      <span className="font-medium text-slate-900">{b.accountHolderName || selectedUserModal.userName}</span>
                                    </div>
                                    {b.upiId && (
                                      <div>
                                        <span className="text-[10px] text-slate-500 block">Account / Raast ID</span>
                                        <span className="font-mono text-slate-900">{b.upiId}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                                    <button
                                      onClick={() => openBankEditModal(selectedUserModal, b)}
                                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold cursor-pointer transition"
                                    >
                                      Edit Details
                                    </button>
                                    {modalBanks.length > 1 && (
                                      <button
                                        onClick={async () => {
                                          if (window.confirm(`Remove bank ${b.bankName} (${b.accountNumber.slice(-4)})?`)) {
                                            await adminDeleteUserBank(selectedUserModal.userPhone || selectedUserModal.userId, b.id || b.accountNumber);
                                            const fresh = allUsers.find(u => u.userId === selectedUserModal.userId);
                                            if (fresh) setSelectedUserModal(fresh);
                                          }
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer transition"
                                      >
                                        Remove Bank
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                              <span>No bank account has been added by this user yet.</span>
                              <button
                                onClick={() => openBankAddModal(selectedUserModal)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Building2 className="w-3.5 h-3.5" /> Link Bank Account Now
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Financial Overview */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Top-up Balance</span>
                      <span className="text-lg font-black text-blue-400">
                        Rs. {(selectedUserModal.topUpBalance ?? selectedUserModal.availableBalance ?? 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Withdrawable</span>
                      <span className="text-lg font-black text-emerald-400">
                        Rs. {(selectedUserModal.withdrawableBalance ?? 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Today Commission</span>
                      <span className="text-lg font-bold text-amber-300">
                        Rs. {(selectedUserModal.todayCommission || 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyFullUserDetails(selectedUserModal)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" /> Copy Full Dossier
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete user "${selectedUserModal.userName}"?`)) {
                            setActionLoading(`del-modal-${selectedUserModal.userId}`);
                            const res = await deleteUser(selectedUserModal.userPhone || selectedUserModal.userId);
                            setActionLoading(null);
                            setSelectedUserModal(null);
                            alert(res.message);
                          }
                        }}
                        disabled={actionLoading === `del-modal-${selectedUserModal.userId}`}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete User
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUserForAdjust(selectedUserModal);
                        setSelectedUserModal(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Adjust Balance
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Admin Direct Bank Account Link / Edit */}
            {bankEditUser && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs text-slate-900 z-50 overflow-y-auto flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {bankEditBankId ? 'Edit Bank Account' : 'Link New Bank Account'}
                        </h3>
                        <p className="text-xs text-slate-500">User: {bankEditUser.userName} (+92 {bankEditUser.userPhone})</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBankEditUser(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {bankEditSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{bankEditSuccess}</span>
                    </div>
                  )}

                  {bankEditError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{bankEditError}</span>
                    </div>
                  )}

                  {/* Popular Bank Quick Select */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Quick Select Bank</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Meezan Bank', 'Habib Bank Limited (HBL)', 'United Bank Limited (UBL)', 'MCB Bank', 'Allied Bank Limited (ABL)', 'Bank Alfalah', 'Easypaisa', 'JazzCash'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBankEditName(b)}
                          className={`px-2 py-1 text-[11px] rounded-lg border font-medium cursor-pointer transition ${
                            bankEditName === b
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {b.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSaveUserBank} className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankEditName}
                        onChange={(e) => setBankEditName(e.target.value)}
                        placeholder="e.g. Meezan Bank, HBL, Easypaisa"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                      <input
                        type="text"
                        value={bankEditAccNum}
                        onChange={(e) => setBankEditAccNum(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 01020304050607"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">IBAN / Branch Code</label>
                        <input
                          type="text"
                          value={bankEditIfsc}
                          onChange={(e) => setBankEditIfsc(e.target.value.toUpperCase())}
                          placeholder="e.g. MEZN0001234 or PK36MEZN..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          value={bankEditHolder}
                          onChange={(e) => setBankEditHolder(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Account / Raast ID (Optional)</label>
                      <input
                        type="text"
                        value={bankEditUpi}
                        onChange={(e) => setBankEditUpi(e.target.value)}
                        placeholder="e.g. 03001234567 or username@raast"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={bankEditIsPrimary}
                        onChange={(e) => setBankEditIsPrimary(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Set as Primary Bank Account</span>
                        <span className="text-[10px] text-slate-500">Withdrawals will default to this account.</span>
                      </div>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setBankEditUser(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bankEditLoading}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {bankEditLoading ? 'Saving...' : (bankEditBankId ? 'Update Bank Account' : 'Save & Link to Database')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: REFERRAL TEAMS & MEMBER TRACKING */}
        {activeAdminTab === 'TEAMS' && (
          <div className="flex flex-col gap-5">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Referral Teams & Member Tracking</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                      Direct Level 1 Network
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View team hierarchies, member activity, and deposit volumes. (Strictly non-reward tracking system).
                  </p>
                </div>
              </div>
            </div>

            {/* Aggregate Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">Total Team Leaders</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{allTeams.length}</span>
                <span className="text-[10px] text-slate-400">Users with registered teams</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">Total Referred Members</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">
                  {allTeams.reduce((sum, t) => sum + t.totalMembers, 0)}
                </span>
                <span className="text-[10px] text-slate-400">Joined via referral links</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">Active Team Traders</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {allTeams.reduce((sum, t) => sum + t.activeMembers, 0)}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">With deposits / active trading</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">Total Team Deposits</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  Rs. {allTeams.reduce((sum, t) => sum + t.totalDeposits, 0).toLocaleString('en-PK')}
                </span>
                <span className="text-[10px] text-slate-400">Volume across all teams</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search teams by leader name, mobile, referral code, or member name..."
                value={teamSearchQuery}
                onChange={e => setTeamSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 shadow-xs"
              />
              {teamSearchQuery && (
                <button
                  onClick={() => setTeamSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Teams List */}
            {allTeams.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No Referral Teams Formed Yet</h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                    When registered users share their unique link and new users sign up, their team trees will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {allTeams
                  .filter(team => {
                    const q = teamSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      team.headName.toLowerCase().includes(q) ||
                      team.headId.toLowerCase().includes(q) ||
                      team.headPhone.includes(q) ||
                      team.headReferralCode.toLowerCase().includes(q) ||
                      team.members.some(
                        m =>
                          m.userName.toLowerCase().includes(q) ||
                          m.userPhone.includes(q) ||
                          m.userId.toLowerCase().includes(q)
                      )
                    );
                  })
                  .map(team => {
                    const isExpanded = selectedTeamHeadId === team.headId;

                    return (
                      <div
                        key={team.headId}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
                      >
                        {/* Team Leader Header */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                              {team.headName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900">{team.headName}</h4>
                                <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold font-mono">
                                  Ref: {team.headReferralCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono">+92 {team.headPhone}</span>
                                <span>•</span>
                                <span className="font-mono text-[11px]">UID: {team.headId}</span>
                              </div>
                            </div>
                          </div>

                          {/* Leader Stats & Toggle */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Direct Members</span>
                                <span className="text-sm font-black text-slate-900">{team.totalMembers}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Active</span>
                                <span className="text-sm font-black text-emerald-600">{team.activeMembers}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Team Deposits</span>
                                <span className="text-sm font-black text-blue-900">
                                  Rs. {team.totalTeamDeposits.toLocaleString('en-PK')}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedTeamHeadId(isExpanded ? null : team.headId)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                isExpanded
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                            >
                              <span>{isExpanded ? 'Hide Members' : `View Members (${team.totalMembers})`}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded Members Table */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Direct Members Joined under {team.headName} ({team.members.length})
                              </h5>
                              <span className="text-[11px] text-slate-500">Permanently linked</span>
                            </div>

                            {team.members.length === 0 ? (
                              <p className="text-xs text-slate-500 py-4 text-center">No members have joined yet.</p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse min-w-[640px]">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                      <th className="p-3">Member Details</th>
                                      <th className="p-3">Join Date</th>
                                      <th className="p-3">Account Status</th>
                                      <th className="p-3 text-right">Total Deposits</th>
                                      <th className="p-3 text-right">Deposit Count</th>
                                      <th className="p-3 text-right">Last Deposit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs">
                                    {team.members.map((m, mIdx) => {
                                      const joinDateStr = new Date(m.joinedDate).toLocaleDateString('en-PK', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      });
                                      const lastDepStr = m.lastDepositDate
                                        ? new Date(m.lastDepositDate).toLocaleDateString('en-PK', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : 'No deposits';

                                      return (
                                        <tr key={m.userId || mIdx} className="hover:bg-slate-50/80">
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center uppercase shrink-0">
                                                {m.userName.charAt(0)}
                                              </div>
                                              <div>
                                                <span className="font-bold text-slate-900 block">{m.userName}</span>
                                                <span className="text-[11px] text-slate-500 font-mono">
                                                  +92 {m.userPhone} • UID: {m.userId}
                                                </span>
                                                <div className="mt-0.5">
                                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                                    Joined: {m.joinedViaCode || team.headReferralCode || 'Direct'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-3 text-slate-600">{joinDateStr}</td>
                                          <td className="p-3">
                                            {m.accountStatus === 'Active' ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                <Clock className="w-3 h-3 text-slate-400" /> Inactive
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 text-right font-extrabold text-slate-900">
                                            Rs. {m.totalDeposits.toLocaleString('en-PK')}
                                          </td>
                                          <td className="p-3 text-right text-slate-600">
                                            {m.depositCount} {m.depositCount === 1 ? 'tx' : 'txs'}
                                          </td>
                                          <td className="p-3 text-right text-[11px] text-slate-500">
                                            {lastDepStr}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: TELEGRAM & CUSTOMER SERVICE CONFIGURATION */}
        {activeAdminTab === 'SUPPORT' && (
          <form onSubmit={handleSaveSupport} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center shadow-xs">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Telegram & Customer Service Desk</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                      Live App Sync
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure official Telegram handles, community channels, and helpdesk endpoints</p>
                </div>
              </div>
              {supportSaved && (
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Saved to DB!
                </span>
              )}
            </div>

            {/* Telegram Channels Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">Telegram Integration</span>
                </div>
                <span className="text-[11px] text-sky-700 font-medium">Auto-formats handles (@username or URL)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Telegram Support Account / Handle</span>
                    {telegramSupportInput && (
                      <a
                        href={telegramSupportInput.startsWith('http') ? telegramSupportInput : `https://t.me/${telegramSupportInput.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-900 hover:text-blue-700 font-bold flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. @winzopay_official or https://t.me/..."
                      value={telegramSupportInput}
                      onChange={e => setTelegramSupportInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <Send className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Official Telegram Channel / News Group</span>
                    {telegramChannelInput && (
                      <a
                        href={telegramChannelInput.startsWith('http') ? telegramChannelInput : `https://t.me/${telegramChannelInput.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-900 hover:text-blue-700 font-bold flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. https://t.me/winzopay_news"
                      value={telegramChannelInput}
                      onChange={e => setTelegramChannelInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <Radio className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Service & Multi-Channel Help Desk */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">Customer Service Channels</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">Available 24x7</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>24/7 WhatsApp Customer Care Number</span>
                    {supportWhatsappInput && (
                      <a
                        href={supportWhatsappInput.startsWith('http') ? supportWhatsappInput : `https://wa.me/${supportWhatsappInput.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Test WhatsApp
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. +92 300 1234567 or 03001234567"
                      value={supportWhatsappInput}
                      onChange={e => setSupportWhatsappInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Helpline / Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. +92 21 111 222 333"
                      value={supportPhoneInput}
                      onChange={e => setSupportPhoneInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Customer Support Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. support@winzopay.com"
                      value={supportEmailInput}
                      onChange={e => setSupportEmailInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Support Modal Status Notice</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 24/7 Official Desk • Instant UTR & Deposit Verification"
                      value={supportNoticeInput}
                      onChange={e => setSupportNoticeInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    />
                    <Headphones className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Active Customer Service Channels</span>
                  <span className="text-[11px] text-slate-500">
                    Telegram: {telegramSupportInput || 'Not set'} • WhatsApp: {supportWhatsappInput || 'Not set'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200">
                Active in App
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Telegram & Customer Service Settings to Database
            </button>
          </form>
        )}

        {/* Tab 7: GATEWAY & PLATFORM SETTINGS */}
        {activeAdminTab === 'GATEWAY' && (
          <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Payment Gateway & Operational Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Control deposit addresses, thresholds, and market hours in database</p>
              </div>
              {configSaved && (
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Saved!
                </span>
              )}
            </div>

            {/* EasyPaisa Settings */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-900 block">EasyPaisa Merchant Deposit Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">EasyPaisa Account Number</label>
                  <input
                    type="text"
                    value={easypaisaNumberInput}
                    onChange={e => setEasypaisaNumberInput(e.target.value)}
                    placeholder="0345-0192837"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">EasyPaisa Account Title</label>
                  <input
                    type="text"
                    value={easypaisaTitleInput}
                    onChange={e => setEasypaisaTitleInput(e.target.value)}
                    placeholder="WinzoPay Official"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* JazzCash Settings */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-rose-900 block">JazzCash Merchant Deposit Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">JazzCash Account Number</label>
                  <input
                    type="text"
                    value={jazzcashNumberInput}
                    onChange={e => setJazzcashNumberInput(e.target.value)}
                    placeholder="0301-9283746"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">JazzCash Account Title</label>
                  <input
                    type="text"
                    value={jazzcashTitleInput}
                    onChange={e => setJazzcashTitleInput(e.target.value)}
                    placeholder="WinzoPay Official"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Backup Merchant Deposit Account / Raast ID</label>
              <input
                type="text"
                value={upiIdInput}
                onChange={e => setUpiIdInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Merchant Display Name</label>
              <input
                type="text"
                value={upiNameInput}
                onChange={e => setUpiNameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Min Deposit (Rs.)</label>
                <input
                  type="number"
                  value={minDepInput}
                  onChange={e => setMinDepInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max Deposit (Rs.)</label>
                <input
                  type="number"
                  value={maxDepInput}
                  onChange={e => setMaxDepInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Min Withdraw (Rs.)</label>
                <input
                  type="number"
                  value={minWthInput}
                  onChange={e => setMinWthInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max Withdraw (Rs.)</label>
                <input
                  type="number"
                  value={maxWthInput}
                  onChange={e => setMaxWthInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sell RP Start Time</label>
                <input
                  type="text"
                  value={startTimeInput}
                  onChange={e => setStartTimeInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sell RP End Time</label>
                <input
                  type="text"
                  value={endTimeInput}
                  onChange={e => setEndTimeInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Gateway Settings to Database
            </button>
          </form>
        )}
      </main>

      {/* Reject Reason Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full border border-slate-200 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900">Specify Rejection Reason</h3>
            <input
              type="text"
              placeholder="e.g. Invalid UTR or Name Mismatch"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setRejectingId(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (rejectingId.type === 'DEP') {
                    await rejectDeposit(rejectingId.id, rejectReason);
                  } else {
                    await rejectWithdrawal(rejectingId.id, rejectReason);
                  }
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                Confirm Reject in DB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
