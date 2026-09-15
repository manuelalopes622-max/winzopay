import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Filter,
  Cpu,
  ShoppingBag,
  Coins,
  TrendingUp,
  Wallet,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

export const TransactionHistoryModal: React.FC = () => {
  const {
    isTxHistoryOpen,
    setIsTxHistoryOpen,
    transactions,
    depositRequests,
    withdrawalRequests,
    txHistoryFilter,
    setTxHistoryFilter,
    userId,
    userPhone,
    checkBelongsToUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Synchronize transaction records with real-time deposit/withdrawal request statuses
  // Strictly isolated to the authenticated user's own activity
  const syncedTransactions = useMemo(() => {
    // 1. Strictly filter base transactions to only records belonging to the authenticated user
    const userBaseTxs = transactions.filter(tx => checkBelongsToUser(tx, userId, userPhone));

    const list: Transaction[] = userBaseTxs.map(tx => {
      if (tx.type === 'DEPOSIT' || tx.type === 'BUY_RP') {
        const dep = depositRequests.find(
          d => checkBelongsToUser(d, userId, userPhone) && (
            d.id === tx.id || 
            (tx.utr && d.utr && d.utr.trim().toLowerCase() === tx.utr.trim().toLowerCase()) || 
            (tx.notes && tx.notes.includes(d.id))
          )
        );
        if (dep) {
          return { ...tx, status: (dep.status === 'PENDING' ? 'PENDING' : dep.status) as any };
        }
      } else if (tx.type === 'WITHDRAWAL') {
        const wth = withdrawalRequests.find(
          w => checkBelongsToUser(w, userId, userPhone) && (
            w.id === tx.id || (tx.notes && tx.notes.includes(w.id))
          )
        );
        if (wth) {
          return { ...tx, status: (wth.status === 'PROCESSING' || wth.status === 'PENDING' ? 'PENDING' : wth.status) as any };
        }
      }
      return tx;
    });

    // 2. Also include any user withdrawalRequests not yet captured in transaction list (strictly for current user)
    const userWithdrawals = withdrawalRequests.filter(wth => checkBelongsToUser(wth, userId, userPhone));
    userWithdrawals.forEach(wth => {
      const alreadyInList = list.some(tx => tx.id === wth.id || (tx.notes && tx.notes.includes(wth.id)));
      if (!alreadyInList) {
        list.push({
          id: wth.id,
          userId: wth.userId,
          userName: wth.userName,
          userPhone: wth.userPhone,
          type: 'WITHDRAWAL',
          amount: wth.amount,
          rpAmount: wth.rpAmount || wth.amount,
          status: (wth.status === 'PROCESSING' || wth.status === 'PENDING' ? 'PENDING' : wth.status) as any,
          title: wth.payoutMethod === 'UPI_QR' ? 'Withdrawal Request (QR / Wallet)' : `Withdrawal Request (${wth.bankAccount?.bankName || 'Bank Transfer'})`,
          bankDetails: wth.bankAccount ? {
            bankName: wth.bankAccount.bankName,
            accountNumber: wth.bankAccount.accountNumber,
            accountHolderName: wth.bankAccount.accountHolderName,
          } : undefined,
          payoutMethod: wth.payoutMethod,
          payoutUpiId: wth.payoutUpiId,
          payoutQrUrl: wth.payoutQrUrl,
          notes: `Ref: ${wth.id} • ${wth.status === 'SUCCESS' ? 'Approved & Dispatched' : wth.status === 'REJECTED' ? 'Rejected & Refunded' : 'Pending Admin Approval'}`,
          timestamp: new Date(wth.createdAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAt: wth.createdAt,
        });
      }
    });

    // 3. Also include any user depositRequests not yet captured in transaction list (strictly for current user)
    const userDeposits = depositRequests.filter(dep => checkBelongsToUser(dep, userId, userPhone));
    userDeposits.forEach(dep => {
      const alreadyInList = list.some(
        tx => tx.id === dep.id || 
              (dep.utr && tx.utr && dep.utr.trim().toLowerCase() === tx.utr.trim().toLowerCase()) || 
              (tx.notes && tx.notes.includes(dep.id))
      );
      if (!alreadyInList) {
        list.push({
          id: dep.id,
          userId: dep.userId,
          userName: dep.userName,
          userPhone: dep.userPhone,
          type: 'DEPOSIT',
          amount: dep.amount,
          rpAmount: dep.rpAmount || dep.amount,
          status: (dep.status === 'PROCESSING' || dep.status === 'PENDING' ? 'PENDING' : dep.status) as any,
          title: `Deposit - ${dep.method || 'QR'} Top-Up`,
          utr: dep.utr,
          notes: `Order Ref: ${dep.id}${dep.utr ? ` • UTR: ${dep.utr}` : ''} • ${dep.status === 'SUCCESS' ? 'Approved & Credited' : dep.status === 'REJECTED' ? 'Rejected' : 'Pending Admin Verification'}`,
          timestamp: new Date(dep.createdAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAt: dep.createdAt,
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [transactions, depositRequests, withdrawalRequests, userId, userPhone, checkBelongsToUser]);

  // Compute live ledger summary totals from actual database records
  const stats = useMemo(() => {
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let totalPlans = 0;
    let totalProfits = 0;

    syncedTransactions.forEach(tx => {
      if (tx.status === 'SUCCESS') {
        if (tx.type === 'DEPOSIT' || tx.type === 'BUY_RP') {
          totalDeposited += Math.abs(tx.amount);
        } else if (tx.type === 'WITHDRAWAL') {
          totalWithdrawn += Math.abs(tx.amount);
        } else if (tx.type === 'PLAN_PURCHASE') {
          totalPlans += Math.abs(tx.amount);
        } else if (tx.type === 'MINING_PROFIT' || tx.type === 'COMMISSION' || tx.type === 'REWARD') {
          totalProfits += Math.abs(tx.amount);
        } else if (tx.type === 'SELL_RP' && tx.profitAmount) {
          totalProfits += Math.abs(tx.profitAmount);
        }
      }
    });

    return { totalDeposited, totalWithdrawn, totalPlans, totalProfits };
  }, [syncedTransactions]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: syncedTransactions.length,
      DEPOSIT: syncedTransactions.filter(t => t.type === 'DEPOSIT' || t.type === 'BUY_RP').length,
      PLAN_PURCHASE: syncedTransactions.filter(t => t.type === 'PLAN_PURCHASE').length,
      SELL_RP: syncedTransactions.filter(t => t.type === 'SELL_RP').length,
      MINING_PROFIT: syncedTransactions.filter(t => t.type === 'MINING_PROFIT').length,
      WITHDRAWAL: syncedTransactions.filter(t => t.type === 'WITHDRAWAL').length,
    };
  }, [syncedTransactions]);

  if (!isTxHistoryOpen) return null;

  const filteredTransactions = syncedTransactions.filter(tx => {
    // Category filter
    if (txHistoryFilter === 'DEPOSIT' && tx.type !== 'DEPOSIT' && tx.type !== 'BUY_RP') return false;
    if (txHistoryFilter === 'PLAN_PURCHASE' && tx.type !== 'PLAN_PURCHASE') return false;
    if (txHistoryFilter === 'BUY_RP' && tx.type !== 'BUY_RP' && tx.type !== 'DEPOSIT') return false;
    if (txHistoryFilter === 'SELL_RP' && tx.type !== 'SELL_RP') return false;
    if (txHistoryFilter === 'MINING_PROFIT' && tx.type !== 'MINING_PROFIT') return false;
    if (txHistoryFilter === 'WITHDRAWAL' && tx.type !== 'WITHDRAWAL') return false;
    if (txHistoryFilter === 'COMMISSION' && tx.type !== 'COMMISSION' && tx.type !== 'REWARD') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchUtr = tx.utr?.toLowerCase().includes(q);
      const matchBank = tx.bankDetails?.bankName.toLowerCase().includes(q);
      const matchPlan = tx.planName?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      return matchTitle || matchId || matchUtr || matchBank || matchPlan || matchNotes;
    }
    return true;
  });

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin text-blue-900" /> Processing
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
    }
  };

  const getTxIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
      case 'BUY_RP':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'PLAN_PURCHASE':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
        );
      case 'SELL_RP':
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        );
      case 'MINING_PROFIT':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        );
      case 'WITHDRAWAL':
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
      case 'COMMISSION':
      case 'REWARD':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold shrink-0">
            <Filter className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn" id="transaction-history-modal">
      <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl h-[94vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTxHistoryOpen(false)}
              id="tx-history-close-back"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Transaction Ledger
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Synced"></span>
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                Personal Activity • {filteredTransactions.length} Record{filteredTransactions.length === 1 ? '' : 's'} Synced
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsTxHistoryOpen(false)}
            id="tx-history-close-x"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Ledger Summary Cards */}
        <div className="px-5 pt-3 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mb-0.5">
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
              <span>Deposited</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900">
              Rs. {stats.totalDeposited.toLocaleString('en-PK')}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mb-0.5">
              <Cpu className="w-3.5 h-3.5 text-blue-900" />
              <span>Plans Bought</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900">
              Rs. {stats.totalPlans.toLocaleString('en-PK')}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mb-0.5">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>Profits</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-700">
              +Rs. {stats.totalProfits.toLocaleString('en-PK')}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mb-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
              <span>Withdrawn</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900">
              Rs. {stats.totalWithdrawn.toLocaleString('en-PK')}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="px-5 pt-3 pb-3 bg-white border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'All Records', count: tabCounts.ALL },
              { id: 'DEPOSIT', label: 'Deposits', count: tabCounts.DEPOSIT },
              { id: 'PLAN_PURCHASE', label: 'Plans', count: tabCounts.PLAN_PURCHASE },
              { id: 'SELL_RP', label: 'RP Sales', count: tabCounts.SELL_RP },
              { id: 'MINING_PROFIT', label: 'Profits', count: tabCounts.MINING_PROFIT },
              { id: 'WITHDRAWAL', label: 'Withdrawals', count: tabCounts.WITHDRAWAL },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTxHistoryFilter(tab.id as any)}
                id={`tx-tab-${tab.id.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  txHistoryFilter === tab.id
                    ? 'bg-slate-900 text-white border border-slate-900 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  txHistoryFilter === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="tx-search-input"
              placeholder="Search by Order ID, UTR Number, Plan, Bank Name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-5 flex-1 flex flex-col gap-3 bg-slate-50/50 min-h-[300px]">
          {filteredTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Filter className="w-7 h-7" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">No Transactions Found</p>
              <p className="text-xs text-slate-500 max-w-xs">
                No database records match the current filter or search criteria.
              </p>
            </div>
          ) : (
            filteredTransactions.map(tx => (
              <div
                key={tx.id}
                id={`tx-item-${tx.id}`}
                onClick={() => setSelectedTx(tx)}
                className="bg-white hover:bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  {getTxIcon(tx.type)}
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                      {tx.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tx.timestamp}</p>
                    {tx.utr && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        UTR: {tx.utr}
                      </p>
                    )}
                    {tx.planName && (
                      <p className="text-[10px] text-blue-900 font-semibold mt-0.5">
                        Plan: {tx.planName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-sm font-black tracking-tight ${
                    tx.type === 'DEPOSIT' || tx.type === 'SELL_RP' || tx.type === 'MINING_PROFIT' || tx.type === 'COMMISSION' || tx.type === 'REWARD'
                      ? 'text-emerald-700'
                      : 'text-slate-800'
                  }`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'SELL_RP' || tx.type === 'MINING_PROFIT' || tx.type === 'COMMISSION' || tx.type === 'REWARD'
                      ? `+Rs. ${Math.abs(tx.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                      : `-Rs. ${Math.abs(tx.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                  </span>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Transaction Detail Bottom Sheet Modal */}
        {selectedTx && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4" id="tx-receipt-modal">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Database Record Details</h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  id="tx-receipt-close-btn"
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center py-2 gap-1 text-center">
                <span className="text-xs text-slate-500 font-semibold">{selectedTx.title}</span>
                <h2 className={`text-3xl font-black ${
                  selectedTx.type === 'DEPOSIT' || selectedTx.type === 'SELL_RP' || selectedTx.type === 'MINING_PROFIT' || selectedTx.type === 'COMMISSION' || selectedTx.type === 'REWARD'
                    ? 'text-emerald-700'
                    : 'text-slate-900'
                }`}>
                  {selectedTx.type === 'DEPOSIT' || selectedTx.type === 'SELL_RP' || selectedTx.type === 'MINING_PROFIT' || selectedTx.type === 'COMMISSION' || selectedTx.type === 'REWARD'
                    ? '+'
                    : '-'}Rs. {Math.abs(selectedTx.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </h2>
                <div className="mt-1">{getStatusBadge(selectedTx.status)}</div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Record ID:</span>
                  <span className="font-mono text-slate-800 font-bold">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-800 font-bold uppercase">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-slate-800">{selectedTx.timestamp}</span>
                </div>
                {selectedTx.utr && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UTR / Ref:</span>
                    <span className="font-mono text-emerald-700 font-bold">{selectedTx.utr}</span>
                  </div>
                )}
                {selectedTx.planName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Name:</span>
                    <span className="text-slate-900 font-bold">{selectedTx.planName}</span>
                  </div>
                )}
                {selectedTx.sellerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Merchant Desk:</span>
                    <span className="text-slate-900 font-bold">{selectedTx.sellerName}</span>
                  </div>
                )}
                {selectedTx.profitAmount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Realized Profit:</span>
                    <span className="text-emerald-700 font-bold">+Rs. {selectedTx.profitAmount.toLocaleString('en-PK')}</span>
                  </div>
                )}
                {selectedTx.bankDetails && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank Destination:</span>
                    <span className="text-slate-900 font-bold">
                      {selectedTx.bankDetails.bankName} (•••• {selectedTx.bankDetails.accountNumber.slice(-4)})
                    </span>
                  </div>
                )}
                {selectedTx.notes && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Notes:</span>
                    <span className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                      {selectedTx.notes}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                id="tx-close-receipt-btn"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
