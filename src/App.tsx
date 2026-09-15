import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { DepositView } from './components/DepositView';
import { BuyRpView } from './components/BuyRpView';
import { MiningStatusView } from './components/MiningStatusView';
import { SellRpView } from './components/SellRpView';
import { WithdrawView } from './components/WithdrawView';
import { TeamView } from './components/TeamView';
import { ProfileView } from './components/ProfileView';
import { ManageBankView } from './components/ManageBankView';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { CustomerServiceModal } from './components/CustomerServiceModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { FaqModal } from './components/FaqModal';
import { NotificationModal } from './components/NotificationModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';

const MainAppContent: React.FC = () => {
  const { activeTab, isAdminOpen, setIsAdminOpen, isLoggedIn } = useApp();
  const [isHashAdmin, setIsHashAdmin] = useState<boolean>(() => {
    return (
      window.location.hash === '#admin' ||
      window.location.search.includes('portal=admin') ||
      window.location.search.includes('admin=true')
    );
  });

  // Listen to hash and URL changes for the separate Admin Portal route (#admin)
  useEffect(() => {
    const checkHash = () => {
      const isAdm =
        window.location.hash === '#admin' ||
        window.location.search.includes('portal=admin') ||
        window.location.search.includes('admin=true');
      setIsHashAdmin(isAdm);
      if (isAdm) {
        setIsAdminOpen(true);
      }
    };

    window.addEventListener('hashchange', checkHash);
    window.addEventListener('popstate', checkHash);

    // Keyboard shortcut (Alt + A) to toggle separate admin portal
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        if (window.location.hash === '#admin') {
          window.location.hash = '';
          setIsAdminOpen(false);
          setIsHashAdmin(false);
        } else {
          window.location.hash = '#admin';
          setIsAdminOpen(true);
          setIsHashAdmin(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('popstate', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsAdminOpen]);

  // If in separate Admin Portal mode, render ONLY the full Admin Portal
  if (isAdminOpen || isHashAdmin) {
    return (
      <AdminPanel
        onClose={() => {
          setIsHashAdmin(false);
          setIsAdminOpen(false);
        }}
      />
    );
  }

  // If user is NOT logged in, show Login / Registration screen FIRST
  if (!isLoggedIn) {
    return (
      <>
        <LoginView />
        <CustomerServiceModal />
        <ResetPasswordModal />
        <FaqModal />
      </>
    );
  }

  // Once authenticated, display full WinzoPay Trading Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Responsive layout container: Full width with max-w-7xl responsive padding */}
      <div className="w-full min-h-screen bg-slate-50 flex flex-col relative">
        {/* Top Header */}
        <Header />

        {/* Dynamic Workflow Views */}
        <main className="flex-1 w-full bg-slate-50">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'deposit' && <DepositView />}
          {activeTab === 'buy_rp' && <BuyRpView />}
          {activeTab === 'mining' && <MiningStatusView />}
          {activeTab === 'sell_rp' && <SellRpView />}
          {activeTab === 'withdraw' && <WithdrawView />}
          {activeTab === 'team' && <TeamView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Dedicated Navigation Bar */}
        <BottomNav />

        {/* Global Modals & Sub-screens */}
        <ManageBankView />
        <TransactionHistoryModal />
        <CustomerServiceModal />
        <ResetPasswordModal />
        <FaqModal />
        <NotificationModal />
        <AuthModal />
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
