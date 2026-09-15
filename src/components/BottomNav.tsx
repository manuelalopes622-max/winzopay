import React from 'react';
import {
  Home,
  User,
  ArrowDownLeft,
  Cpu,
  ShoppingBag,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, activeMiningPlans, completedPlans } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-40 shadow-lg">
      <div className="grid grid-cols-6 items-center">
        {/* Tab 1: Home */}
        <button
          id="nav-home-tab"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className={`w-4 h-4 mb-0.5 ${activeTab === 'home' ? 'text-slate-900 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] tracking-tight">Home</span>
        </button>

        {/* Tab 2: Deposit */}
        <button
          id="nav-deposit-tab"
          onClick={() => setActiveTab('deposit')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'deposit'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft className={`w-4 h-4 mb-0.5 ${activeTab === 'deposit' ? 'text-blue-900 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] tracking-tight">Deposit</span>
        </button>

        {/* Tab 3: Buy RP */}
        <button
          id="nav-buy-rp-tab"
          onClick={() => setActiveTab('buy_rp')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'buy_rp'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Cpu className={`w-4 h-4 mb-0.5 ${activeTab === 'buy_rp' ? 'text-blue-900 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] tracking-tight">Buy RP</span>
        </button>

        {/* Tab 4: Mining Status */}
        <button
          id="nav-mining-tab"
          onClick={() => setActiveTab('mining')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'mining'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Activity className={`w-4 h-4 mb-0.5 ${activeTab === 'mining' ? 'text-blue-900 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activeMiningPlans.length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-blue-900 text-white font-black text-[8px] flex items-center justify-center animate-pulse">
                {activeMiningPlans.length}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight">Mining</span>
        </button>

        {/* Tab 5: Sell RP */}
        <button
          id="nav-sell-rp-tab"
          onClick={() => setActiveTab('sell_rp')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'sell_rp'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-4 h-4 mb-0.5 ${activeTab === 'sell_rp' ? 'text-amber-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {completedPlans.length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-white font-black text-[8px] flex items-center justify-center">
                {completedPlans.length}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight">Sell RP</span>
        </button>

        {/* Tab 6: Withdraw */}
        <button
          id="nav-withdraw-tab"
          onClick={() => setActiveTab('withdraw')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'withdraw'
              ? 'text-slate-900 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ArrowUpRight className={`w-4 h-4 mb-0.5 ${activeTab === 'withdraw' ? 'text-blue-900 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] tracking-tight">Withdraw</span>
        </button>
      </div>
    </nav>
  );
};
