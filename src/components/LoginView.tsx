import React, { useState, useEffect } from 'react';
import {
  Phone,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Headphones,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Check,
  Copy,
  Users,
  Link as LinkIcon,
  Gift,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const {
    login,
    signUp,
    resetForgottenPassword,
    setIsSupportOpen,
    incomingReferralCode,
    incomingReferrerInfo,
    validateReferralCode,
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>(() => {
    // If incoming referral parameter was detected in URL, default directly to registration
    if (typeof window !== 'undefined' && (window.location.search.includes('ref=') || window.location.pathname.includes('/signup'))) {
      return 'SIGNUP';
    }
    return 'LOGIN';
  });

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(incomingReferralCode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);

  // Sync when incoming referral code is resolved
  useEffect(() => {
    if (incomingReferralCode && !referralCodeInput) {
      setReferralCodeInput(incomingReferralCode);
      setMode('SIGNUP');
    }
  }, [incomingReferralCode]);

  // Real-time validation of active referral code in the input
  const activeValidation = React.useMemo(() => {
    const code = referralCodeInput.trim();
    if (!code) return null;
    return validateReferralCode(code);
  }, [referralCodeInput, validateReferralCode]);

  // Formatted joining referral link preview
  const currentReferralLink = React.useMemo(() => {
    const code = referralCodeInput.trim() || incomingReferralCode.trim();
    if (!code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://winzopay-website.onrender.com';
    return `${origin}/signup?ref=${encodeURIComponent(code)}`;
  }, [referralCodeInput, incomingReferralCode]);

  // Copy helper
  const handleCopy = (text: string, type: 'CODE' | 'LINK') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'CODE') {
      setCopiedRefCode(true);
      setTimeout(() => setCopiedRefCode(false), 2000);
    } else {
      setCopiedRefLink(true);
      setTimeout(() => setCopiedRefLink(false), 2000);
    }
  };

  // Forgot password OTP simulation state
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const handleSendOtp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setError('');
    // Generate a realistic 6-digit OTP
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(generated);
    setOtpSent(true);
    setEnteredOtp(generated); // prefill for easy instant demo/testing while keeping realistic UI
    setOtpTimer(60);

    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'SIGNUP') {
        if (!fullName.trim()) {
          setError('Please enter your full name as per bank records.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please verify.');
          setLoading(false);
          return;
        }

        const res = await signUp(fullName.trim(), cleanPhone, password, undefined, referralCodeInput.trim());
        if (!res.success) {
          setError(res.message || 'Registration failed. Please check details.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Account registered in database! Opening trading dashboard...');
      } else if (mode === 'FORGOT') {
        if (password !== confirmPassword) {
          setError('New passwords do not match. Please verify.');
          setLoading(false);
          return;
        }

        if (otpSent && enteredOtp !== simulatedOtp && enteredOtp !== '123456') {
          setError('Invalid OTP code. Please enter the 6-digit verification code.');
          setLoading(false);
          return;
        }

        const res = await resetForgottenPassword(cleanPhone, password);
        if (!res.success) {
          setError(res.message || 'Password reset failed. Please check your mobile number.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Password updated successfully! Signing you into your dashboard...');
        
        // Auto-sign in with the newly reset password
        setTimeout(async () => {
          const loginRes = await login(cleanPhone, password);
          if (!loginRes.success) {
            setMode('LOGIN');
            setSuccessMsg('Password reset! Please log in with your new password.');
          }
        }, 1200);

      } else {
        const res = await login(cleanPhone, password);
        if (!res.success) {
          setError(res.message || 'Authentication failed. Please verify credentials.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Authentication successful! Loading your dashboard...');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error communicating with database.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoName: string, demoPhone: string) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // Attempt login or register if not existing
      let res = await login(demoPhone, 'demo1234');
      if (!res.success) {
        res = await signUp(demoName, demoPhone, 'demo1234');
      }
      if (!res.success) {
        setError(res.message || 'Unable to start demo session.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed demo authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Subtle Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="WinzoPay Logo"
            className="w-11 h-11 rounded-2xl object-cover shadow-lg border border-amber-400/40 bg-slate-950"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">WINZO<span className="text-blue-900">PAY</span></span>
              <span className="text-[10px] uppercase font-extrabold bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full">
                RP TRADING
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Pakistan's 24x7 Official Rummy Points Settlement Gateway
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSupportOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
        >
          <Headphones className="w-4 h-4 text-blue-900" />
          <span className="hidden sm:inline">24x7 Help Desk</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Platform Features (Visible on large screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Bank Settlement Engine</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Buy & Sell RP Instantly with <span className="text-blue-900">0% Commission</span>
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed">
              Sign in to your verified user account to deposit RP with instant QR & EasyPaisa / JazzCash / Raast verification, or cash out via 1Link / Raast straight to your bank account within minutes.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant QR & Wallets</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automated transaction ID verification</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">24x7 1Link / Raast Payouts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Direct settlement to any Pakistani Bank</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                <span>256-Bit Secure Database Authentication</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-900" />
                <span>Verified Beneficiary Transfers</span>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative">
              
              {/* Switcher Tabs */}
              {mode !== 'FORGOT' ? (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      mode === 'LOGIN'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGNUP');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      mode === 'SIGNUP'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register Account
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-xs border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[11px] font-extrabold text-blue-900 px-3 py-1 bg-blue-50 border border-blue-200 rounded-xl">
                    Password Recovery
                  </span>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'LOGIN'
                    ? 'Welcome Back'
                    : mode === 'SIGNUP'
                    ? 'Create Account'
                    : 'Reset Account Password'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {mode === 'LOGIN'
                    ? 'Enter your registered mobile number and password'
                    : mode === 'SIGNUP'
                    ? 'Get started in 30 seconds with 0% transaction charges'
                    : 'Verify your mobile number and set a new secure password'}
                </p>
              </div>

              {/* Error / Success Alerts */}
              {error && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Simulated OTP Notification Banner for Forgot Password */}
              {mode === 'FORGOT' && otpSent && simulatedOtp && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-950 text-xs font-medium rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span>SMS Verification OTP: <strong className="font-mono font-bold tracking-widest text-blue-900 text-sm bg-white px-2 py-0.5 rounded border border-blue-200">{simulatedOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(simulatedOtp)}
                    className="text-[10px] font-bold text-blue-900 bg-white border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {mode === 'SIGNUP' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name (Bank Record)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ahmed Khan"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Registered Mobile Number</label>
                    {mode === 'FORGOT' && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpTimer > 0}
                        className="text-[11px] text-blue-900 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:text-slate-400 disabled:no-underline"
                      >
                        <RefreshCw className={`w-3 h-3 ${otpTimer > 0 ? 'animate-spin' : ''}`} />
                        <span>{otpTimer > 0 ? `Resend in ${otpTimer}s` : otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative flex">
                    <div className="flex items-center px-3.5 bg-slate-50 border border-r-0 border-slate-300 rounded-l-2xl text-xs font-bold text-slate-600 gap-1.5 select-none">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>+92</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="300 1234567"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-r-2xl text-slate-900 text-xs font-bold tracking-wider focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* OTP Field in Forgot Password Mode */}
                {mode === 'FORGOT' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">6-Digit Verification Code (OTP)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder={otpSent ? "Enter 6-digit OTP received" : "Click 'Send OTP' above"}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-xs font-bold tracking-widest focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Password / New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {mode === 'FORGOT' ? 'New Password' : 'Password'}
                    </label>
                    {mode === 'LOGIN' && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('FORGOT');
                            setError('');
                            setSuccessMsg('');
                          }}
                          className="text-[11px] text-blue-900 hover:text-blue-700 hover:underline font-bold cursor-pointer transition-colors"
                        >
                          Forgot Password?
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setIsSupportOpen(true)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline font-medium cursor-pointer"
                        >
                          Help
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'SIGNUP'
                          ? 'Create at least 6 characters'
                          : mode === 'FORGOT'
                          ? 'Enter new password (min 6 chars)'
                          : 'Enter account password'
                      }
                      className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (for SIGNUP and FORGOT) */}
                {(mode === 'SIGNUP' || mode === 'FORGOT') && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {mode === 'FORGOT' ? 'Confirm New Password' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Referral Code & Joining Link Details (Only for SIGNUP mode) */}
                {mode === 'SIGNUP' && (
                  <div className="pt-2 flex flex-col gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-blue-900" />
                          <span>Referral Code (Inviter ID)</span>
                        </label>
                        {referralCodeInput && (
                          <button
                            type="button"
                            onClick={() => setReferralCodeInput('')}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                          >
                            Clear Code
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase().trim())}
                          placeholder="e.g. WZP-123456 (Optional)"
                          className={`w-full pl-10 pr-4 py-3 bg-white border rounded-2xl text-slate-900 text-xs font-mono font-bold tracking-wider focus:outline-none transition-all placeholder:text-slate-400 ${
                            activeValidation?.valid
                              ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20'
                              : referralCodeInput
                              ? 'border-amber-400 ring-1 ring-amber-400/30'
                              : 'border-slate-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900'
                          }`}
                        />
                      </div>

                      {/* Validation helper text */}
                      <div className="mt-1 px-1">
                        {activeValidation ? (
                          activeValidation.valid ? (
                            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Verified Inviter: <strong className="text-slate-900">{activeValidation.user?.userName}</strong> ({activeValidation.user?.referralCode || activeValidation.user?.userId})
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] font-semibold text-rose-600">
                              {activeValidation.message || 'Invalid referral code. Please verify or leave blank.'}
                            </p>
                          )
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Enter an inviter's referral code or join via an invitation link.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Prominent Referral Code & Referral Link Card (when valid or detected) */}
                    {(activeValidation?.valid || (incomingReferralCode && !activeValidation)) && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 text-slate-900 flex flex-col gap-2.5 shadow-2xs animate-fadeIn">
                        <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black text-blue-950 uppercase tracking-wider">
                              Referral Network Inviter
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active Link
                          </span>
                        </div>

                        {/* Inviter Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-xl border border-blue-100 flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Referring Trader</span>
                            <span className="font-extrabold text-slate-900 truncate">
                              {activeValidation?.user?.userName || incomingReferrerInfo?.referrerName || 'Winzo Trader'}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div className="flex flex-col truncate">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Referral Code</span>
                              <span className="font-mono font-extrabold text-blue-900 truncate">
                                {referralCodeInput || incomingReferralCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(referralCodeInput || incomingReferralCode, 'CODE')}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedRefCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Referral Link Display */}
                        {currentReferralLink && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Joining Referral Link</span>
                            <div className="flex items-center gap-1.5 bg-white p-1.5 pl-2.5 rounded-xl border border-blue-200">
                              <LinkIcon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                              <span className="text-[11px] font-mono text-slate-700 truncate select-all flex-1">
                                {currentReferralLink}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(currentReferralLink, 'LINK')}
                                className="px-2 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                {copiedRefLink ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-300" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500 leading-tight">
                          ℹ️ By completing registration, your account will be registered under this referral code and link in the database and dashboard.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'LOGIN'
                          ? 'Sign In to Dashboard'
                          : mode === 'SIGNUP'
                          ? 'Complete Registration'
                          : 'Reset Password & Sign In'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Forgot password mode alternate link */}
              {mode === 'FORGOT' && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
                  >
                    Remember your password? <span className="text-blue-900">Sign In</span>
                  </button>
                </div>
              )}

              {/* Quick Demo Access Divider (in LOGIN or SIGNUP mode) */}
              {mode !== 'FORGOT' && (
                <>
                  <div className="relative my-5 flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                      Or Instant Demo
                    </span>
                  </div>

                  {/* One-click Demo Trader Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('User', '3001234567')}
                    className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-900" />
                    <span>One-Click Guest User Login</span>
                  </button>
                </>
              )}

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-500">
                  By signing in, you agree to WinzoPay's Settlement Terms & Trading Policy.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>© 2026 WinzoPay RP Settlement Ltd.</span>
          <span>•</span>
          <span>All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>1Link Instant</span>
          <span>•</span>
          <span>Raast Direct</span>
          <span>•</span>
          <span>24x7 Escrow Protected</span>
        </div>
      </footer>
    </div>
  );
};
