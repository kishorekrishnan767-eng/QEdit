'use client';

import { useState, useCallback } from 'react';
import Editor from '@/components/Editor';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPaper, updatePaper } from '@/lib/supabase/papers';
import { PaperData } from '@/types';

export default function CreateQuestionPaperPage() {
  const router = useRouter();
  const [paperId, setPaperId] = useState<string | null>(null);

  const handleSave = useCallback(async (data: PaperData, status: 'draft' | 'saved'): Promise<string | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    if (paperId) {
      // Update existing paper
      const success = await updatePaper(paperId, data, status);
      return success ? paperId : null;
    } else {
      // Create new paper
      const record = await createPaper(user.email, data, status);
      if (record) {
        setPaperId(record.id);
        return record.id;
      }
      return null;
    }
  }, [paperId]);

  return (
    <div className="min-h-screen relative">
      {/* Back Button */}
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
      <Editor paperId={paperId} onSave={handleSave} />
    </div>
  );
}
