import React, { useState, useMemo } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  UserCheck,
  Clock,
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Link as LinkIcon,
  Phone,
  Calendar,
  Wallet,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamMember } from '../types';

export const TeamView: React.FC = () => {
  const {
    userName,
    userId,
    userPhone,
    referralCode,
    referralLink,
    referredBy,
    referrerName,
    joinedViaReferralCode,
    joinedViaReferralLink,
    teamMembers,
    teamStats,
    setActiveTab,
    isLoggedIn,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJoinedLink, setCopiedJoinedLink] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showQrModal, setShowQrModal] = useState(false);

  const effectiveJoinedCode = joinedViaReferralCode || referredBy;
  const effectiveJoinedLink = joinedViaReferralLink || (effectiveJoinedCode ? `https://winzopay-website.onrender.com/signup?ref=${encodeURIComponent(effectiveJoinedCode)}` : '');

  // Copy referral link to clipboard
  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copy referral code to clipboard
  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyJoinedLink = () => {
    if (!effectiveJoinedLink) return;
    navigator.clipboard.writeText(effectiveJoinedLink);
    setCopiedJoinedLink(true);
    setTimeout(() => setCopiedJoinedLink(false), 2000);
  };

  // Native share handler with fallback
  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Join my WinzoPay Trading Team',
          text: `Join my team on WinzoPay! Register using my referral link or referral code ${referralCode}.`,
          url: referralLink,
        });
      } catch (err) {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    let list = [...teamMembers];
    const q = memberSearchQuery.toLowerCase().trim();

    if (q) {
      list = list.filter(
        m =>
          m.userName.toLowerCase().includes(q) ||
          m.userId.toLowerCase().includes(q) ||
          m.userPhone.includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.referralCode && m.referralCode.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'ACTIVE') {
      list = list.filter(m => m.accountStatus === 'Active');
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter(m => m.accountStatus === 'Inactive');
    }

    return list;
  }, [teamMembers, memberSearchQuery, statusFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12 text-slate-900 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  My Referral Team
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold">
                  Direct Level 1
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Build your trader network by sharing your unique link. Track your team members, active status, and deposit volume in real-time.
              </p>
            </div>
          </div>

          {/* Referred By Badge if registered via a referrer */}
          {referredBy && (
            <div className="bg-white/10 border border-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl text-left flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Referring Head</span>
                <span className="text-xs font-bold text-white">
                  {referrerName ? `${referrerName} (${referredBy})` : referredBy}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left = Referral Link & Invitation Card, Right = Team Stats & Member Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN (lg:col-span-5): Referral Link & Share Tools */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Unique Referral Link Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Your Referral Link</h2>
                  <p className="text-[11px] text-slate-500">Share with prospective team members</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="View QR Code"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>QR</span>
              </button>
            </div>

            {/* Referral Code Display Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Your Referral Code</span>
                <span className="text-base font-black text-slate-900 font-mono tracking-wider block mt-0.5">
                  {referralCode || 'WZP-TEAM'}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Referral URL Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Full Invitation Link</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-3 pr-24 text-xs font-mono text-slate-800 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy Link</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-blue-200" />
                <span>Share Invite</span>
              </button>
            </div>

            {/* How It Works Notice */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-900 shrink-0" />
                <h3 className="text-xs font-black text-slate-900">How Team Network Works</h3>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>When users click your link, your referral code is automatically applied at registration.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>Every joined member is permanently connected to your team overview.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>Track member deposit activity, active statuses, and joined dates in real-time.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Account Referral Origin / Joined Via Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  My Registration Referral Source
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                effectiveJoinedCode
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {effectiveJoinedCode ? 'Referred Trader' : 'Direct Signup'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Joined via Code</span>
                <span className="font-mono font-black text-slate-900 text-xs block mt-0.5 truncate">
                  {effectiveJoinedCode || 'WZP-DIRECT'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Inviter Name</span>
                <span className="font-extrabold text-blue-900 text-xs block mt-0.5 truncate">
                  {referrerName || (effectiveJoinedCode ? 'Referring Partner' : 'Official Portal')}
                </span>
              </div>
            </div>

            {effectiveJoinedLink && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Source Referral Link</span>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-mono text-slate-700 truncate select-all flex-1">
                    {effectiveJoinedLink}
                  </span>
                  <button
                    onClick={handleCopyJoinedLink}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-600 cursor-pointer"
                    title="Copy Source Link"
                  >
                    {copiedJoinedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Team Head Identity Badge */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-xs">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Team Leader</span>
                <h3 className="text-sm font-black text-slate-900">{userName || 'Active Trader'}</h3>
                <span className="text-xs text-slate-500 font-mono">+92 {userPhone || 'N/A'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Team Size</span>
              <span className="text-xl font-black text-blue-900 block">{teamStats.totalMembers}</span>
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN (lg:col-span-7): Team Metrics & Members Directory */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Team Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Total Team Members */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Total Team Members</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">{teamStats.totalMembers}</span>
                <span className="text-[10px] text-slate-400">Direct Level 1</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Active Members */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Active Traders</span>
                <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{teamStats.activeMembers}</span>
                <span className="text-[10px] text-emerald-700 font-medium">With active balances/deposits</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Total Team Deposits */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Total Team Deposits</span>
                <span className="text-2xl font-black text-blue-900 mt-0.5 block">
                  Rs. {teamStats.totalDeposits.toLocaleString('en-PK')}
                </span>
                <span className="text-[10px] text-slate-400">Sum of successful deposits</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Members Directory Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  Team Members Directory ({filteredMembers.length})
                </h3>
                <p className="text-xs text-slate-500">Members who registered using your referral code</p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({teamMembers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Active ({teamStats.activeMembers})
                </button>
                <button
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-white text-slate-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inactive ({teamMembers.length - teamStats.activeMembers})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search member by name, mobile number, or User ID..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
              {memberSearchQuery && (
                <button
                  onClick={() => setMemberSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Member List or Empty State */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 shadow-xs">
                  <Users className="w-7 h-7 text-blue-800" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {teamMembers.length === 0 ? 'No Team Members Yet' : 'No matching members found'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {teamMembers.length === 0
                      ? 'Share your unique referral link to invite your first trader. When they register, they will appear here.'
                      : `No members match your search "${memberSearchQuery}". Try resetting your filter.`}
                  </p>
                </div>
                {teamMembers.length === 0 ? (
                  <button
                    onClick={handleCopyLink}
                    className="mt-1 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy & Share Referral Link
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMemberSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="text-xs text-blue-900 font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-3">Member Details</th>
                      <th className="p-3">Join Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Total Deposits</th>
                      <th className="p-3 text-right">Deposit Count</th>
                      <th className="p-3 text-right">Last Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMembers.map((member, idx) => {
                      const formattedDate = new Date(member.joinedDate).toLocaleDateString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const lastDepFormatted = member.lastDepositDate
                        ? new Date(member.lastDepositDate).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'No deposits yet';

                      return (
                        <tr key={member.userId || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Member Details */}
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                                {member.userName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-900 text-xs">{member.userName}</span>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                  <span>+92 {member.userPhone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">UID: {member.userId}</span>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                    Joined: {member.joinedViaCode || referralCode || 'Direct'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Join Date */}
                          <td className="p-3 text-slate-600">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            {member.accountStatus === 'Active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Total Deposits */}
                          <td className="p-3 text-right">
                            <span className="font-extrabold text-slate-900">
                              Rs. {member.totalDeposits.toLocaleString('en-PK')}
                            </span>
                          </td>

                          {/* Deposit Count */}
                          <td className="p-3 text-right font-medium text-slate-600">
                            {member.depositCount} {member.depositCount === 1 ? 'tx' : 'txs'}
                          </td>

                          {/* Last Deposit */}
                          <td className="p-3 text-right text-[11px] text-slate-500">
                            {lastDepFormatted}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* QR Code Share Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Referral QR Code</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                {/* SVG QR Code Simulation */}
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Referral Code</span>
                <span className="text-base font-black text-slate-900 font-mono block">{referralCode}</span>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Scan to open WinzoPay registration with your code attached.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  handleCopyLink();
                  setShowQrModal(false);
                }}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
