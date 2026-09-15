import { SellerDesk } from '../types';

export interface TradingPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  commissionRate: number; // Percentage, e.g. 8 for 8%
  rateText: string;
  rangeText: string;
  durationText: string;
  defaultDurationSeconds: number; // e.g. 60s for testing/instant or 180s, etc.
  hashRateText: string;
  algorithm: string;
  badge: string;
  popular?: boolean;
  gradient: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  benefits: string[];
}

export const TRADING_PLANS: TradingPlan[] = [
  {
    id: 'plan-1',
    name: 'Starter RP Miner',
    minAmount: 100,
    maxAmount: 5000,
    commissionRate: 8,
    rateText: '8%',
    rangeText: 'Rs. 100 to Rs. 5,000',
    durationText: '120s Fast Mining',
    defaultDurationSeconds: 120,
    hashRateText: '25.4 MH/s',
    algorithm: 'RP-Ethash-Lite',
    badge: '8% PROFIT',
    popular: false,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    benefits: [
      '8% Guaranteed Mining Yield',
      'Quick 120-Second Mining Period',
      'Instant Auto-Completion',
      'Direct Seller Marketplace Liquidity'
    ]
  },
  {
    id: 'plan-2',
    name: 'Silver Growth Rig',
    minAmount: 5100,
    maxAmount: 10000,
    commissionRate: 10,
    rateText: '10%',
    rangeText: 'Rs. 5,100 to Rs. 10,000',
    durationText: '300s Mining Cycle',
    defaultDurationSeconds: 300,
    hashRateText: '64.8 MH/s',
    algorithm: 'RP-Ethash-Pro',
    badge: '10% PROFIT',
    popular: true,
    gradient: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-slate-900',
    textColor: 'text-emerald-400',
    borderColor: 'border-slate-700',
    benefits: [
      '10% Return on Total Investment',
      'Dual-Cluster GPU Hash Processing',
      'Priority Seller Settlement Lane',
      'Zero Transaction Deductions'
    ]
  },
  {
    id: 'plan-3',
    name: 'Gold Pro Mining Farm',
    minAmount: 11000,
    maxAmount: 50000,
    commissionRate: 15,
    rateText: '15%',
    rangeText: 'Rs. 11,000 to Rs. 50,000',
    durationText: '300s High Yield',
    defaultDurationSeconds: 300,
    hashRateText: '142.5 MH/s',
    algorithm: 'RP-Quantum-Node',
    badge: '15% HIGH YIELD',
    popular: false,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-slate-900',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    benefits: [
      '15% High Commission Profit',
      'Dedicated ASIC Mining Rig Allocation',
      'VIP Verified Buyer Matching',
      'Instant Return to Top-Up Balance'
    ]
  },
  {
    id: 'plan-4',
    name: 'Diamond Quantum Miner',
    minAmount: 51000,
    maxAmount: 100000,
    commissionRate: 20,
    rateText: '20%',
    rangeText: 'Rs. 51,000 to Rs. 100,000',
    durationText: '500s VIP Master Cycle',
    defaultDurationSeconds: 500,
    hashRateText: '380.0 MH/s',
    algorithm: 'RP-Quantum-Ultra',
    badge: '20% MAXIMUM',
    popular: false,
    gradient: 'from-purple-600 to-indigo-700',
    bgLight: 'bg-slate-900',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    benefits: [
      'Maximum 20% Top-Tier Mining Return',
      'Highest Mining Power & Speed',
      'Direct 1-Click Instant Sale to Official Desk',
      'Instant Auto-Refund of Capital + Profit'
    ]
  }
];

export const VERIFIED_SELLERS: SellerDesk[] = [
  {
    id: 'seller-1',
    name: 'WinzoPay Official Market Desk #1',
    tag: 'Official Partner',
    rating: 4.99,
    completedTrades: 18420,
    fillRate: '99.9%',
    badge: 'INSTANT AUTO-CREDIT',
    paymentMethods: ['Top-Up Balance Direct', '1Link Instant', 'Raast / Wallet'],
    status: 'ONLINE',
    minTrade: 100,
    maxTrade: 500000,
  },
  {
    id: 'seller-2',
    name: 'Apex P2P Liquidity Merchant',
    tag: 'Verified Merchant',
    rating: 4.97,
    completedTrades: 12150,
    fillRate: '99.8%',
    badge: 'ZERO FEE 0%',
    paymentMethods: ['Top-Up Balance Auto', 'Direct Settlement'],
    status: 'ONLINE',
    minTrade: 500,
    maxTrade: 250000,
  },
  {
    id: 'seller-3',
    name: 'SwiftCapital Exchange Node',
    tag: 'Institutional Liquidity',
    rating: 4.95,
    completedTrades: 9840,
    fillRate: '99.6%',
    badge: 'HIGH VOLUME',
    paymentMethods: ['Instant Wallet Credit', 'Bank Wire'],
    status: 'ONLINE',
    minTrade: 1000,
    maxTrade: 1000000,
  }
];

export function getCommissionRateForAmount(amount: number): number {
  if (amount >= 51000) return 20;
  if (amount >= 11000) return 15;
  if (amount >= 5100) return 10;
  if (amount >= 100) return 8;
  return 8;
}
