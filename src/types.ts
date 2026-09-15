export interface UsdtWallet {
  id: string;
  address: string;
  network: 'TRC20' | 'BEP20' | 'ERC20';
  label?: string; // e.g. "Binance", "Trust Wallet", "OKX"
  isPrimary: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  payoutQrUrl?: string;
  isPrimary: boolean;
  createdAt: string;
  accountType?: 'BANK' | 'USDT';
  usdtAddress?: string;
  usdtNetwork?: 'TRC20' | 'BEP20' | 'ERC20';
}

export interface UserRecord {
  userId: string;
  userName: string;
  userPhone: string;
  email?: string;
  password?: string;
  availableBalance: number;
  topUpBalance?: number;
  withdrawableBalance?: number;
  todayCommission: number;
  bankAccounts: BankAccount[];
  usdtWallets?: UsdtWallet[];
  usdtAddress?: string;
  usdtNetwork?: 'TRC20' | 'BEP20' | 'ERC20';
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string;
  vipLevel?: number;
  referralCode?: string;
  referredBy?: string;
  referrerName?: string;
  joinedViaReferralCode?: string;
  joinedViaReferralLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  userId: string;
  userName: string;
  userPhone: string;
  email?: string;
  referralCode?: string;
  joinedViaCode?: string;
  joinedDate: string;
  accountStatus: 'Active' | 'Inactive';
  totalDeposits: number;
  depositCount: number;
  lastDepositDate?: string;
}

export interface TeamOverview {
  headId: string;
  headName: string;
  headPhone: string;
  headReferralCode: string;
  totalMembers: number;
  activeMembers: number;
  totalTeamDeposits: number;
  members: TeamMember[];
}

export type TransactionType =
  | 'DEPOSIT'
  | 'BUY_RP'
  | 'PLAN_PURCHASE'
  | 'MINING_PROFIT'
  | 'SELL_RP'
  | 'WITHDRAWAL'
  | 'REWARD'
  | 'COMMISSION'
  | 'ADJUSTMENT';

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'REJECTED';

export interface UserRPPlan {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  planId: string;
  planName: string;
  investedAmount: number;
  profitRate: number; // e.g. 10%
  profitAmount: number; // e.g. Rs. 500
  totalReturn: number; // investedAmount + profitAmount
  durationSeconds: number;
  startTimestamp: number;
  completionTimestamp: number;
  startTime: string;
  completionTime: string;
  status: 'MINING' | 'COMPLETED' | 'SOLD';
  sellerName?: string;
  soldAt?: string;
}

export interface SellerDesk {
  id: string;
  name: string;
  tag: string;
  rating: number;
  completedTrades: number;
  fillRate: string;
  badge: string;
  paymentMethods: string[];
  status: 'ONLINE' | 'BUSY';
  minTrade: number;
  maxTrade: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  rpAmount?: number;
  profitAmount?: number;
  status: TransactionStatus;
  title: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  utr?: string;
  planName?: string;
  planId?: string;
  sellerName?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  payoutMethod?: 'BANK_TRANSFER' | 'UPI_QR' | 'USDT';
  payoutUpiId?: string;
  payoutQrUrl?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
  usdtAmount?: number;
  txHash?: string;
  notes?: string;
  timestamp: string;
  createdAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  amount: number;
  rpAmount: number;
  utr: string;
  method: 'EasyPaisa' | 'JazzCash' | 'EASYPAISA' | 'JAZZCASH' | 'UPI' | 'QR' | 'BANK_TRANSFER' | 'USDT';
  accountNumber?: string;
  accountTitle?: string;
  screenshotUrl?: string;
  receiptUrl?: string;
  usdtAmount?: number;
  usdtNetwork?: string;
  txHash?: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  amount: number;
  rpAmount: number;
  bankAccount: BankAccount;
  payoutMethod?: 'BANK_TRANSFER' | 'UPI_QR' | 'USDT';
  payoutUpiId?: string;
  payoutQrUrl?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
  usdtAmount?: number;
  status: TransactionStatus;
  createdAt: string;
  paidAt?: string;
  rejectedReason?: string;
  isRefunded?: boolean;
  refundedAmount?: number;
  refundedAt?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  claimed: boolean;
  type: 'DAILY_CHECKIN' | 'FIRST_DEPOSIT' | 'ADD_BANK' | 'REFERRAL' | 'VIP_BONUS';
  progress?: {
    current: number;
    target: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'TRANSACTION' | 'PROMO';
  read: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support' | 'system';
  text: string;
  timestamp: string;
}

export interface PlatformConfig {
  upiId: string;
  upiName: string;
  qrCodeUrl: string;
  easypaisaNumber?: string;
  easypaisaTitle?: string;
  easypaisaQrUrl?: string;
  jazzcashNumber?: string;
  jazzcashTitle?: string;
  jazzcashQrUrl?: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  sellRpStartTime: string; // "10:00 AM"
  sellRpEndTime: string;   // "10:00 PM"
  supportTelegram: string; // Official Telegram support account / URL
  officialChannel: string; // Official Telegram updates channel
  supportWhatsapp?: string; // WhatsApp Customer Service number or link
  supportEmail?: string; // Customer Service email
  supportPhone?: string; // Customer Service helpline phone
  supportNotice?: string; // Broadcast notice for support modal
  exchangeRate: number; // 1 RP = Rs. 1
  usdtDepositAddress?: string; // Official USDT TRC20 Wallet Address
  usdtNetwork?: string; // "TRC20"
  usdtRate?: number; // 1 USDT = Rs. 280
  usdtQrUrl?: string; // QR code image for USDT address
}

export type ActiveTab = 'home' | 'deposit' | 'buy_rp' | 'mining' | 'sell_rp' | 'withdraw' | 'team' | 'profile';
