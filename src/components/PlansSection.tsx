import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { TRADING_PLANS, TradingPlan, getCommissionRateForAmount } from '../data/plans';
import { useApp } from '../context/AppContext';

interface PlansSectionProps {
  onSelectPlan?: (minAmount: number) => void;
  compact?: boolean;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ onSelectPlan, compact = false }) => {
  const { setActiveTab } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-2'); // Silver is default popular
  const [simulatedAmount, setSimulatedAmount] = useState<number>(5100);

  const activePlan = TRADING_PLANS.find(p => p.id === selectedPlanId) || TRADING_PLANS[1];
  const activeRate = getCommissionRateForAmount(simulatedAmount) || activePlan.commissionRate;
  const estimatedCommission = Math.round((simulatedAmount * activeRate) / 100);
  const totalReturn = simulatedAmount + estimatedCommission;

  const handlePlanClick = (plan: TradingPlan) => {
    setSelectedPlanId(plan.id);
    setSimulatedAmount(plan.minAmount);
  };

  const handleDepositInPlan = (amount: number) => {
    if (onSelectPlan) {
      onSelectPlan(amount);
    } else {
      setActiveTab('buy_rp');
    }
  };

  return (
    <section className="w-full flex flex-col gap-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-900" />
            <span>RP Trading Plans</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            High-Yield RP Commission Plans
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Earn up to <strong className="text-blue-900 font-bold">20% instant return</strong> on your deposits with 24x7 1Link / Raast bank settlement.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-fit shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-900" />
          <span className="font-bold text-slate-900">0% Platform Fee</span>
          <span className="text-slate-300">•</span>
          <span>Direct Bank Payout</span>
        </div>
      </div>

      {/* 4 Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {TRADING_PLANS.map(plan => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => handlePlanClick(plan)}
              className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-white border-blue-900 ring-2 ring-blue-900/20 shadow-md scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Badge for Popular or High Return */}
              {plan.popular && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-blue-900 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  Most Popular
                </div>
              )}

              <div>
                {/* Top Plan Info */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${isSelected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                    {plan.badge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {plan.durationText}
                  </span>
                </div>

                {/* Plan Name & Commission Rate Display */}
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{plan.name}</h3>
                
                <div className="my-2.5 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                    {plan.rateText}
                  </span>
                  <span className="text-xs font-extrabold text-blue-900 uppercase">
                    Return / Comm.
                  </span>
                </div>

                {/* Deposit Range */}
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 mb-3 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Deposit Range</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {plan.rangeText}
                  </span>
                </div>

                {/* Benefits List */}
                <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDepositInPlan(plan.minAmount);
                }}
                className={`w-full py-2.5 sm:py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                <span>Deposit Rs. {plan.minAmount.toLocaleString('en-PK')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Plan Return Simulator */}
      {!compact && (
        <div className="rounded-3xl bg-white text-slate-900 p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Col: Amount Slider & Quick Chips */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Live Profit Calculator</h3>
                  <p className="text-xs text-slate-500">Calculate your exact return before depositing</p>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-4 gap-2">
                {[1000, 5100, 20000, 51000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSimulatedAmount(amt)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      simulatedAmount === amt
                        ? 'bg-blue-900 text-white border border-blue-900'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Rs. {amt.toLocaleString('en-PK')}
                  </button>
                ))}
              </div>

              {/* Amount Range Slider */}
              <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Min: Rs. 100</span>
                  <span className="text-blue-900 font-bold">Selected: Rs. {simulatedAmount.toLocaleString('en-PK')}</span>
                  <span>Max: Rs. 1,00,000</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={simulatedAmount}
                  onChange={(e) => setSimulatedAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>
            </div>

            {/* Right Col: Calculation Summary Box */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">Applicable Plan Tier:</span>
                <span className="font-extrabold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {activeRate}% Commission
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Calculated Bonus / Comm.:</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  + Rs. {estimatedCommission.toLocaleString('en-PK')}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-700 font-bold block">Total RP Payout</span>
                  <span className="text-[10px] text-slate-500">Principal + Commission</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  Rs. {totalReturn.toLocaleString('en-PK')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDepositInPlan(simulatedAmount)}
                className="w-full mt-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Deposit Rs. {simulatedAmount.toLocaleString('en-PK')} Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
