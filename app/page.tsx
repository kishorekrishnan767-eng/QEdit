'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

function AnimatedCursor() {
  const [pos, setPos] = useState({ x: 55, y: 45 });

  useEffect(() => {
    const keyframes = [
      { x: 20, y: 15 }, { x: 80, y: 12 }, { x: 60, y: 35 },
      { x: 35, y: 15 }, { x: 15, y: 30 }, { x: 75, y: 25 },
      { x: 50, y: 10 }, { x: 20, y: 15 },
    ];
    let frame = 0;
    let t = 0;
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
    const step = () => {
      const curr = keyframes[frame];
      const next = keyframes[(frame + 1) % keyframes.length];
      t += 0.007;
      if (t >= 1) { t = 0; frame = (frame + 1) % keyframes.length; }
      setPos({ x: lerp(curr.x, next.x, t), y: lerp(curr.y, next.y, t) });
    };
    const id = setInterval(step, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      {/* Soft glow behind cursor */}
      <div style={{
        position: 'absolute', top: -8, left: -4,
        width: 60, height: 60, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, transparent 70%)',
        filter: 'blur(6px)',
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      {/* Original first cursor — big, clean, rounded corners */}
      <svg width="52" height="60" viewBox="0 0 24 28" fill="none"
        style={{ filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.8)) drop-shadow(0 2px 6px rgba(0,0,0,0.5))', display: 'block' }}>
        {/* Outer light green border */}
        <path d="M3 2L21 14L12 15L8 26L3 2Z"
          fill="none"
          stroke="#a7f3d0"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Inner cursor fill, corner radiused using its own thick stroke */}
        <path d="M3 2L21 14L12 15L8 26L3 2Z"
          fill="#1a3d2b"
          stroke="#1a3d2b"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* Label */}
      <div style={{
        position: 'absolute', left: 46, top: 4,
        background: 'linear-gradient(135deg, #2a7d5f, #1a5c43)',
        color: 'white', fontSize: 10, fontWeight: 800,
        padding: '3px 9px', borderRadius: 99,
        whiteSpace: 'nowrap',
        boxShadow: '0 0 14px rgba(42,125,95,0.8)',
        letterSpacing: '0.05em',
      }}>
        QEdit ✦
      </div>
    </div>
  );
}





export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', whatsapp: '', organization: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', whatsapp: '', organization: '', message: '' });
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4ade80', '#2a7d5f', '#a7f3d0'], zIndex: 9999 });
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    // Initialize upon mount
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-[#c4e5d3] selection:text-[#1e3c2f] font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav 
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? 'backdrop-blur-xl shadow-sm' 
            : 'bg-transparent border-transparent'
        }`} 
        style={isScrolled ? {
          background: 'rgba(235, 248, 241, 0.95)',
          borderBottomColor: 'rgba(42,125,95,0.18)',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <Image src="/logohead.png" alt="QEdit" width={48} height={48} className="w-11 h-auto object-contain" priority />
            <span className="text-2xl font-extrabold tracking-tighter" style={{ color: '#1a3d2b' }}>QEdit</span>
          </div>
          {/* Right side — nav links + auth */}
          <div className="flex items-center gap-7">
            <div className="hidden md:flex items-center gap-7">
              <Link href="#" className="text-lg font-semibold hover:opacity-70 transition-opacity" style={{ color: '#2a7d5f' }}>About</Link>
              <Link href="#" className="text-lg font-semibold hover:opacity-70 transition-opacity" style={{ color: '#2a7d5f' }}>Features</Link>
              <Link href="#" className="text-lg font-semibold hover:opacity-70 transition-opacity" style={{ color: '#2a7d5f' }}>Docs</Link>
              <Link href="#contact" className="text-lg font-semibold hover:opacity-70 transition-opacity" style={{ color: '#2a7d5f' }}>Contact</Link>
            </div>
            <Link href="/auth" className="px-7 py-3 rounded-full text-lg font-bold text-white bg-[#2a7d5f] hover:bg-[#1f5e47] transition-colors">Get Started &rarr;</Link>
          </div>
        </div>
      </nav>


      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-28 lg:pt-40 lg:pb-36">
          
          {/* Checkered Grid Background with Filled Blocks and Skew */}
          <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none z-0 overflow-hidden">
            {/* The skew container - shifted out slightly so the corners don't show a gap */}
            <div className="absolute -inset-30 skew-y-6 opacity-60">
              <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* The 40x40 Grid */}
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a7d5f" strokeWidth="1.5" strokeOpacity="0.6" />
                  </pattern>
                  {/* The scattered filled squares mapped exactly to the grid */}
                  <pattern id="filled-squares" width="480" height="480" patternUnits="userSpaceOnUse">
                    <rect x="80"  y="0"   width="80"  height="40"  fill="#2a7d5f" fillOpacity="0.18" />
                    <rect x="320" y="0"   width="40"  height="80"  fill="#4ade80" fillOpacity="0.14" />

                    <rect x="40"  y="80"  width="40"  height="40"  fill="#2a7d5f" fillOpacity="0.20" />
                    <rect x="200" y="80"  width="80"  height="40"  fill="#4ade80" fillOpacity="0.14" />
                    <rect x="440" y="80"  width="40"  height="80"  fill="#2a7d5f" fillOpacity="0.16" />

                    <rect x="160" y="160" width="40"  height="80"  fill="#2a7d5f" fillOpacity="0.18" />
                    <rect x="360" y="160" width="80"  height="40"  fill="#4ade80" fillOpacity="0.13" />

                    <rect x="0"   y="240" width="40"  height="40"  fill="#4ade80" fillOpacity="0.15" />
                    <rect x="280" y="240" width="80"  height="40"  fill="#2a7d5f" fillOpacity="0.18" />

                    <rect x="80"  y="320" width="40"  height="80"  fill="#4ade80" fillOpacity="0.14" />
                    <rect x="360" y="320" width="80"  height="40"  fill="#2a7d5f" fillOpacity="0.16" />

                    <rect x="200" y="400" width="80"  height="40"  fill="#2a7d5f" fillOpacity="0.18" />
                    <rect x="440" y="440" width="40"  height="40"  fill="#4ade80" fillOpacity="0.14" />
                  </pattern>
                </defs>
                {/* Draw Filled Squares layer */}
                <rect width="100%" height="100%" fill="url(#filled-squares)" />
                {/* Draw the Grid lines over top */}
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>
            {/* A soft fade out mask at the bottom so it blends with content */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/80 to-white"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 bg-[#e8f5ee] text-[#2a7d5f] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-[#c4e5d3] mb-8">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Built for SRM & Educational Institutions
            </div>

            <h1 className="text-5xl lg:text-[4.5rem] font-black tracking-tight text-gray-900 mb-6 leading-[1.08]">
              The intelligent platform for <br className="hidden md:block"/>
              <span className="text-[#2a7d5f]">academic assessments.</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
              Design, manage, and export professional question papers in minutes. Real-time split-pane editing, Bloom&apos;s Taxonomy tagging, and one-click PDF generation — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="#" 
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-bold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-0.5">
                View Docs
              </Link>
              <Link href="/auth" 
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-bold text-white bg-[#2a7d5f] hover:bg-[#1f5e47] shadow-[0_8px_20px_rgba(42,125,95,0.3)] hover:shadow-[0_12px_25px_rgba(42,125,95,0.4)] transition-all hover:-translate-y-0.5">
                Login to Dashboard
              </Link>
            </div>
            
            {/* Editor Preview Card Wrapper */}
            <div className="relative mt-16 max-w-5xl mx-auto group">
              {/* Glowing gradient aura behind the card */}
              <div className="absolute -inset-8 bg-linear-to-r from-[#2a7d5f]/40 via-[#4ade80]/50 to-[#2a7d5f]/40 blur-[80px] opacity-80 group-hover:opacity-100 transition-opacity duration-700 rounded-[60px]"></div>
              
              {/* Editor Preview Card with animated cursor */}
              <div className="relative border border-gray-200/80 rounded-[28px] p-1.5 bg-white shadow-[0_32px_80px_-15px_rgba(0,0,0,0.15)]">
              {/* Toolbar strip */}
              <div className="bg-[#f0f2f4] rounded-t-[20px] px-4 py-2.5 flex items-center gap-2 border-b border-gray-200/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-md px-4 py-1 text-[10px] font-semibold text-gray-400 border border-gray-200 w-48">qedit.vercel.app/editor</div>
                </div>
              </div>
              
               <div className="aspect-video w-full rounded-b-[20px] bg-white overflow-visible relative flex shadow-inner">
                  {/* Animated cursor */}
                  <AnimatedCursor />
                  
                  {/* Editor Left Pane */}
                  <div className="w-[44%] h-full bg-[#f8f9fc] border-r border-gray-200 p-5 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-[#2a7d5f]/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/4"></div>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                       <div className="flex gap-1.5">
                         <div className="h-5 w-14 bg-[#2a7d5f] rounded-md opacity-80"></div>
                         <div className="h-5 w-14 bg-gray-200 rounded-md"></div>
                       </div>
                       <div className="h-5 w-20 bg-gray-200 rounded-md"></div>
                    </div>
                    {/* Header form card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-16 bg-gray-300 rounded"></div>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <div className="h-7 bg-gray-100 rounded-lg border border-gray-200"></div>
                         <div className="h-7 bg-gray-100 rounded-lg border border-gray-200"></div>
                         <div className="h-7 bg-gray-100 rounded-lg border border-gray-200"></div>
                         <div className="h-7 bg-gray-100 rounded-lg border border-gray-200"></div>
                       </div>
                    </div>
                    {/* Question card highlighted */}
                    <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-sm flex flex-col gap-2 relative overflow-hidden flex-1">
                       <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2a7d5f] rounded-l-xl"></div>
                       <div className="flex items-center justify-between pl-2">
                         <div className="h-2.5 w-20 bg-emerald-100 rounded"></div>
                         <div className="flex gap-1">
                           <div className="h-4 w-6 bg-orange-100 rounded text-[8px] flex items-center justify-center font-bold text-orange-500">BL</div>
                           <div className="h-4 w-6 bg-blue-100 rounded text-[8px] flex items-center justify-center font-bold text-blue-500">CO</div>
                           <div className="h-4 w-6 bg-purple-100 rounded text-[8px] flex items-center justify-center font-bold text-purple-500">PO</div>
                         </div>
                       </div>
                       <div className="pl-2 flex flex-col gap-2">
                         <div className="h-2 w-full bg-gray-100 rounded"></div>
                         <div className="h-2 w-4/5 bg-gray-100 rounded"></div>
                         <div className="h-2 w-3/5 bg-gray-100 rounded"></div>
                       </div>
                    </div>
                    {/* Bottom buttons */}
                    <div className="flex gap-2 mt-auto">
                      <div className="h-7 px-3 bg-[#2a7d5f] rounded-lg opacity-90 flex items-center justify-center gap-1">
                        <span style={{ fontSize: 8, color: '#fff', fontWeight: 800, letterSpacing: '0.04em' }}>✦ Auto BL</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Right Pane */}
                  <div className="w-[56%] h-full bg-[#eef0f3] p-6 flex items-center justify-center relative">
                    {/* Grid dots bg */}
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    {/* A4 Sheet */}
                    <div className="w-[62%] h-[92%] bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-100 group-hover:-translate-y-2 transition-transform duration-700 relative">
                       {/* Sheet top header */}
                       <div className="px-4 py-3 border-b border-gray-100 flex flex-col items-center gap-1 bg-white">
                         <div className="h-2 w-36 bg-gray-800 rounded"></div>
                         <div className="h-1.5 w-24 bg-gray-300 rounded"></div>
                         <div className="h-1.5 w-28 bg-gray-300 rounded"></div>
                         <div className="flex w-full justify-between mt-1 px-2">
                           <div className="h-1.5 w-14 bg-gray-200 rounded"></div>
                           <div className="h-1.5 w-14 bg-gray-200 rounded"></div>
                         </div>
                       </div>
                       {/* Questions */}
                       <div className="p-4 flex flex-col gap-3 flex-1">
                         {[1,2,3].map((n) => (
                           <div key={n} className="flex gap-2 text-left">
                             <div className="h-2 w-5 bg-gray-900 rounded mt-0.5 shrink-0"></div>
                             <div className="flex-1 flex flex-col gap-1.5">
                               <div className="h-2 w-full bg-gray-700 rounded"></div>
                               <div className="h-2 w-[85%] bg-gray-400 rounded"></div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                    {/* PDF badge */}
                    <div className="absolute bottom-4 right-4 bg-[#2a7d5f] text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zM4 18h16v2H4v-2z"/></svg>
                      PDF Ready
                    </div>
                   </div>
               </div>
            </div>
            </div>
            
            {/* Floating stats below hero */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2a7d5f]"></div>
                Live A4 Preview
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                Bloom's BL/CO/PO Tagging
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                One-Click PDF Export
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                Role-Based Access Control
              </div>
            </div>
          </div>
        </section>

        {/* Features Section — green bg, white text */}
        <section className="py-24 relative overflow-hidden" style={{ background: '#1a3d2b' }}>
          

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-extrabold tracking-[0.2em] uppercase mb-3" style={{ color: '#86efac' }}>Enterprise Grade Features</h2>
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">Everything you need. Nothing you don&apos;t.</h3>
              <p className="text-lg font-medium max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Built from the ground up for academic institutions that demand precision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>, accent: '#2a7d5f', bg: '#e8f5ee', border: '#c4e5d3', title: 'Live A4 Rendering', desc: 'Pixel-accurate preview with auto-pagination and dynamic question numbering across sections.' },
                { icon: <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.502 2.502 0 0 1 1.44-3.54A2.5 2.5 0 0 1 9.5 2zm0 0M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.502 2.502 0 0 0-1.44-3.54A2.5 2.5 0 0 0 14.5 2z"/>, accent: '#d97706', bg: '#fef3c7', border: '#fde68a', title: "Bloom's Automation", desc: 'Tag each question natively with Bloom\'s Taxonomy Levels (BL), Course Outcomes (CO), and Program Outcomes (PO).' },
                { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Zero-Touch PDFs', desc: 'Generate perfectly formatted 2-up landscape A4 PDFs with a single click. No layout adjustments needed.' },
                { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>, accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'Collaboration Hub', desc: 'Share papers with precise view or edit permissions. Request management with in-app email notifications.' },
                { icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', title: 'Multi-Admin Security', desc: 'Sys-Ops panel with root super-admin delegation, access approval workflows, and role isolation.' },
                { icon: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>, accent: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', title: 'Auto-Save & Cloud Sync', desc: '5-second debounced autosave to Supabase ensures your work is never lost. Access papers from anywhere.' },
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight">Start creating better exams today.</h2>
            <p className="text-lg text-gray-500 font-medium mb-8">Join educators already using QEdit to streamline their entire assessment pipeline.</p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#2a7d5f] hover:bg-[#1f5e47] shadow-[0_8px_20px_rgba(42,125,95,0.3)] hover:shadow-[0_14px_28px_rgba(42,125,95,0.4)] transition-all hover:-translate-y-1">
              Apply for Access &rarr;
            </Link>
          </div>
        </section>

        {/* Contact / Inquire Section */}
        <section id="contact" className="relative py-32 bg-[#1a3d2b] overflow-hidden">
          {/* Ambient Glowing Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2a7d5f] rounded-full blur-[140px] opacity-20"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#1e6b4f] rounded-full blur-[140px] opacity-30"></div>
            {/* Extremely faint grid matching hero */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">
              
              {/* Left Side: Premium Text & Contact Info */}
              <div className="lg:col-span-5 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d5f]/30 bg-[#2a7d5f]/10 backdrop-blur-md mb-8">
                  <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#a7f3d0]">Support & Setup</span>
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
                  Ready to redefine <br/><span className="text-[#a7f3d0]">assessments?</span>
                </h2>
                
                <p className="text-lg text-[#c4e5d3] font-medium mb-12 leading-relaxed opacity-90">
                  Whether you need technical integration assistance or a tailored campus-wide demo, our engineering team is here to help you deploy seamlessly.
                </p>
                
                <div className="space-y-5">
                  <a href="mailto:support@qedit.com" className="group flex items-center p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-[#2a7d5f]/40 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-[#2a7d5f]/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#c4e5d3]/60 uppercase tracking-wider mb-1">Direct Email</div>
                      <div className="text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">support@qedit.com</div>
                    </div>
                  </a>
                  
                  <a href="tel:+918608252352" className="group flex items-center p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-[#2a7d5f]/40 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-[#2a7d5f]/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#c4e5d3]/60 uppercase tracking-wider mb-1">priority line</div>
                      <div className="text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">+91 86082 52352</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Right Side: Form Component */}
              <div className="lg:col-span-7 relative">
                {/* Form Wrapper with glass effect behind the actual form */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#2a7d5f]/20 to-transparent blur-2xl rounded-[40px] transform rotate-1 scale-105"></div>
                
                <div className="relative bg-white rounded-[32px] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-100/50">
                  {contactStatus === 'success' ? (
                    <div className="text-center py-16 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-24 h-24 rounded-full bg-[#f0f7f4] border-8 border-[#e8f5ee] flex items-center justify-center mx-auto mb-8">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a7d5f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[pulse_2s_infinite]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3">Thanks for reaching out!</h3>
                      <p className="text-lg text-emerald-100/70 font-medium mb-10 max-w-sm mx-auto">We successfully received your inquiry. Our team will jump right on it and get back to you shortly.</p>
                      <button onClick={() => setContactStatus('idle')} className="px-8 py-3.5 rounded-xl text-sm font-extrabold bg-[#0a1f16] text-[#4ade80] hover:text-white hover:bg-[#2a7d5f] transition-all">Submit Another Inquiry</button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Send an Inquiry Request</h3>
                      <form onSubmit={handleContactSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5 text-left">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                             <input required type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                               className="w-full px-5 py-4 rounded-xl bg-[#f8f9fb] border border-gray-100 focus:bg-white focus:border-[#2a7d5f] focus:ring-4 focus:ring-[#2a7d5f]/10 outline-none transition-all placeholder-gray-400 font-semibold text-gray-900" placeholder="Jane Doe" />
                          </div>
                          <div className="space-y-1.5 text-left">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Work Email</label>
                             <input required type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                               className="w-full px-5 py-4 rounded-xl bg-[#f8f9fb] border border-gray-100 focus:bg-white focus:border-[#2a7d5f] focus:ring-4 focus:ring-[#2a7d5f]/10 outline-none transition-all placeholder-gray-400 font-semibold text-gray-900" placeholder="jane@university.edu" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5 text-left">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Institution</label>
                              <input type="text" value={contactForm.organization} onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
                                className="w-full px-5 py-4 rounded-xl bg-[#f8f9fb] border border-gray-100 focus:bg-white focus:border-[#2a7d5f] focus:ring-4 focus:ring-[#2a7d5f]/10 outline-none transition-all placeholder-gray-400 font-semibold text-gray-900" placeholder="e.g. SRM Institute" />
                           </div>
                           <div className="space-y-1.5 text-left">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">WhatsApp (Optional)</label>
                              <input type="tel" value={contactForm.whatsapp} onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                                className="w-full px-5 py-4 rounded-xl bg-[#f8f9fb] border border-gray-100 focus:bg-white focus:border-[#2a7d5f] focus:ring-4 focus:ring-[#2a7d5f]/10 outline-none transition-all placeholder-gray-400 font-semibold text-gray-900" placeholder="+91 XXXXX XXXXX" />
                           </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">How can we help?</label>
                           <textarea required rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                             className="w-full px-5 py-4 rounded-xl bg-[#f8f9fb] border border-gray-100 focus:bg-white focus:border-[#2a7d5f] focus:ring-4 focus:ring-[#2a7d5f]/10 outline-none transition-all resize-none placeholder-gray-400 font-semibold text-gray-900" placeholder="Tell us about your assessment goals..."></textarea>
                        </div>
                        
                        {contactStatus === 'error' && (
                          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-100 flex items-center gap-3">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                             Failed to seamlessly send message. Please verify your connection and try again.
                          </div>
                        )}
                        
                        <button type="submit" disabled={contactStatus === 'loading'}
                          className="w-full mt-4 px-8 py-4 rounded-xl text-base font-black text-white bg-[#2a7d5f] hover:bg-[#1e6b4f] hover:shadow-[0_8px_25px_rgba(42,125,95,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 group">
                          {contactStatus === 'loading' ? (
                            <span className="flex items-center gap-3"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Initializing Secure Link...</span>
                          ) : (
                            <>Initialize Request <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Dark Footer */}
      <footer className="bg-[#0f1f17] text-white pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-white/10">
             {/* Brand Col */}
             <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                   <Image src="/logohead.png" alt="QEdit" width={36} height={36} className="w-8 h-auto brightness-0 invert opacity-90" />
                   <span className="text-xl font-black tracking-tighter text-white">QEdit</span>
                </div>
                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-xs mb-6">
                  An intelligent question paper management platform built for modern educational institutions.
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <a href="tel:+918608252352" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors font-medium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.98-.89a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    +91 86082 52352
                  </a>
                  <a href="mailto:mh6651@srmist.edu.in" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors font-medium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    mh6651@srmist.edu.in
                  </a>
                </div>
             </div>

             {/* Platform Links */}
             <div>
                <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Platform</h4>
                <ul className="space-y-3 text-gray-400 text-sm font-medium">
                  <li><Link href="/auth" className="hover:text-emerald-400 transition-colors">Sign In</Link></li>
                  <li><Link href="/auth/register" className="hover:text-emerald-400 transition-colors">Apply for Access</Link></li>
                  <li><Link href="/auth/forgot-password" className="hover:text-emerald-400 transition-colors">Reset Password</Link></li>
                  <li><Link href="/admin" className="hover:text-red-400 transition-colors">Sys-Ops Panel</Link></li>
                </ul>
             </div>

             {/* Legal/Info Links */}
             <div>
                <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Information</h4>
                <ul className="space-y-3 text-gray-400 text-sm font-medium">
                  <li><Link href="#" className="hover:text-emerald-400 transition-colors">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                </ul>
             </div>
           </div>

           <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
             <p className="text-gray-500 text-xs font-medium">© {new Date().getFullYear()} QEdit Platform. All rights reserved.</p>
             <p className="text-xs font-semibold flex items-center gap-1.5 text-gray-500">
               Crafted with <span className="text-emerald-400 mx-0.5">💚</span> by Chan&apos;s Team
             </p>
           </div>
        </div>
      </footer>

    </div>
  );
}
