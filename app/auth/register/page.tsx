'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signUpError) {
      if (
        signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already been registered')
      ) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (signInError) {
      router.push('/auth?registered=1');
      return;
    }

    try {
      const res = await fetch('/api/auth/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to process authorization. Has the database been setup?');
        setLoading(false);
        return;
      }

      if (data.access === 'admin' || data.access === 'approved') router.push('/dashboard');
      else router.push('/auth/pending');
      router.refresh();
    } catch {
      setError('Network error preventing access check.');
      setLoading(false);
    }
  };

  const EyeButton = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2a7d5f] transition-colors bg-white pl-2"
    >
      {show
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

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
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 60%)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 60%)', transform: 'translate(20%, 20%)' }} />
        
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
              Design better <br/>
              <span style={{ color: '#86efac' }}>assessments</span> in minutes.
            </h1>
            <p className="text-xl xl:text-2xl font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Join our platform to streamline your question paper creation and deliver high-quality exams with ease.
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

      {/* Right Register Form Box */}
      <div className="flex-1 w-full lg:w-[45%] xl:w-[40%] min-w-[460px] flex items-center justify-center p-6 lg:p-8 z-20 bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.06)] overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto py-2">
          <div className="mb-5 flex items-center gap-3">
             <Image src="/logohead.png" alt="QEdit Icon" width={48} height={48} className="w-10 h-auto object-contain" priority />
             <span className="text-3xl font-extrabold tracking-tighter text-gray-900">QEdit</span>
          </div>

          <div className="mb-6 text-left">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Create Account</h2>
            <p className="text-sm text-gray-500 font-medium">Apply for access to QEdit.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-gray-700 shadow-sm border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 mb-4"
          >
            {googleLoading ? (
               <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-[11px] font-bold text-gray-400">OR REGISTER WITH EMAIL</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                required
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900 pr-12"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    letterSpacing: !showPassword && password.length > 0 ? '0.2em' : 'normal'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                />
                <EyeButton show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>
              
              {password.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 px-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500 bg-gray-200 overflow-hidden">
                       <div className="h-full rounded-full transition-all duration-500" 
                         style={{ 
                           width: password.length >= [1, 6, 10, 14][i] ? '100%' : '0%',
                           background: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][i] 
                         }} 
                       />
                    </div>
                  ))}
                  <span className="text-[11px] font-bold uppercase tracking-wider ml-1 w-12 text-right" style={{ color: password.length < 6 ? '#ef4444' : password.length < 10 ? '#f59e0b' : password.length < 14 ? '#3b82f6' : '#22c55e' }}>
                    {password.length < 6 ? 'Weak' : password.length < 10 ? 'Fair' : password.length < 14 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border-2 transition-all outline-none text-gray-900 pr-12 focus:bg-white"
                  style={{
                    borderColor: confirmPassword && password !== confirmPassword ? '#fca5a5' : 'transparent',
                    boxShadow: confirmPassword && password !== confirmPassword 
                        ? '0 0 0 1px #fee2e2' 
                        : 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    letterSpacing: !showConfirm && confirmPassword.length > 0 ? '0.2em' : 'normal'
                  }}
                  onFocus={(e) => { 
                    e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? '#fca5a5' : '#2a7d5f'; 
                  }}
                  onBlur={(e) => { 
                    e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? '#fca5a5' : 'transparent'; 
                  }}
                />
                <EyeButton show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs font-bold mt-2 text-red-500 pl-1 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', boxShadow: '0 8px 20px -6px rgba(42,125,95,0.5)' }}
            >
              {loading ? 'Submitting Application...' : 'Apply for Access'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-gray-500">
            Already have an account?{' '}
            <Link href="/auth" className="font-bold text-[#2a7d5f] hover:underline hover:text-[#1a4731]">
              Sign in here
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
