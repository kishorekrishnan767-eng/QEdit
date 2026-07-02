'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from '@/components/Editor';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPaperById, updatePaper } from '@/lib/supabase/papers';
import { PaperData, QuestionPaperRecord } from '@/types';

export default function EditQuestionPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.id as string;
  const [paper, setPaper] = useState<QuestionPaperRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaper() {
      const record = await getPaperById(paperId);
      if (record) {
        setPaper(record);
      } else {
        setError('Paper not found or access denied.');
      }
      setLoading(false);
    }
    loadPaper();
  }, [paperId]);

  const handleSave = useCallback(async (data: PaperData, status: 'draft' | 'saved'): Promise<string | null> => {
    const success = await updatePaper(paperId, data, status);
    return success ? paperId : null;
  }, [paperId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f7f4' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: '#2a7d5f', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#6b7280' }}>Loading paper...</p>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f7f4' }}>
        <div className="text-center p-8 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e5ea', maxWidth: '400px' }}>
          <div className="text-3xl mb-3">🚫</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>Access Denied</h2>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{error || 'This paper does not exist or you do not have permission to access it.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: '#2a7d5f' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <button
        onClick={() => router.push('/dashboard')}
        className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 print:hidden"
        style={{
          background: 'rgba(255,255,255,0.9)',
          color: '#2a7d5f',
          border: '1px solid #d1eddf',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5ee'; e.currentTarget.style.borderColor = '#2a7d5f'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = '#d1eddf'; }}
      >
        <ArrowLeft size={15} /> Dashboard
      </button>
      <Editor initialData={paper.paper_data} paperId={paper.id} onSave={handleSave} />
    </div>
  );
}
