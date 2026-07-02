'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setSuccessMsg('Account created! Please sign in.');
    }
    if (searchParams.get('reset') === '1') {
      setSuccessMsg('Password updated! Please sign in with your new password.');
    }
    if (searchParams.get('error') === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
    if (searchParams.get('error') === 'rejected') {
      setError('Your access request has been rejected. Please contact the administrator.');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email — check your inbox.');
      } else if (msg.includes('user not found')) {
        setError('No account found with this email. Please register first.');
      } else {
        setError(signInError.message);
      }
      setEmailLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.access === 'admin' || data.access === 'approved') router.push('/dashboard');
      else if (data.access === 'rejected') {
        await supabase.auth.signOut();
        setError('Your access has been rejected. Contact the administrator.');
        setEmailLoading(false);
        return;
      } else router.push('/auth/pending');
      router.refresh();
    } catch {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex w-full" style={{ background: '#f9fafc' }}>
      
      {/* Left immersive panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] xl:w-[60%] p-16 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(220deg, #1e3c2f 0%, #2a7d5f 50%, #153325 100%)',
          boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.1)' 
        }}
      >
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 60%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 60%)', transform: 'translate(-20%, 20%)' }} />
        
        {/* Modern Dot Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="inline-block self-start">
            <div className="flex items-center gap-4">
              <Image src="/logohead.png" alt="QEdit Icon" width={64} height={64} className="w-14 h-auto object-contain" priority />
              <span className="text-white font-extrabold text-5xl tracking-tighter drop-shadow-sm">QEdit</span>
            </div>
            <div className="h-1.5 w-full rounded-full mt-3" style={{ background: '#4ade80' }}></div>
          </div>

          <div className="mt-auto mb-32 max-w-3xl">
            <h1 className="text-5xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8 drop-shadow-md">
              The smart way to <br/>
              <span style={{ color: '#86efac' }}>create</span> question papers.
            </h1>
            <p className="text-xl xl:text-2xl font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
              A modern platform designed for educators to easily build, organize, and export professional exam papers.
            </p>
          </div>
          
          {/* Emphasized Crafted By */}
          <div className="mt-auto pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <p className="text-lg font-medium flex items-center gap-2 text-white">
              <span className="opacity-80">Crafted with</span> 
              <span className="text-xl animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.5))' }}>💚</span> 
              <span className="opacity-80">by</span> 
              <strong className="tracking-wide text-[#86efac]">Chan&apos;s Team</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Right Login Form Box */}
      <div className="flex-1 w-full lg:w-[45%] xl:w-[40%] min-w-[460px] flex items-center justify-center p-10 lg:p-12 z-20 bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.06)] overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Logo in Form View */}
          <div className="mb-10 flex items-center gap-3">
             <Image src="/logohead.png" alt="QEdit Icon" width={56} height={56} className="w-12 h-auto object-contain" priority />
             <span className="text-4xl font-extrabold tracking-tighter text-gray-900">QEdit</span>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-base text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {successMsg && (
            <div className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading || emailLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm bg-white text-gray-700 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700">Password</label>
                <Link href="/auth/forgot-password" className="text-sm font-bold text-[#2a7d5f] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-base bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900 pr-12"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    letterSpacing: !showPassword && password.length > 0 ? '0.2em' : 'normal'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2a7d5f] transition-colors"
                >
                  {showPassword
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={emailLoading || loading}
              className="w-full py-4 mt-2 px-4 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', boxShadow: '0 8px 20px -6px rgba(42,125,95,0.5)' }}
            >
              {emailLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-bold text-[#2a7d5f] hover:underline hover:text-[#1a4731]">
              Apply for access
            </Link>
          </p>
          
          <div className="mt-8 lg:hidden flex justify-center pb-8 border-t border-gray-100 pt-6">
            <p className="text-sm font-medium flex items-center gap-1.5 text-gray-400">
              Crafted with <span>💚</span> by Chan&apos;s Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#2a7d5f] animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
