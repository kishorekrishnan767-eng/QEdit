'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        let msg = 'Failed to reset password. Please try again.';
        try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore html */ }
        setError(msg);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth?reset=1'), 2500);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const EyeButton = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2a7d5f] transition-colors bg-transparent pl-2"
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
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 60%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 60%)', transform: 'translate(-20%, 20%)' }} />
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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

      {/* Right Form Box */}
      <div className="flex-1 w-full lg:w-[45%] xl:w-[40%] min-w-[460px] flex items-center justify-center p-10 lg:p-12 z-20 bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.06)] overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto py-8">
          <div className="mb-10 flex items-center gap-3">
             <Image src="/logohead.png" alt="QEdit Icon" width={56} height={56} className="w-12 h-auto object-contain" priority />
             <span className="text-4xl font-extrabold tracking-tighter text-gray-900">QEdit</span>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Setup New Password</h2>
            <p className="text-base text-gray-500 font-medium">
              {success ? "Saved successfully!" : "Enter your secure new password."}
            </p>
          </div>

          {success ? (
            <div className="rounded-xl px-5 py-6 text-center border-2 border-emerald-100 bg-emerald-50 mb-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-bold text-emerald-800 mb-2">Password Updated!</p>
              <p className="text-sm font-medium text-emerald-600">
                You will be redirected to log in momentarily.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  <span>
                    {error}
                    {error.includes('request a new') && (
                      <Link href="/auth/forgot-password" className="block mt-1 font-bold underline text-red-800">
                        Request new link
                      </Link>
                    )}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl text-base bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900"
                      disabled={!token}
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                    />
                    <EyeButton show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl text-base bg-gray-50 border-2 transition-all outline-none text-gray-900 focus:bg-white"
                      disabled={!token}
                      style={{
                        borderColor: confirmPassword && password !== confirmPassword ? '#fca5a5' : 'transparent',
                        boxShadow: confirmPassword && password !== confirmPassword ? '0 0 0 1px #fee2e2' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? '#fca5a5' : '#2a7d5f'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? '#fca5a5' : 'transparent'; }}
                    />
                    <EyeButton show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs font-bold mt-2 text-red-500 pl-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-4 mt-4 px-4 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', boxShadow: '0 8px 20px -6px rgba(42,125,95,0.5)' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#2a7d5f] animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
