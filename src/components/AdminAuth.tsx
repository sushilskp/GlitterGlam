import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, UserRole, addAuditLog } from '../lib/supabaseClient';
import { KeyRound, Mail, User, ShieldCheck, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminAuthProps {
  onSuccess: (userData: { name: string; email: string; role: UserRole; id: string }) => void;
}

export default function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if password reset token is present in the URL (Supabase recovery redirect)
  useEffect(() => {
    // Supabase standard recovery URL contains type=recovery or access_token in hash/query
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || hash.includes('access_token=')) {
      setView('reset');
      setSuccessMsg("✓ Password recovery link recognized. Please specify your new password below.");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setErrorMsg("Database authentication is not configured in this environment.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Retrieve role preference either from profile table or user metadata
        let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
        let userRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'Customer';

        try {
          // Double check database user_profiles table for RBAC authority
          const { data: dbProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          if (dbProfile) {
            userRole = (dbProfile.role as UserRole) || 'Customer';
            userName = dbProfile.name || userName;
          }
        } catch (dbErr) {
          console.warn("Non-blocking DB Profile look-up skip:", dbErr);
        }

        onSuccess({ name: userName, email: data.user.email || '', role: userRole, id: data.user.id });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email address or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setErrorMsg("Database authentication is not configured in this environment.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + (window.location.hash ? window.location.hash : '#admin'),
      });
      if (error) throw error;
      setSuccessMsg("✓ Password reset email issued successfully! Please check your mailbox folder.");
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setErrorMsg("Database authentication is not configured in this environment.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMsg("✓ Password updated successfully! Redirecting to login view...");
      setTimeout(() => {
        setView('login');
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update system login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-stone-900 border border-[#C9A66B]/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#FDFBF8] font-sans">
      
      {/* Brand logo header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/30 mb-3 text-stone-100">
          <ShieldCheck className="w-7 h-7 text-[#C9A66B]" />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#C9A66B] uppercase">
          {view === 'login' && 'Staff Verification'}
          {view === 'signup' && 'Register Account'}
          {view === 'forgot' && 'Reset Credential'}
          {view === 'reset' && 'Define Password'}
        </h2>
        <p className="text-[10px] tracking-widest text-[#A67C52] font-mono mt-1.5 uppercase">
          {view === 'login' && 'Verify credential to enter vault'}
          {view === 'signup' && 'Instantiate administrative authorization'}
          {view === 'forgot' && 'Issue tokenized self-service link'}
          {view === 'reset' && 'Specify updated secure hash password'}
        </p>
      </div>

      {/* Message banners */}
      {errorMsg && (
        <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-100 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-100 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Login Form view */}
      {view === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-800/80 border border-stone-700 focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] rounded-lg pl-11 pr-4 py-2.5 text-xs text-[#FDFBF8] transition-all placeholder:text-stone-600 focus:outline-none"
                placeholder="admin@glitterglam.in"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 font-medium">Password Shield</label>
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="text-[10px] text-[#C9A66B] hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-800/80 border border-stone-700 focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] rounded-lg pl-11 pr-11 py-2.5 text-xs text-[#FDFBF8] transition-all placeholder:text-stone-600 focus:outline-none"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A66B] hover:bg-[#A67C52] text-[#1D1D1D] font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Assert Authorization Key</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-500">
            <p className="text-[10px] text-stone-400 font-mono tracking-wider leading-relaxed">
              🔒 ADMINISTRATIVE PORTAL CLEARANCE. NEW OPERATORS AND STAFF ACCOUNTS ARE DEPLOYED BY THE LEAD ADMINISTRATOR DIRECTLY IN THE SUPABASE USER PROFILES ENGINE.
            </p>
          </div>
        </form>
      )}

      {/* Forgot Password view */}
      {view === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-stone-400 text-center leading-relaxed mb-4">
            Enter your active system email address. We will broadcast a secure, cryptographic pass-phrase adjustment token.
          </p>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-800/80 border border-stone-700 focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] rounded-lg pl-11 pr-4 py-2.5 text-xs text-[#FDFBF8] transition-all placeholder:text-stone-600 focus:outline-none"
                placeholder="admin@glitterglam.in"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A66B] hover:bg-[#A67C52] text-[#1D1D1D] font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Transmit Reset Request</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-500">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setView('login');
              }}
              className="text-stone-400 hover:text-white underline font-medium"
            >
              ← Cancel and Return to Sign In
            </button>
          </div>
        </form>
      )}

      {/* Reset Password view */}
      {view === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-stone-400 text-center leading-relaxed mb-4">
            Authorized recovery verified. Enter your newly desired passwords below to stamp and commit database keys.
          </p>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5 font-medium">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-800/80 border border-stone-700 focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] rounded-lg pl-11 pr-4 py-2.5 text-xs text-[#FDFBF8] transition-all placeholder:text-stone-600 focus:outline-none"
                placeholder="Specify new secure password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A66B] hover:bg-[#A67C52] text-[#1D1D1D] font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Lock-In New Password</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-500">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setView('login');
              }}
              className="text-stone-400 hover:text-white underline font-medium"
            >
              ← Back to login
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
