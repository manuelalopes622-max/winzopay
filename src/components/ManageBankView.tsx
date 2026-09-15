import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Building2,
  Trash2,
  CheckCircle2,
  Star,
  ShieldCheck,
  X,
  Wallet,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const POPULAR_BANKS = [
  'Meezan Bank',
  'Habib Bank Limited (HBL)',
  'United Bank Limited (UBL)',
  'MCB Bank',
  'Allied Bank Limited (ABL)',
  'Bank Alfalah',
  'Easypaisa',
  'JazzCash',
];

export const ManageBankView: React.FC = () => {
  const {
    bankAccounts,
    deleteBankAccount,
    setPrimaryBankAccount,
    addBankAccount,
    usdtWallets,
    addUsdtWallet,
    deleteUsdtWallet,
    setPrimaryUsdtWallet,
    isManageBankOpen,
    setIsManageBankOpen,
    isAddBankModalOpen,
    setIsAddBankModalOpen,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'BANK' | 'USDT'>('BANK');

  // Add Bank Modal fields
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add USDT Wallet Modal fields
  const [isAddUsdtModalOpen, setIsAddUsdtModalOpen] = useState(false);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('TRC20');
  const [usdtLabel, setUsdtLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Listen for external trigger to switch to USDT tab
  useEffect(() => {
    const handleSwitchToUsdt = () => {
      setActiveSection('USDT');
      setIsManageBankOpen(true);
    };
    window.addEventListener('open-usdt-wallet-management', handleSwitchToUsdt);
    return () => window.removeEventListener('open-usdt-wallet-management', handleSwitchToUsdt);
  }, [setIsManageBankOpen]);

  if (!isManageBankOpen && !isAddBankModalOpen && !isAddUsdtModalOpen) return null;

  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!holderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      setError('Account numbers do not match!');
      return;
    }

    if (accountNumber.length < 8) {
      setError('Account number must be at least 8 digits.');
      return;
    }

    if (ifscCode.trim().length < 4) {
      setError('Please enter a valid IBAN or Branch code (e.g. MEZN0001234 or PK36...).');
      return;
    }

    addBankAccount({
      accountHolderName: holderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim() || undefined,
      isPrimary: bankAccounts.length === 0,
    });

    setSuccessMsg('Bank account added successfully!');
    setHolderName('');
    setBankName('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscCode('');
    setUpiId('');

    setTimeout(() => {
      setSuccessMsg('');
      setIsAddBankModalOpen(false);
    }, 1200);
  };

  const handleAddUsdtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanAddr = usdtAddress.trim();
    if (!cleanAddr) {
      setError('Please enter your USDT wallet address.');
      return;
    }

    if (usdtNetwork === 'TRC20' && !cleanAddr.startsWith('T')) {
      setError('USDT TRC-20 address should typically start with "T" (Tron Network).');
      return;
    }

    if (usdtNetwork === 'BEP20' && !cleanAddr.startsWith('0x')) {
      setError('USDT BEP-20 address should typically start with "0x" (BSC Network).');
      return;
    }

    if (cleanAddr.length < 24) {
      setError('Invalid wallet address length. Please double-check.');
      return;
    }

    addUsdtWallet({
      address: cleanAddr,
      network: usdtNetwork,
      label: usdtLabel.trim() || (usdtNetwork === 'TRC20' ? 'Tron USDT' : 'BSC USDT'),
      isPrimary: usdtWallets.length === 0,
    });

    setSuccessMsg('USDT wallet saved successfully!');
    setUsdtAddress('');
    setUsdtLabel('');

    setTimeout(() => {
      setSuccessMsg('');
      setIsAddUsdtModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn text-slate-900">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManageBankOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Payment & Payout Accounts
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                {bankAccounts.length} Banks • {usdtWallets.length} USDT Wallets
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSection === 'BANK' ? (
              <button
                id="add-bank-top-btn"
                onClick={() => setIsAddBankModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bank</span>
              </button>
            ) : (
              <button
                id="add-usdt-top-btn"
                onClick={() => setIsAddUsdtModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add USDT</span>
              </button>
            )}
            <button
              onClick={() => setIsManageBankOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActiveSection('BANK')}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'BANK'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>Bank Cards ({bankAccounts.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('USDT')}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSection === 'USDT'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>USDT Wallets ({usdtWallets.length})</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          
          {/* ==================== BANK CARDS TAB ==================== */}
          {activeSection === 'BANK' && (
            <>
              {bankAccounts.length === 0 ? (
                /* Empty Bank State */
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-1">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900">No Bank Account Added Yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Add your primary bank account to enable instant RP withdrawals and daily commissions.
                    </p>
                  </div>
                  <button
                    id="empty-add-bank-btn"
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Bank Account
                  </button>
                </div>
              ) : (
                /* Bank Cards Responsive Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bankAccounts.map(bank => (
                    <div
                      key={bank.id}
                      className={`relative rounded-3xl p-5 transition-all shadow-xs border flex flex-col justify-between ${
                        bank.isPrimary
                          ? 'bg-blue-950 text-white border-blue-900 shadow-md'
                          : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                                bank.isPrimary ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className={`font-extrabold text-sm leading-tight ${bank.isPrimary ? 'text-white' : 'text-slate-900'}`}>{bank.bankName}</h3>
                              <p className={`text-xs ${bank.isPrimary ? 'text-blue-200' : 'text-slate-500'}`}>
                                {bank.accountHolderName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {bank.isPrimary ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-800 text-blue-100 text-[10px] font-bold border border-blue-700 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-blue-300 text-blue-300" /> Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => setPrimaryBankAccount(bank.id)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-semibold transition-colors cursor-pointer border border-slate-200"
                              >
                                Set Primary
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm(`Remove ${bank.bankName} account?`)) {
                                  deleteBankAccount(bank.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                bank.isPrimary ? 'text-blue-300 hover:text-rose-300' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete Bank"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="my-4">
                          <span className={`text-[10px] uppercase tracking-wider block font-medium ${bank.isPrimary ? 'text-blue-300' : 'text-slate-400'}`}>
                            Account Number
                          </span>
                          <p className={`font-mono text-base font-black tracking-widest mt-0.5 ${bank.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                            •••• •••• •••• {bank.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs ${bank.isPrimary ? 'border-blue-900' : 'border-slate-200'}`}>
                        <span className={`font-mono text-[11px] font-bold ${bank.isPrimary ? 'text-blue-200' : 'text-slate-500'}`}>{bank.ifscCode}</span>
                        <span className={`text-[10px] flex items-center gap-1 font-bold ${bank.isPrimary ? 'text-blue-200' : 'text-blue-900'}`}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Ready for Payouts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ==================== USDT WALLETS TAB ==================== */}
          {activeSection === 'USDT' && (
            <>
              {usdtWallets.length === 0 ? (
                /* Empty USDT State */
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-1">
                    <Coins className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900">No USDT Wallet Added</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Link your TRC-20 or BEP-20 wallet address for fast, secure crypto withdrawals with 0% gateway fees.
                    </p>
                  </div>
                  <button
                    id="empty-add-usdt-btn"
                    onClick={() => setIsAddUsdtModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add USDT Wallet
                  </button>
                </div>
              ) : (
                /* USDT Wallets Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {usdtWallets.map(wallet => (
                    <div
                      key={wallet.id}
                      className={`relative rounded-3xl p-5 transition-all shadow-xs border flex flex-col justify-between ${
                        wallet.isPrimary
                          ? 'bg-slate-900 text-white border-emerald-600/40 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                                wallet.isPrimary ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <Coins className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className={`font-extrabold text-sm leading-tight ${wallet.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                                  {wallet.label || 'USDT Wallet'}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  wallet.network === 'TRC20'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {wallet.network}
                                </span>
                              </div>
                              <p className={`text-xs ${wallet.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                                {wallet.network === 'TRC20' ? 'Tron Network' : wallet.network === 'BEP20' ? 'BNB Smart Chain' : 'Ethereum'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {wallet.isPrimary ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" /> Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => setPrimaryUsdtWallet(wallet.id)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-semibold transition-colors cursor-pointer border border-slate-200"
                              >
                                Set Primary
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm(`Remove ${wallet.label || 'this USDT wallet'}?`)) {
                                  deleteUsdtWallet(wallet.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                wallet.isPrimary ? 'text-slate-400 hover:text-rose-300' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete USDT Wallet"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="my-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] uppercase tracking-wider block font-medium ${wallet.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                              Wallet Address
                            </span>
                            <button
                              onClick={() => handleCopyAddress(wallet.id, wallet.address)}
                              className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                                wallet.isPrimary ? 'text-emerald-400 hover:text-emerald-300' : 'text-blue-900 hover:underline'
                              }`}
                            >
                              {copiedId === wallet.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className={`p-2 rounded-xl font-mono text-xs break-all ${
                            wallet.isPrimary ? 'bg-slate-800 text-emerald-300 border border-slate-700' : 'bg-white text-slate-800 border border-slate-200'
                          }`}>
                            {wallet.address}
                          </div>
                        </div>
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs ${wallet.isPrimary ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-[10px] flex items-center gap-1 font-bold ${wallet.isPrimary ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Ready for USDT Payout
                        </span>
                        <span className={`text-[10px] ${wallet.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                          0% Crypto Fee
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fadeIn text-slate-900">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Bank Account</h3>
                  <p className="text-xs text-slate-500">For fast & secure 1Link / Raast withdrawal payouts</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddBankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {successMsg}
              </div>
            )}

            {/* Popular Banks Quick Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Popular Banks
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BANKS.slice(0, 6).map(pb => (
                  <button
                    key={pb}
                    type="button"
                    onClick={() => setBankName(pb)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      bankName === pb
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pb}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddBankSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  placeholder="Enter name exactly as in passbook"
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank, HBL, Easypaisa"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter bank account number"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  placeholder="Re-enter bank account number"
                  value={confirmAccountNumber}
                  onChange={e => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">IBAN / Branch Code *</label>
                <input
                  type="text"
                  placeholder="e.g. MEZN0001234 or PK36MEZN..."
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Save Bank Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add USDT Wallet Modal */}
      {isAddUsdtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fadeIn text-slate-900">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add USDT Wallet</h3>
                  <p className="text-xs text-slate-500">For fast crypto withdrawal payouts</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUsdtModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAddUsdtSubmit} className="flex flex-col gap-3">
              {/* Network Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Blockchain Network *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUsdtNetwork('TRC20')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      usdtNetwork === 'TRC20'
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>TRC-20 (Tron)</span>
                    <span className={`text-[10px] font-normal ${usdtNetwork === 'TRC20' ? 'text-emerald-200' : 'text-slate-500'}`}>
                      Recommended • Fast
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsdtNetwork('BEP20')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      usdtNetwork === 'BEP20'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>BEP-20 (BSC)</span>
                    <span className={`text-[10px] font-normal ${usdtNetwork === 'BEP20' ? 'text-amber-100' : 'text-slate-500'}`}>
                      Binance Smart Chain
                    </span>
                  </button>
                </div>
              </div>

              {/* Wallet Label / Exchange */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Wallet Label / Platform (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Binance, Trust Wallet, Bybit"
                  value={usdtLabel}
                  onChange={e => setUsdtLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              {/* USDT Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  USDT ({usdtNetwork}) Receiving Address *
                </label>
                <input
                  type="text"
                  placeholder={usdtNetwork === 'TRC20' ? 'Starts with T... (e.g. TYDzsYUE...)' : 'Starts with 0x...'}
                  value={usdtAddress}
                  onChange={e => setUsdtAddress(e.target.value.trim())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Make sure to copy the correct {usdtNetwork} address. Transfers to the wrong network cannot be recovered.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Save USDT Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
