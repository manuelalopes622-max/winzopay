import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  BankAccount,
  UsdtWallet,
  UserRecord,
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  RewardItem,
  NotificationItem,
  ChatMessage,
  PlatformConfig,
  ActiveTab,
  UserRPPlan,
  SellerDesk,
  TeamMember,
  TeamOverview
} from '../types';
import { TRADING_PLANS, VERIFIED_SELLERS, getCommissionRateForAmount } from '../data/plans';

// Helper to recursively strip undefined fields so Firestore setDoc/updateDoc never fails
function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item)) as any;
  }
  if (typeof obj === 'object') {
    if (obj.constructor && obj.constructor.name === 'FieldValue') {
      return obj;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestorePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isDbConnected: boolean;
  
  // User & Balances & Auth
  isLoggedIn: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  setUserEmail: (email: string) => void;
  allUsers: UserRecord[];
  totalBalance: number;
  availableBalance: number; // Customer Top-Up Balance (Alias for topUpBalance)
  topUpBalance: number;     // Step 1 & 2: Top-Up Balance deposited, used to buy RP plans
  withdrawableBalance: number; // Step 5 & 6: Balance from sold RP, available for bank/wallet withdrawal
  setWithdrawableBalance: React.Dispatch<React.SetStateAction<number>>;
  pendingWithdrawal: number;   // Step 6 & 7: Balance locked in pending withdrawal requests
  activeMiningInvested: number;// Step 2 & 3: Active investment working in 300s mining plans
  rpMiningBalance: number;     // Step 4 & 5: Completed RP yield + capital ready to sell
  todayCommission: number;
  rpBalance: number;
  vipLevel: number;
  signUp: (name: string, phone: string, password?: string, email?: string, referralCodeInput?: string) => Promise<{ success: boolean; message?: string }>;
  login: (phone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (name: string, phone: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  resetForgottenPassword: (phone: string, newPass: string) => Promise<{ success: boolean; message?: string }>;

  // Referral & Team Tracking (Strictly non-monetary, team structure & member deposit metrics only)
  referralCode: string;
  referredBy: string;
  referrerName: string;
  referralLink: string;
  joinedViaReferralCode: string;
  joinedViaReferralLink: string;
  incomingReferralCode: string;
  setIncomingReferralCode: (code: string) => void;
  incomingReferrerInfo: { valid: boolean; user?: UserRecord; message?: string };
  teamMembers: TeamMember[];
  teamStats: {
    totalMembers: number;
    activeMembers: number;
    totalDeposits: number;
  };
  allTeams: TeamOverview[];
  validateReferralCode: (code: string) => { valid: boolean; user?: UserRecord; message?: string };
  
  // RP Mining Plans & Lifecycle
  userPlans: UserRPPlan[];
  activeMiningPlans: UserRPPlan[];
  completedPlans: UserRPPlan[];
  soldPlans: UserRPPlan[];
  totalMiningInvested: number;
  totalMiningProfits: number;
  buyRPPlan: (planId: string, amount: number, durationSeconds?: number) => { success: boolean; message: string; plan?: UserRPPlan };
  fastForwardPlanMining: (userPlanId: string) => void;
  sellRPPlan: (userPlanId: string, sellerName?: string) => { success: boolean; message: string; totalCredited?: number };
  
  // Banks
  bankAccounts: BankAccount[];
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'createdAt'>) => boolean;
  deleteBankAccount: (id: string) => void;
  setPrimaryBankAccount: (id: string) => void;
  getPrimaryBank: () => BankAccount | undefined;
  adminUpdateUserBankDetails: (
    targetPhoneOrUid: string,
    bankData: {
      id?: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      upiId?: string;
      isPrimary?: boolean;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  adminDeleteUserBank: (
    targetPhoneOrUid: string,
    bankIdOrAccountNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  adminSetPrimaryUserBank: (
    targetPhoneOrUid: string,
    bankIdOrAccountNumber: string
  ) => Promise<{ success: boolean; message?: string }>;

  // USDT Wallets
  usdtWallets: UsdtWallet[];
  addUsdtWallet: (wallet: Omit<UsdtWallet, 'id' | 'createdAt'>) => boolean;
  deleteUsdtWallet: (id: string) => void;
  setPrimaryUsdtWallet: (id: string) => void;
  getPrimaryUsdtWallet: () => UsdtWallet | undefined;
  
  // Transactions
  transactions: Transaction[];
  allTransactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  checkBelongsToUser: (
    record: { userId?: string; userPhone?: string },
    currentUid?: string | null,
    currentPhone?: string | null
  ) => boolean;
  
  // Deposit / Top-Up
  depositRequests: DepositRequest[];
  submitDeposit: (
    amount: number,
    utr: string,
    method?: 'EasyPaisa' | 'JazzCash' | 'EASYPAISA' | 'JAZZCASH' | 'UPI' | 'QR' | 'BANK_TRANSFER' | 'USDT' | string,
    accountNumber?: string,
    accountTitle?: string,
    screenshotUrl?: string,
    usdtAmount?: number,
    usdtNetwork?: string,
    txHash?: string
  ) => boolean;
  
  // Withdrawal
  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawal: (
    amount: number,
    bankId?: string,
    payoutMethod?: 'BANK_TRANSFER' | 'UPI_QR' | 'USDT',
    payoutUpiId?: string,
    payoutQrUrl?: string,
    usdtAddress?: string,
    usdtNetwork?: string
  ) => { success: boolean; message: string };
  
  // Rewards
  rewards: RewardItem[];
  claimReward: (id: string) => boolean;
  
  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Customer Support
  chatMessages: ChatMessage[];
  sendSupportMessage: (text: string) => void;
  
  // Platform Config & Admin controls
  config: PlatformConfig;
  updateConfig: (newConfig: Partial<PlatformConfig>) => void;
  approveDeposit: (requestId: string) => Promise<void>;
  rejectDeposit: (requestId: string, reason?: string) => Promise<void>;
  approveWithdrawal: (requestId: string) => Promise<void>;
  rejectWithdrawal: (requestId: string, reason?: string) => Promise<void>;
  adjustUserBalance: (amount: number, isAddition: boolean, note: string) => void;
  adjustSpecificUserBalance: (targetPhoneOrUid: string, amount: number, isAddition: boolean, note: string) => Promise<void>;
  deleteUser: (targetPhoneOrUid: string) => Promise<{ success: boolean; message: string }>;
  wipeAllUsers: () => Promise<{ success: boolean; message: string }>;
  cleanEntireDatabase: () => Promise<{ success: boolean; message: string }>;
  
  // Modals & Navigation helpers
  isManageBankOpen: boolean;
  setIsManageBankOpen: (open: boolean) => void;
  isAddBankModalOpen: boolean;
  setIsAddBankModalOpen: (open: boolean) => void;
  isTxHistoryOpen: boolean;
  setIsTxHistoryOpen: (open: boolean) => void;
  txHistoryFilter: 'ALL' | 'DEPOSIT' | 'PLAN_PURCHASE' | 'MINING_PROFIT' | 'SELL_RP' | 'WITHDRAWAL' | 'BUY_RP' | 'COMMISSION';
  setTxHistoryFilter: (filter: 'ALL' | 'DEPOSIT' | 'PLAN_PURCHASE' | 'MINING_PROFIT' | 'SELL_RP' | 'WITHDRAWAL' | 'BUY_RP' | 'COMMISSION') => void;
  isRewardsOpen: boolean;
  setIsRewardsOpen: (open: boolean) => void;
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isResetPasswordOpen: boolean;
  setIsResetPasswordOpen: (open: boolean) => void;
  isFaqOpen: boolean;
  setIsFaqOpen: (open: boolean) => void;
  
  // Refresh simulation
  refreshing: boolean;
  triggerRefresh: () => void;
}

const DEFAULT_CONFIG: PlatformConfig = {
  upiId: '03450192837',
  upiName: 'WinzoPay Official',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=03450192837',
  easypaisaNumber: '0345-0192837',
  easypaisaTitle: 'WinzoPay Official',
  easypaisaQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=03450192837',
  jazzcashNumber: '0301-9283746',
  jazzcashTitle: 'WinzoPay Official',
  jazzcashQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=03019283746',
  minDeposit: 100,
  maxDeposit: 100000,
  minWithdraw: 100,
  maxWithdraw: 500000,
  sellRpStartTime: '10:00 AM',
  sellRpEndTime: '10:00 PM',
  supportTelegram: 'https://t.me/winzopay_official',
  officialChannel: 'https://t.me/winzopay_news',
  supportWhatsapp: '+923001234567',
  supportEmail: 'support@winzopay.com',
  supportPhone: '+92 21 111 200 888',
  supportNotice: '24/7 Official Desk • Instant Transaction & Deposit Verification',
  exchangeRate: 1.0,
  usdtDepositAddress: 'TYZ89WinzoPayOfficialTRC20DepositWallet888',
  usdtNetwork: 'TRC20',
  usdtRate: 280,
  usdtQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=TYZ89WinzoPayOfficialTRC20DepositWallet888',
};

const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-1',
    title: 'Daily Check-in Bonus',
    description: 'Claim daily login reward to boost your trading wallet.',
    rewardAmount: 10,
    claimed: false,
    type: 'DAILY_CHECKIN',
  },
  {
    id: 'rew-2',
    title: 'Add Bank Account Bonus',
    description: 'Link your primary bank account to receive Rs. 10 instant bonus.',
    rewardAmount: 10,
    claimed: false,
    type: 'ADD_BANK',
  },
  {
    id: 'rew-3',
    title: 'First RP Deposit Bonus',
    description: 'Complete your first deposit and receive Rs. 10 instant bonus.',
    rewardAmount: 10,
    claimed: false,
    type: 'FIRST_DEPOSIT',
    progress: { current: 0, target: 1 },
  },
  {
    id: 'rew-4',
    title: 'Newbie Referral Quest',
    description: 'Invite 1 active trader to WinzoPay platform.',
    rewardAmount: 10,
    claimed: false,
    type: 'REFERRAL',
    progress: { current: 0, target: 1 },
  },
  {
    id: 'rew-5',
    title: 'VIP Trader Level 1 Bonus',
    description: 'Active trader membership reward.',
    rewardAmount: 10,
    claimed: false,
    type: 'VIP_BONUS',
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
const INITIAL_CHATS: ChatMessage[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_BANKS: BankAccount[] = [];

/**
 * Strict User Ownership Check:
 * Ensures a database record (Transaction, Deposit, Withdrawal, Plan) strictly belongs to the
 * authenticated user, preventing any leakage of another user's activity in the ledger or views.
 */
export const checkBelongsToUser = (
  record: { userId?: string; userPhone?: string },
  currentUid?: string | null,
  currentPhone?: string | null
): boolean => {
  const cleanCurrentPhone = (currentPhone || '').replace(/\D/g, '');
  const cleanUid = (currentUid || '').trim().toUpperCase();

  // If the user isn't identified by UID or phone, we cannot attribute records to them
  if (!cleanCurrentPhone && !cleanUid) {
    return false;
  }

  const recPhone = (record.userPhone || '').toString().replace(/\D/g, '');
  const recUid = (record.userId || '').toString().trim().toUpperCase();

  // If record has neither phone nor userId, it cannot belong to any specific user
  if (!recPhone && !recUid) {
    return false;
  }

  // 1. Direct Phone Match (exact or standard 10-digit trailing match)
  if (cleanCurrentPhone && recPhone) {
    if (recPhone === cleanCurrentPhone) return true;
    if (cleanCurrentPhone.length >= 10 && recPhone.length >= 10 && recPhone.slice(-10) === cleanCurrentPhone.slice(-10)) return true;
  }

  // 2. Direct UID Match
  if (cleanUid && recUid) {
    if (recUid === cleanUid) return true;
    if (cleanCurrentPhone.length >= 6 && recUid === `WZP-${cleanCurrentPhone.slice(-6)}`.toUpperCase()) return true;
    if (recPhone.length >= 6 && cleanUid === `WZP-${recPhone.slice(-6)}`.toUpperCase()) return true;
  }

  // 3. Match user ID embedded in phone or vice versa
  if (cleanCurrentPhone && recUid) {
    if (recUid === cleanCurrentPhone) return true;
    if (cleanCurrentPhone.length >= 6 && recUid.endsWith(cleanCurrentPhone.slice(-6))) return true;
  }

  return false;
};

// Auto-purge legacy mock data and stale user session storage
if (typeof window !== 'undefined') {
  try {
    const isV10Clean = localStorage.getItem('wzp_v10_clean');
    if (!isV10Clean) {
      const legacyKeys = [
        'wzp_user_id', 'wzp_user_name', 'wzp_user_phone', 'wzp_is_logged_in',
        'wzp_avail_bal', 'wzp_comm_bal', 'wzp_banks', 'wzp_txs',
        'wzp_deposit_reqs', 'wzp_withdraw_reqs', 'wzp_rewards', 'wzp_notifs', 'wzp_chat', 'wzp_config',
        'wzp_v4_avail_bal', 'wzp_v4_banks',
        'wzp_v5_user_id', 'wzp_v5_user_name', 'wzp_v5_user_phone', 'wzp_v5_user_email', 'wzp_v5_user_pass',
        'wzp_v5_topup_bal', 'wzp_v5_avail_bal', 'wzp_v5_withdrawable_bal', 'wzp_v5_comm_bal',
        'wzp_v5_banks', 'wzp_v5_is_logged_in', 'wzp_v5_txs', 'wzp_v5_deps', 'wzp_v5_wths', 'wzp_v5_plans',
        'wzp_plans_stored', 'wzp_plans_cache', 'wzp_v5_cached_users',
        'wzp_v5_clean', 'wzp_v6_clean', 'wzp_v7_clean', 'wzp_v8_user_plans'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('wzp_v10_clean', 'true');
    }
  } catch (e) {
    console.error('Storage cleanup note:', e);
  }
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  
  // Modals
  const [isManageBankOpen, setIsManageBankOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isTxHistoryOpen, setIsTxHistoryOpen] = useState(false);
  const [txHistoryFilter, setTxHistoryFilter] = useState<'ALL' | 'BUY_RP' | 'SELL_RP' | 'COMMISSION'>('ALL');
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // User State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('wzp_v5_is_logged_in') === 'true';
  });
  const [userId, setUserId] = useState(() => localStorage.getItem('wzp_v5_user_id') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('wzp_v5_user_name') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('wzp_v5_user_phone') || '');
  const [userEmail, setUserEmailState] = useState(() => localStorage.getItem('wzp_v5_user_email') || '');
  
  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    localStorage.setItem('wzp_v5_user_email', email);
  };

  // Referral tracking state (Permanent direct linkage, strictly non-monetary)
  const [referralCode, setReferralCode] = useState(() => localStorage.getItem('wzp_v5_ref_code') || '');
  const [referredBy, setReferredBy] = useState(() => localStorage.getItem('wzp_v5_referred_by') || '');
  const [referrerName, setReferrerName] = useState(() => localStorage.getItem('wzp_v5_referrer_name') || '');
  const [joinedViaReferralCode, setJoinedViaReferralCode] = useState(() => localStorage.getItem('wzp_v5_joined_ref_code') || localStorage.getItem('wzp_v5_referred_by') || '');
  const [joinedViaReferralLink, setJoinedViaReferralLink] = useState(() => localStorage.getItem('wzp_v5_joined_ref_link') || '');

  // Incoming referral code from shared URL or manual entry
  const [incomingReferralCode, setIncomingReferralCodeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlRef = params.get('ref') || params.get('code') || params.get('referral') || params.get('referrer') || params.get('invite');
        if (urlRef) {
          const cleaned = urlRef.trim().toUpperCase();
          localStorage.setItem('wzp_incoming_ref_code', cleaned);
          return cleaned;
        }
      } catch {}
      return localStorage.getItem('wzp_incoming_ref_code') || '';
    }
    return '';
  });

  const setIncomingReferralCode = (code: string) => {
    const cleaned = (code || '').trim().toUpperCase();
    setIncomingReferralCodeState(cleaned);
    if (typeof window !== 'undefined') {
      if (cleaned) {
        localStorage.setItem('wzp_incoming_ref_code', cleaned);
      } else {
        localStorage.removeItem('wzp_incoming_ref_code');
      }
    }
  };

  // URL Query param auto-catcher on window load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlRef = params.get('ref') || params.get('code') || params.get('referral') || params.get('referrer') || params.get('invite');
        if (urlRef) {
          const cleaned = urlRef.trim().toUpperCase();
          setIncomingReferralCodeState(cleaned);
          localStorage.setItem('wzp_incoming_ref_code', cleaned);
        }
      } catch {}
    }
  }, []);

  // Master Users list for Admin Panel (synced in real-time from Firestore)
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  
  // Step 1: User Top-Up Balance (Deposited funds used to buy RP plans)
  const [topUpBalance, setTopUpBalance] = useState<number>(() => {
    const saved = localStorage.getItem('wzp_v5_topup_bal') || localStorage.getItem('wzp_v5_avail_bal');
    return saved !== null ? parseFloat(saved) : 0.00;
  });

  // Step 5: User Withdrawable Balance (Earned funds from sold RP, available for bank/UPI withdrawal)
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(() => {
    const saved = localStorage.getItem('wzp_v5_withdrawable_bal');
    return saved !== null ? parseFloat(saved) : 0.00;
  });

  // Alias availableBalance to topUpBalance for backwards compatibility
  const availableBalance = topUpBalance;
  const setAvailableBalance = setTopUpBalance;
  
  const [todayCommission, setTodayCommission] = useState<number>(() => {
    const saved = localStorage.getItem('wzp_v5_comm_bal');
    return saved !== null ? parseFloat(saved) : 0.00;
  });

  const vipLevel = (topUpBalance + withdrawableBalance) > 10000 ? 2 : 1;

  // Banks (starts empty)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('wzp_v5_banks');
    return saved ? JSON.parse(saved) : INITIAL_BANKS;
  });

  // USDT Wallets
  const [usdtWallets, setUsdtWallets] = useState<UsdtWallet[]>(() => {
    const saved = localStorage.getItem('wzp_v5_usdt_wallets');
    return saved ? JSON.parse(saved) : [];
  });

  // Transactions (strictly filtered to the active authenticated user)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedPhone = localStorage.getItem('wzp_v5_user_phone');
    const savedUid = localStorage.getItem('wzp_v5_user_id');
    const isLoggedIn = localStorage.getItem('wzp_v5_is_logged_in') === 'true';
    if (!isLoggedIn || (!savedPhone && !savedUid)) return INITIAL_TRANSACTIONS;

    const saved = localStorage.getItem('wzp_v7_txs');
    if (!saved) return INITIAL_TRANSACTIONS;
    try {
      const parsed: Transaction[] = JSON.parse(saved);
      return parsed.filter(t => !t.id.startsWith('tx-') && checkBelongsToUser(t, savedUid, savedPhone));
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Master platform transactions cache ref
  const allPlatformTxsRef = useRef<Transaction[]>([]);

  // All Platform Transactions (Master Ledger for Admin Panel)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // Deposit Requests
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    const saved = localStorage.getItem('wzp_v5_deposit_reqs');
    return saved ? JSON.parse(saved) : [];
  });

  // User RP Mining Plans
  const [userPlans, setUserPlans] = useState<UserRPPlan[]>(() => {
    const saved = localStorage.getItem('wzp_v8_user_plans');
    return saved ? JSON.parse(saved) : [];
  });

  // Withdrawal Requests
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('wzp_v5_withdraw_reqs');
    return saved ? JSON.parse(saved) : [];
  });

  // Rewards
  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('wzp_v5_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('wzp_v5_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Support Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('wzp_v5_chat');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  // Config
  const [config, setConfig] = useState<PlatformConfig>(() => {
    const saved = localStorage.getItem('wzp_v5_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.easypaisaNumber || !parsed.jazzcashNumber) {
          parsed.easypaisaNumber = DEFAULT_CONFIG.easypaisaNumber;
          parsed.easypaisaTitle = DEFAULT_CONFIG.easypaisaTitle;
          parsed.easypaisaQrUrl = DEFAULT_CONFIG.easypaisaQrUrl;
          parsed.jazzcashNumber = DEFAULT_CONFIG.jazzcashNumber;
          parsed.jazzcashTitle = DEFAULT_CONFIG.jazzcashTitle;
          parsed.jazzcashQrUrl = DEFAULT_CONFIG.jazzcashQrUrl;
        }
        if (!parsed.upiId || parsed.upiId.includes('@') || !parsed.upiId.startsWith('03')) {
          parsed.upiId = '03450192837';
        }
        if (!parsed.usdtDepositAddress) {
          parsed.usdtDepositAddress = DEFAULT_CONFIG.usdtDepositAddress;
          parsed.usdtNetwork = DEFAULT_CONFIG.usdtNetwork;
          parsed.usdtRate = DEFAULT_CONFIG.usdtRate;
          parsed.usdtQrUrl = DEFAULT_CONFIG.usdtQrUrl;
        }
        return parsed;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('wzp_v5_topup_bal', topUpBalance.toString());
    localStorage.setItem('wzp_v5_avail_bal', topUpBalance.toString());
  }, [topUpBalance]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_withdrawable_bal', withdrawableBalance.toString());
  }, [withdrawableBalance]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_comm_bal', todayCommission.toString());
  }, [todayCommission]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_usdt_wallets', JSON.stringify(usdtWallets));
  }, [usdtWallets]);

  useEffect(() => {
    localStorage.setItem('wzp_v7_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_deposit_reqs', JSON.stringify(depositRequests));
  }, [depositRequests]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_withdraw_reqs', JSON.stringify(withdrawalRequests));
  }, [withdrawalRequests]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('wzp_v5_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('wzp_v8_user_plans', JSON.stringify(userPlans));
  }, [userPlans]);

  // Derived Mining Plans & Balances across 7-step Lifecycle
  const activeMiningPlans = userPlans.filter(p => p.status === 'MINING');
  const completedPlans = userPlans.filter(p => p.status === 'COMPLETED');
  const soldPlans = userPlans.filter(p => p.status === 'SOLD');

  // Step 2 & 3: Active Mining Invested (No money deducted during mining)
  const activeMiningInvested = activeMiningPlans.reduce((sum, p) => sum + p.investedAmount, 0);
  const totalMiningInvested = activeMiningInvested;

  // Step 4 & 5: Completed RP Yield Balance (Capital + Mining Reward ready to be sold)
  const rpMiningBalance = completedPlans.reduce((sum, p) => sum + p.totalReturn, 0);
  const rpBalance = rpMiningBalance;

  // Step 6 & 7: Pending Withdrawal locked in queue (strictly for this authenticated user)
  const pendingWithdrawal = withdrawalRequests
    .filter(r => (r.status === 'PENDING' || r.status === 'PROCESSING') && checkBelongsToUser(r, userId, userPhone))
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMiningProfits = completedPlans.reduce((sum, p) => sum + p.profitAmount, 0) + soldPlans.reduce((sum, p) => sum + p.profitAmount, 0);
  
  // Total Portfolio Assets
  const totalBalance = topUpBalance + activeMiningInvested + rpMiningBalance + withdrawableBalance + pendingWithdrawal;

  // Active Mining completion tick timer (checks every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let updated = false;

      setUserPlans(prevPlans => {
        const nextPlans = prevPlans.map(plan => {
          if (plan.status === 'MINING' && now >= plan.completionTimestamp) {
            updated = true;
            // Send celebration notification
            const notifId = `notif-mine-${Date.now()}`;
            setNotifications(prevNotifs => [
              {
                id: notifId,
                title: '⚡ RP Mining Completed!',
                message: `Mining finished for ${plan.planName}. Total return Rs. ${plan.totalReturn.toLocaleString('en-PK')} (Capital Rs. ${plan.investedAmount.toLocaleString('en-PK')} + Rs. ${plan.profitAmount.toLocaleString('en-PK')} profit) is now ready to sell!`,
                type: 'TRANSACTION',
                read: false,
                timestamp: 'Just now'
              },
              ...prevNotifs
            ]);
            return {
              ...plan,
              status: 'COMPLETED' as const
            };
          }
          return plan;
        });

        return updated ? nextPlans : prevPlans;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ========================================================================
  // FIRESTORE REAL-TIME SYNCHRONIZATION ENGINE
  // ========================================================================
  useEffect(() => {
    let unsubDeposits: () => void = () => {};
    let unsubWithdrawals: () => void = () => {};
    let unsubTransactions: () => void = () => {};
    let unsubUserPlans: () => void = () => {};
    let unsubConfig: () => void = () => {};
    let unsubUsers: () => void = () => {};

    try {
      // 1. Real-time Deposit Requests Listener
      const depositsQuery = query(collection(db, 'deposits'));
      unsubDeposits = onSnapshot(depositsQuery, (snapshot) => {
        setIsDbConnected(true);
        const list: DepositRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || 'Trader',
            userPhone: data.userPhone || '',
            amount: Number(data.amount) || 0,
            rpAmount: Number(data.rpAmount) || Number(data.amount) || 0,
            utr: data.utr || '',
            method: data.method || 'QR',
            status: data.status || 'PENDING',
            createdAt: data.createdAt || new Date().toISOString(),
            receiptUrl: data.receiptUrl,
          });
        });
        // Sort latest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDepositRequests(list);
      }, (error) => {
        console.warn('Firestore deposits listener note:', error);
      });

      // 2. Real-time Withdrawal Requests Listener
      const withdrawalsQuery = query(collection(db, 'withdrawals'));
      unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
        const list: WithdrawalRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || 'User',
            userPhone: data.userPhone || '',
            amount: Number(data.amount) || 0,
            rpAmount: Number(data.rpAmount) || Number(data.amount) || 0,
            bankAccount: data.bankAccount || {
              id: 'bank-0',
              bankName: data.bankDetails?.bankName || 'Bank Account',
              accountHolderName: data.bankDetails?.accountHolderName || data.userName || 'User',
              accountNumber: data.bankDetails?.accountNumber || '••••',
              ifscCode: data.bankDetails?.ifscCode || 'PK0000',
              isPrimary: true,
              createdAt: new Date().toISOString()
            },
            payoutMethod: data.payoutMethod || (data.payoutUpiId || data.payoutQrUrl ? 'UPI_QR' : 'BANK_TRANSFER'),
            payoutUpiId: data.payoutUpiId || undefined,
            payoutQrUrl: data.payoutQrUrl || undefined,
            status: data.status || 'PENDING',
            createdAt: data.createdAt || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()),
            rejectedReason: data.rejectedReason,
          });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWithdrawalRequests(list);
      }, (error) => {
        console.warn('Firestore withdrawals listener note:', error);
      });

      // 3. Real-time Ledger Transactions Listener (All platform ledger + Active user sync)
      const txQuery = query(collection(db, 'transactions'));
      unsubTransactions = onSnapshot(txQuery, (snapshot) => {
        if (!snapshot.empty) {
          const allList: Transaction[] = [];
          const userList: Transaction[] = [];
          const withdrawalTxList: Transaction[] = [];
          const currentUid = (localStorage.getItem('wzp_v5_user_id') || userId || '').trim();
          const currentPhone = (localStorage.getItem('wzp_v5_user_phone') || userPhone || '').replace(/\D/g, '');
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Filter out any legacy dummy/mock IDs
            if (docSnap.id.startsWith('tx-') || data.id?.startsWith('tx-') || data.isMock) {
              return;
            }
            const txItem: Transaction = {
              id: docSnap.id,
              userId: data.userId || '',
              userName: data.userName || '',
              userPhone: data.userPhone || '',
              type: data.type || 'DEPOSIT',
              amount: Number(data.amount) || 0,
              rpAmount: Number(data.rpAmount) || 0,
              profitAmount: data.profitAmount ? Number(data.profitAmount) : undefined,
              status: data.status || 'SUCCESS',
              title: data.title || 'Transaction',
              utr: data.utr,
              planName: data.planName,
              planId: data.planId,
              sellerName: data.sellerName,
              bankDetails: data.bankDetails,
              payoutMethod: data.payoutMethod,
              payoutUpiId: data.payoutUpiId,
              payoutQrUrl: data.payoutQrUrl,
              notes: data.notes,
              timestamp: data.timestamp || new Date().toLocaleString(),
              createdAt: data.createdAt || new Date().toISOString(),
            };

            allList.push(txItem);

            if (txItem.type === 'WITHDRAWAL') {
              withdrawalTxList.push(txItem);
            }

            // Strict User Activity Isolation:
            // Only add to the user's ledger if the record belongs strictly to the authenticated user
            if (checkBelongsToUser(txItem, currentUid, currentPhone)) {
              userList.push(txItem);
            }
          });

          // Sort newest first
          allList.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime() || 0;
            const timeB = new Date(b.createdAt || 0).getTime() || 0;
            return timeB - timeA;
          });

          userList.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime() || 0;
            const timeB = new Date(b.createdAt || 0).getTime() || 0;
            return timeB - timeA;
          });

          allPlatformTxsRef.current = allList;

          // Activity & Ledger Privacy Enforcement:
          // Admin portal has full audit trail. Normal users are strictly restricted to their own transactions.
          const isAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('wzp_admin_auth') === 'true';
          if (isAdminSession) {
            setAllTransactions(allList);
          } else {
            setAllTransactions(userList);
          }
          setTransactions(userList);

          // Synchronize any withdrawal transactions into the withdrawalRequests state for admin queue
          if (withdrawalTxList.length > 0) {
            setWithdrawalRequests(prev => {
              const merged = [...prev];
              withdrawalTxList.forEach(wtx => {
                const exists = merged.some(r => r.id === wtx.id || (wtx.notes && wtx.notes.includes(r.id)));
                if (!exists) {
                  merged.push({
                    id: wtx.id,
                    userId: wtx.userId,
                    userName: wtx.userName || 'User',
                    userPhone: wtx.userPhone || '',
                    amount: wtx.amount,
                    rpAmount: wtx.rpAmount || wtx.amount,
                    bankAccount: wtx.bankDetails ? {
                      id: 'bank-tx',
                      bankName: wtx.bankDetails.bankName,
                      accountNumber: wtx.bankDetails.accountNumber,
                      accountHolderName: wtx.bankDetails.accountHolderName || wtx.userName,
                      ifscCode: 'PK0000',
                      isPrimary: true,
                      createdAt: wtx.createdAt || new Date().toISOString()
                    } : {
                      id: 'bank-tx',
                      bankName: 'Bank Transfer',
                      accountNumber: '••••',
                      accountHolderName: wtx.userName || 'User',
                      ifscCode: 'PK0000',
                      isPrimary: true,
                      createdAt: wtx.createdAt || new Date().toISOString()
                    },
                    payoutMethod: wtx.payoutMethod || 'BANK_TRANSFER',
                    payoutUpiId: wtx.payoutUpiId,
                    payoutQrUrl: wtx.payoutQrUrl,
                    status: (wtx.status === 'PROCESSING' || wtx.status === 'PENDING' ? 'PENDING' : wtx.status) as any,
                    createdAt: wtx.createdAt || new Date().toISOString(),
                    rejectedReason: wtx.notes,
                  });
                }
              });
              return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
          }
        } else {
          setAllTransactions([]);
          setTransactions([]);
        }
      }, (error) => {
        console.warn('Firestore transactions listener note:', error);
      });

      // 4. Real-time User RP Plans Listener (Syncs mining rigs and completed plans from Firestore)
      const plansQuery = query(collection(db, 'user_plans'));
      unsubUserPlans = onSnapshot(plansQuery, (snapshot) => {
        if (!snapshot.empty) {
          const plansList: UserRPPlan[] = [];
          const currentUid = (localStorage.getItem('wzp_v5_user_id') || userId || '').trim();
          const currentPhone = (localStorage.getItem('wzp_v5_user_phone') || userPhone || '').replace(/\D/g, '');

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawPlanPhone = (data.userPhone || '').toString().replace(/\D/g, '');
            const planUid = (data.userId || '').toString().trim();

            const isUserPlan = checkBelongsToUser(data, currentUid, currentPhone);

            if (isUserPlan) {
              const startTs = typeof data.startTimestamp === 'number' ? data.startTimestamp : Date.now() - 300000;
              const durationSec = Number(data.durationSeconds) || 300;
              const compTs = typeof data.completionTimestamp === 'number' ? data.completionTimestamp : (startTs + durationSec * 1000);
              
              let currentStatus: 'MINING' | 'COMPLETED' | 'SOLD' = data.status || 'MINING';
              if (currentStatus === 'MINING' && compTs <= Date.now()) {
                currentStatus = 'COMPLETED';
              }

              plansList.push({
                id: docSnap.id,
                userId: planUid || currentUid,
                userName: data.userName || userName || 'Trader',
                userPhone: rawPlanPhone || currentPhone,
                planId: data.planId || 'PLAN_1',
                planName: data.planName || 'Winzo Standard RP',
                investedAmount: Number(data.investedAmount) || Number(data.amount) || 0,
                profitRate: Number(data.profitRate) || 10,
                profitAmount: Number(data.profitAmount) || 0,
                totalReturn: Number(data.totalReturn) || (Number(data.investedAmount) || 0) + (Number(data.profitAmount) || 0),
                durationSeconds: durationSec,
                startTimestamp: startTs,
                completionTimestamp: compTs,
                startTime: data.startTime || new Date(startTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                completionTime: data.completionTime || new Date(compTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                status: currentStatus,
                sellerName: data.sellerName,
                soldAt: data.soldAt,
              });
            }
          });

          plansList.sort((a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0));
          if (plansList.length > 0) {
            setUserPlans(plansList);
            localStorage.setItem('wzp_v8_user_plans', JSON.stringify(plansList));
          }
        }
      }, (error) => {
        console.warn('Firestore user_plans listener note:', error);
      });

      // 5. Real-time Platform Config Listener
      const configDocRef = doc(db, 'config', 'platform_settings');
      unsubConfig = onSnapshot(configDocRef, (snap) => {
        if (snap.exists()) {
          const cfg = snap.data() as Partial<PlatformConfig>;
          setConfig(prev => ({ ...prev, ...cfg }));
        }
      }, (error) => {
        console.warn('Firestore config listener note:', error);
      });

      // 6. Real-time All Users & Credentials Listener for Admin Panel
      const usersQuery = query(collection(db, 'users'));
      unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        if (!snapshot.empty) {
          const map = new Map<string, UserRecord>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawPhone = (data.userPhone || data.phone || '').toString().replace(/\D/g, '');
            const uid = data.userId || (rawPhone ? `WZP-${rawPhone.slice(-6)}` : docSnap.id);
            
            // Derive a canonical unique key for this user
            let key = rawPhone || uid || docSnap.id;
            if (!key) return;

            // Look up any existing record keyed by rawPhone, uid, or matching property
            let existing: UserRecord | undefined = map.get(key);
            if (!existing && uid && map.has(uid)) {
              existing = map.get(uid);
            }
            if (!existing && rawPhone && map.has(rawPhone)) {
              existing = map.get(rawPhone);
            }
            if (!existing && (rawPhone || uid)) {
              for (const [k, rec] of map.entries()) {
                if ((rawPhone && rec.userPhone === rawPhone) || (uid && rec.userId === uid)) {
                  existing = rec;
                  key = k;
                  break;
                }
              }
            }

            const loadedName = data.userName || data.name || existing?.userName || 'Registered Trader';
            const email = data.email || data.userEmail || existing?.email || (rawPhone ? `${rawPhone}@user.winzopay.com` : 'trader@winzopay.com');
            const password = data.password || data.userPassword || existing?.password || '';

            // Merge all bank accounts for this user without dropping secondary banks
            const bankMap = new Map<string, BankAccount>();

            // 1. Existing banks previously mapped for this user record
            if (existing && Array.isArray(existing.bankAccounts)) {
              existing.bankAccounts.forEach(b => {
                if (b && (b.accountNumber || b.id)) {
                  const bKey = (b.accountNumber || b.id).toString().trim();
                  if (bKey) bankMap.set(bKey, b);
                }
              });
            }

            // 2. Bank accounts array from current document snapshot
            if (Array.isArray(data.bankAccounts)) {
              data.bankAccounts.forEach(b => {
                if (b && (b.accountNumber || b.id)) {
                  const bKey = (b.accountNumber || b.id).toString().trim();
                  if (bKey) {
                    const prev = bankMap.get(bKey);
                    bankMap.set(bKey, { ...prev, ...b });
                  }
                }
              });
            }

            // 3. Fallback to individual legacy document fields if not present
            if (data.bankName && data.bankName !== 'No Bank Linked' && data.accountNumber) {
              const acc = data.accountNumber.toString().trim();
              if (acc && !bankMap.has(acc)) {
                bankMap.set(acc, {
                  id: `bank-${Date.now()}`,
                  bankName: data.bankName,
                  accountHolderName: data.accountHolderName || data.userName || loadedName || '',
                  accountNumber: acc,
                  ifscCode: data.ifscCode || '',
                  upiId: data.upiId || '',
                  isPrimary: bankMap.size === 0,
                  createdAt: new Date().toISOString(),
                });
              }
            }

            if (existing?.accountNumber && existing?.bankName && existing?.bankName !== 'No Bank Linked') {
              const acc = existing.accountNumber.toString().trim();
              if (acc && !bankMap.has(acc)) {
                bankMap.set(acc, {
                  id: `bank-${Date.now()}`,
                  bankName: existing.bankName,
                  accountHolderName: existing.accountHolderName || existing.userName || loadedName || '',
                  accountNumber: acc,
                  ifscCode: existing.ifscCode || '',
                  upiId: existing.upiId || '',
                  isPrimary: bankMap.size === 0,
                  createdAt: new Date().toISOString(),
                });
              }
            }

            let bankAccountsList: BankAccount[] = Array.from(bankMap.values());
            if (bankAccountsList.length > 0 && !bankAccountsList.some(b => b.isPrimary)) {
              bankAccountsList[0].isPrimary = true;
            }

            const primaryBank = bankAccountsList.find(b => b.isPrimary) || bankAccountsList[0];
            const resolvedBankName = primaryBank?.bankName || (data.bankName && data.bankName !== 'No Bank Linked' ? data.bankName : (existing?.bankName && existing.bankName !== 'No Bank Linked' ? existing.bankName : (bankAccountsList.length > 0 ? bankAccountsList[0].bankName : 'No Bank Linked')));
            const resolvedAccNum = primaryBank?.accountNumber || data.accountNumber || existing?.accountNumber || (bankAccountsList.length > 0 ? bankAccountsList[0].accountNumber : '');
            const resolvedIfsc = primaryBank?.ifscCode || data.ifscCode || existing?.ifscCode || (bankAccountsList.length > 0 ? bankAccountsList[0].ifscCode : '');
            const resolvedHolder = primaryBank?.accountHolderName || data.accountHolderName || existing?.accountHolderName || loadedName || '';

            const userRefCode = data.referralCode || existing?.referralCode || (rawPhone ? `WZP-${rawPhone.slice(-6)}` : (uid ? `WZP-${uid.slice(-6)}` : docSnap.id));
            const userReferredBy = data.referredBy || existing?.referredBy || '';
            const userReferrerName = data.referrerName || existing?.referrerName || '';
            const userJoinedViaCode = data.joinedViaReferralCode || userReferredBy || existing?.joinedViaReferralCode || '';
            const userJoinedViaLink = data.joinedViaReferralLink || (userJoinedViaCode ? `https://winzopay-website.onrender.com/signup?ref=${encodeURIComponent(userJoinedViaCode)}` : (existing?.joinedViaReferralLink || ''));

            const availBal = typeof data.topUpBalance === 'number'
              ? data.topUpBalance
              : typeof data.availableBalance === 'number'
              ? data.availableBalance
              : (existing?.topUpBalance || existing?.availableBalance || 0);
            const withdrawableBal = typeof data.withdrawableBalance === 'number'
              ? data.withdrawableBalance
              : (existing?.withdrawableBalance || 0);
            const commBal = typeof data.todayCommission === 'number' ? data.todayCommission : (existing?.todayCommission || 0);

            const userRec: UserRecord = {
              userId: uid || existing?.userId || docSnap.id,
              userName: loadedName,
              userPhone: rawPhone || data.userPhone || existing?.userPhone || '',
              email,
              password,
              availableBalance: availBal,
              topUpBalance: availBal,
              withdrawableBalance: withdrawableBal,
              todayCommission: commBal,
              bankAccounts: bankAccountsList,
              bankName: resolvedBankName,
              accountNumber: resolvedAccNum,
              ifscCode: resolvedIfsc,
              accountHolderName: resolvedHolder,
              upiId: primaryBank?.upiId || data.upiId || existing?.upiId || '',
              vipLevel: (availBal + withdrawableBal) > 10000 ? 2 : 1,
              referralCode: userRefCode,
              referredBy: userReferredBy,
              referrerName: userReferrerName,
              joinedViaReferralCode: userJoinedViaCode,
              joinedViaReferralLink: userJoinedViaLink,
              createdAt: data.createdAt || existing?.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || existing?.updatedAt,
            };

            map.set(key, userRec);
          });

          const userList = Array.from(map.values());
          // Sort newest first
          userList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          const isAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('wzp_admin_auth') === 'true';
          if (isAdminSession) {
            setAllUsers(userList);
          } else {
            // Referral Privacy Enforcement:
            // Referred users must NOT see their referrer's balance, commission, passwords, or private bank activity.
            const currentUid = (localStorage.getItem('wzp_v5_user_id') || userId || '').trim();
            const currentPhone = (localStorage.getItem('wzp_v5_user_phone') || userPhone || '').replace(/\D/g, '');

            const sanitizedList = userList.map(u => {
              const uPhone = (u.userPhone || '').replace(/\D/g, '');
              const isSelf = (currentUid && u.userId === currentUid) || (currentPhone && uPhone === currentPhone);
              if (isSelf) return u;

              // Strip sensitive private fields for any other user (especially upstream referrer)
              return {
                ...u,
                availableBalance: 0,
                topUpBalance: 0,
                withdrawableBalance: 0,
                todayCommission: 0,
                password: '',
                bankAccounts: [],
                accountNumber: '',
                ifscCode: '',
                upiId: '',
              };
            });
            setAllUsers(sanitizedList);
          }
        } else {
          setAllUsers([]);
        }
      }, (error) => {
        console.warn('Firestore users listener note:', error);
      });

    } catch (e) {
      console.warn('Firestore initialization note:', e);
    }

    return () => {
      unsubDeposits();
      unsubWithdrawals();
      unsubTransactions();
      unsubUserPlans();
      unsubConfig();
      unsubUsers();
    };
  }, []);

  // Re-synchronize user-specific transactions whenever active user identity changes (e.g. login, logout, switch account)
  useEffect(() => {
    const cleanPhone = (userPhone || localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '');
    const activeUid = (userId || localStorage.getItem('wzp_v5_user_id') || '').trim();

    if (!cleanPhone && !activeUid) {
      setTransactions([]);
      return;
    }

    if (allPlatformTxsRef.current.length > 0) {
      const userOnly = allPlatformTxsRef.current.filter(t => checkBelongsToUser(t, activeUid, cleanPhone));
      setTransactions(userOnly);
      localStorage.setItem('wzp_v7_txs', JSON.stringify(userOnly));
    }
  }, [userId, userPhone]);

  // Listen to active user balance and profile updates from Firestore in real time across all identity keys
  useEffect(() => {
    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    const activeUid = userId;
    if (!cleanPhone && !activeUid) return;

    const unsubList: (() => void)[] = [];

    const handleSnapData = (data: any) => {
      if (!data) return;
      if (data.userName) {
        setUserName(data.userName);
        localStorage.setItem('wzp_v5_user_name', data.userName);
      }
      if (data.userId) {
        setUserId(data.userId);
        localStorage.setItem('wzp_v5_user_id', data.userId);
      }
      if (typeof data.topUpBalance === 'number') {
        setTopUpBalance(data.topUpBalance);
        localStorage.setItem('wzp_v5_topup_bal', data.topUpBalance.toString());
        localStorage.setItem('wzp_v5_avail_bal', data.topUpBalance.toString());
      } else if (typeof data.availableBalance === 'number') {
        setTopUpBalance(data.availableBalance);
        localStorage.setItem('wzp_v5_topup_bal', data.availableBalance.toString());
        localStorage.setItem('wzp_v5_avail_bal', data.availableBalance.toString());
      }
      if (typeof data.withdrawableBalance === 'number') {
        setWithdrawableBalance(data.withdrawableBalance);
        localStorage.setItem('wzp_v5_withdrawable_bal', data.withdrawableBalance.toString());
      }
      if (data.referralCode) {
        setReferralCode(data.referralCode);
        localStorage.setItem('wzp_v5_ref_code', data.referralCode);
      }
      if (data.referredBy) {
        setReferredBy(data.referredBy);
        localStorage.setItem('wzp_v5_referred_by', data.referredBy);
      }
      if (data.referrerName) {
        setReferrerName(data.referrerName);
        localStorage.setItem('wzp_v5_referrer_name', data.referrerName);
      }
      const snapJoinedCode = data.joinedViaReferralCode || data.referredBy;
      if (snapJoinedCode) {
        setJoinedViaReferralCode(snapJoinedCode);
        localStorage.setItem('wzp_v5_joined_ref_code', snapJoinedCode);
      }
      const snapJoinedLink = data.joinedViaReferralLink || (snapJoinedCode ? `https://winzopay-website.onrender.com/signup?ref=${encodeURIComponent(snapJoinedCode)}` : '');
      if (snapJoinedLink) {
        setJoinedViaReferralLink(snapJoinedLink);
        localStorage.setItem('wzp_v5_joined_ref_link', snapJoinedLink);
      }
      if (typeof data.todayCommission === 'number') {
        setTodayCommission(data.todayCommission);
        localStorage.setItem('wzp_v5_comm_bal', data.todayCommission.toString());
      }
      if (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0) {
        setBankAccounts(data.bankAccounts);
        localStorage.setItem('wzp_v5_banks', JSON.stringify(data.bankAccounts));
      } else if (data.bankName && data.bankName !== 'No Bank Linked' && data.accountNumber) {
        const singleBank: BankAccount[] = [{
          id: `bank-${Date.now()}`,
          bankName: data.bankName,
          accountHolderName: data.accountHolderName || data.userName || userName || '',
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode || '',
          upiId: data.upiId || '',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }];
        setBankAccounts(singleBank);
        localStorage.setItem('wzp_v5_banks', JSON.stringify(singleBank));
      }
    };

    if (cleanPhone) {
      try {
        const userPhoneRef = doc(db, 'users', cleanPhone);
        const unsub = onSnapshot(userPhoneRef, (snap) => {
          if (snap.exists()) {
            handleSnapData(snap.data());
          }
        }, (err) => {
          console.warn('User phone live sync note:', err);
        });
        unsubList.push(unsub);
      } catch (err) {
        console.warn('User phone sync note:', err);
      }
    }

    if (activeUid && activeUid !== cleanPhone) {
      try {
        const userUidRef = doc(db, 'users', activeUid);
        const unsub = onSnapshot(userUidRef, (snap) => {
          if (snap.exists()) {
            handleSnapData(snap.data());
          }
        }, (err) => {
          console.warn('User UID live sync note:', err);
        });
        unsubList.push(unsub);
      } catch (err) {
        console.warn('User UID sync note:', err);
      }
    }

    return () => {
      unsubList.forEach(u => u());
    };
  }, [userPhone, userId]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    const cleanPhone = (userPhone || '').replace(/\D/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '') : '');
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('wzp_v5_user_id') || '' : '');

    try {
      if (cleanPhone) {
        const snap = await getDoc(doc(db, 'users', cleanPhone));
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.topUpBalance === 'number') {
            setTopUpBalance(data.topUpBalance);
            localStorage.setItem('wzp_v5_topup_bal', data.topUpBalance.toString());
            localStorage.setItem('wzp_v5_avail_bal', data.topUpBalance.toString());
          } else if (typeof data.availableBalance === 'number') {
            setTopUpBalance(data.availableBalance);
            localStorage.setItem('wzp_v5_topup_bal', data.availableBalance.toString());
            localStorage.setItem('wzp_v5_avail_bal', data.availableBalance.toString());
          }
          if (typeof data.withdrawableBalance === 'number') {
            setWithdrawableBalance(data.withdrawableBalance);
            localStorage.setItem('wzp_v5_withdrawable_bal', data.withdrawableBalance.toString());
          }
          if (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0) {
            setBankAccounts(data.bankAccounts);
            localStorage.setItem('wzp_v5_banks', JSON.stringify(data.bankAccounts));
          } else if (data.bankName && data.bankName !== 'No Bank Linked' && data.accountNumber) {
            const singleBank: BankAccount[] = [{
              id: `bank-${Date.now()}`,
              bankName: data.bankName,
              accountHolderName: data.accountHolderName || data.userName || userName || '',
              accountNumber: data.accountNumber,
              ifscCode: data.ifscCode || '',
              upiId: data.upiId || '',
              isPrimary: true,
              createdAt: new Date().toISOString(),
            }];
            setBankAccounts(singleBank);
            localStorage.setItem('wzp_v5_banks', JSON.stringify(singleBank));
          }
        }
      } else if (activeUid) {
        const snap = await getDoc(doc(db, 'users', activeUid));
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.topUpBalance === 'number') {
            setTopUpBalance(data.topUpBalance);
            localStorage.setItem('wzp_v5_topup_bal', data.topUpBalance.toString());
            localStorage.setItem('wzp_v5_avail_bal', data.topUpBalance.toString());
          }
          if (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0) {
            setBankAccounts(data.bankAccounts);
            localStorage.setItem('wzp_v5_banks', JSON.stringify(data.bankAccounts));
          }
        }
      }
    } catch (e) {
      console.warn('Manual refresh note:', e);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  // Active Referral Code & Dynamic Referral Link
  const currentReferralCode = useMemo(() => {
    if (referralCode) return referralCode;
    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    if (cleanPhone) return `WZP-${cleanPhone.slice(-6)}`;
    if (userId) return userId;
    return '';
  }, [referralCode, userPhone, userId]);

  const referralLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://winzopay-website.onrender.com';
    const codeToUse = currentReferralCode || (userPhone ? `WZP-${userPhone.replace(/\D/g, '').slice(-6)}` : userId);
    return codeToUse ? `${origin}/signup?ref=${encodeURIComponent(codeToUse)}` : `${origin}/signup`;
  }, [currentReferralCode, userPhone, userId]);

  // Real-time Referral Code Validator
  const validateReferralCode = (inputCode: string): { valid: boolean; user?: UserRecord; message?: string } => {
    const clean = (inputCode || '').trim().toUpperCase();
    if (!clean) {
      return { valid: false, message: 'Please enter a referral code.' };
    }
    const cleanDigits = inputCode.replace(/\D/g, '');
    const currentCleanPhone = (userPhone || '').replace(/\D/g, '');
    const currentUid = userId || (currentCleanPhone ? `WZP-${currentCleanPhone.slice(-6)}` : '');

    // Cannot refer self
    if (
      (currentUid && clean === currentUid.toUpperCase()) ||
      (currentReferralCode && clean === currentReferralCode.toUpperCase()) ||
      (currentCleanPhone && cleanDigits && cleanDigits === currentCleanPhone)
    ) {
      return { valid: false, message: 'You cannot use your own referral code as referrer.' };
    }

    const found = allUsers.find(u => {
      const uPhoneDigits = (u.userPhone || '').replace(/\D/g, '');
      const uRefCode = (u.referralCode || (uPhoneDigits ? `WZP-${uPhoneDigits.slice(-6)}` : u.userId || '')).toUpperCase();
      const uUid = (u.userId || '').toUpperCase();
      return uRefCode === clean || uUid === clean || (cleanDigits.length >= 10 && uPhoneDigits === cleanDigits);
    });

    if (found) {
      return {
        valid: true,
        user: found,
        message: `Verified! Referring Head: ${found.userName || 'Winzo Trader'} (${found.referralCode || found.userId})`
      };
    }

    return {
      valid: false,
      message: 'Referral code not found in our database.'
    };
  };

  // Incoming Referrer Info Validation
  const incomingReferrerInfo = useMemo(() => {
    if (!incomingReferralCode) {
      return { valid: false, message: '' };
    }
    return validateReferralCode(incomingReferralCode);
  }, [incomingReferralCode, allUsers, userPhone, userId, currentReferralCode]);

  // Backend authorized team members state
  const [apiTeamMembers, setApiTeamMembers] = useState<TeamMember[]>([]);

  const fetchAuthorizedTeam = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
      const res = await fetch(`/api/team?userId=${encodeURIComponent(userId)}&userPhone=${encodeURIComponent(activeCleanPhone)}`, {
        headers: {
          'x-user-id': userId,
          'x-user-phone': activeCleanPhone,
          'x-admin-token': typeof window !== 'undefined' && sessionStorage.getItem('wzp_admin_auth') === 'true' ? '112211' : '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.teamMembers)) {
          setApiTeamMembers(data.teamMembers);
        }
      }
    } catch (err) {
      console.warn('Could not fetch authorized team data from backend API:', err);
    }
  }, [isLoggedIn, userId, userPhone]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAuthorizedTeam();
    }
  }, [isLoggedIn, fetchAuthorizedTeam]);

  // Direct Level-1 Team Members calculation for currently active user
  // Privacy Guarantee:
  // - Only the referrer/agent can see their directly referred members' deposits and permitted activity.
  // - Referred users must NOT see their referrer's deposits, withdrawals, commission, balance, or private activity.
  const teamMembers = useMemo<TeamMember[]>(() => {
    if (!isLoggedIn) return [];
    if (apiTeamMembers && apiTeamMembers.length > 0) {
      return apiTeamMembers;
    }
    const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
    const activeUid = userId || (activeCleanPhone ? `WZP-${activeCleanPhone.slice(-6)}` : '');
    const activeRefCode = (currentReferralCode || '').toUpperCase();

    // Filter direct members whose referredBy matches current user
    const directUsers = allUsers.filter(u => {
      if (!u.referredBy) return false;
      const refByClean = u.referredBy.trim().toUpperCase();
      const refByPhoneDigits = u.referredBy.replace(/\D/g, '');
      const matchUid = activeUid && refByClean === activeUid.toUpperCase();
      const matchRefCode = activeRefCode && refByClean === activeRefCode;
      const matchPhone = activeCleanPhone && refByPhoneDigits && refByPhoneDigits === activeCleanPhone;
      return matchUid || matchRefCode || matchPhone;
    });

    return directUsers.map(m => {
      const mCleanPhone = (m.userPhone || '').replace(/\D/g, '');
      const mUid = m.userId;

      // Sum all successful deposits for this member from allTransactions and depositRequests
      const memberDepositTxs = allTransactions.filter(tx => {
        const txPhone = (tx.userPhone || '').replace(/\D/g, '');
        const isThisMember = (mUid && tx.userId === mUid) || (mCleanPhone && txPhone && txPhone === mCleanPhone);
        return isThisMember && tx.type === 'DEPOSIT' && tx.status === 'SUCCESS';
      });

      const totalDeposits = memberDepositTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const depositCount = memberDepositTxs.length;
      const lastDeposit = memberDepositTxs[0]?.createdAt || memberDepositTxs[0]?.timestamp;

      const isActive = totalDeposits > 0 || (m.topUpBalance || 0) > 0 || (m.availableBalance || 0) > 0;

      return {
        userId: m.userId,
        userName: m.userName || 'Team Member',
        userPhone: m.userPhone || '',
        email: m.email,
        referralCode: m.referralCode || (mCleanPhone ? `WZP-${mCleanPhone.slice(-6)}` : m.userId),
        joinedViaCode: m.joinedViaReferralCode || m.referredBy || activeRefCode || activeUid,
        joinedDate: m.createdAt || new Date().toISOString(),
        accountStatus: isActive ? 'Active' : 'Inactive',
        totalDeposits,
        depositCount,
        lastDepositDate: lastDeposit,
      };
    }).sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
  }, [apiTeamMembers, allUsers, allTransactions, isLoggedIn, userPhone, userId, currentReferralCode]);

  // Aggregate statistics for active user's team
  const teamStats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter(m => m.accountStatus === 'Active').length;
    const totalDeposits = teamMembers.reduce((sum, m) => sum + m.totalDeposits, 0);
    return {
      totalMembers,
      activeMembers,
      totalDeposits,
    };
  }, [teamMembers]);

  // Aggregate All Teams for Admin Overview
  const allTeams = useMemo<TeamOverview[]>(() => {
    const headMap = new Map<string, { head: UserRecord; members: UserRecord[] }>();

    // Index all users as potential heads
    allUsers.forEach(u => {
      const uCleanPhone = (u.userPhone || '').replace(/\D/g, '');
      const uUid = u.userId || (uCleanPhone ? `WZP-${uCleanPhone.slice(-6)}` : '');
      const uRefCode = (u.referralCode || (uCleanPhone ? `WZP-${uCleanPhone.slice(-6)}` : uUid)).toUpperCase();
      headMap.set(uUid, { head: u, members: [] });
      if (uRefCode && uRefCode !== uUid) {
        headMap.set(uRefCode, { head: u, members: [] });
      }
      if (uCleanPhone && uCleanPhone !== uUid) {
        headMap.set(uCleanPhone, { head: u, members: [] });
      }
    });

    // Populate members under their referring head
    allUsers.forEach(m => {
      if (m.referredBy) {
        const refBy = m.referredBy.trim();
        const refByUpper = refBy.toUpperCase();
        const refByPhone = refBy.replace(/\D/g, '');

        let targetEntry = headMap.get(refByUpper) || (refByPhone ? headMap.get(refByPhone) : undefined);
        if (!targetEntry) {
          for (const [, entry] of headMap.entries()) {
            const hCleanPhone = (entry.head.userPhone || '').replace(/\D/g, '');
            const hUid = (entry.head.userId || '').toUpperCase();
            const hRefCode = (entry.head.referralCode || '').toUpperCase();
            if (hUid === refByUpper || hRefCode === refByUpper || (refByPhone && hCleanPhone === refByPhone)) {
              targetEntry = entry;
              break;
            }
          }
        }

        if (targetEntry && !targetEntry.members.some(existing => existing.userId === m.userId)) {
          targetEntry.members.push(m);
        }
      }
    });

    const seenHeadUids = new Set<string>();
    const teamsList: TeamOverview[] = [];

    headMap.forEach(({ head, members }) => {
      const headUid = head.userId || (head.userPhone ? `WZP-${head.userPhone.replace(/\D/g, '').slice(-6)}` : '');
      if (seenHeadUids.has(headUid)) return;
      seenHeadUids.add(headUid);

      const headCleanPhone = (head.userPhone || '').replace(/\D/g, '');
      const headRefCode = head.referralCode || (headCleanPhone ? `WZP-${headCleanPhone.slice(-6)}` : headUid);

      const teamMembersList: TeamMember[] = members.map(m => {
        const mCleanPhone = (m.userPhone || '').replace(/\D/g, '');
        const mUid = m.userId;

        const memberDepositTxs = allTransactions.filter(tx => {
          const txPhone = (tx.userPhone || '').replace(/\D/g, '');
          const isThisMember = (mUid && tx.userId === mUid) || (mCleanPhone && txPhone && txPhone === mCleanPhone);
          return isThisMember && tx.type === 'DEPOSIT' && tx.status === 'SUCCESS';
        });

        const totalDeposits = memberDepositTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const depositCount = memberDepositTxs.length;
        const lastDeposit = memberDepositTxs[0]?.createdAt || memberDepositTxs[0]?.timestamp;
        const isActive = totalDeposits > 0 || (m.topUpBalance || 0) > 0 || (m.availableBalance || 0) > 0;

        return {
          userId: m.userId,
          userName: m.userName || 'Team Member',
          userPhone: m.userPhone || '',
          email: m.email,
          referralCode: m.referralCode || (mCleanPhone ? `WZP-${mCleanPhone.slice(-6)}` : m.userId),
          joinedViaCode: m.joinedViaReferralCode || m.referredBy || headRefCode || headUid,
          joinedDate: m.createdAt || new Date().toISOString(),
          accountStatus: (isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          totalDeposits,
          depositCount,
          lastDepositDate: lastDeposit,
        };
      }).sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());

      const activeMembersCount = teamMembersList.filter(m => m.accountStatus === 'Active').length;
      const totalTeamDeposits = teamMembersList.reduce((sum, m) => sum + m.totalDeposits, 0);

      teamsList.push({
        headId: headUid,
        headName: head.userName || 'Head Trader',
        headPhone: head.userPhone || '',
        headReferralCode: headRefCode,
        totalMembers: teamMembersList.length,
        activeMembers: activeMembersCount,
        totalTeamDeposits,
        members: teamMembersList,
      });
    });

    return teamsList.sort((a, b) => b.totalMembers - a.totalMembers || b.totalTeamDeposits - a.totalTeamDeposits);
  }, [allUsers, allTransactions]);

  const addBankAccount = (bank: Omit<BankAccount, 'id' | 'createdAt'>): boolean => {
    const isFirst = bankAccounts.length === 0;
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: (bank.bankName || '').trim(),
      accountHolderName: (bank.accountHolderName || userName || 'Trader').trim(),
      accountNumber: (bank.accountNumber || '').trim(),
      ifscCode: (bank.ifscCode || '').trim().toUpperCase(),
      upiId: bank.upiId ? bank.upiId.trim() : '',
      isPrimary: isFirst ? true : (bank.isPrimary ?? false),
      createdAt: new Date().toISOString(),
    };

    // If the newly added bank is primary, mark all previous as non-primary; otherwise prepend
    const updatedBanks: BankAccount[] = newBank.isPrimary
      ? [newBank, ...bankAccounts.map(b => ({ ...b, isPrimary: false }))]
      : [newBank, ...bankAccounts];

    setBankAccounts(updatedBanks);
    localStorage.setItem('wzp_v5_banks', JSON.stringify(updatedBanks));

    const cleanPhone = (userPhone || '').replace(/\D/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '') : '');
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('wzp_v5_user_id') || '' : '') || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');

    const primary = updatedBanks.find(b => b.isPrimary) || updatedBanks[0] || newBank;

    // Persist bank account in Firestore under BOTH phone and UID keys with sanitizeFirestorePayload
    const bankUpdatePayload = sanitizeFirestorePayload({
      bankAccounts: updatedBanks,
      bankName: primary.bankName,
      accountNumber: primary.accountNumber,
      ifscCode: primary.ifscCode,
      accountHolderName: primary.accountHolderName || newBank.accountHolderName || userName || '',
      upiId: primary.upiId || newBank.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (cleanPhone) {
        setDoc(doc(db, 'users', cleanPhone), bankUpdatePayload, { merge: true })
          .then(() => console.log('Successfully saved bank to Firestore user doc:', cleanPhone))
          .catch(err => console.error('Firestore userPhone save bank error:', err));
      }
      if (activeUid) {
        setDoc(doc(db, 'users', activeUid), bankUpdatePayload, { merge: true })
          .then(() => console.log('Successfully saved bank to Firestore UID doc:', activeUid))
          .catch(err => console.error('Firestore activeUid save bank error:', err));
      }
    } catch (err) {
      console.error('Firestore save bank error:', err);
    }

    // Update in allUsers state for immediate admin and application reflection
    setAllUsers(prev =>
      prev.map(u => {
        if ((cleanPhone && u.userPhone === cleanPhone) || (activeUid && u.userId === activeUid)) {
          return {
            ...u,
            bankAccounts: updatedBanks,
            bankName: primary.bankName,
            accountNumber: primary.accountNumber,
            ifscCode: primary.ifscCode,
            accountHolderName: primary.accountHolderName,
            upiId: primary.upiId || u.upiId,
          };
        }
        return u;
      })
    );

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Bank Account Added',
      message: `${bank.bankName} (${bank.accountNumber.slice(-4)}) has been securely added and saved to database.`,
      type: 'TRANSACTION',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev]);

    return true;
  };

  const deleteBankAccount = (id: string) => {
    const filtered = bankAccounts.filter(b => b.id !== id);
    if (filtered.length > 0 && !filtered.some(b => b.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    setBankAccounts(filtered);
    localStorage.setItem('wzp_v5_banks', JSON.stringify(filtered));

    const cleanPhone = (userPhone || '').replace(/\D/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '') : '');
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('wzp_v5_user_id') || '' : '') || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');
    const primary = filtered.find(b => b.isPrimary) || filtered[0];

    const bankPayload: any = sanitizeFirestorePayload({
      bankAccounts: filtered,
      bankName: primary?.bankName || 'No Bank Linked',
      accountNumber: primary?.accountNumber || '',
      ifscCode: primary?.ifscCode || '',
      accountHolderName: primary?.accountHolderName || '',
      upiId: primary?.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    if (cleanPhone) {
      setDoc(doc(db, 'users', cleanPhone), bankPayload, { merge: true }).catch(console.error);
    }
    if (activeUid) {
      setDoc(doc(db, 'users', activeUid), bankPayload, { merge: true }).catch(console.error);
    }

    setAllUsers(prev =>
      prev.map(u => {
        if ((cleanPhone && u.userPhone === cleanPhone) || (activeUid && u.userId === activeUid)) {
          return {
            ...u,
            bankAccounts: filtered,
            bankName: primary?.bankName || 'No Bank Linked',
            accountNumber: primary?.accountNumber || '',
            ifscCode: primary?.ifscCode || '',
            accountHolderName: primary?.accountHolderName || '',
            upiId: primary?.upiId || '',
          };
        }
        return u;
      })
    );
  };

  const setPrimaryBankAccount = (id: string) => {
    const updated = bankAccounts.map(b => ({
      ...b,
      isPrimary: b.id === id,
    }));
    setBankAccounts(updated);
    localStorage.setItem('wzp_v5_banks', JSON.stringify(updated));

    const cleanPhone = (userPhone || '').replace(/\D/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '') : '');
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('wzp_v5_user_id') || '' : '') || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');
    const primary = updated.find(b => b.isPrimary) || updated[0];

    const bankPayload: any = sanitizeFirestorePayload({
      bankAccounts: updated,
      bankName: primary?.bankName || '',
      accountNumber: primary?.accountNumber || '',
      ifscCode: primary?.ifscCode || '',
      accountHolderName: primary?.accountHolderName || '',
      upiId: primary?.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    if (cleanPhone) {
      setDoc(doc(db, 'users', cleanPhone), bankPayload, { merge: true }).catch(console.error);
    }
    if (activeUid) {
      setDoc(doc(db, 'users', activeUid), bankPayload, { merge: true }).catch(console.error);
    }

    setAllUsers(prev =>
      prev.map(u => {
        if ((cleanPhone && u.userPhone === cleanPhone) || (activeUid && u.userId === activeUid)) {
          return {
            ...u,
            bankAccounts: updated,
            bankName: primary?.bankName || '',
            accountNumber: primary?.accountNumber || '',
            ifscCode: primary?.ifscCode || '',
            accountHolderName: primary?.accountHolderName || '',
            upiId: primary?.upiId || '',
          };
        }
        return u;
      })
    );
  };

  const getPrimaryBank = () => {
    return bankAccounts.find(b => b.isPrimary) || bankAccounts[0];
  };

  // USDT Wallet Management
  const addUsdtWallet = (wallet: Omit<UsdtWallet, 'id' | 'createdAt'>): boolean => {
    const isFirst = usdtWallets.length === 0;
    const newWallet: UsdtWallet = {
      id: `usdt-${Date.now()}`,
      address: wallet.address.trim(),
      network: wallet.network || 'TRC20',
      label: wallet.label?.trim() || 'TRC20 Wallet',
      isPrimary: isFirst ? true : (wallet.isPrimary ?? false),
      createdAt: new Date().toISOString(),
    };

    const updatedWallets: UsdtWallet[] = newWallet.isPrimary
      ? [newWallet, ...usdtWallets.map(w => ({ ...w, isPrimary: false }))]
      : [newWallet, ...usdtWallets];

    setUsdtWallets(updatedWallets);
    localStorage.setItem('wzp_v5_usdt_wallets', JSON.stringify(updatedWallets));

    const cleanPhone = (userPhone || '').replace(/\D/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('wzp_v5_user_phone') || '').replace(/\D/g, '') : '');
    const activeUid = userId || (typeof window !== 'undefined' ? localStorage.getItem('wzp_v5_user_id') || '' : '') || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');
    const primary = updatedWallets.find(w => w.isPrimary) || updatedWallets[0] || newWallet;

    const usdtPayload: any = sanitizeFirestorePayload({
      usdtWallets: updatedWallets,
      usdtAddress: primary.address,
      usdtNetwork: primary.network,
      updatedAt: new Date().toISOString(),
    });

    try {
      if (cleanPhone) {
        setDoc(doc(db, 'users', cleanPhone), usdtPayload, { merge: true }).catch(console.warn);
      }
      if (activeUid) {
        setDoc(doc(db, 'users', activeUid), usdtPayload, { merge: true }).catch(console.warn);
      }
    } catch (err) {
      console.warn('Save USDT wallet note:', err);
    }
    return true;
  };

  const deleteUsdtWallet = (id: string) => {
    let updated = usdtWallets.filter(w => w.id !== id);
    if (updated.length > 0 && !updated.some(w => w.isPrimary)) {
      updated = updated.map((w, idx) => idx === 0 ? { ...w, isPrimary: true } : w);
    }
    setUsdtWallets(updated);
    localStorage.setItem('wzp_v5_usdt_wallets', JSON.stringify(updated));

    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    const activeUid = userId || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');
    const primary = updated.find(w => w.isPrimary) || updated[0];

    const payload = sanitizeFirestorePayload({
      usdtWallets: updated,
      usdtAddress: primary ? primary.address : '',
      usdtNetwork: primary ? primary.network : '',
      updatedAt: new Date().toISOString(),
    });

    if (cleanPhone) setDoc(doc(db, 'users', cleanPhone), payload, { merge: true }).catch(console.warn);
    if (activeUid) setDoc(doc(db, 'users', activeUid), payload, { merge: true }).catch(console.warn);
  };

  const setPrimaryUsdtWallet = (id: string) => {
    const updated = usdtWallets.map(w => ({
      ...w,
      isPrimary: w.id === id,
    }));
    setUsdtWallets(updated);
    localStorage.setItem('wzp_v5_usdt_wallets', JSON.stringify(updated));

    const primary = updated.find(w => w.id === id);
    if (primary) {
      const cleanPhone = (userPhone || '').replace(/\D/g, '');
      const activeUid = userId || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : '');
      const payload = sanitizeFirestorePayload({
        usdtWallets: updated,
        usdtAddress: primary.address,
        usdtNetwork: primary.network,
        updatedAt: new Date().toISOString(),
      });
      if (cleanPhone) setDoc(doc(db, 'users', cleanPhone), payload, { merge: true }).catch(console.warn);
      if (activeUid) setDoc(doc(db, 'users', activeUid), payload, { merge: true }).catch(console.warn);
    }
  };

  const getPrimaryUsdtWallet = () => {
    return usdtWallets.find(w => w.isPrimary) || usdtWallets[0];
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'> & { id?: string }) => {
    const txId = tx.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestampStr = new Date().toLocaleString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const activePhone = (userPhone || '').replace(/\D/g, '') || localStorage.getItem('wzp_v5_user_phone') || '';
    const activeUid = userId || localStorage.getItem('wzp_v5_user_id') || (activePhone ? `WZP-${activePhone.slice(-6)}` : 'GUEST');
    const activeName = userName || localStorage.getItem('wzp_v5_user_name') || 'Trader';

    const newTx: Transaction = {
      ...tx,
      id: txId,
      userId: tx.userId || activeUid,
      userName: tx.userName || activeName,
      userPhone: tx.userPhone || activePhone,
      timestamp: timestampStr,
      createdAt: tx.createdAt || new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev.filter(t => t.id !== txId)]);
    setAllTransactions(prev => [newTx, ...prev.filter(t => t.id !== txId)]);

    // Save to Firestore database collection 'transactions'
    try {
      const sanitizedTx = sanitizeFirestorePayload({
        ...newTx,
        createdAt: newTx.createdAt || new Date().toISOString()
      });
      setDoc(doc(db, 'transactions', txId), sanitizedTx).catch(console.warn);
    } catch (e) {
      console.warn('Firestore add transaction error:', e);
    }
  };

  // Submit Deposit (Writes directly to Firestore 'deposits' collection for admin approval)
  const submitDeposit = (
    amount: number,
    utr: string,
    method: 'EasyPaisa' | 'JazzCash' | 'EASYPAISA' | 'JAZZCASH' | 'UPI' | 'QR' | 'BANK_TRANSFER' | 'USDT' | string = 'EasyPaisa',
    accountNumber?: string,
    accountTitle?: string,
    screenshotUrl?: string,
    usdtAmount?: number,
    usdtNetwork: string = 'TRC20',
    txHash?: string
  ): boolean => {
    if (amount < config.minDeposit) return false;

    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    const depId = `DEP-${Math.floor(100000 + Math.random() * 900000)}`;
    const activeUid = userId || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : `WZP-${Math.floor(100000 + Math.random() * 900000)}`);
    const activeName = userName || 'Trader';

    const calculatedUsdt = usdtAmount || +(amount / (config.usdtRate || 280)).toFixed(2);

    const newReq: DepositRequest = {
      id: depId,
      userId: activeUid,
      userName: activeName,
      userPhone: cleanPhone,
      amount,
      rpAmount: amount * config.exchangeRate,
      utr: utr || txHash || '',
      method: (method as any) || 'EasyPaisa',
      accountNumber: accountNumber || '',
      accountTitle: accountTitle || '',
      screenshotUrl: screenshotUrl || '',
      receiptUrl: screenshotUrl || '',
      usdtAmount: method === 'USDT' ? calculatedUsdt : undefined,
      usdtNetwork: method === 'USDT' ? usdtNetwork : undefined,
      txHash: method === 'USDT' ? (txHash || utr) : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Update local state
    setDepositRequests(prev => [newReq, ...prev]);

    addTransaction({
      id: depId,
      type: 'DEPOSIT',
      amount,
      rpAmount: newReq.rpAmount,
      status: 'PENDING',
      title: method === 'USDT'
        ? `Deposit - USDT (${usdtNetwork}) Top-Up`
        : `Deposit - ${method} Top-Up`,
      utr: utr || txHash,
      usdtAmount: method === 'USDT' ? calculatedUsdt : undefined,
      usdtNetwork: method === 'USDT' ? usdtNetwork : undefined,
      txHash: method === 'USDT' ? (txHash || utr) : undefined,
      userId: activeUid,
      userPhone: cleanPhone,
      userName: activeName,
      notes: method === 'USDT'
        ? `USDT Amount: ${calculatedUsdt} USDT • TXID: ${txHash || utr} • Pending Admin Approval`
        : `${method} Deposit • A/C: ${accountNumber || 'Official'} • Trx ID: ${utr} • Pending Admin Approval`,
    });

    // Write to Firestore database 'deposits' collection
    try {
      const sanitizedDep = sanitizeFirestorePayload({
        ...newReq,
        createdAt: newReq.createdAt || new Date().toISOString()
      });
      setDoc(doc(db, 'deposits', depId), sanitizedDep).catch(err => console.warn('Firestore deposit write error:', err));
    } catch (e) {
      console.warn('Deposit Firestore write note:', e);
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Deposit Request Submitted',
      message: method === 'USDT'
        ? `USDT Deposit request of ${calculatedUsdt} USDT (Rs. ${amount.toLocaleString('en-PK')}, TXID: ${txHash || utr}) is queued for Admin approval.`
        : `Deposit request of Rs. ${amount.toLocaleString('en-PK')} via ${method} (Transaction ID: ${utr}) is queued in the database for Admin approval.`,
      type: 'TRANSACTION',
      read: false,
      timestamp: 'Just now',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return true;
  };

  // Submit Withdrawal (Writes directly to Firestore 'withdrawals' collection for admin approval)
  const submitWithdrawal = (
    amount: number,
    bankId?: string,
    payoutMethod: 'BANK_TRANSFER' | 'UPI_QR' | 'USDT' = 'BANK_TRANSFER',
    payoutUpiId?: string,
    payoutQrUrl?: string,
    usdtAddress?: string,
    usdtNetwork: string = 'TRC20'
  ): { success: boolean; message: string } => {
    if (amount > withdrawableBalance) {
      return {
        success: false,
        message: `Insufficient Withdrawable balance (Rs. ${withdrawableBalance.toLocaleString('en-PK')}). Please sell completed mined RP first to generate withdrawable balance.`
      };
    }
    if (amount < config.minWithdraw) {
      return { success: false, message: `Minimum withdrawal amount is Rs. ${config.minWithdraw}` };
    }
    if (amount > config.maxWithdraw) {
      return { success: false, message: `Maximum withdrawal limit is Rs. ${config.maxWithdraw}` };
    }

    let bank = bankAccounts.find(b => b.id === bankId) || getPrimaryBank();
    
    if (payoutMethod === 'USDT') {
      const targetAddress = usdtAddress || bank?.usdtAddress || getPrimaryUsdtWallet()?.address || '';
      if (!targetAddress) {
        return { success: false, message: 'Please add or select a valid USDT wallet address (TRC20 / BEP20).' };
      }
      const targetNetwork = (usdtNetwork || bank?.usdtNetwork || getPrimaryUsdtWallet()?.network || 'TRC20') as 'TRC20' | 'BEP20' | 'ERC20';
      bank = {
        id: `usdt-payout-${Date.now()}`,
        bankName: `USDT Wallet (${targetNetwork})`,
        accountHolderName: userName || 'Trader',
        accountNumber: targetAddress,
        ifscCode: targetNetwork,
        upiId: targetAddress,
        usdtAddress: targetAddress,
        usdtNetwork: targetNetwork,
        accountType: 'USDT',
        isPrimary: false,
        createdAt: new Date().toISOString()
      };
    } else if (!bank) {
      if (payoutMethod === 'UPI_QR' && payoutUpiId) {
        bank = {
          id: `qr-payout-${Date.now()}`,
          bankName: 'QR / Account Payout',
          accountHolderName: userName || 'User',
          accountNumber: payoutUpiId,
          ifscCode: 'PK000000',
          upiId: payoutUpiId,
          payoutQrUrl: payoutQrUrl,
          isPrimary: false,
          createdAt: new Date().toISOString()
        };
      } else {
        return { success: false, message: 'Please select a bank account or provide a payout Account ID / QR.' };
      }
    }

    // STEP 6: Money DEDUCTED from Withdrawable Balance and submitted for Admin Approval (Top-Up balance is NOT touched)
    const newWithdrawable = Math.max(0, withdrawableBalance - amount);
    setWithdrawableBalance(newWithdrawable);
    localStorage.setItem('wzp_v5_withdrawable_bal', newWithdrawable.toString());

    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    const wthId = `WTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const calculatedUsdt = +(amount / (config.usdtRate || 280)).toFixed(2);

    const newReq: WithdrawalRequest = {
      id: wthId,
      userId: userId || (cleanPhone ? `WZP-${cleanPhone.slice(-6)}` : `WZP-${Math.floor(100000 + Math.random() * 900000)}`),
      userName: userName || 'User',
      userPhone: cleanPhone,
      amount,
      rpAmount: amount,
      bankAccount: bank,
      payoutMethod,
      payoutUpiId: payoutUpiId || bank.upiId,
      payoutQrUrl: payoutQrUrl || bank.payoutQrUrl,
      usdtAddress: payoutMethod === 'USDT' ? (usdtAddress || bank.accountNumber) : undefined,
      usdtNetwork: payoutMethod === 'USDT' ? (usdtNetwork || bank.usdtNetwork || 'TRC20') : undefined,
      usdtAmount: payoutMethod === 'USDT' ? calculatedUsdt : undefined,
      status: 'PENDING',
      createdAt: nowIso,
    };

    setWithdrawalRequests(prev => [newReq, ...prev]);

    setAllUsers(prev =>
      prev.map(u => {
        const matchPhone = cleanPhone && u.userPhone === cleanPhone;
        const matchUid = (newReq.userId && u.userId === newReq.userId) || u.userId === userId;
        if (matchPhone || matchUid) {
          return { ...u, withdrawableBalance: newWithdrawable, updatedAt: nowIso };
        }
        return u;
      })
    );

    addTransaction({
      id: wthId,
      type: 'WITHDRAWAL',
      amount,
      rpAmount: amount,
      status: 'PENDING',
      title: payoutMethod === 'USDT'
        ? `Withdrawal Request (USDT ${newReq.usdtNetwork})`
        : payoutMethod === 'UPI_QR'
        ? `Withdrawal Request (QR / Wallet)`
        : `Withdrawal Request (${bank.bankName})`,
      userId: newReq.userId,
      userPhone: cleanPhone,
      userName: newReq.userName,
      bankDetails: {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber.length > 8 ? `${bank.accountNumber.slice(0, 6)}...${bank.accountNumber.slice(-4)}` : bank.accountNumber,
        accountHolderName: bank.accountHolderName,
      },
      payoutMethod,
      payoutUpiId: payoutUpiId || bank.upiId,
      payoutQrUrl: payoutQrUrl || bank.payoutQrUrl,
      usdtAddress: newReq.usdtAddress,
      usdtNetwork: newReq.usdtNetwork,
      usdtAmount: newReq.usdtAmount,
      notes: payoutMethod === 'USDT'
        ? `USDT: ${calculatedUsdt} USDT to ${newReq.usdtAddress} • Ref: ${newReq.id}`
        : `Ref: ${newReq.id} • Awaiting Admin Payout Approval`,
    });

    // Write to Firestore database 'withdrawals' and update user document
    try {
      const sanitizedReq = sanitizeFirestorePayload({
        ...newReq,
        createdAt: nowIso,
      });
      setDoc(doc(db, 'withdrawals', wthId), sanitizedReq).catch(console.warn);

      if (cleanPhone) {
        setDoc(doc(db, 'users', cleanPhone), sanitizeFirestorePayload({
          withdrawableBalance: newWithdrawable,
          updatedAt: nowIso
        }), { merge: true }).catch(console.warn);
      }
      if (userId) {
        setDoc(doc(db, 'users', userId), sanitizeFirestorePayload({
          withdrawableBalance: newWithdrawable,
          updatedAt: nowIso
        }), { merge: true }).catch(console.warn);
      }
    } catch (e) {
      console.warn('Withdrawal Firestore write note:', e);
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Withdrawal Submitted',
      message: payoutMethod === 'USDT'
        ? `Withdrawal request for ${calculatedUsdt} USDT (Rs. ${amount.toLocaleString('en-PK')}) submitted to address ${newReq.usdtAddress}.`
        : `Withdrawal request of Rs. ${amount.toLocaleString('en-PK')} has been submitted from your Withdrawable Balance and sent for Admin approval.`,
      type: 'TRANSACTION',
      read: false,
      timestamp: 'Just now',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return {
      success: true,
      message: payoutMethod === 'USDT'
        ? `Withdrawal request for ${calculatedUsdt} USDT (Rs. ${amount.toLocaleString('en-PK')}) submitted successfully! Admin will send funds to your wallet.`
        : `Withdrawal request for Rs. ${amount.toLocaleString('en-PK')} submitted successfully! Admin will review and approve the payout.`
    };
  };

  // ========================================================================
  // RP PLAN PURCHASE & MINING & SELLING SYSTEM
  // ========================================================================

  // STEP 2 & 3: Buy RP Plan: Deducts amount from customer's Top-Up balance and starts 300s mining
  const buyRPPlan = (
    planId: string,
    amount: number,
    durationSeconds?: number
  ): { success: boolean; message: string; plan?: UserRPPlan } => {
    const planMeta = TRADING_PLANS.find(p => p.id === planId) || TRADING_PLANS[0];

    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid investment amount.' };
    }
    if (amount < planMeta.minAmount) {
      return { success: false, message: `Minimum amount for ${planMeta.name} is Rs. ${planMeta.minAmount.toLocaleString('en-PK')}` };
    }
    if (amount > planMeta.maxAmount) {
      return { success: false, message: `Maximum amount for ${planMeta.name} is Rs. ${planMeta.maxAmount.toLocaleString('en-PK')}` };
    }
    if (amount > topUpBalance) {
      return { success: false, message: `Insufficient Top-Up balance (Rs. ${topUpBalance.toLocaleString('en-PK')}). Please Deposit / Top-Up first.` };
    }

    // Completely deduct investment from customer's Top-Up balance
    const newTopUp = topUpBalance - amount;
    setTopUpBalance(newTopUp);

    // Calculate profit and 300s completion time
    const profitRate = planMeta.commissionRate || getCommissionRateForAmount(amount);
    const profitAmount = Math.round((amount * profitRate) / 100);
    const totalReturn = amount + profitAmount;
    const duration = durationSeconds || planMeta.defaultDurationSeconds || 300;
    const startTimestamp = Date.now();
    const completionTimestamp = startTimestamp + (duration * 1000);
    const planInstanceId = `RPP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPlan: UserRPPlan = {
      id: planInstanceId,
      userId: userId || `WZP-${Math.floor(100000 + Math.random() * 900000)}`,
      userName: userName || 'Trader',
      planId: planMeta.id,
      planName: planMeta.name,
      investedAmount: amount,
      profitRate,
      profitAmount,
      totalReturn,
      durationSeconds: duration,
      startTimestamp,
      completionTimestamp,
      startTime: new Date(startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      completionTime: new Date(completionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'MINING',
    };

    // Store in local user plans list
    setUserPlans(prev => [newPlan, ...prev]);

    // Record Plan Purchase Transaction
    addTransaction({
      type: 'PLAN_PURCHASE',
      amount,
      profitAmount,
      status: 'SUCCESS',
      title: `RP Mining Plan Purchase - ${planMeta.name}`,
      planName: planMeta.name,
      planId: planMeta.id,
      notes: `Mining activated (${duration}s cycle) • Expected Return Rs. ${totalReturn.toLocaleString('en-PK')} (Capital Rs. ${amount.toLocaleString('en-PK')} + Profit Rs. ${profitAmount.toLocaleString('en-PK')})`,
    });

    // Write to Firestore database collection 'user_plans'
    try {
      setDoc(doc(db, 'user_plans', planInstanceId), {
        ...newPlan,
        createdAt: serverTimestamp(),
      }).catch(err => console.warn('Firestore plan write note:', err));

      const cleanPhone = (userPhone || '').replace(/\D/g, '');
      if (cleanPhone) {
        setDoc(doc(db, 'users', cleanPhone), {
          topUpBalance: newTopUp,
          availableBalance: newTopUp,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
      }
      if (userId) {
        setDoc(doc(db, 'users', userId), {
          topUpBalance: newTopUp,
          availableBalance: newTopUp,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
      }
    } catch (e) {
      console.warn('Database plan write note:', e);
    }

    // Celebration & Notification
    try {
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setNotifications(prev => [
      {
        id: `notif-buy-${Date.now()}`,
        title: '⛏️ RP Plan Activated & Mining Started',
        message: `Rs. ${amount.toLocaleString('en-PK')} deducted from Top-Up balance. Mining in progress (${duration}s cycle) with Rs. ${profitAmount.toLocaleString('en-PK')} reward.`,
        type: 'TRANSACTION',
        read: false,
        timestamp: 'Just now'
      },
      ...prev
    ]);

    return {
      success: true,
      message: `Plan purchased successfully! RP Mining is now active (${duration}s).`,
      plan: newPlan
    };
  };

  // Fast-Forward Mining (for demonstration / testing)
  const fastForwardPlanMining = (userPlanId: string) => {
    setUserPlans(prev =>
      prev.map(p => {
        if (p.id === userPlanId && p.status === 'MINING') {
          return {
            ...p,
            completionTimestamp: Date.now() - 1000,
            status: 'COMPLETED' as const
          };
        }
        return p;
      })
    );

    try {
      updateDoc(doc(db, 'user_plans', userPlanId), {
        status: 'COMPLETED',
        completionTimestamp: Date.now() - 1000
      }).catch(console.warn);
    } catch {
      // ignore
    }
  };

  // STEP 5: Sell RP to Seller: Customer sells completed RP package to designated merchant.
  // RP Balance DEDUCTED, Money (Total Return = Principal + Profit) ADDED → Withdrawable Balance!
  const sellRPPlan = (
    userPlanId: string,
    sellerName: string = 'WinzoPay Official Market Desk #1'
  ): { success: boolean; message: string; totalCredited?: number } => {
    const targetPlan = userPlans.find(p => p.id === userPlanId);

    if (!targetPlan) {
      return { success: false, message: 'RP Plan not found.' };
    }

    if (targetPlan.status === 'MINING') {
      const remainingSec = Math.max(0, Math.ceil((targetPlan.completionTimestamp - Date.now()) / 1000));
      return {
        success: false,
        message: `Cannot sell RP yet! Mining is still in progress (${remainingSec}s remaining). RP can only be sold after mining completes.`
      };
    }

    if (targetPlan.status === 'SOLD') {
      return { success: false, message: 'This RP plan has already been sold and settled.' };
    }

    const totalReturn = targetPlan.totalReturn || (targetPlan.investedAmount + targetPlan.profitAmount);
    const profit = targetPlan.profitAmount;

    // STEP 5: RP Balance DEDUCTED, Money ADDED → Withdrawable Balance!
    const newWithdrawable = withdrawableBalance + totalReturn;
    setWithdrawableBalance(newWithdrawable);
    setTodayCommission(prev => prev + profit);

    // Update plan status
    const soldAtStr = new Date().toISOString();
    setUserPlans(prev =>
      prev.map(p => (p.id === userPlanId ? { ...p, status: 'SOLD' as const, sellerName, soldAt: soldAtStr } : p))
    );

    // Record Sell RP Transaction
    addTransaction({
      type: 'SELL_RP',
      amount: totalReturn,
      rpAmount: totalReturn,
      profitAmount: profit,
      status: 'SUCCESS',
      title: `Sold RP to ${sellerName}`,
      sellerName,
      planName: targetPlan.planName,
      planId: targetPlan.planId,
      notes: `Total Return Rs. ${totalReturn.toLocaleString('en-PK')} (Capital Rs. ${targetPlan.investedAmount.toLocaleString('en-PK')} + Profit Rs. ${profit.toLocaleString('en-PK')}) credited to Withdrawable Balance`,
    });

    // Record Mining Profit Transaction
    addTransaction({
      type: 'MINING_PROFIT',
      amount: profit,
      status: 'SUCCESS',
      title: `Mining Profit Credited - ${targetPlan.planName}`,
      planName: targetPlan.planName,
      notes: `${targetPlan.profitRate}% Yield Payout added to Withdrawable Balance`,
    });

    // Write to Firestore database
    try {
      updateDoc(doc(db, 'user_plans', userPlanId), {
        status: 'SOLD',
        sellerName,
        soldAt: soldAtStr,
      }).catch(console.warn);

      const cleanPhone = (userPhone || '').replace(/\D/g, '');
      if (cleanPhone) {
        setDoc(doc(db, 'users', cleanPhone), {
          withdrawableBalance: newWithdrawable,
          todayCommission: todayCommission + profit,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
      }
      if (userId) {
        setDoc(doc(db, 'users', userId), {
          withdrawableBalance: newWithdrawable,
          todayCommission: todayCommission + profit,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
      }
    } catch (e) {
      console.warn('Firestore sell RP update note:', e);
    }

    // Celebration & Notification
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch {
      // ignore
    }

    setNotifications(prev => [
      {
        id: `notif-sell-${Date.now()}`,
        title: '🎉 RP Sold Successfully!',
        message: `Sold RP to ${sellerName}. Total return Rs. ${totalReturn.toLocaleString('en-PK')} (Capital Rs. ${targetPlan.investedAmount.toLocaleString('en-PK')} + Profit Rs. ${profit.toLocaleString('en-PK')}) has been added to your Withdrawable Balance.`,
        type: 'TRANSACTION',
        read: false,
        timestamp: 'Just now'
      },
      ...prev
    ]);

    return {
      success: true,
      message: `RP sold successfully to ${sellerName}! Rs. ${totalReturn.toLocaleString('en-PK')} has been added to your Withdrawable Balance.`,
      totalCredited: totalReturn
    };
  };

  // Claim Reward
  const claimReward = (id: string): boolean => {
    const target = rewards.find(r => r.id === id);
    if (!target || target.claimed) return false;

    setRewards(prev =>
      prev.map(r => (r.id === id ? { ...r, claimed: true } : r))
    );

    const newBal = availableBalance + target.rewardAmount;
    setAvailableBalance(newBal);

    addTransaction({
      type: 'REWARD',
      amount: target.rewardAmount,
      status: 'SUCCESS',
      title: target.title,
      notes: 'Bonus credited directly to wallet',
    });

    if (userId) {
      setDoc(doc(db, 'users', userId), { availableBalance: newBal }, { merge: true }).catch(console.warn);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    return true;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const sendSupportMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let botResponse = 'Thank you for contacting WinzoPay Support. An agent has received your query and will update your transaction status.';
      const lower = text.toLowerCase();
      if (lower.includes('deposit') || lower.includes('buy rp') || lower.includes('trx') || lower.includes('tid')) {
        botResponse = 'Deposits are credited within 1-5 minutes after EasyPaisa/JazzCash Transaction ID verification. Our team will verify and credit your balance shortly!';
      } else if (lower.includes('withdraw') || lower.includes('sell rp') || lower.includes('payout')) {
        botResponse = 'Sell RP / Withdrawal operates daily from 10:00 AM – 10:00 PM. Payouts are dispatched via 1Link / Raast straight to your linked bank account or wallet within 5-15 minutes.';
      } else if (lower.includes('bank') || lower.includes('iban') || lower.includes('branch')) {
        botResponse = 'You can add or update your bank card in the "Manage Bank" section. Ensure the Account Holder Name matches your verified profile.';
      }

      const replyMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'support',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 800);
  };

  const updateConfig = (newConfig: Partial<PlatformConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);

    // Sync gateway config to Firestore 'config/platform_settings'
    try {
      setDoc(doc(db, 'config', 'platform_settings'), updated, { merge: true }).catch(console.warn);
    } catch (e) {
      console.warn('Firestore config update note:', e);
    }
  };

  // ========================================================================
  // ADMIN DATABASE ACTIONS: APPROVE / REJECT DEPOSITS & WITHDRAWALS
  // ========================================================================
  const approveDeposit = async (requestId: string) => {
    // 1. Locate deposit request from memory or transaction ledger
    let req = depositRequests.find(r => r.id === requestId || r.utr === requestId);
    if (!req) {
      const tx = (allTransactions && allTransactions.length > 0 ? allTransactions : transactions)
        .find(t => t.id === requestId || t.utr === requestId || t.notes?.includes(requestId));
      if (tx) {
        req = {
          id: requestId,
          userId: tx.userId || '',
          userName: tx.userName || 'Trader',
          userPhone: tx.userPhone || '',
          amount: tx.amount,
          rpAmount: tx.rpAmount || tx.amount,
          utr: tx.utr || '',
          method: 'EasyPaisa',
          status: 'PENDING',
          createdAt: tx.createdAt || tx.timestamp,
        };
      }
    }

    const cleanReqId = req?.id || requestId;
    const reqUtr = req?.utr?.trim() || '';
    const reqAmount = req?.amount || 0;

    // 2. Update Firestore Database Deposit Record (with merge: true for resilience)
    try {
      await setDoc(doc(db, 'deposits', cleanReqId), {
        status: 'SUCCESS',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (requestId !== cleanReqId) {
        await setDoc(doc(db, 'deposits', requestId), {
          status: 'SUCCESS',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore setDoc deposit approval error:', err);
    }

    // 3. Update local state for deposit requests
    setDepositRequests(prev => {
      const exists = prev.some(r => r.id === cleanReqId || r.id === requestId || (reqUtr && r.utr === reqUtr));
      if (!exists && req) {
        return [{ ...req, status: 'SUCCESS' }, ...prev];
      }
      return prev.map(r => {
        if (r.id === cleanReqId || r.id === requestId || (reqUtr && r.utr === reqUtr)) {
          return { ...r, status: 'SUCCESS' };
        }
        return r;
      });
    });

    // 4. Resolve Target Depositor
    const targetPhone = (req?.userPhone || '').replace(/\D/g, '');
    const targetUid = req?.userId || '';
    const currentActivePhone = (userPhone || '').replace(/\D/g, '');

    // Check if the target user matches the active session
    const isCurrentSessionUser =
      (targetPhone && targetPhone === currentActivePhone) ||
      (targetUid && targetUid === userId) ||
      (!targetPhone && !targetUid);

    // Find in allUsers directory
    const targetUser = allUsers.find(
      u => (targetPhone && u.userPhone === targetPhone) ||
           (targetUid && u.userId === targetUid) ||
           (targetPhone && u.userId === `WZP-${targetPhone.slice(-6)}`)
    );

    // Calculate updated Top-Up balance
    let currentTopUp = targetUser
      ? (typeof targetUser.topUpBalance === 'number' ? targetUser.topUpBalance : (targetUser.availableBalance ?? 0))
      : (isCurrentSessionUser ? topUpBalance : 0);

    if (isCurrentSessionUser && topUpBalance > currentTopUp) {
      currentTopUp = topUpBalance;
    }

    const newTopUp = currentTopUp + reqAmount;

    // If current session is the depositor, immediately credit active state & local storage
    if (isCurrentSessionUser && reqAmount > 0) {
      setTopUpBalance(newTopUp);
      localStorage.setItem('wzp_v5_topup_bal', newTopUp.toString());
      localStorage.setItem('wzp_v5_avail_bal', newTopUp.toString());
    }

    // Update allUsers in local memory so Admin table reflects change instantly
    if (reqAmount > 0) {
      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = targetPhone && u.userPhone === targetPhone;
          const matchUid = targetUid && u.userId === targetUid;
          if (matchPhone || matchUid) {
            return {
              ...u,
              topUpBalance: newTopUp,
              availableBalance: newTopUp,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        })
      );
    }

    // 5. Update Target User in Firestore Database across both phone and UID keys
    try {
      if (reqAmount > 0) {
        if (targetPhone && targetPhone.length >= 10) {
          await setDoc(doc(db, 'users', targetPhone), {
            topUpBalance: newTopUp,
            availableBalance: newTopUp,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        if (targetUid) {
          await setDoc(doc(db, 'users', targetUid), {
            topUpBalance: newTopUp,
            availableBalance: newTopUp,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        if (targetUser?.userId && targetUser.userId !== targetUid) {
          await setDoc(doc(db, 'users', targetUser.userId), {
            topUpBalance: newTopUp,
            availableBalance: newTopUp,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Firestore credit user balance note:', err);
    }

    // 6. Update transaction ledger in state and Firestore
    const isMatchingTx = (t: Transaction) => {
      const matchId = t.id === cleanReqId || t.id === requestId;
      const matchUtr = reqUtr && t.utr && t.utr.trim().toLowerCase() === reqUtr.toLowerCase();
      const matchNotes = t.notes && (t.notes.includes(cleanReqId) || t.notes.includes(requestId));
      return matchId || matchUtr || matchNotes;
    };

    setTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'SUCCESS' } : t))
    );
    setAllTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'SUCCESS' } : t))
    );

    try {
      const txQuery = query(collection(db, 'transactions'));
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach(async (d) => {
        const txData = d.data();
        const dIdMatch = d.id === cleanReqId || d.id === requestId;
        const dUtrMatch = reqUtr && txData.utr && txData.utr.toString().trim().toLowerCase() === reqUtr.toLowerCase();
        const dNotesMatch = txData.notes && (txData.notes.includes(cleanReqId) || txData.notes.includes(requestId));
        if (dIdMatch || dUtrMatch || dNotesMatch) {
          await setDoc(doc(db, 'transactions', d.id), {
            status: 'SUCCESS',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(console.warn);
        }
      });
    } catch (e) {
      console.warn('Firestore tx update note:', e);
    }

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Deposit Approved! 🎉',
        message: `Your deposit of Rs. ${reqAmount.toLocaleString('en-PK')}${reqUtr ? ` (Ref: ${reqUtr})` : ''} has been approved and credited to your Top-Up balance.`,
        type: 'TRANSACTION',
        read: false,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
  };

  const rejectDeposit = async (requestId: string, reason = 'Invalid UTR reference or payment not received') => {
    let req = depositRequests.find(r => r.id === requestId || r.utr === requestId);
    const cleanReqId = req?.id || requestId;
    const reqUtr = req?.utr?.trim() || '';

    // 1. Update Firestore Database
    try {
      await setDoc(doc(db, 'deposits', cleanReqId), {
        status: 'REJECTED',
        rejectedReason: reason,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (requestId !== cleanReqId) {
        await setDoc(doc(db, 'deposits', requestId), {
          status: 'REJECTED',
          rejectedReason: reason,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore reject deposit error:', err);
    }

    // 2. Update state
    setDepositRequests(prev =>
      prev.map(r => (r.id === cleanReqId || r.id === requestId || (reqUtr && r.utr === reqUtr)
        ? { ...r, status: 'REJECTED', rejectedReason: reason }
        : r
      ))
    );

    const isMatchingTx = (t: Transaction) => {
      const matchId = t.id === cleanReqId || t.id === requestId;
      const matchUtr = reqUtr && t.utr && t.utr.trim().toLowerCase() === reqUtr.toLowerCase();
      const matchNotes = t.notes && (t.notes.includes(cleanReqId) || t.notes.includes(requestId));
      return matchId || matchUtr || matchNotes;
    };

    setTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'REJECTED', notes: `Rejected: ${reason}` } : t))
    );
    setAllTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'REJECTED', notes: `Rejected: ${reason}` } : t))
    );

    try {
      const txQuery = query(collection(db, 'transactions'));
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach(async (d) => {
        const txData = d.data();
        const dIdMatch = d.id === cleanReqId || d.id === requestId;
        const dUtrMatch = reqUtr && txData.utr && txData.utr.toString().trim().toLowerCase() === reqUtr.toLowerCase();
        const dNotesMatch = txData.notes && (txData.notes.includes(cleanReqId) || txData.notes.includes(requestId));
        if (dIdMatch || dUtrMatch || dNotesMatch) {
          await setDoc(doc(db, 'transactions', d.id), {
            status: 'REJECTED',
            notes: `Rejected: ${reason}`,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(console.warn);
        }
      });
    } catch (e) {
      console.warn('Firestore tx reject update note:', e);
    }

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Deposit Rejected',
        message: `Deposit request of Rs. ${req?.amount ? req.amount.toLocaleString('en-PK') : ''} was rejected. Reason: ${reason}`,
        type: 'SYSTEM',
        read: false,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
  };

  const approveWithdrawal = async (requestId: string) => {
    let req = withdrawalRequests.find(r => r.id === requestId);
    const cleanReqId = req?.id || requestId;

    // STEP 7: ADMIN APPROVES -> Money sent to user's account
    // 1. Update Firestore Database
    try {
      await setDoc(doc(db, 'withdrawals', cleanReqId), {
        status: 'SUCCESS',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (requestId !== cleanReqId) {
        await setDoc(doc(db, 'withdrawals', requestId), {
          status: 'SUCCESS',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore setDoc withdrawal approval note:', err);
    }

    // 2. Update state
    setWithdrawalRequests(prev =>
      prev.map(r => (r.id === cleanReqId || r.id === requestId ? { ...r, status: 'SUCCESS' } : r))
    );

    const isMatchingTx = (t: Transaction) => {
      return t.id === cleanReqId || t.id === requestId || (t.notes && (t.notes.includes(cleanReqId) || t.notes.includes(requestId)));
    };

    setTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'SUCCESS' } : t))
    );
    setAllTransactions(prev =>
      prev.map(t => (isMatchingTx(t) ? { ...t, status: 'SUCCESS' } : t))
    );

    try {
      const txQuery = query(collection(db, 'transactions'));
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach(async (d) => {
        const txData = d.data();
        if (d.id === cleanReqId || d.id === requestId || txData.notes?.includes(cleanReqId) || txData.notes?.includes(requestId)) {
          await setDoc(doc(db, 'transactions', d.id), {
            status: 'SUCCESS',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(console.warn);
        }
      });
    } catch (e) {
      console.warn('Firestore tx update note:', e);
    }

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Withdrawal Approved & Paid! 💸',
        message: req ? `Rs. ${req.amount.toLocaleString('en-PK')} has been approved and paid to ${req.bankAccount?.bankName || 'bank account'}.` : 'Withdrawal payout confirmed.',
        type: 'TRANSACTION',
        read: false,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
  };

  const rejectWithdrawal = async (requestId: string, reason = 'Bank account verification failed') => {
    // 1. In-memory guard: if already marked REJECTED or already refunded, refund Rs. 0
    const localReq = withdrawalRequests.find(r => r.id === requestId);
    if (localReq) {
      const isAlreadyRejected = (localReq.status || '').toUpperCase() === 'REJECTED';
      const isAlreadyRefunded = localReq.isRefunded === true;
      if (isAlreadyRejected || isAlreadyRefunded) {
        console.warn(`[WinzoPay] Withdrawal ${requestId} is already marked REJECTED / refunded. 0 additional refund applied.`);
        return { success: true, refunded: false, amountRefunded: 0 };
      }
    }

    // 2. Try backend API call first for atomic server-side Firestore runTransaction
    let apiProcessed = false;
    let apiResult: any = null;
    try {
      const res = await fetch('/api/withdrawals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': '112211',
        },
        body: JSON.stringify({ requestId, reason }),
      });
      if (res.ok) {
        apiResult = await res.json();
        apiProcessed = true;
      }
    } catch (err) {
      console.warn('[WinzoPay] Backend API reject withdrawal note:', err);
    }

    let finalRefunded = false;
    let finalAmountRefunded = 0;
    let finalNewBalance: number | null = null;
    let targetPhone = (localReq?.userPhone || '').replace(/\D/g, '');
    let targetUid = localReq?.userId || '';

    if (apiProcessed && apiResult && apiResult.success) {
      finalRefunded = apiResult.refunded === true;
      finalAmountRefunded = Number(apiResult.amountRefunded) || 0;
      finalNewBalance = apiResult.newBalance !== null && apiResult.newBalance !== undefined ? Number(apiResult.newBalance) : null;
      if (apiResult.userPhone) targetPhone = apiResult.userPhone.replace(/\D/g, '');
      if (apiResult.userId) targetUid = apiResult.userId;
    } else {
      // 3. Fallback: Client-side Atomic Firestore Transaction
      try {
        const txResult = await runTransaction(db, async (transaction) => {
          const wRef = doc(db, 'withdrawals', requestId);
          const wSnap = await transaction.get(wRef);

          if (!wSnap.exists()) {
            throw new Error(`Withdrawal request ${requestId} not found.`);
          }

          const wData = wSnap.data();
          const currentStatus = (wData.status || '').toUpperCase();
          const alreadyRefunded = wData.isRefunded === true || currentStatus === 'REJECTED';

          if (alreadyRefunded) {
            return {
              refunded: false,
              amountRefunded: 0,
              userId: wData.userId,
              userPhone: wData.userPhone,
            };
          }

          const amount = Number(wData.amount) || 0;
          const phone = (wData.userPhone || '').replace(/\D/g, '');
          const uid = wData.userId;

          let userDocRef = phone ? doc(db, 'users', phone) : (uid ? doc(db, 'users', uid) : null);
          let userSnap = userDocRef ? await transaction.get(userDocRef) : null;
          if ((!userSnap || !userSnap.exists()) && uid) {
            userDocRef = doc(db, 'users', uid);
            userSnap = await transaction.get(userDocRef);
          }

          let currentWithdrawable = 0;
          if (userSnap && userSnap.exists()) {
            const uData = userSnap.data();
            currentWithdrawable = typeof uData.withdrawableBalance === 'number' ? uData.withdrawableBalance : 0;
          }
          const newWithdrawable = currentWithdrawable + amount;

          transaction.update(wRef, {
            status: 'REJECTED',
            rejectedReason: reason,
            isRefunded: true,
            refundedAmount: amount,
            refundedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          if (userDocRef && userSnap && userSnap.exists()) {
            transaction.update(userDocRef, {
              withdrawableBalance: newWithdrawable,
              updatedAt: new Date().toISOString(),
            });
          }

          return {
            refunded: true,
            amountRefunded: amount,
            newBalance: newWithdrawable,
            userId: uid,
            userPhone: phone,
          };
        });

        finalRefunded = txResult.refunded;
        finalAmountRefunded = txResult.amountRefunded;
        finalNewBalance = (txResult as any).newBalance ?? null;
        if (txResult.userPhone) targetPhone = txResult.userPhone.replace(/\D/g, '');
        if (txResult.userId) targetUid = txResult.userId;
      } catch (dbErr) {
        console.error('[WinzoPay] Atomic transaction rejection error:', dbErr);
      }
    }

    // 4. Update local state
    setWithdrawalRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'REJECTED', rejectedReason: reason, isRefunded: true, refundedAmount: finalAmountRefunded } : r))
    );

    setTransactions(prev =>
      prev.map(t =>
        t.notes?.includes(requestId) || t.id === requestId
          ? { ...t, status: 'REJECTED', notes: `Refunded to Withdrawable Balance. Reason: ${reason}` }
          : t
      )
    );
    setAllTransactions(prev =>
      prev.map(t =>
        t.notes?.includes(requestId) || t.id === requestId
          ? { ...t, status: 'REJECTED', notes: `Refunded to Withdrawable Balance. Reason: ${reason}` }
          : t
      )
    );

    // 5. Update user balance ONLY if finalRefunded is true (exact-once)
    if (finalRefunded && finalAmountRefunded > 0) {
      const currentActivePhone = (userPhone || '').replace(/\D/g, '');
      const isCurrentSessionUser =
        (targetPhone && targetPhone === currentActivePhone) ||
        (targetUid && targetUid === userId) ||
        (!targetPhone && !targetUid);

      if (isCurrentSessionUser) {
        setWithdrawableBalance(prev => {
          const nextBal = finalNewBalance !== null ? finalNewBalance : prev + finalAmountRefunded;
          localStorage.setItem('wzp_v5_withdrawable_bal', nextBal.toString());
          return nextBal;
        });
      }

      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = targetPhone && u.userPhone?.replace(/\D/g, '') === targetPhone;
          const matchUid = targetUid && u.userId === targetUid;
          if (matchPhone || matchUid) {
            const nextBal = finalNewBalance !== null ? finalNewBalance : (u.withdrawableBalance || 0) + finalAmountRefunded;
            return {
              ...u,
              withdrawableBalance: nextBal,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        })
      );

      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'Withdrawal Rejected & Refunded',
          message: `Rs. ${finalAmountRefunded.toLocaleString('en-PK')} has been refunded to your Withdrawable balance. Reason: ${reason}`,
          type: 'SYSTEM',
          read: false,
          timestamp: 'Just now',
        },
        ...prev,
      ]);
    } else {
      console.log(`[WinzoPay] Rejection processed without additional refund. (Rs. 0 refunded, request already rejected/refunded).`);
    }

    return {
      success: true,
      refunded: finalRefunded,
      amountRefunded: finalAmountRefunded,
    };
  };

  const adjustUserBalance = (amount: number, isAdd: boolean, note: string, balanceType: 'topUp' | 'withdrawable' = 'topUp') => {
    if (balanceType === 'withdrawable') {
      const updatedBal = isAdd ? withdrawableBalance + amount : Math.max(0, withdrawableBalance - amount);
      setWithdrawableBalance(updatedBal);
      localStorage.setItem('wzp_v5_withdrawable_bal', updatedBal.toString());

      setAllUsers(prev =>
        prev.map(u => {
          const isMe = u.userId === userId || (userPhone && u.userPhone === userPhone.replace(/\D/g, ''));
          return isMe ? { ...u, withdrawableBalance: updatedBal, updatedAt: new Date().toISOString() } : u;
        })
      );

      addTransaction({
        type: 'ADJUSTMENT',
        amount: isAdd ? amount : -amount,
        status: 'SUCCESS',
        title: isAdd ? 'Admin Withdrawable Credit' : 'Admin Withdrawable Debit',
        notes: note || 'Manual administrative adjustment',
      });

      const activePhone = (userPhone || '').replace(/\D/g, '');
      if (activePhone) {
        setDoc(doc(db, 'users', activePhone), {
          withdrawableBalance: updatedBal,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(console.warn);
      }
      if (userId) {
        setDoc(doc(db, 'users', userId), {
          withdrawableBalance: updatedBal,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(console.warn);
      }
      return;
    }

    const updatedBal = isAdd ? topUpBalance + amount : Math.max(0, topUpBalance - amount);
    setTopUpBalance(updatedBal);
    setAvailableBalance(updatedBal);
    localStorage.setItem('wzp_v5_topup_bal', updatedBal.toString());
    localStorage.setItem('wzp_v5_avail_bal', updatedBal.toString());

    setAllUsers(prev =>
      prev.map(u => {
        const isMe = u.userId === userId || (userPhone && u.userPhone === userPhone.replace(/\D/g, ''));
        return isMe ? { ...u, topUpBalance: updatedBal, availableBalance: updatedBal, updatedAt: new Date().toISOString() } : u;
      })
    );

    addTransaction({
      type: 'ADJUSTMENT',
      amount: isAdd ? amount : -amount,
      status: 'SUCCESS',
      title: isAdd ? 'Admin Top-Up Credit' : 'Admin Top-Up Debit',
      notes: note || 'Manual administrative adjustment',
    });

    const activePhone = (userPhone || '').replace(/\D/g, '');
    if (activePhone) {
      setDoc(doc(db, 'users', activePhone), {
        topUpBalance: updatedBal,
        availableBalance: updatedBal,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(console.warn);
    }
    if (userId) {
      setDoc(doc(db, 'users', userId), {
        topUpBalance: updatedBal,
        availableBalance: updatedBal,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(console.warn);
    }
  };

  const adjustSpecificUserBalance = async (
    targetPhoneOrUid: string,
    amount: number,
    isAddition: boolean,
    note: string,
    balanceType: 'topUp' | 'withdrawable' = 'topUp'
  ): Promise<void> => {
    const cleanPhone = targetPhoneOrUid.replace(/\D/g, '');
    const targetUser = allUsers.find(
      u => u.userId === targetPhoneOrUid || (cleanPhone && u.userPhone === cleanPhone)
    );

    if (balanceType === 'withdrawable') {
      const currentBal = targetUser
        ? (targetUser.withdrawableBalance ?? 0)
        : (targetPhoneOrUid === userId || cleanPhone === (userPhone || '').replace(/\D/g, '') ? withdrawableBalance : 0);
      const updatedBal = isAddition ? currentBal + amount : Math.max(0, currentBal - amount);

      if (targetPhoneOrUid === userId || (cleanPhone && cleanPhone === (userPhone || '').replace(/\D/g, ''))) {
        setWithdrawableBalance(updatedBal);
        localStorage.setItem('wzp_v5_withdrawable_bal', updatedBal.toString());
      }

      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = cleanPhone && u.userPhone === cleanPhone;
          const matchUid = (targetUser?.userId && u.userId === targetUser.userId) || u.userId === targetPhoneOrUid;
          if (matchPhone || matchUid) {
            return { ...u, withdrawableBalance: updatedBal, updatedAt: new Date().toISOString() };
          }
          return u;
        })
      );

      try {
        if (cleanPhone && cleanPhone.length >= 10) {
          await setDoc(doc(db, 'users', cleanPhone), {
            withdrawableBalance: updatedBal,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        if (targetUser?.userId || targetPhoneOrUid) {
          await setDoc(doc(db, 'users', targetUser?.userId || targetPhoneOrUid), {
            withdrawableBalance: updatedBal,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Firestore adjust user withdrawable balance error:', err);
      }

      addTransaction({
        type: 'ADJUSTMENT',
        amount: isAddition ? amount : -amount,
        status: 'SUCCESS',
        title: isAddition ? `Admin Withdrawable Credit to ${targetUser?.userName || targetPhoneOrUid}` : `Admin Withdrawable Debit from ${targetUser?.userName || targetPhoneOrUid}`,
        notes: `${note || 'Manual administrative balance adjustment'} [User: ${targetUser?.userName || targetPhoneOrUid}]`,
      });
      return;
    }

    const currentBal = targetUser
      ? (targetUser.topUpBalance ?? targetUser.availableBalance ?? 0)
      : (targetPhoneOrUid === userId || cleanPhone === (userPhone || '').replace(/\D/g, '') ? topUpBalance : 0);
    const updatedBal = isAddition ? currentBal + amount : Math.max(0, currentBal - amount);

    // If currently logged in user is the target, update active state immediately
    if (targetPhoneOrUid === userId || (cleanPhone && cleanPhone === (userPhone || '').replace(/\D/g, ''))) {
      setTopUpBalance(updatedBal);
      setAvailableBalance(updatedBal);
      localStorage.setItem('wzp_v5_topup_bal', updatedBal.toString());
      localStorage.setItem('wzp_v5_avail_bal', updatedBal.toString());
    }

    setAllUsers(prev =>
      prev.map(u => {
        const matchPhone = cleanPhone && u.userPhone === cleanPhone;
        const matchUid = (targetUser?.userId && u.userId === targetUser.userId) || u.userId === targetPhoneOrUid;
        if (matchPhone || matchUid) {
          return { ...u, topUpBalance: updatedBal, availableBalance: updatedBal, updatedAt: new Date().toISOString() };
        }
        return u;
      })
    );

    // Persist to Firestore database
    try {
      if (cleanPhone && cleanPhone.length >= 10) {
        await setDoc(doc(db, 'users', cleanPhone), {
          topUpBalance: updatedBal,
          availableBalance: updatedBal,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      if (targetUser?.userId || targetPhoneOrUid) {
        await setDoc(doc(db, 'users', targetUser?.userId || targetPhoneOrUid), {
          topUpBalance: updatedBal,
          availableBalance: updatedBal,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore adjust user balance error:', err);
    }

    addTransaction({
      type: 'ADJUSTMENT',
      amount: isAddition ? amount : -amount,
      status: 'SUCCESS',
      title: isAddition ? `Admin Top-Up Credit to ${targetUser?.userName || targetPhoneOrUid}` : `Admin Top-Up Debit from ${targetUser?.userName || targetPhoneOrUid}`,
      notes: `${note || 'Manual administrative balance adjustment'} [User: ${targetUser?.userName || targetPhoneOrUid}]`,
    });
  };

  const cleanEntireDatabase = async (): Promise<{ success: boolean; message: string }> => {
    const collectionsToWipe = [
      'users',
      'deposits',
      'withdrawals',
      'transactions',
      'user_plans',
      'bank_accounts',
      'customer_service_messages',
      'notifications',
      'rewards',
      'chats',
      'support_chats',
      'messages',
      'config'
    ];

    try {
      for (const colName of collectionsToWipe) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }

      // Reset client state in memory
      setAllUsers([]);
      setDepositRequests([]);
      setWithdrawalRequests([]);
      setTransactions([]);
      setAllTransactions([]);
      setUserPlans([]);
      setBankAccounts([]);
      setTopUpBalance(0);
      setWithdrawableBalance(0);
      setAvailableBalance(0);
      setTodayCommission(0);
      setUserName('');
      setUserPhone('');
      setUserEmailState('');
      setUserId('');
      setIsLoggedIn(false);

      // Clear local storage keys
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'wzp_v5_user_name',
          'wzp_v5_user_phone',
          'wzp_v5_user_email',
          'wzp_v5_user_id',
          'wzp_v5_user_pass',
          'wzp_v5_topup_bal',
          'wzp_v5_avail_bal',
          'wzp_v5_withdrawable_bal',
          'wzp_v5_banks',
          'wzp_v5_is_logged_in',
          'wzp_v5_txs',
          'wzp_v5_deps',
          'wzp_v5_wths',
          'wzp_v5_plans',
          'wzp_plans_stored',
          'wzp_plans_cache',
          'wzp_v5_cached_users',
          'wzp_v7_clean'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }

      return { success: true, message: 'Database and local cache have been completely cleaned.' };
    } catch (err: any) {
      console.error('cleanEntireDatabase error:', err);
      return { success: false, message: err?.message || 'Error occurred while cleaning the database.' };
    }
  };

  const deleteUser = async (targetPhoneOrUid: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanPhone = targetPhoneOrUid.replace(/\D/g, '');
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      const batch = writeBatch(db);
      let deleted = 0;
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const docPhone = (data.userPhone || data.phone || '').toString().replace(/\D/g, '');
        const docUid = (data.userId || docSnap.id || '').toString();
        if (
          docSnap.id === targetPhoneOrUid ||
          docSnap.id === cleanPhone ||
          docUid === targetPhoneOrUid ||
          (cleanPhone && docPhone === cleanPhone)
        ) {
          batch.delete(docSnap.ref);
          deleted++;
        }
      });
      if (deleted > 0) {
        await batch.commit();
      }
      setAllUsers(prev => prev.filter(u => u.userId !== targetPhoneOrUid && u.userPhone !== cleanPhone));

      // If the currently active user was deleted, immediately reset session and bank storage
      const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
      if (
        (cleanPhone && activeCleanPhone === cleanPhone) ||
        targetPhoneOrUid === userId ||
        targetPhoneOrUid === userPhone
      ) {
        logout();
      }

      return { success: true, message: 'User account removed from database successfully.' };
    } catch (err: any) {
      console.error('deleteUser error:', err);
      return { success: false, message: err?.message || 'Failed to delete user.' };
    }
  };

  const adminUpdateUserBankDetails = async (
    targetPhoneOrUid: string,
    bankData: {
      id?: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      upiId?: string;
      isPrimary?: boolean;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = targetPhoneOrUid.replace(/\D/g, '');
    const targetUser = allUsers.find(
      u => u.userId === targetPhoneOrUid || (cleanPhone && u.userPhone === cleanPhone)
    );

    const targetUid = targetUser?.userId || (!cleanPhone ? targetPhoneOrUid : `WZP-${cleanPhone.slice(-6)}`);
    const targetCleanPhone = targetUser?.userPhone || cleanPhone;

    const currentBanks: BankAccount[] = (targetUser?.bankAccounts && targetUser.bankAccounts.length > 0)
      ? [...targetUser.bankAccounts]
      : (targetUser?.accountNumber && targetUser?.bankName && targetUser.bankName !== 'No Bank Linked' ? [{
          id: `bank-orig-${targetUser.userId}`,
          bankName: targetUser.bankName,
          accountNumber: targetUser.accountNumber,
          ifscCode: targetUser.ifscCode || '',
          accountHolderName: targetUser.accountHolderName || targetUser.userName,
          upiId: targetUser.upiId || '',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }] : []);

    const bankId = bankData.id || `bank-${Date.now()}`;
    const shouldBePrimary = bankData.isPrimary ?? (currentBanks.length === 0);

    const targetBankObj: BankAccount = {
      id: bankId,
      bankName: bankData.bankName.trim(),
      accountNumber: bankData.accountNumber.trim(),
      ifscCode: bankData.ifscCode.trim().toUpperCase(),
      accountHolderName: bankData.accountHolderName.trim() || targetUser?.userName || 'Account Holder',
      upiId: bankData.upiId ? bankData.upiId.trim() : '',
      isPrimary: shouldBePrimary,
      createdAt: new Date().toISOString(),
    };

    let updatedBanks: BankAccount[];
    const existingIndex = currentBanks.findIndex(b => (bankData.id && b.id === bankData.id) || b.accountNumber === targetBankObj.accountNumber);

    if (existingIndex >= 0) {
      updatedBanks = currentBanks.map((b, idx) => {
        if (idx === existingIndex) {
          return { ...b, ...targetBankObj };
        }
        return shouldBePrimary ? { ...b, isPrimary: false } : b;
      });
    } else {
      updatedBanks = shouldBePrimary
        ? [targetBankObj, ...currentBanks.map(b => ({ ...b, isPrimary: false }))]
        : [...currentBanks, targetBankObj];
    }

    if (!updatedBanks.some(b => b.isPrimary) && updatedBanks.length > 0) {
      updatedBanks[0].isPrimary = true;
    }

    const primary = updatedBanks.find(b => b.isPrimary) || updatedBanks[0] || targetBankObj;

    const bankPayload = sanitizeFirestorePayload({
      bankAccounts: updatedBanks,
      bankName: primary.bankName,
      accountNumber: primary.accountNumber,
      ifscCode: primary.ifscCode,
      accountHolderName: primary.accountHolderName,
      upiId: primary.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (targetCleanPhone) {
        await setDoc(doc(db, 'users', targetCleanPhone), bankPayload, { merge: true });
      }
      if (targetUid && targetUid !== targetCleanPhone) {
        await setDoc(doc(db, 'users', targetUid), bankPayload, { merge: true });
      }

      // If active user matches
      const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
      if (
        (targetCleanPhone && activeCleanPhone === targetCleanPhone) ||
        targetUid === userId ||
        targetPhoneOrUid === userId
      ) {
        setBankAccounts(updatedBanks);
        localStorage.setItem('wzp_v5_banks', JSON.stringify(updatedBanks));
      }

      // Update in allUsers state
      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = targetCleanPhone && u.userPhone === targetCleanPhone;
          const matchUid = u.userId === targetUid || u.userId === targetPhoneOrUid;
          if (matchPhone || matchUid) {
            return {
              ...u,
              bankAccounts: updatedBanks,
              bankName: primary.bankName,
              accountNumber: primary.accountNumber,
              ifscCode: primary.ifscCode,
              accountHolderName: primary.accountHolderName,
              upiId: primary.upiId || '',
              updatedAt: new Date().toISOString(),
            };
          }
          return u;
        })
      );

      return { success: true, message: `Bank account saved successfully (${updatedBanks.length} total linked).` };
    } catch (err: any) {
      console.error('adminUpdateUserBankDetails error:', err);
      return { success: false, message: err?.message || 'Failed to save bank account in database.' };
    }
  };

  const adminDeleteUserBank = async (
    targetPhoneOrUid: string,
    bankIdOrAccountNumber: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = targetPhoneOrUid.replace(/\D/g, '');
    const targetUser = allUsers.find(
      u => u.userId === targetPhoneOrUid || (cleanPhone && u.userPhone === cleanPhone)
    );

    const targetUid = targetUser?.userId || (!cleanPhone ? targetPhoneOrUid : `WZP-${cleanPhone.slice(-6)}`);
    const targetCleanPhone = targetUser?.userPhone || cleanPhone;

    const currentBanks: BankAccount[] = (targetUser?.bankAccounts && targetUser.bankAccounts.length > 0)
      ? [...targetUser.bankAccounts]
      : [];

    const updatedBanks = currentBanks.filter(
      b => b.id !== bankIdOrAccountNumber && b.accountNumber !== bankIdOrAccountNumber
    );

    if (updatedBanks.length > 0 && !updatedBanks.some(b => b.isPrimary)) {
      updatedBanks[0].isPrimary = true;
    }

    const primary = updatedBanks.find(b => b.isPrimary) || updatedBanks[0];

    const bankPayload = sanitizeFirestorePayload({
      bankAccounts: updatedBanks,
      bankName: primary?.bankName || 'No Bank Linked',
      accountNumber: primary?.accountNumber || '',
      ifscCode: primary?.ifscCode || '',
      accountHolderName: primary?.accountHolderName || '',
      upiId: primary?.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (targetCleanPhone) {
        await setDoc(doc(db, 'users', targetCleanPhone), bankPayload, { merge: true });
      }
      if (targetUid && targetUid !== targetCleanPhone) {
        await setDoc(doc(db, 'users', targetUid), bankPayload, { merge: true });
      }

      const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
      if (
        (targetCleanPhone && activeCleanPhone === targetCleanPhone) ||
        targetUid === userId ||
        targetPhoneOrUid === userId
      ) {
        setBankAccounts(updatedBanks);
        localStorage.setItem('wzp_v5_banks', JSON.stringify(updatedBanks));
      }

      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = targetCleanPhone && u.userPhone === targetCleanPhone;
          const matchUid = u.userId === targetUid || u.userId === targetPhoneOrUid;
          if (matchPhone || matchUid) {
            return {
              ...u,
              bankAccounts: updatedBanks,
              bankName: primary?.bankName || 'No Bank Linked',
              accountNumber: primary?.accountNumber || '',
              ifscCode: primary?.ifscCode || '',
              accountHolderName: primary?.accountHolderName || '',
              upiId: primary?.upiId || '',
              updatedAt: new Date().toISOString(),
            };
          }
          return u;
        })
      );

      return { success: true, message: 'Bank account removed successfully.' };
    } catch (err: any) {
      console.error('adminDeleteUserBank error:', err);
      return { success: false, message: err?.message || 'Failed to remove bank account.' };
    }
  };

  const adminSetPrimaryUserBank = async (
    targetPhoneOrUid: string,
    bankIdOrAccountNumber: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = targetPhoneOrUid.replace(/\D/g, '');
    const targetUser = allUsers.find(
      u => u.userId === targetPhoneOrUid || (cleanPhone && u.userPhone === cleanPhone)
    );

    const targetUid = targetUser?.userId || (!cleanPhone ? targetPhoneOrUid : `WZP-${cleanPhone.slice(-6)}`);
    const targetCleanPhone = targetUser?.userPhone || cleanPhone;

    const currentBanks: BankAccount[] = (targetUser?.bankAccounts && targetUser.bankAccounts.length > 0)
      ? [...targetUser.bankAccounts]
      : [];

    const updatedBanks = currentBanks.map(b => ({
      ...b,
      isPrimary: b.id === bankIdOrAccountNumber || b.accountNumber === bankIdOrAccountNumber,
    }));

    const primary = updatedBanks.find(b => b.isPrimary) || updatedBanks[0];

    const bankPayload = sanitizeFirestorePayload({
      bankAccounts: updatedBanks,
      bankName: primary?.bankName || '',
      accountNumber: primary?.accountNumber || '',
      ifscCode: primary?.ifscCode || '',
      accountHolderName: primary?.accountHolderName || '',
      upiId: primary?.upiId || '',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (targetCleanPhone) {
        await setDoc(doc(db, 'users', targetCleanPhone), bankPayload, { merge: true });
      }
      if (targetUid && targetUid !== targetCleanPhone) {
        await setDoc(doc(db, 'users', targetUid), bankPayload, { merge: true });
      }

      const activeCleanPhone = (userPhone || '').replace(/\D/g, '');
      if (
        (targetCleanPhone && activeCleanPhone === targetCleanPhone) ||
        targetUid === userId ||
        targetPhoneOrUid === userId
      ) {
        setBankAccounts(updatedBanks);
        localStorage.setItem('wzp_v5_banks', JSON.stringify(updatedBanks));
      }

      setAllUsers(prev =>
        prev.map(u => {
          const matchPhone = targetCleanPhone && u.userPhone === targetCleanPhone;
          const matchUid = u.userId === targetUid || u.userId === targetPhoneOrUid;
          if (matchPhone || matchUid) {
            return {
              ...u,
              bankAccounts: updatedBanks,
              bankName: primary?.bankName || '',
              accountNumber: primary?.accountNumber || '',
              ifscCode: primary?.ifscCode || '',
              accountHolderName: primary?.accountHolderName || '',
              upiId: primary?.upiId || '',
              updatedAt: new Date().toISOString(),
            };
          }
          return u;
        })
      );

      return { success: true, message: 'Primary bank set successfully.' };
    } catch (err: any) {
      console.error('adminSetPrimaryUserBank error:', err);
      return { success: false, message: err?.message || 'Failed to update primary bank.' };
    }
  };

  const wipeAllUsers = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      setAllUsers([]);
      // Reset active session and bank storage
      logout();
      return { success: true, message: 'All user records in the users table have been wiped.' };
    } catch (err: any) {
      console.error('wipeAllUsers error:', err);
      return { success: false, message: err?.message || 'Failed to wipe user table.' };
    }
  };

  const signUp = async (
    name: string,
    phone: string,
    password?: string,
    email?: string,
    referralCodeInput?: string
  ): Promise<{ success: boolean; message?: string }> => {
    // Normalize mobile number (handles +92, 92, 0, and spaces)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && (cleanPhone.startsWith('92') || cleanPhone.startsWith('91'))) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.replace(/^0+/, '');
    }
    const standardPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    if (standardPhone.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!name.trim()) {
      return { success: false, message: 'Please enter your full name as per bank records.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const assignedEmail = email?.trim() || `${standardPhone}@user.winzopay.com`;

    try {
      // Validate referral code if provided (or auto-picked from incoming referral link)
      const targetRefCode = (referralCodeInput && referralCodeInput.trim()) ? referralCodeInput.trim() : incomingReferralCode.trim();
      let finalReferredBy = '';
      let finalReferrerName = '';
      if (targetRefCode) {
        const valResult = validateReferralCode(targetRefCode);
        if (!valResult.valid) {
          return {
            success: false,
            message: valResult.message || 'Invalid referral code provided.'
          };
        }
        if (valResult.user) {
          finalReferredBy = valResult.user.userId || valResult.user.referralCode || `WZP-${valResult.user.userPhone.slice(-6)}`;
          finalReferrerName = valResult.user.userName || 'Winzo Trader';
        }
      }

      // Check if account already exists in database under any key format
      let accountExists = false;
      try {
        const snapDirect = await getDoc(doc(db, 'users', standardPhone));
        if (snapDirect.exists()) accountExists = true;
        if (!accountExists) {
          const snapPlus = await getDoc(doc(db, 'users', `+92${standardPhone}`));
          if (snapPlus.exists()) accountExists = true;
        }
        if (!accountExists) {
          const snapZero = await getDoc(doc(db, 'users', `0${standardPhone}`));
          if (snapZero.exists()) accountExists = true;
        }
        if (!accountExists) {
          const snapUid = await getDoc(doc(db, 'users', `WZP-${standardPhone.slice(-6)}`));
          if (snapUid.exists()) accountExists = true;
        }
      } catch (checkErr) {
        console.warn('Firestore user exists check note:', checkErr);
      }

      if (!accountExists && allUsers && allUsers.length > 0) {
        const cached = allUsers.some(u => {
          const p = (u.userPhone || u.phone || '').toString().replace(/\D/g, '');
          return p === standardPhone || (p.length >= 10 && p.slice(-10) === standardPhone);
        });
        if (cached) accountExists = true;
      }

      if (accountExists) {
        return {
          success: false,
          message: `An account with mobile number +92 ${standardPhone} already exists. Please sign in instead.`,
        };
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://winzopay-website.onrender.com';
      const newUid = `WZP-${standardPhone.slice(-6)}`;
      const myReferralCode = newUid;
      const myJoinedViaCode = finalReferredBy;
      const myJoinedViaLink = finalReferredBy ? `${origin}/signup?ref=${encodeURIComponent(finalReferredBy)}` : '';
      const initialBanks: BankAccount[] = [];

      const userData = {
        userId: newUid,
        userName: name.trim(),
        userPhone: standardPhone,
        rawPhone: standardPhone,
        fullPhone: `+92${standardPhone}`,
        fullPhoneNumber: `92${standardPhone}`,
        countryCode: '+92',
        country: 'PAKISTAN',
        email: assignedEmail,
        password: password,
        topUpBalance: 0.00,
        availableBalance: 0.00,
        withdrawableBalance: 0.00,
        todayCommission: 0.00,
        rpMiningBalance: 0.00,
        activeMiningInvested: 0.00,
        pendingWithdrawal: 0.00,
        bankAccounts: initialBanks,
        bankName: 'No Bank Linked',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: name.trim(),
        upiId: '',
        vipLevel: 1,
        referralCode: myReferralCode,
        referredBy: finalReferredBy,
        referrerName: finalReferrerName,
        joinedViaReferralCode: myJoinedViaCode,
        joinedViaReferralLink: myJoinedViaLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in Firestore across all keys
      let writeSucceeded = false;
      try {
        await Promise.all([
          setDoc(doc(db, 'users', standardPhone), userData),
          setDoc(doc(db, 'users', `+92${standardPhone}`), userData, { merge: true }),
          setDoc(doc(db, 'users', newUid), userData, { merge: true }),
        ]);
        writeSucceeded = true;
      } catch (dbErr: any) {
        console.warn('Direct Firestore registration error, trying server proxy endpoint:', dbErr);
        try {
          const resp = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: name.trim(),
              phone: standardPhone,
              password,
              email: assignedEmail,
              referralCode: targetRefCode,
            }),
          });
          const json = await resp.json();
          if (json.success) {
            writeSucceeded = true;
          } else {
            return { success: false, message: json.message || 'Registration failed.' };
          }
        } catch (proxyErr: any) {
          console.error('Server proxy registration error:', proxyErr);
          return {
            success: false,
            message: dbErr?.message || 'Database connection error during account creation. Please try again.',
          };
        }
      }

      if (!writeSucceeded) {
        return { success: false, message: 'Could not store account in database. Please try again.' };
      }

      setUserName(name.trim());
      setUserPhone(standardPhone);
      setUserEmailState(assignedEmail);
      setUserId(newUid);
      setTopUpBalance(0.00);
      setWithdrawableBalance(0.00);
      setTodayCommission(0.00);
      setBankAccounts([]);
      setTransactions([]);
      setUserPlans([]);
      setReferralCode(myReferralCode);
      setReferredBy(finalReferredBy);
      setReferrerName(finalReferrerName);
      setJoinedViaReferralCode(myJoinedViaCode);
      setJoinedViaReferralLink(myJoinedViaLink);
      setIsLoggedIn(true);

      localStorage.setItem('wzp_v5_user_name', name.trim());
      localStorage.setItem('wzp_v5_user_phone', standardPhone);
      localStorage.setItem('wzp_v5_user_email', assignedEmail);
      localStorage.setItem('wzp_v5_user_id', newUid);
      localStorage.setItem('wzp_v5_ref_code', myReferralCode);
      localStorage.setItem('wzp_v5_referred_by', finalReferredBy);
      localStorage.setItem('wzp_v5_referrer_name', finalReferrerName);
      localStorage.setItem('wzp_v5_joined_ref_code', myJoinedViaCode);
      localStorage.setItem('wzp_v5_joined_ref_link', myJoinedViaLink);
      localStorage.setItem('wzp_v5_topup_bal', '0.00');
      localStorage.setItem('wzp_v5_avail_bal', '0.00');
      localStorage.setItem('wzp_v5_withdrawable_bal', '0.00');
      localStorage.setItem('wzp_v5_comm_bal', '0.00');
      localStorage.setItem('wzp_v5_banks', JSON.stringify([]));
      localStorage.setItem('wzp_v7_txs', JSON.stringify([]));
      localStorage.setItem('wzp_v8_user_plans', JSON.stringify([]));
      localStorage.setItem('wzp_v5_is_logged_in', 'true');
      localStorage.setItem('wzp_v5_user_pass', password);

      // Add welcome notification
      const welcomeNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Welcome to WinzoPay!',
        message: `Account created for ${name.trim()} (${newUid}). Add your bank details in Manage Bank to get started.`,
        type: 'SYSTEM',
        read: false,
        timestamp: 'Just now',
      };
      setNotifications(prev => [welcomeNotif, ...prev]);

      return { success: true };
    } catch (e: any) {
      console.error('Database signup error:', e);
      return {
        success: false,
        message: e?.message || 'Database connection error during account creation. Please try again.',
      };
    }
  };

  const login = async (phone: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    // Normalize mobile number
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && (cleanPhone.startsWith('92') || cleanPhone.startsWith('91'))) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.replace(/^0+/, '');
    }
    const standardPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    if (standardPhone.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your account password.' };
    }

    try {
      let userData: any = null;
      const fallbackUid = `WZP-${standardPhone.slice(-6)}`;

      // 1. Direct Firestore lookups across all key patterns
      try {
        const snapDirect = await getDoc(doc(db, 'users', standardPhone));
        if (snapDirect.exists()) {
          userData = snapDirect.data();
        }

        if (!userData) {
          const snapPlus = await getDoc(doc(db, 'users', `+92${standardPhone}`));
          if (snapPlus.exists()) {
            userData = snapPlus.data();
          }
        }

        if (!userData) {
          const snap92 = await getDoc(doc(db, 'users', `92${standardPhone}`));
          if (snap92.exists()) {
            userData = snap92.data();
          }
        }

        if (!userData) {
          const snapZero = await getDoc(doc(db, 'users', `0${standardPhone}`));
          if (snapZero.exists()) {
            userData = snapZero.data();
          }
        }

        if (!userData) {
          const snapUid = await getDoc(doc(db, 'users', fallbackUid));
          if (snapUid.exists()) {
            userData = snapUid.data();
          }
        }
      } catch (directErr) {
        console.warn('Direct Firestore login check note:', directErr);
      }

      // 2. Cross-check allUsers state cache
      if (!userData && allUsers && allUsers.length > 0) {
        const userInAll = allUsers.find(u => {
          const raw = (u.userPhone || u.phone || '').toString().replace(/\D/g, '');
          return (
            raw === standardPhone ||
            (raw.length >= 10 && raw.slice(-10) === standardPhone) ||
            u.userId === fallbackUid
          );
        });
        if (userInAll) {
          userData = userInAll;
        }
      }

      // 3. Server Proxy Fallback (ultra-reliable backend verification)
      if (!userData) {
        try {
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: standardPhone, password }),
          });
          const json = await resp.json();
          if (json.success && json.user) {
            userData = json.user;
          } else if (!json.success && resp.status === 401) {
            return {
              success: false,
              message: json.message || 'Incorrect password entered. Please check your credentials.',
            };
          }
        } catch (serverLoginErr) {
          console.warn('Server login proxy note:', serverLoginErr);
        }
      }

      if (!userData) {
        return {
          success: false,
          message: `No account found with mobile number +92 ${standardPhone}. Please register a new account.`,
        };
      }

      // Authenticate password
      if (userData.password && userData.password !== password) {
        return {
          success: false,
          message: 'Incorrect password entered. Please check your credentials or reset your password.',
        };
      }

      // If user had no password saved in legacy doc, update it
      if (!userData.password && password) {
        try {
          await setDoc(doc(db, 'users', standardPhone), { password }, { merge: true });
        } catch {}
      }

      const loadedName = userData.userName || 'User';
      const loadedUid = userData.userId || fallbackUid;

      // Extract balances with fallbacks
      let loadedTopUp = typeof userData.topUpBalance === 'number'
        ? userData.topUpBalance
        : typeof userData.availableBalance === 'number'
        ? userData.availableBalance
        : 0.00;
      let loadedWithdrawable = typeof userData.withdrawableBalance === 'number' ? userData.withdrawableBalance : 0.00;
      let loadedComm = typeof userData.todayCommission === 'number' ? userData.todayCommission : 0.00;

      // Cross-check allUsers state cache to ensure maximum accuracy
      const userInAll = allUsers.find(u => {
        const raw = (u.userPhone || u.phone || '').toString().replace(/\D/g, '');
        return raw === standardPhone || u.userId === loadedUid;
      });
      if (userInAll) {
        const allTopUp = userInAll.topUpBalance ?? userInAll.availableBalance ?? 0;
        if (allTopUp > loadedTopUp) loadedTopUp = allTopUp;
        if ((userInAll.withdrawableBalance || 0) > loadedWithdrawable) loadedWithdrawable = userInAll.withdrawableBalance || 0;
      }

      // Robust Bank Accounts Retrieval: ONLY from database doc
      let loadedBanks: BankAccount[] = [];
      if (Array.isArray(userData.bankAccounts) && userData.bankAccounts.length > 0) {
        loadedBanks = userData.bankAccounts;
      } else if (userData.accountNumber && userData.bankName && userData.bankName !== 'No Bank Linked') {
        loadedBanks = [{
          id: `bank-${Date.now()}`,
          bankName: userData.bankName,
          accountHolderName: userData.accountHolderName || loadedName,
          accountNumber: userData.accountNumber,
          ifscCode: userData.ifscCode || '',
          upiId: userData.upiId,
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }];
      } else {
        try {
          const uidDoc = await getDoc(doc(db, 'users', loadedUid));
          if (uidDoc.exists()) {
            const uidData = uidDoc.data();
            if (Array.isArray(uidData.bankAccounts) && uidData.bankAccounts.length > 0) {
              loadedBanks = uidData.bankAccounts;
            } else if (uidData.accountNumber && uidData.bankName && uidData.bankName !== 'No Bank Linked') {
              loadedBanks = [{
                id: `bank-${Date.now()}`,
                bankName: uidData.bankName,
                accountHolderName: uidData.accountHolderName || loadedName,
                accountNumber: uidData.accountNumber,
                ifscCode: uidData.ifscCode || '',
                upiId: uidData.upiId,
                isPrimary: true,
                createdAt: new Date().toISOString(),
              }];
            }
          }
        } catch {}
      }

      const primaryBank = loadedBanks.find(b => b.isPrimary) || loadedBanks[0];
      const loadedRefCode = userData.referralCode || fallbackUid;
      const loadedReferredBy = userData.referredBy || '';
      const loadedReferrerName = userData.referrerName || '';
      const loadedJoinedCode = userData.joinedViaReferralCode || loadedReferredBy;
      const loadedJoinedLink = userData.joinedViaReferralLink || (loadedJoinedCode ? `https://winzopay-website.onrender.com/signup?ref=${encodeURIComponent(loadedJoinedCode)}` : '');

      setUserName(loadedName);
      setUserPhone(standardPhone);
      setUserEmailState(userData.email || `${standardPhone}@user.winzopay.com`);
      setUserId(loadedUid);
      setReferralCode(loadedRefCode);
      setReferredBy(loadedReferredBy);
      setReferrerName(loadedReferrerName);
      setJoinedViaReferralCode(loadedJoinedCode);
      setJoinedViaReferralLink(loadedJoinedLink);
      setTopUpBalance(loadedTopUp);
      setWithdrawableBalance(loadedWithdrawable);
      setTodayCommission(loadedComm);
      setBankAccounts(loadedBanks);

      // Restore USDT wallets
      let loadedUsdt: UsdtWallet[] = [];
      if (Array.isArray(userData.usdtWallets) && userData.usdtWallets.length > 0) {
        loadedUsdt = userData.usdtWallets;
      } else if (userData.usdtAddress) {
        loadedUsdt = [{
          id: `usdt-${Date.now()}`,
          address: userData.usdtAddress,
          network: (userData.usdtNetwork as any) || 'TRC20',
          label: 'Primary USDT Wallet',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }];
      }
      setUsdtWallets(loadedUsdt);
      localStorage.setItem('wzp_v5_usdt_wallets', JSON.stringify(loadedUsdt));

      setIsLoggedIn(true);

      // Immediately filter and update transactions strictly for this user
      if (allPlatformTxsRef.current.length > 0) {
        const userOnly = allPlatformTxsRef.current.filter(t => checkBelongsToUser(t, loadedUid, standardPhone));
        setTransactions(userOnly);
        localStorage.setItem('wzp_v7_txs', JSON.stringify(userOnly));
      }

      localStorage.setItem('wzp_v5_user_name', loadedName);
      localStorage.setItem('wzp_v5_user_phone', standardPhone);
      localStorage.setItem('wzp_v5_user_email', userData.email || `${standardPhone}@user.winzopay.com`);
      localStorage.setItem('wzp_v5_user_id', loadedUid);
      localStorage.setItem('wzp_v5_ref_code', loadedRefCode);
      localStorage.setItem('wzp_v5_referred_by', loadedReferredBy);
      localStorage.setItem('wzp_v5_referrer_name', loadedReferrerName);
      localStorage.setItem('wzp_v5_joined_ref_code', loadedJoinedCode);
      localStorage.setItem('wzp_v5_joined_ref_link', loadedJoinedLink);
      localStorage.setItem('wzp_v5_topup_bal', loadedTopUp.toString());
      localStorage.setItem('wzp_v5_avail_bal', loadedTopUp.toString());
      localStorage.setItem('wzp_v5_withdrawable_bal', loadedWithdrawable.toString());
      localStorage.setItem('wzp_v5_comm_bal', loadedComm.toString());
      localStorage.setItem('wzp_v5_banks', JSON.stringify(loadedBanks));
      localStorage.setItem('wzp_v5_is_logged_in', 'true');
      localStorage.setItem('wzp_v5_user_pass', password);

      // Reconcile and unify both Firestore documents (standardPhone and loadedUid)
      try {
        const unifiedData = {
          userId: loadedUid,
          userName: loadedName,
          userPhone: standardPhone,
          rawPhone: standardPhone,
          fullPhone: `+92${standardPhone}`,
          referralCode: loadedRefCode,
          referredBy: loadedReferredBy,
          referrerName: loadedReferrerName,
          joinedViaReferralCode: loadedJoinedCode,
          joinedViaReferralLink: loadedJoinedLink,
          topUpBalance: loadedTopUp,
          availableBalance: loadedTopUp,
          withdrawableBalance: loadedWithdrawable,
          bankAccounts: loadedBanks,
          bankName: primaryBank?.bankName || 'No Bank Linked',
          accountNumber: primaryBank?.accountNumber || '',
          ifscCode: primaryBank?.ifscCode || '',
          accountHolderName: primaryBank?.accountHolderName || loadedName,
          upiId: primaryBank?.upiId || '',
          updatedAt: new Date().toISOString(),
        };
        setDoc(doc(db, 'users', standardPhone), unifiedData, { merge: true }).catch(console.warn);
        setDoc(doc(db, 'users', `+92${standardPhone}`), unifiedData, { merge: true }).catch(console.warn);
        setDoc(doc(db, 'users', loadedUid), unifiedData, { merge: true }).catch(console.warn);
      } catch (err) {
        console.warn('Login doc reconciliation error:', err);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Database login error:', e);
      return {
        success: false,
        message: e?.message || 'Database error verifying login. Please check connection.',
      };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId('');
    setUserName('');
    setUserPhone('');
    setUserEmailState('');
    setReferralCode('');
    setReferredBy('');
    setReferrerName('');
    setJoinedViaReferralCode('');
    setJoinedViaReferralLink('');
    setTopUpBalance(0);
    setWithdrawableBalance(0);
    setTodayCommission(0);
    setBankAccounts([]);
    setUsdtWallets([]);
    setTransactions([]);
    setUserPlans([]);
    if (typeof window !== 'undefined') {
      const userKeys = [
        'wzp_v5_is_logged_in',
        'wzp_v5_user_name',
        'wzp_v5_user_phone',
        'wzp_v5_user_email',
        'wzp_v5_user_id',
        'wzp_v5_ref_code',
        'wzp_v5_referred_by',
        'wzp_v5_referrer_name',
        'wzp_v5_joined_ref_code',
        'wzp_v5_joined_ref_link',
        'wzp_v5_user_pass',
        'wzp_v5_topup_bal',
        'wzp_v5_avail_bal',
        'wzp_v5_withdrawable_bal',
        'wzp_v5_comm_bal',
        'wzp_v5_banks',
        'wzp_v5_usdt_wallets',
        'wzp_v7_txs',
        'wzp_v8_user_plans'
      ];
      userKeys.forEach(k => localStorage.removeItem(k));
    }
  };

  const updateUserProfile = async (name: string, phone: string, email?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = phone.replace(/\D/g, '');
    setUserName(name);
    setUserPhone(cleanPhone);
    if (email) {
      setUserEmailState(email);
      localStorage.setItem('wzp_v5_user_email', email);
    }
    localStorage.setItem('wzp_v5_user_name', name);
    localStorage.setItem('wzp_v5_user_phone', cleanPhone);
    try {
      const updates: any = { userName: name, userPhone: cleanPhone, updatedAt: new Date().toISOString() };
      if (email) updates.email = email;
      if (cleanPhone) {
        await setDoc(doc(db, 'users', cleanPhone), updates, { merge: true });
      }
      if (userId) {
        await setDoc(doc(db, 'users', userId), updates, { merge: true });
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Profile update note:', e);
      return { success: false, message: e?.message };
    }
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    const activeKey = (userPhone || '').replace(/\D/g, '') || userId;
    if (!activeKey) {
      return { success: false, message: 'You must be logged in to change password.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    try {
      const userSnap = await getDoc(doc(db, 'users', activeKey));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.password && data.password !== currentPass) {
          return { success: false, message: 'Current password does not match.' };
        }
      }

      await updateDoc(doc(db, 'users', activeKey), {
        password: newPass,
        updatedAt: new Date().toISOString(),
      });

      localStorage.setItem('wzp_v5_user_pass', newPass);
      return { success: true };
    } catch (e: any) {
      console.error('Change password error:', e);
      return { success: false, message: e?.message || 'Failed to update password in database.' };
    }
  };

  const resetForgottenPassword = async (phone: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.replace(/^0+/, '');
    }
    const standardPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    if (standardPhone.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    try {
      const fallbackUid = `WZP-${standardPhone.slice(-6)}`;
      let foundUser = false;
      let targetUid = fallbackUid;

      // 1. Direct Firestore check
      try {
        const snap1 = await getDoc(doc(db, 'users', standardPhone));
        if (snap1.exists()) {
          foundUser = true;
          targetUid = snap1.data().userId || fallbackUid;
        } else {
          const snap2 = await getDoc(doc(db, 'users', `+92${standardPhone}`));
          if (snap2.exists()) {
            foundUser = true;
            targetUid = snap2.data().userId || fallbackUid;
          } else {
            const snapZero = await getDoc(doc(db, 'users', `0${standardPhone}`));
            if (snapZero.exists()) {
              foundUser = true;
              targetUid = snapZero.data().userId || fallbackUid;
            } else {
              const snap3 = await getDoc(doc(db, 'users', fallbackUid));
              if (snap3.exists()) {
                foundUser = true;
                targetUid = snap3.data().userId || fallbackUid;
              }
            }
          }
        }
      } catch (checkErr) {
        console.warn('Firestore password reset check note:', checkErr);
      }

      // 2. Direct Firestore update across keys
      let updateSucceeded = false;
      if (foundUser) {
        try {
          const updatePayload = { password: newPass, updatedAt: new Date().toISOString() };
          await Promise.all([
            setDoc(doc(db, 'users', standardPhone), updatePayload, { merge: true }),
            setDoc(doc(db, 'users', `+92${standardPhone}`), updatePayload, { merge: true }),
            setDoc(doc(db, 'users', targetUid), updatePayload, { merge: true }),
          ]);
          updateSucceeded = true;
        } catch (dbErr) {
          console.warn('Direct Firestore password update error, attempting server proxy:', dbErr);
        }
      }

      // 3. Server proxy fallback
      if (!updateSucceeded) {
        try {
          const resp = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: standardPhone, newPassword: newPass }),
          });
          const json = await resp.json();
          if (json.success) {
            updateSucceeded = true;
          } else {
            return { success: false, message: json.message || 'Failed to reset password.' };
          }
        } catch (serverErr) {
          console.error('Server reset password proxy error:', serverErr);
        }
      }

      if (!updateSucceeded) {
        return {
          success: false,
          message: `No account registered with mobile number +92 ${standardPhone}. Please check the number or register.`,
        };
      }

      localStorage.setItem('wzp_v5_user_pass', newPass);
      return { success: true, message: 'Your password has been successfully reset! You can now sign in.' };
    } catch (e: any) {
      console.error('Reset password error:', e);
      return { success: false, message: e?.message || 'Failed to reset password in database.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdminOpen,
        setIsAdminOpen,
        isDbConnected,
        isLoggedIn,
        isAuthModalOpen,
        setIsAuthModalOpen,
        userId,
        userName,
        userPhone,
        userEmail,
        setUserEmail,
        allUsers,
        signUp,
        login,
        logout,
        updateUserProfile,
        changePassword,
        resetForgottenPassword,
        referralCode,
        referredBy,
        referrerName,
        referralLink,
        joinedViaReferralCode,
        joinedViaReferralLink,
        incomingReferralCode,
        setIncomingReferralCode,
        incomingReferrerInfo,
        teamMembers,
        teamStats,
        allTeams,
        validateReferralCode,
        totalBalance,
        availableBalance,
        topUpBalance,
        withdrawableBalance,
        setWithdrawableBalance,
        pendingWithdrawal,
        activeMiningInvested,
        rpMiningBalance,
        todayCommission,
        rpBalance,
        vipLevel,
        userPlans,
        activeMiningPlans,
        completedPlans,
        soldPlans,
        totalMiningInvested,
        totalMiningProfits,
        buyRPPlan,
        fastForwardPlanMining,
        sellRPPlan,
        bankAccounts,
        addBankAccount,
        deleteBankAccount,
        setPrimaryBankAccount,
        getPrimaryBank,
        usdtWallets,
        addUsdtWallet,
        deleteUsdtWallet,
        setPrimaryUsdtWallet,
        getPrimaryUsdtWallet,
        transactions,
        allTransactions,
        addTransaction,
        checkBelongsToUser,
        depositRequests,
        submitDeposit,
        withdrawalRequests,
        submitWithdrawal,
        rewards,
        claimReward,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        chatMessages,
        sendSupportMessage,
        config,
        updateConfig,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
        adjustUserBalance,
        adjustSpecificUserBalance,
        adminUpdateUserBankDetails,
        adminDeleteUserBank,
        adminSetPrimaryUserBank,
        deleteUser,
        wipeAllUsers,
        cleanEntireDatabase,
        isManageBankOpen,
        setIsManageBankOpen,
        isAddBankModalOpen,
        setIsAddBankModalOpen,
        isTxHistoryOpen,
        setIsTxHistoryOpen,
        txHistoryFilter,
        setTxHistoryFilter,
        isRewardsOpen,
        setIsRewardsOpen,
        isSupportOpen,
        setIsSupportOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        isResetPasswordOpen,
        setIsResetPasswordOpen,
        isFaqOpen,
        setIsFaqOpen,
        refreshing,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
