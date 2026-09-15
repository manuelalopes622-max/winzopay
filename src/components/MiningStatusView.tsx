import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCw,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Coins,
  Activity,
  Layers,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRPPlan } from '../types';

export const MiningStatusView: React.FC = () => {
  const {
    userPlans,
    activeMiningPlans,
    completedPlans,
    soldPlans,
    totalMiningInvested,
    totalMiningProfits,
    fastForwardPlanMining,
    setActiveTab,
    refreshing,
    triggerRefresh,
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [, setTick] = useState(0);

  // Force re-render every second to update countdowns
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayedPlans = userPlans.filter(p => {
    if (activeTabFilter === 'ACTIVE') return p.status === 'MINING';
    if (activeTabFilter === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900" id="mining-status-view">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            id="mining-back-btn"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-900" />
              RP Mining Center
            </h1>
            <p className="text-[11px] text-slate-500">Step 4 & 5: Live mining rigs & yield progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            className={`p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
              refreshing ? 'animate-spin text-blue-900' : ''
            }`}
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Mining Power / Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active Capital */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-900" />
                Active Mining Capital
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-900 animate-ping"></span>
            </div>
            <div className="text-xl font-black text-slate-900">
              Rs. {totalMiningInvested.toLocaleString('en-PK')}
            </div>
            <div className="text-[11px] text-blue-950 font-bold mt-1 flex items-center gap-1">
              <span>{activeMiningPlans.length} Rigs Active</span>
            </div>
          </div>

          {/* Mining Profits */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                Total Mining Profits
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">
              +Rs. {totalMiningProfits.toLocaleString('en-PK')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {completedPlans.length} Ready to Sell
            </div>
          </div>
        </div>

        {/* Action Shortcut Banner */}
        {completedPlans.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {completedPlans.length} RP {completedPlans.length === 1 ? 'Plan is' : 'Plans are'} Ready to Sell!
                </h4>
                <p className="text-[11px] text-emerald-800 font-semibold">
                  Total payout: Rs. {completedPlans.reduce((sum, p) => sum + p.totalReturn, 0).toLocaleString('en-PK')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('sell_rp')}
              id="mining-go-to-sell-btn"
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              Sell RP Now →
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTabFilter('ACTIVE')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTabFilter === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Mining ({activeMiningPlans.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('COMPLETED')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTabFilter === 'COMPLETED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ready to Sell ({completedPlans.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTabFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Plans ({userPlans.length})
          </button>
        </div>

        {/* Plan Cards List */}
        {displayedPlans.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <Cpu className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No {activeTabFilter.toLowerCase()} mining plans</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {activeTabFilter === 'ACTIVE'
                ? 'Purchase an RP Mining Plan using your Top-Up balance to start earning daily mining profits.'
                : 'Completed plans will appear here once mining duration finishes.'}
            </p>
            <button
              onClick={() => setActiveTab('buy_rp')}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              Buy RP Mining Plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPlans.map((plan) => {
              const now = Date.now();
              const isMining = plan.status === 'MINING';
              const isCompleted = plan.status === 'COMPLETED';
              const isSold = plan.status === 'SOLD';

              const totalDurationMs = plan.completionTimestamp - plan.startTimestamp;
              const elapsedMs = Math.max(0, now - plan.startTimestamp);
              const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
              const remainingSec = Math.max(0, Math.ceil((plan.completionTimestamp - now) / 1000));
              const streamingProfit = Math.round((plan.profitAmount * progressPct) / 100);

              return (
                <div
                  key={plan.id}
                  id={`mining-plan-${plan.id}`}
                  className={`bg-white rounded-2xl p-4 border transition-all relative overflow-hidden shadow-sm ${
                    isMining
                      ? 'border-blue-900 ring-1 ring-blue-900/20'
                      : isCompleted
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{plan.planName}</span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {plan.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Started: {plan.startTime} • Finish: {plan.completionTime}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isMining && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-950 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 animate-pulse">
                          <Activity className="w-3 h-3 animate-spin text-blue-900" />
                          MINING ({remainingSec}s)
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          READY TO SELL
                        </span>
                      )}
                      {isSold && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          ✓ SOLD & SETTLED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live Progress Bar (if mining) */}
                  {isMining && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-blue-900" />
                          Mining Progress: {progressPct}%
                        </span>
                        <span className="text-blue-950 font-mono font-bold">
                          {remainingSec}s remaining
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-blue-900 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Financial Details Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 mt-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Invested Capital</span>
                      <span className="text-xs font-bold text-slate-900">Rs. {plan.investedAmount.toLocaleString('en-PK')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Profit ROI</span>
                      <span className="text-xs font-bold text-emerald-700">+{plan.profitRate}% (Rs. {plan.profitAmount.toLocaleString('en-PK')})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Total Return</span>
                      <span className="text-xs font-black text-slate-900">Rs. {plan.totalReturn.toLocaleString('en-PK')}</span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    {isMining && (
                      <>
                        <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                          <Flame className="w-3 h-3 text-amber-600" />
                          Accrued: Rs. {streamingProfit.toLocaleString('en-PK')}
                        </span>
                        <button
                          type="button"
                          onClick={() => fastForwardPlanMining(plan.id)}
                          id={`fast-forward-btn-${plan.id}`}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                          title="Instant completion for demo"
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          Fast-Forward (Demo)
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <>
                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Mining completed! Sell to get funds back.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('sell_rp')}
                          id={`sell-completed-btn-${plan.id}`}
                          className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          Sell RP to Seller →
                        </button>
                      </>
                    )}

                    {isSold && (
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-600">
                        <span>Sold to: <strong className="text-slate-900">{plan.sellerName || 'Merchant'}</strong></span>
                        <span className="text-emerald-700 font-bold">Credited to Withdrawable Balance ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
