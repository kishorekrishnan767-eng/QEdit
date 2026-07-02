'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, Zap, LogOut, ChevronRight, Clock, Plus, Pencil, Trash2, Copy, Share2, FolderOpen, Users } from 'lucide-react';
import { deletePaper, duplicatePaper, renamePaper } from '@/lib/supabase/papers';
import { QuestionPaperRecord } from '@/types';
import ShareModal from '@/components/ShareModal';

interface DashboardClientProps {
  user: {
    email: string;
    name: string;
  };
  drafts: QuestionPaperRecord[];
  savedPapers: QuestionPaperRecord[];
  sharedPapers: QuestionPaperRecord[];
  isAdmin?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardClient({ user, drafts: initialDrafts, savedPapers: initialSaved, sharedPapers: initialShared, isAdmin }: DashboardClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [saved, setSaved] = useState(initialSaved);
  const [shared] = useState(initialShared);
  const [shareModal, setShareModal] = useState<{ paperId: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleDelete = async (paperId: string, list: 'drafts' | 'saved') => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    setDeletingId(paperId);
    const success = await deletePaper(paperId);
    if (success) {
      if (list === 'drafts') setDrafts(prev => prev.filter(p => p.id !== paperId));
      else setSaved(prev => prev.filter(p => p.id !== paperId));
    }
    setDeletingId(null);
  };

  const handleDuplicate = async (paperId: string) => {
    const record = await duplicatePaper(paperId, user.email);
    if (record) {
      setDrafts(prev => [record, ...prev]);
    }
  };

  const handleRename = async (paperId: string, newTitle: string, list: 'drafts' | 'saved') => {
    if (!newTitle.trim()) return;
    const success = await renamePaper(paperId, newTitle);
    if (success) {
      const update = (prev: QuestionPaperRecord[]) =>
        prev.map(p => p.id === paperId ? { ...p, title: newTitle.trim() } : p);
      if (list === 'drafts') setDrafts(update);
      else setSaved(update);
    }
  };

  const PaperCard = ({ paper, showDelete, list }: { paper: QuestionPaperRecord; showDelete: boolean; list: 'drafts' | 'saved' | 'shared' }) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(paper.title);
    const inputRef = useRef<HTMLInputElement>(null);

    const startRename = () => {
      if (list === 'shared') return; // shared papers can't be renamed
      setEditingTitle(true);
      setTimeout(() => inputRef.current?.select(), 50);
    };

    const commitRename = () => {
      setEditingTitle(false);
      if (titleValue.trim() !== paper.title) {
        handleRename(paper.id, titleValue, list as 'drafts' | 'saved');
      }
    };

    return (
      <div
        className="group flex items-center justify-between p-4 rounded-xl transition-all duration-200"
        style={{ background: '#ffffff', border: '1px solid #e9ecef' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d1eddf'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,125,95,0.06)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{
            background: list === 'shared' ? 'rgba(56,128,236,0.08)' : paper.status === 'draft' ? '#fff8e1' : '#e8f5ee',
            border: `1px solid ${list === 'shared' ? 'rgba(56,128,236,0.15)' : paper.status === 'draft' ? '#fde68a' : '#c4e5d3'}`,
          }}>
            <FileText size={18} style={{ color: list === 'shared' ? '#3880ec' : paper.status === 'draft' ? '#d97706' : '#2a7d5f' }} />
          </div>
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <input
                ref={inputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setTitleValue(paper.title); setEditingTitle(false); }
                }}
                className="text-sm font-semibold w-full px-2 py-0.5 rounded-md"
                style={{ color: '#1a1a2e', border: '1.5px solid #2a7d5f', outline: 'none', background: '#f0f9f5' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h4
                  className="text-sm font-semibold truncate"
                  style={{ color: '#1a1a2e', cursor: list !== 'shared' ? 'text' : 'default' }}
                  onDoubleClick={list !== 'shared' ? startRename : undefined}
                  title={list !== 'shared' ? 'Double-click to rename' : paper.title}
                >
                  {paper.title}
                </h4>
                {list !== 'shared' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startRename(); }}
                    className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 rounded"
                    style={{ color: '#9ca3af' }}
                    title="Rename"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px]" style={{ color: '#9ca3af' }}>{timeAgo(paper.updated_at)}</span>
              {list === 'shared' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(56,128,236,0.08)', color: '#3880ec' }}>
                  Shared by {paper.owner_email.split('@')[0]}
                </span>
              )}
              {paper.status === 'draft' && list !== 'shared' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: '#fff8e1', color: '#d97706' }}>Draft</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(list === 'shared' ? `/paper/${paper.id}` : `/dashboard/edit/${paper.id}`)}
            className="p-2 rounded-lg text-sm transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5ee'; e.currentTarget.style.color = '#2a7d5f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleDuplicate(paper.id)}
            className="p-2 rounded-lg text-sm transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            title="Duplicate"
          >
            <Copy size={15} />
          </button>
          {showDelete && (
            <>
              <button
                onClick={() => setShareModal({ paperId: paper.id, title: paper.title })}
                className="p-2 rounded-lg text-sm transition-colors"
                style={{ color: '#6b7280' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.color = '#3880ec'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                title="Share"
              >
                <Share2 size={15} />
              </button>
              <button
                onClick={() => handleDelete(paper.id, list as 'drafts' | 'saved')}
                disabled={deletingId === paper.id}
                className="p-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                style={{ color: '#c4c9d1' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4c9d1'; }}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
    <div className="text-center py-10 rounded-xl" style={{ background: '#fafbfc', border: '1px dashed #e2e5ea' }}>
      <Icon size={28} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
      <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: '#c4c9d1' }}>{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f0f7f4 0%, #f8f9fb 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid #e2e5ea' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Qedit" width={120} height={32} className="h-8 w-auto" priority />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{user.name}</p>
              <p className="text-[11px]" style={{ color: '#9ca3af' }}>{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #2a7d5f, #1e6b4f)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(42, 125, 95, 0.1)', color: '#2a7d5f', border: '1px solid rgba(42, 125, 95, 0.2)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(42, 125, 95, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(42, 125, 95, 0.1)'; }}
              >
                <Zap size={15} /> Sys-Ops
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
              style={{ color: '#6b7280', border: '1px solid #e2e5ea' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fda4a4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e2e5ea'; }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome + Create */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>
              Welcome back, <span style={{ color: '#2a7d5f' }}>{user.name.split(' ')[0]}</span>
            </h1>
            <p style={{ color: '#6b7280' }}>Manage your question papers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #2a7d5f, #1e6b4f)', boxShadow: '0 4px 12px rgba(42,125,95,0.25)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(42,125,95,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,125,95,0.25)'; }}
            >
              <Plus size={18} /> Create Paper
            </button>
          </div>
        </div>

        {/* Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => router.push('/dashboard/create')}
            className="group text-left p-5 rounded-xl transition-all duration-200"
            style={{ background: '#fff', border: '1px solid #e2e5ea' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2a7d5f'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(42,125,95,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e5ea'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f5ee', border: '1px solid #c4e5d3' }}>
                <Plus size={20} style={{ color: '#2a7d5f' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>Create Question Paper</h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>Start a new paper from scratch</p>
              </div>
              <ChevronRight size={16} className="ml-auto transition-transform group-hover:translate-x-1" style={{ color: '#2a7d5f' }} />
            </div>
          </button>
          <div
            className="p-5 rounded-xl cursor-not-allowed relative"
            style={{ background: '#fafbfc', border: '1px solid #e9ecef', opacity: 0.7 }}
          >
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
                <Clock size={10} /> Coming Soon
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f1f3f6', border: '1px solid #e2e5ea' }}>
                <Zap size={20} style={{ color: '#9ca3af' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#6b7280' }}>Online MCQ Test</h3>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Create online MCQ examinations</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Drafts */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen size={18} style={{ color: '#d97706' }} />
            <h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>My Drafts</h2>
            {drafts.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#fff8e1', color: '#d97706' }}>{drafts.length}</span>
            )}
          </div>
          {drafts.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No drafts yet" description="Your draft papers will appear here when you start creating" />
          ) : (
            <div className="space-y-2">
              {drafts.map(paper => (
                <PaperCard key={paper.id} paper={paper} showDelete={true} list="drafts" />
              ))}
            </div>
          )}
        </section>

        {/* My Question Papers */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: '#2a7d5f' }} />
            <h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>My Question Papers</h2>
            {saved.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#e8f5ee', color: '#2a7d5f' }}>{saved.length}</span>
            )}
          </div>
          {saved.length === 0 ? (
            <EmptyState icon={FileText} title="No saved papers yet" description="Save a paper as final to see it here" />
          ) : (
            <div className="space-y-2">
              {saved.map(paper => (
                <PaperCard key={paper.id} paper={paper} showDelete={true} list="saved" />
              ))}
            </div>
          )}
        </section>

        {/* Shared With Me */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} style={{ color: '#3880ec' }} />
            <h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>Shared With Me</h2>
            {shared.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(56,128,236,0.08)', color: '#3880ec' }}>{shared.length}</span>
            )}
          </div>
          {shared.length === 0 ? (
            <EmptyState icon={Users} title="Nothing shared yet" description="Papers shared with you by others will appear here" />
          ) : (
            <div className="space-y-2">
              {shared.map(paper => (
                <PaperCard key={paper.id} paper={paper} showDelete={false} list="shared" />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          isOpen={!!shareModal}
          onClose={() => setShareModal(null)}
          paperId={shareModal.paperId}
          paperTitle={shareModal.title}
          isOwner={true}
        />
      )}
    </div>
  );
}
