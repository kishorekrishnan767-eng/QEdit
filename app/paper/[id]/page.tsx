'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from '@/components/Editor';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Lock, SendHorizonal, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPaperById, updatePaper } from '@/lib/supabase/papers';
import { checkAccess } from '@/lib/supabase/collaborations';
import { requestAccess, getMyRequest } from '@/lib/supabase/access-requests';
import { PaperData, QuestionPaperRecord } from '@/types';

export default function CollaborationPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.id as string;

  const [paper, setPaper] = useState<QuestionPaperRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [permission, setPermission] = useState<'edit' | 'view'>('edit');

  // Request access state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'already_sent'>('idle');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        router.push('/auth');
        return;
      }

      const userInfo = { email: user.email, name: user.user_metadata?.full_name || user.email };
      setCurrentUser(userInfo);

      const access = await checkAccess(paperId, user.email);

      if (!access.hasAccess) {
        // Check if already sent a request
        const myReq = await getMyRequest(paperId, user.email);
        if (myReq) {
          setRequestStatus(myReq.status === 'pending' ? 'already_sent' : 'idle');
        }
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setIsOwner(access.isOwner);
      setPermission(access.isOwner ? 'edit' : (access.permission as 'edit' | 'view') || 'view');

      const record = await getPaperById(paperId);
      if (record) {
        setPaper(record);
      } else {
        setAccessDenied(true);
      }
      setLoading(false);
    }
    load();
  }, [paperId, router]);

  const handleSave = useCallback(async (data: PaperData, status: 'draft' | 'saved'): Promise<string | null> => {
    const success = await updatePaper(paperId, data, status);
    return success ? paperId : null;
  }, [paperId]);

  const handleRequestAccess = async () => {
    if (!currentUser || requestStatus === 'sending') return;
    setRequestStatus('sending');

    // Get paper owner email to notify
    const record = await getPaperById(paperId);
    const result = await requestAccess(paperId, currentUser.email, currentUser.name, requestMessage);
    if (result) {
      // Email the owner
      if (record) {
        await fetch('/api/email/notify-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerEmail: record.owner_email,
            requesterEmail: currentUser.email,
            requesterName: currentUser.name,
            paperTitle: record.title,
            paperId,
          }),
        });
      }
      setRequestStatus('sent');
    } else {
      setRequestStatus('already_sent');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f7f4' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
            style={{ borderColor: '#2a7d5f', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#6b7280' }}>Checking access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #f0f7f4 0%, #f8f9fb 100%)' }}>
        <div className="w-full max-w-md p-8 rounded-2xl text-center"
          style={{ background: '#fff', border: '1px solid #e2e5ea', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <Lock size={28} style={{ color: '#dc2626' }} />
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>Access Restricted</h2>
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
            You don&apos;t have permission to view this question paper.
          </p>

          {requestStatus === 'sent' ? (
            <div className="p-4 rounded-xl mb-4" style={{ background: '#e8f5ee', border: '1px solid #c4e5d3' }}>
              <p className="text-sm font-semibold" style={{ color: '#2a7d5f' }}>✅ Request sent!</p>
              <p className="text-xs mt-1" style={{ color: '#4b8c6e' }}>The owner has been notified. You&apos;ll get an email when access is granted.</p>
            </div>
          ) : requestStatus === 'already_sent' ? (
            <div className="p-4 rounded-xl mb-4" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
              <p className="text-sm font-semibold" style={{ color: '#d97706' }}>⏳ Request pending</p>
              <p className="text-xs mt-1" style={{ color: '#92400e' }}>You&apos;ve already requested access. Please wait for the owner to respond.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Optional: Add a message to the owner..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl resize-none"
                style={{ border: '1px solid #e2e5ea', color: '#1a1a2e', background: '#f8f9fb' }}
              />
              <button
                onClick={handleRequestAccess}
                disabled={requestStatus === 'sending'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2a7d5f, #1e6b4f)', boxShadow: '0 4px 12px rgba(42,125,95,0.25)' }}
                onMouseEnter={(e) => { if (requestStatus !== 'sending') e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <SendHorizonal size={16} />
                {requestStatus === 'sending' ? 'Sending Request...' : 'Request Access'}
              </button>
            </div>
          )}

          <button onClick={() => router.push('/dashboard')} className="text-sm transition-colors" style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!paper) return null;

  // View-only mode: no onSave prop, show read-only banner
  const isViewOnly = permission === 'view';

  return (
    <div className="min-h-screen relative">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all print:hidden"
        style={{ background: 'rgba(255,255,255,0.9)', color: '#2a7d5f', border: '1px solid #d1eddf', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5ee'; e.currentTarget.style.borderColor = '#2a7d5f'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = '#d1eddf'; }}
      >
        <ArrowLeft size={15} /> Dashboard
      </button>

      {/* View-only banner */}
      {isViewOnly && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium print:hidden"
          style={{ background: 'rgba(79,70,229,0.9)', color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(79,70,229,0.3)' }}>
          <Eye size={14} /> View Only — You cannot edit this paper
        </div>
      )}

      {/* Pass onSave only if user has edit access */}
      <Editor
        initialData={paper.paper_data}
        paperId={paper.id}
        onSave={isViewOnly ? undefined : handleSave}
      />
    </div>
  );
}
