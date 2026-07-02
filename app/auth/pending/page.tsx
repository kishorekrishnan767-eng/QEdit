'use client';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PendingPage() {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  useEffect(() => {
    let mounted = true;
    
    async function checkStatus() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const res = await fetch('/api/auth/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        if (!res.ok) return;
        const data = await res.json();
        
        if (mounted && (data.access === 'approved' || data.access === 'admin')) {
          router.push('/dashboard');
          router.refresh();
        }
      } catch {
        // ignore network errors during polling
      }
    }

    // Check instantly on load
    checkStatus();

    // Then poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

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
              Awaiting <br/>
              <span style={{ color: '#86efac' }}>Approval</span>.
            </h1>
            <p className="text-xl xl:text-2xl font-light leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Your account has been registered. An administrator will review your access request shortly.
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-yellow-50 border-2 border-yellow-100">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Pending Review</h2>
            <p className="text-base text-gray-500 font-medium leading-relaxed">
              We have received your registration securely. Access must be granted by an administrator before you can proceed.
            </p>
          </div>

          <div className="rounded-xl px-5 py-5 mb-8 bg-gray-50 border border-gray-200 shadow-inner">
            <p className="text-sm font-bold text-gray-600 leading-relaxed">
              When approved, just sign in normally and you will be routed directly to the system dashboard!
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-4 px-4 rounded-xl font-bold text-base bg-white text-gray-700 border-2 border-gray-200 shadow-sm transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
          
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
