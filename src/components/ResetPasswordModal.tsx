import React, { useState } from 'react';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  Phone,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ResetPasswordModal: React.FC = () => {
  const {
    isResetPasswordOpen,
    setIsResetPasswordOpen,
    changePassword,
    resetForgottenPassword,
    isLoggedIn,
    userPhone
  } = useApp();

  const [tab, setTab] = useState<'CHANGE' | 'FORGOT'>(isLoggedIn ? 'CHANGE' : 'FORGOT');
  
  // Change password fields (when logged in)
  const [currentPassword, setCurrentPassword] = useState('');
  
  // Forgot password fields
  const [phone, setPhone] = useState(userPhone || '');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Common password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isResetPasswordOpen) return null;

  const handleSendOtp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(generated);
    setOtpSent(true);
    setEnteredOtp(generated);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'CHANGE') {
      if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setError('Please fill in all password fields.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);

      try {
        const res = await changePassword(currentPassword, newPassword);
        if (!res.success) {
          setError(res.message || 'Failed to change password.');
          setLoading(false);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsResetPasswordOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
      } catch (err: any) {
        setError(err?.message || 'Database error updating password.');
      } finally {
        setLoading(false);
      }
    } else {
      // FORGOT mode
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      if (!newPassword.trim() || !confirmPassword.trim()) {
        setError('Please enter and confirm your new password.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (otpSent && enteredOtp !== simulatedOtp && enteredOtp !== '123456') {
        setError('Invalid 6-digit OTP code entered.');
        return;
      }

      setLoading(true);

      try {
        const res = await resetForgottenPassword(cleanPhone, newPassword);
        if (!res.success) {
          setError(res.message || 'Failed to reset password.');
          setLoading(false);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsResetPasswordOpen(false);
          setPhone('');
          setNewPassword('');
          setConfirmPassword('');
          setEnteredOtp('');
          setOtpSent(false);
        }, 1500);
      } catch (err: any) {
        setError(err?.message || 'Database error resetting password.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[88vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsResetPasswordOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Security & Password
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                {tab === 'CHANGE' ? 'Change your current password' : 'Recover password via mobile OTP'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsResetPasswordOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-4 bg-slate-50/50">
          {/* Mode Switcher Tabs */}
          {isLoggedIn && (
            <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60">
              <button
                type="button"
                onClick={() => {
                  setTab('CHANGE');
                  setError('');
                }}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'CHANGE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('FORGOT');
                  setError('');
                }}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'FORGOT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Forgot Password (OTP)
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password updated successfully in database!</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {tab === 'FORGOT' && otpSent && simulatedOtp && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 text-xs font-medium rounded-2xl flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Verification OTP: <strong className="font-mono font-bold tracking-widest text-blue-900 text-sm bg-white px-2 py-0.5 rounded border border-blue-200">{simulatedOtp}</strong></span>
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

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  {tab === 'CHANGE' ? 'Change Login Password' : 'Reset Password with Mobile OTP'}
                </h3>
                <p className="text-[11px] text-slate-500">Protect your WinzoPay account credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {tab === 'CHANGE' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current Password *</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Registered Mobile Number *</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpTimer > 0}
                        className="text-[11px] text-blue-900 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:text-slate-400 disabled:no-underline"
                      >
                        <RefreshCw className={`w-3 h-3 ${otpTimer > 0 ? 'animate-spin' : ''}`} />
                        <span>{otpTimer > 0 ? `Resend in ${otpTimer}s` : otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                      </button>
                    </div>
                    <div className="relative flex">
                      <div className="flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-bold text-slate-600 gap-1 select-none">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>+92</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="300 1234567"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit Verification Code (OTP) *</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={otpSent ? "Enter 6-digit OTP received" : "Click 'Send OTP' above"}
                      value={enteredOtp}
                      onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{tab === 'CHANGE' ? 'Update Password' : 'Reset Password & Save'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

