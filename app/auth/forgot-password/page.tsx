'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!res.ok) {
        let msg = 'Something went wrong. Please try again.';
        try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore */ }
        setError(msg);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
    setLoading(false);
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
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Forgot Password</h2>
            <p className="text-base text-gray-500 font-medium">
              {sent ? "We've sent you a reset link." : "Enter your email to receive a reset link."}
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl px-5 py-6 text-center border-2 border-emerald-100 bg-emerald-50 mb-8">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-lg font-bold text-emerald-800 mb-2">Reset link sent!</p>
              <p className="text-sm font-medium text-emerald-600">
                If this email is registered, you&apos;ll receive a link within a few minutes. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-base bg-gray-50 border-2 border-transparent focus:bg-white transition-all outline-none text-gray-900"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 px-4 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #2a7d5f 0%, #1e6b4f 100%)', boxShadow: '0 8px 20px -6px rgba(42,125,95,0.5)' }}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Remembered your password?{' '}
            <Link href="/auth" className="font-bold text-[#2a7d5f] hover:underline hover:text-[#1a4731]">
              Sign in
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
