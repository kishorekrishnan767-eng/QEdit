'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  HelpCircle,
  Award,
  Download,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
  Settings,
  UserCheck,
  GraduationCap
} from 'lucide-react';

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const navigationItems = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'question-papers', title: 'Creating Question Papers', icon: FileText },
    { id: 'blooms-taxonomy', title: 'Bloom\'s & Outcomes', icon: GraduationCap },
    { id: 'pdf-export', title: 'PDF & Printing', icon: Download },
    { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle },
  ];

  const filteredItems = navigationItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-800 font-sans selection:bg-[#c4e5d3] selection:text-[#1e3c2f]">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#0f1f17]/95 backdrop-blur-md text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logohead.png" alt="QEdit Logo" width={36} height={36} className="w-9 h-auto brightness-0 invert opacity-90 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-black tracking-tighter text-white">QEdit <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest ml-2">Docs</span></span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link href="/auth" className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#2a7d5f] hover:bg-[#1f5e47] transition-all shadow-md hover:shadow-emerald-900/30">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Header */}
      <div className="relative bg-[#0f1f17] text-white py-16 px-6 overflow-hidden border-b border-emerald-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-4 border border-emerald-500/20">
            <Sparkles size={14} /> Official Documentation &amp; User Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Everything you need to master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">QEdit</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            Explore step-by-step guides, feature walkthroughs, and institutional standards for creating and managing high-quality examination papers.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
            <input
              type="text"
              placeholder="Search topics, features, guidelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all text-sm font-medium shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-900/5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">Documentation Topics</h3>
                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                          isActive
                            ? 'bg-[#2a7d5f] text-white shadow-md shadow-emerald-700/20'
                            : 'text-gray-600 hover:bg-emerald-50 hover:text-[#2a7d5f]'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-[#2a7d5f]'} />
                        <span className="flex-1">{item.title}</span>
                        {isActive && <ChevronRight size={16} />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Support Card */}
              <div className="bg-gradient-to-br from-[#0f1f17] to-[#1a3729] rounded-2xl p-6 text-white shadow-lg border border-emerald-800/40">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                  <ShieldCheck size={22} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Need Technical Support?</h4>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  Have questions about institutional question paper standards or account access? Reach out directly to our support team.
                </p>
                <div className="space-y-2 text-xs font-semibold text-emerald-300">
                  <p>📧 chanthip@srmist.edu.in</p>
                  <p>📞 +91 95514 73145</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Documentation Content Area */}
          <main className="lg:col-span-3 space-y-12">

            {/* SECTION 1: OVERVIEW */}
            {(activeSection === 'overview' || searchQuery !== '') && (
              <section id="overview" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <BookOpen size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Platform Overview</h2>
                    <p className="text-xs text-gray-500 font-medium">Introduction to QEdit Assessment Management</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  <strong>QEdit</strong> is an institutional-grade question paper management system designed specifically for modern higher education institutions. It streamlines the lifecycle of question paper drafting, standardized formatting, outcome tagging, and secure PDF generation.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-[#2a7d5f] text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Standardized Layouts</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Enforces exact institutional templates, header formats, and mark distribution rules automatically.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-[#2a7d5f] text-white flex items-center justify-center font-bold text-sm mb-3">2</div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Bloom&apos;s Level Tagging</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Categorizes questions by Cognitive Levels (K1-K6) and Course Outcomes (CO1-CO6) for accreditation compliance.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-[#2a7d5f] text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Print-Ready PDF Output</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Generates crisp, high-precision PDFs ready for end-semester examinations and continuous assessment tests.</p>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 2: GETTING STARTED */}
            {(activeSection === 'getting-started' || searchQuery !== '') && (
              <section id="getting-started" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <Zap size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Getting Started</h2>
                    <p className="text-xs text-gray-500 font-medium">Account access, authorization, and dashboard navigation</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-gray-600 font-medium">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2a7d5f] flex items-center justify-center font-bold text-xs shrink-0 mt-1">Step 1</div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Apply for Institutional Access</h4>
                      <p className="leading-relaxed">
                        To maintain examination confidentiality, access is granted through pre-authorized institutional accounts. Visit the <Link href="/auth/register" className="text-[#2a7d5f] font-bold underline hover:text-emerald-700">Apply for Access</Link> page and submit your official university credentials and department details.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2a7d5f] flex items-center justify-center font-bold text-xs shrink-0 mt-1">Step 2</div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Sign In to Your Workspace</h4>
                      <p className="leading-relaxed">
                        Once authorized, log in via <Link href="/auth" className="text-[#2a7d5f] font-bold underline hover:text-emerald-700">Sign In</Link>. Enter your registered email and secure password to open your personalized Question Paper Dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2a7d5f] flex items-center justify-center font-bold text-xs shrink-0 mt-1">Step 3</div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">Dashboard Navigation</h4>
                      <p className="leading-relaxed">
                        From your main dashboard, view all current drafts, completed paper archives, subject categories, and quick-action buttons for creating new papers or editing existing ones.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: CREATING QUESTION PAPERS */}
            {(activeSection === 'question-papers' || searchQuery !== '') && (
              <section id="question-papers" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <FileText size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Creating &amp; Managing Question Papers</h2>
                    <p className="text-xs text-gray-500 font-medium">Metadata entry, structure setup, and question entry</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-[#2a7d5f]" /> 1. Question Paper Metadata Setup
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">
                      When initiating a new question paper draft, populate the required institutional header details:
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
                      <li className="bg-white p-2.5 rounded-lg border border-gray-200/60">• Course Code &amp; Title (e.g. 21CSC302J)</li>
                      <li className="bg-white p-2.5 rounded-lg border border-gray-200/60">• Academic Regulation (e.g. R2021)</li>
                      <li className="bg-white p-2.5 rounded-lg border border-gray-200/60">• Semester &amp; Branch / Department</li>
                      <li className="bg-white p-2.5 rounded-lg border border-gray-200/60">• Maximum Marks &amp; Exam Duration</li>
                    </ul>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-[#2a7d5f]" /> 2. Structuring Examination Sections
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">
                      QEdit supports standard three-part examination configurations:
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-gray-200/60">
                        <strong className="text-gray-900">Part A (Short Answer Questions):</strong> 10 questions of 2 marks each (Total 20 Marks). Tests direct recall and definition capability.
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200/60">
                        <strong className="text-gray-900">Part B (Either / Or Analytical Questions):</strong> 5 questions with internal choice (11a or 11b) of 13 marks each (Total 65 Marks).
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200/60">
                        <strong className="text-gray-900">Part C (Comprehensive / Design Question):</strong> 1 compulsory question of 15 marks evaluating high-level analysis or system synthesis.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 4: BLOOMS TAXONOMY & OUTCOMES */}
            {(activeSection === 'blooms-taxonomy' || searchQuery !== '') && (
              <section id="blooms-taxonomy" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <GraduationCap size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bloom&apos;s Taxonomy &amp; Course Outcomes</h2>
                    <p className="text-xs text-gray-500 font-medium">Cognitive domain mapping and accreditation compliance</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Every question created in QEdit must be explicitly tagged with its corresponding <strong>Cognitive Level</strong> (Bloom&apos;s Taxonomy) and <strong>Course Outcome (CO)</strong>.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0f1f17] text-white space-y-2">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Cognitive Levels (K1 - K6)</span>
                    <ul className="text-xs space-y-1.5 text-gray-300 font-medium">
                      <li>• <strong>K1 (Remember):</strong> Define, list, state, recall</li>
                      <li>• <strong>K2 (Understand):</strong> Explain, describe, discuss</li>
                      <li>• <strong>K3 (Apply):</strong> Solve, calculate, demonstrate</li>
                      <li>• <strong>K4 (Analyze):</strong> Differentiate, examine, compare</li>
                      <li>• <strong>K5 (Evaluate):</strong> Assess, judge, critique</li>
                      <li>• <strong>K6 (Create):</strong> Design, formulate, construct</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f0f7f4] border border-emerald-100 space-y-2">
                    <span className="text-xs font-extrabold text-[#2a7d5f] uppercase tracking-wider">Course Outcomes (CO1 - CO6)</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Map questions directly to unit-wise syllabus objectives. CO tags are automatically summarized in the header evaluation matrix on generated question paper PDFs.
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2a7d5f] bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 size={13} /> Auto-Validated Balance Checks
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 5: PDF EXPORT */}
            {(activeSection === 'pdf-export' || searchQuery !== '') && (
              <section id="pdf-export" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <Download size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">PDF Export &amp; Printing Guidelines</h2>
                    <p className="text-xs text-gray-500 font-medium">Generating official examination printouts</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-gray-600 font-medium">
                  <p className="leading-relaxed">
                    Once all sections and mark totals are validated, click the <strong>Export PDF</strong> button on the editor interface. QEdit formats the document strictly according to institutional printing specifications:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2 text-[#2a7d5f]">Page Layout &amp; Margins</h4>
                      <p className="text-xs text-gray-600">Standard A4 paper size, 0.75-inch margins, clear typography, and crisp line dividers.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2 text-[#2a7d5f]">Institutional Security</h4>
                      <p className="text-xs text-gray-600">Includes official course header details, page numbering (Page X of Y), and candidate registration box.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 6: FAQ */}
            {(activeSection === 'faq' || searchQuery !== '') && (
              <section id="faq" className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-emerald-900/5 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#2a7d5f]">
                    <HelpCircle size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h2>
                    <p className="text-xs text-gray-500 font-medium">Common questions about QEdit usage</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">How do I reset my password if I forget it?</h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Navigate to <Link href="/auth/forgot-password" className="text-[#2a7d5f] font-bold underline">Reset Password</Link> from the sign-in page. Enter your official email to receive password recovery instructions.
                    </p>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Are drafts saved automatically?</h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Yes, QEdit continuously auto-saves your paper drafts in real-time as you enter or modify questions.
                    </p>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">What if total marks do not add up to 100?</h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      The editor will flag a mark imbalance notification and prevent PDF generation until the total matches the configured maximum marks.
                    </p>
                  </div>
                </div>
              </section>
            )}

          </main>

        </div>
      </div>

      {/* Dark Footer */}
      <footer className="bg-[#0f1f17] text-white pt-12 pb-8 mt-16 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logohead.png" alt="QEdit" width={28} height={28} className="w-7 h-auto brightness-0 invert opacity-90" />
            <span className="text-lg font-extrabold text-white">QEdit Documentation</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} QEdit Platform. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
