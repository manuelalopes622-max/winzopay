import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCw,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Play,
  Layers,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRADING_PLANS, TradingPlan, getCommissionRateForAmount } from '../data/plans';

export const BuyRpView: React.FC = () => {
  const {
    availableBalance,
    buyRPPlan,
    setActiveTab,
    setIsTxHistoryOpen,
    setTxHistoryFilter,
    activeMiningPlans,
    refreshing,
    triggerRefresh,
  } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(TRADING_PLANS[0].id);
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [amountInputStr, setAmountInputStr] = useState<string>('1000');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successPlanName, setSuccessPlanName] = useState<string>('');
  const [successTotalReturn, setSuccessTotalReturn] = useState<number>(0);
  const [successProfit, setSuccessProfit] = useState<number>(0);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  const activePlan: TradingPlan = TRADING_PLANS.find(p => p.id === selectedPlanId) || TRADING_PLANS[0];

  const handlePlanSelect = (plan: TradingPlan) => {
    setSelectedPlanId(plan.id);
    setErrorMessage('');
    // Auto-adjust investment amount to fit within new plan's range
    if (investmentAmount < plan.minAmount) {
      setInvestmentAmount(plan.minAmount);
      setAmountInputStr(plan.minAmount.toString());
    } else if (investmentAmount > plan.maxAmount) {
      setInvestmentAmount(plan.maxAmount);
      setAmountInputStr(plan.maxAmount.toString());
    }
  };

  const handleAmountChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setAmountInputStr(numeric);
    const num = parseInt(numeric, 10);
    if (!isNaN(num)) {
      setInvestmentAmount(num);
    } else {
      setInvestmentAmount(0);
    }
    setErrorMessage('');
  };

  const setPreset = (amt: number) => {
    // Also select plan appropriate for this amount if necessary
    const matchingPlan = TRADING_PLANS.find(p => amt >= p.minAmount && amt <= p.maxAmount);
    if (matchingPlan) {
      setSelectedPlanId(matchingPlan.id);
    }
    setInvestmentAmount(amt);
    setAmountInputStr(amt.toString());
    setErrorMessage('');
  };

  const handleBuyPlan = () => {
    const amt = parseInt(amountInputStr, 10);
    if (!amt || isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid investment amount.');
      return;
    }

    if (amt < activePlan.minAmount) {
      setErrorMessage(`Minimum amount for ${activePlan.name} is Rs. ${activePlan.minAmount.toLocaleString('en-PK')}`);
      return;
    }

    if (amt > activePlan.maxAmount) {
      setErrorMessage(`Maximum amount for ${activePlan.name} is Rs. ${activePlan.maxAmount.toLocaleString('en-PK')}`);
      return;
    }

    if (amt > availableBalance) {
      setErrorMessage(
        `Insufficient Top-Up balance (Rs. ${availableBalance.toLocaleString('en-PK')}). Please deposit funds first.`
      );
      return;
    }

    setIsPurchasing(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = buyRPPlan(activePlan.id, amt, activePlan.defaultDurationSeconds);
      setIsPurchasing(false);

      if (res.success && res.plan) {
        setSuccessPlanName(res.plan.planName);
        setSuccessTotalReturn(res.plan.totalReturn);
        setSuccessProfit(res.plan.profitAmount);
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  const currentAmt = parseInt(amountInputStr, 10) || 0;
  const currentProfitRate = activePlan.commissionRate || getCommissionRateForAmount(currentAmt);
  const currentProfit = Math.round((currentAmt * currentProfitRate) / 100);
  const currentTotalReturn = currentAmt + currentProfit;
  const balanceAfterDeduction = Math.max(0, availableBalance - currentAmt);

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900" id="buy-rp-plan-view">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            id="buy-rp-back-btn"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-900" />
              Buy RP Mining Plan
            </h1>
            <p className="text-[11px] text-slate-500">Step 2: Choose plan & invest from Top-Up balance</p>
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
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  RP Mining Plan Purchase
                  <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">Active Step</span>
                </p>
                <p className="text-[11px] text-slate-600">Amount is deducted from Top-Up balance and starts mining</p>
              </div>
            </div>
            {activeMiningPlans.length > 0 && (
              <button
                onClick={() => setActiveTab('mining')}
                className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 cursor-pointer shadow-xs"
              >
                Mining ({activeMiningPlans.length}) →
              </button>
            )}
          </div>
        </div>

        {/* Current Top-Up Balance Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Wallet className="w-3.5 h-3.5 text-blue-900" />
              Available Top-Up Balance
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Rs. {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('deposit')}
            id="buy-rp-deposit-more-btn"
            className="py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            + Top-Up More
          </button>
        </div>

        {/* Purchase Success Alert Banner */}
        {successPlanName && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Plan Activated & Mining Started!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{successPlanName}</strong> is now actively mining. Amount deducted from Top-Up balance.
                  Expected Return: <span className="font-bold text-emerald-700">Rs. {successTotalReturn.toLocaleString('en-PK')}</span> (Profit Rs. {successProfit.toLocaleString('en-PK')}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSuccessPlanName('');
                  setActiveTab('mining');
                }}
                id="view-live-mining-btn"
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                View Live Mining Status →
              </button>
              <button
                onClick={() => setSuccessPlanName('')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-200"
              >
                Buy Another Plan
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-rose-700 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.includes('Insufficient') && (
              <button
                onClick={() => setActiveTab('deposit')}
                className="underline font-bold text-rose-900 ml-2 cursor-pointer"
              >
                Top-Up Now
              </button>
            )}
          </div>
        )}

        {/* Plan Selection Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              Select RP Mining Plan
            </h2>
            <span className="text-xs text-slate-500">Guaranteed Mining Yield</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRADING_PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan)}
                  id={`plan-card-${plan.id}`}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-900" />
                      {plan.name}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-blue-100 text-blue-900 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {plan.rateText} ROI
                    </span>
                  </div>

                  {/* Hash Rate & Duration */}
                  <div className="flex items-center justify-between text-xs py-1.5 border-y border-slate-200 my-2">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {plan.durationText}
                    </span>
                    <span className="text-blue-900 font-mono text-[11px] font-bold">
                      {plan.hashRateText}
                    </span>
                  </div>

                  {/* Investment Range */}
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500 text-[11px]">Investment Range:</span>
                    <span className="font-bold text-slate-900 text-xs">{plan.rangeText}</span>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-900 font-bold">
                      <span>✓ Selected Mining Rig</span>
                      <span>{plan.algorithm}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Amount Input & Calculator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-900" />
              Investment Amount for {activePlan.name}
            </h2>
            <span className="text-[11px] text-slate-500">
              Min: Rs. {activePlan.minAmount.toLocaleString('en-PK')} | Max: Rs. {activePlan.maxAmount.toLocaleString('en-PK')}
            </span>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-900 focus-within:bg-white transition-all">
              <span className="text-base font-bold text-slate-900 mr-2">Rs.</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInputStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                id="buy-rp-amount-input"
                className="w-full bg-transparent text-xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick presets fitting plan */}
          <div className="grid grid-cols-4 gap-2">
            {[activePlan.minAmount, Math.round(activePlan.minAmount * 2), Math.round((activePlan.minAmount + activePlan.maxAmount) / 2), activePlan.maxAmount]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((presetVal) => (
                <button
                  key={presetVal}
                  type="button"
                  onClick={() => setPreset(presetVal)}
                  className={`py-1.5 px-2 text-center rounded-xl font-bold text-xs transition border cursor-pointer ${
                    investmentAmount === presetVal
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Rs. {presetVal >= 1000 ? `${presetVal / 1000}K` : presetVal}
                </button>
              ))}
          </div>

          {/* Financial Breakdown / Deduction Preview */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Top-Up Balance:</span>
              <span className="font-bold text-slate-900">Rs. {availableBalance.toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span className="flex items-center gap-1 font-semibold">
                Plan Purchase Deduction:
              </span>
              <span className="font-bold">-Rs. {currentAmt.toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Top-Up Balance After Purchase:</span>
              <span className="font-bold text-slate-900">Rs. {balanceAfterDeduction.toLocaleString('en-PK')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="text-slate-500">Mining Cycle Duration:</span>
              <span className="font-bold text-slate-900">{activePlan.durationText}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="font-semibold">Expected Profit ({currentProfitRate}%):</span>
              <span className="font-bold">+Rs. {currentProfit.toLocaleString('en-PK')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
              <span className="text-slate-800">Total Return (Upon Sale):</span>
              <span className="font-black text-slate-900">Rs. {currentTotalReturn.toLocaleString('en-PK')}</span>
            </div>
          </div>

          {/* Buy Action Button */}
          <button
            type="button"
            onClick={handleBuyPlan}
            disabled={isPurchasing || !currentAmt || currentAmt < activePlan.minAmount || currentAmt > activePlan.maxAmount || currentAmt > availableBalance}
            id="buy-rp-submit-btn"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {isPurchasing ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Buy RP Plan & Start Mining (Rs. {currentAmt.toLocaleString('en-PK')})
              </>
            )}
          </button>

          {currentAmt > availableBalance && (
            <p className="text-[11px] text-amber-700 text-center flex items-center justify-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              You need Rs. {(currentAmt - availableBalance).toLocaleString('en-PK')} more. Click "+ Top-Up More" above.
            </p>
          )}
        </div>

        {/* Mining Workflow Info */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <HelpCircle className="w-4 h-4 text-blue-900" />
            RP Mining Plan Rules
          </div>
          <ol className="space-y-1.5 list-decimal list-inside text-[11px] leading-relaxed text-slate-600">
            <li>Plan cost is deducted entirely from your Top-Up balance.</li>
            <li>Your investment enters an automated mining period with live hashrate calculation.</li>
            <li>RP cannot be sold until mining duration completes.</li>
            <li>Once completed, proceed to <strong>Step 6: Sell RP to Seller</strong> to receive your Capital + Profit back into your Top-Up balance.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
