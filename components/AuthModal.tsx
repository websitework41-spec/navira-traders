'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validatePakistaniMobile } from '@/lib/firebase';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
  } = useAuth();

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle phone input strictly limited to 11 digits (digits-only)
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 11);
    setPhone(digitsOnly);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Reset state on open/mode change
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const phoneCheck = validatePakistaniMobile(phone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || 'Please enter a valid Pakistani mobile number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(phoneCheck.cleanPhone, password);
      if (res.success) {
        setSuccessMessage('Signed in successfully! Welcome back.');
        setTimeout(() => {
          closeAuthModal();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const phoneCheck = validatePakistaniMobile(phone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || 'Please enter a valid Pakistani mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(name.trim(), phoneCheck.cleanPhone, password);
      if (res.success) {
        setSuccessMessage('Account created successfully! Welcome to Nawira Traders.');
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 text-white text-center relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#48afff]/20 text-[#48afff] border border-[#48afff]/30 text-[11px] font-bold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% PTA Verified Accounts
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {authModalMode === 'login' && 'Welcome Back'}
            {authModalMode === 'signup' && 'Create Nawira Traders Account'}
            {authModalMode === 'forgot' && 'Account Recovery'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {authModalMode === 'login' &&
              'Sign in with your Pakistani mobile number to track orders and fast checkout.'}
            {authModalMode === 'signup' &&
              'Register in seconds with Open-Parcel delivery and saved shipping addresses.'}
            {authModalMode === 'forgot' &&
              'Instant account verification and password assistance.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Number (Pakistan)
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold transition-colors ${
                      phone.length === 11
                        ? 'text-emerald-600'
                        : phone.length > 0
                        ? 'text-sky-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {phone.length}/11
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Format: 11-digits starting with 03 (e.g. 03001234567)</span>
                  {phone.length === 11 && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 11 Digits Complete
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] font-semibold text-[#136ab5] hover:text-[#136ab5] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-slate-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  New to Nawira Traders?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="font-bold text-[#136ab5] hover:text-[#136ab5] transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. SIGNUP MODE */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Number (Pakistan)
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold transition-colors ${
                      phone.length === 11
                        ? 'text-emerald-600'
                        : phone.length > 0
                        ? 'text-sky-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {phone.length}/11
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>11 digits starting with 03 (used to log in and track orders)</span>
                  {phone.length === 11 && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 11 Digits Complete
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Show passwords</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-semibold text-[#136ab5] hover:text-[#0d4775] cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] active:scale-98 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="font-bold text-[#136ab5] hover:text-[#136ab5] transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. FORGOT / ACCOUNT RECOVERY MODE */}
          {authModalMode === 'forgot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  Mobile Account Password Assistance
                </p>
                <p>
                  Nawira Traders accounts use secure mobile credentials. If you are already logged in, you can update your password directly from the <strong>My Account &gt; Security</strong> tab.
                </p>
                <p>
                  If you are locked out or forgot your password, contact our verified support helpline on WhatsApp from your registered SIM. Our team will verify your account and help you regain instant access.
                </p>
              </div>

              <a
                href={`https://wa.me/923018543131?text=${encodeURIComponent(
                  `Hi Nawira Traders! I forgot my account password. My registered mobile number is: ${phone || '03XXXXXXXXX'}. Please assist me with account recovery.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp Helpline (+92 301 8543131)</span>
              </a>

              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
