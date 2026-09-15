import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FAQ {
  q: string;
  a: string;
  category: 'deposit' | 'withdraw' | 'bank' | 'general';
}

const FAQS: FAQ[] = [
  {
    q: 'How to Buy RP (Deposit) on WinzoPay?',
    a: 'Go to the "Buy RP" tab, choose or enter your desired deposit amount, click "Proceed to Payment", scan the official QR code or copy the Account / Raast ID, make the payment from your banking or wallet app, and then enter the Transaction / Reference Number for automatic verification.',
    category: 'deposit'
  },
  {
    q: 'What is the Sell RP (Withdrawal) timing?',
    a: 'Sell RP operations are open daily from 10:00 AM to 10:00 PM. Payouts are sent directly to your linked primary bank account or QR / wallet via instant 1Link / Raast transfer within 5 to 15 minutes.',
    category: 'withdraw'
  },
  {
    q: 'Why is my deposit marked as pending?',
    a: 'Deposits with correct Transaction / Reference numbers are verified automatically. If a high volume of transactions occurs, an administrator reviews and approves it within 2–5 minutes. You can also contact 24/7 Live Support.',
    category: 'deposit'
  },
  {
    q: 'Are there any fees on Sell RP withdrawals?',
    a: 'WinzoPay charges 0% fees on all standard bank withdrawals. What you sell is what you receive directly in your bank account or wallet address.',
    category: 'withdraw'
  },
  {
    q: 'How do I add or change my bank account or payout QR?',
    a: 'You can add bank details directly from the Home Dashboard or from "Profile" > "Manage Bank Cards", or enter your Payout Account / ID directly in the Sell RP tab. You can link multiple bank accounts and switch your primary receiving account anytime.',
    category: 'bank'
  },
  {
    q: 'What is RP and what is the exchange rate?',
    a: 'RP is the standard tradeable token on WinzoPay. 1 RP is pegged at Rs. 1.00 PKR for 1:1 instantaneous trading and withdrawal.',
    category: 'general'
  }
];

export const FaqModal: React.FC = () => {
  const { isFaqOpen, setIsFaqOpen, setIsSupportOpen } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'deposit' | 'withdraw' | 'bank'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isFaqOpen) return null;

  const filtered = FAQS.filter(f => activeCategory === 'all' || f.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn text-slate-900">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[88vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFaqOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-900" />
                Help Center & FAQs
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                Instant answers to common trading questions
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsFaqOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All FAQs' },
            { id: 'deposit', label: 'Buy RP / Deposits' },
            { id: 'withdraw', label: 'Sell RP / Payouts' },
            { id: 'bank', label: 'Bank Accounts' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="p-5 flex-1 flex flex-col gap-3 bg-slate-50/50">
          {filtered.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-900' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 leading-relaxed bg-slate-50/70">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Support Bottom Prompt */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Still have questions?</span>
          <button
            onClick={() => {
              setIsFaqOpen(false);
              setIsSupportOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Chat with Live Support →
          </button>
        </div>

      </div>
    </div>
  );
};
