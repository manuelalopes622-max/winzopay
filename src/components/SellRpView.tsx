import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCw,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Coins,
  Cpu,
  Wallet,
  Sparkles,
  HelpCircle,
  ArrowDownLeft,
  Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VERIFIED_SELLERS } from '../data/plans';
import { UserRPPlan, SellerDesk } from '../types';

export const SellRpView: React.FC = () => {
  const {
    availableBalance,
    topUpBalance,
    withdrawableBalance,
    userPlans,
    completedPlans,
    activeMiningPlans,
    sellRPPlan,
    fastForwardPlanMining,
    setActiveTab,
    setIsTxHistoryOpen,
    setTxHistoryFilter,
    refreshing,
    triggerRefresh,
  } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return completedPlans[0]?.id || '';
  });
  const [selectedSellerId, setSelectedSellerId] = useState<string>(VERIFIED_SELLERS[0].id);
  const [sellingInProgress, setSellingInProgress] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ planName: string; totalCredited: number; profit: number; sellerName: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedPlan = userPlans.find(p => p.id === selectedPlanId);
  const selectedSeller = VERIFIED_SELLERS.find(s => s.id === selectedSellerId) || VERIFIED_SELLERS[0];

  const handleSelectPlan = (plan: UserRPPlan) => {
    setSelectedPlanId(plan.id);
    setErrorMessage('');
    setSuccessInfo(null);
  };

  const handleSellRP = () => {
    if (!selectedPlan) {
      setErrorMessage('Please select a completed RP plan to sell.');
      return;
    }

    if (selectedPlan.status === 'MINING') {
      const remainingSec = Math.max(0, Math.ceil((selectedPlan.completionTimestamp - Date.now()) / 1000));
      setErrorMessage(`Cannot sell RP yet! Mining is still in progress (${remainingSec}s remaining). RP can only be sold after mining completes.`);
      return;
    }

    if (selectedPlan.status === 'SOLD') {
      setErrorMessage('This plan has already been sold and settled.');
      return;
    }

    setSellingInProgress(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = sellRPPlan(selectedPlan.id, selectedSeller.name);
      setSellingInProgress(false);

      if (res.success) {
        setSuccessInfo({
          planName: selectedPlan.planName,
          totalCredited: res.totalCredited || selectedPlan.totalReturn,
          profit: selectedPlan.profitAmount,
          sellerName: selectedSeller.name,
        });
        setSelectedPlanId('');
      } else {
        setErrorMessage(res.message);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900" id="sell-rp-view">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            id="sell-rp-back-btn"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-900" />
              Sell RP to Seller
            </h1>
            <p className="text-[11px] text-slate-500">Step 5: Sell mined RP • Add capital + profit to Withdrawable Balance</p>
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
                5
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Sell RP to Designated Buyer
                  <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Step 5</span>
                </p>
                <p className="text-[11px] text-slate-600">RP Balance deducted • Added to Withdrawable Balance</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('withdraw')}
              className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 cursor-pointer shadow-xs"
            >
              Step 6: Withdraw →
            </button>
          </div>
        </div>

        {/* Balance Overview Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-bold">
              <Wallet className="w-3.5 h-3.5 text-emerald-700" />
              Withdrawable Balance
            </span>
            <div className="text-xl font-black text-emerald-800 mt-1">
              Rs. {withdrawableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
              <Coins className="w-3.5 h-3.5 text-blue-900" />
              Top-Up Balance
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              Rs. {topUpBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Success Feedback Alert */}
        {successInfo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">RP Package Sold Successfully!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Sold <strong>{successInfo.planName}</strong> to <strong>{successInfo.sellerName}</strong>. Total return of{' '}
                  <span className="font-bold text-emerald-700">Rs. {successInfo.totalCredited.toLocaleString('en-PK')}</span> (including Rs. {successInfo.profit.toLocaleString('en-PK')} profit) has been credited into your <strong>Withdrawable balance</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setActiveTab('withdraw');
                }}
                id="sell-success-withdraw-btn"
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Withdraw Funds to Bank (Step 6) →
              </button>
              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setActiveTab('buy_rp');
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition text-center cursor-pointer border border-slate-200"
              >
                Buy New RP Plan
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

        {/* Section 1: Choose Completed RP Plan to Sell */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              1. Select Mined RP Package to Sell
            </h2>
            <span className="text-xs text-blue-900 font-bold">
              {completedPlans.length} Ready to Sell
            </span>
          </div>

          {userPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2 shadow-xs">
              <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">You do not have any RP plans yet.</p>
              <button
                onClick={() => setActiveTab('buy_rp')}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Buy an RP Plan First →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {userPlans
                .filter(p => p.status !== 'SOLD')
                .map((plan) => {
                  const isMining = plan.status === 'MINING';
                  const isCompleted = plan.status === 'COMPLETED';
                  const isSelected = plan.id === selectedPlanId;
                  const remainingSec = Math.max(0, Math.ceil((plan.completionTimestamp - Date.now()) / 1000));

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        if (isCompleted) {
                          handleSelectPlan(plan);
                        } else {
                          setErrorMessage(`Mining in progress (${remainingSec}s remaining). RP cannot be sold before mining completes.`);
                        }
                      }}
                      id={`sell-plan-card-${plan.id}`}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isCompleted
                          ? isSelected
                            ? 'bg-white border-blue-900 ring-2 ring-blue-900/20 shadow-md'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                          : 'bg-slate-50/80 border-slate-200 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{plan.planName}</span>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {plan.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>Capital: <strong className="text-slate-800">Rs. {plan.investedAmount.toLocaleString('en-PK')}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Profit: +Rs. {plan.profitAmount.toLocaleString('en-PK')}</span>
                          </div>
                        </div>

                        {/* Status / Lock */}
                        <div>
                          {isCompleted ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 px-2.5 py-1 rounded-full">
                                Rs. {plan.totalReturn.toLocaleString('en-PK')}
                              </span>
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => handleSelectPlan(plan)}
                                className="w-4 h-4 accent-blue-900"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Mining ({remainingSec}s)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mining Lock Warning & Demo Fast Forward */}
                      {isMining && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                          <span>🔒 Rule 5: Locked during mining period</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fastForwardPlanMining(plan.id);
                            }}
                            className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                          >
                            ⚡ Complete Now (Demo)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Section 2: Choose Designated Seller / Merchant Desk */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              2. Select Designated Verified Buyer
            </h2>
            <span className="text-xs text-slate-500">Instant Liquidity Desk</span>
          </div>

          <div className="space-y-2.5">
            {VERIFIED_SELLERS.map((seller) => {
              const isSelected = seller.id === selectedSellerId;
              return (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSellerId(seller.id)}
                  id={`seller-card-${seller.id}`}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{seller.name}</span>
                        <span className="bg-blue-50 text-blue-900 border border-blue-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                          {seller.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {seller.rating}
                        </span>
                        <span>•</span>
                        <span>{seller.completedTrades.toLocaleString('en-PK')} trades</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{seller.fillRate} Fill</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedSellerId(seller.id)}
                      className="w-4 h-4 accent-blue-900"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Sell RP Breakdown & Execution */}
        {selectedPlan && selectedPlan.status === 'COMPLETED' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Settlement Payout Breakdown
            </h3>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Selected:</span>
                <span className="font-bold text-slate-900">{selectedPlan.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invested Capital Return:</span>
                <span className="font-bold text-slate-900">Rs. {selectedPlan.investedAmount.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span className="font-semibold">Mined Profit (+{selectedPlan.profitRate}%):</span>
                <span className="font-bold">+Rs. {selectedPlan.profitAmount.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Buyer / Seller Desk:</span>
                <span className="font-medium text-slate-800">{selectedSeller.name}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span className="text-slate-800">Total Returned to Withdrawable:</span>
                <span className="font-black text-emerald-700">Rs. {selectedPlan.totalReturn.toLocaleString('en-PK')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSellRP}
              disabled={sellingInProgress}
              id="sell-rp-submit-btn"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {sellingInProgress ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Sell RP to {selectedSeller.name.split(' ')[0]} (Receive Rs. {selectedPlan.totalReturn.toLocaleString('en-PK')})
                </>
              )}
            </button>
          </div>
        )}

        {/* Sell Rules Note */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <HelpCircle className="w-4 h-4 text-blue-900" />
            RP Selling & Settlement Rules
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed text-slate-600">
            <li>RP can only be sold after the mining cycle is 100% completed.</li>
            <li>When you sell your RP package, <strong>both your Initial Capital and your Mined Profit</strong> are automatically credited into your Withdrawable balance.</li>
            <li>Once credited to your Withdrawable balance, you can <strong>Request a Withdrawal to your Bank</strong> (Step 6).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
