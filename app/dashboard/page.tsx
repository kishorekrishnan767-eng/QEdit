import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { QuestionPaperRecord } from '@/types';
import { getAdminRole } from '@/lib/admin';
import { ADMIN_EMAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Must be logged in
  if (!user) {
    redirect('/auth');
  }

  const email = (user.email || '').toLowerCase().trim();

  // 2. Super-admin always gets through
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    // 3. Check approval status for everyone else
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: record } = await supabaseAdmin
      .from('authorized_users')
      .select('status')
      .eq('email', email)
      .maybeSingle();

    const status = record?.status;

    if (status === 'rejected') {
      // Sign them out and send back to login with error
      await supabase.auth.signOut();
      redirect('/auth?error=rejected');
    }

    if (!record || status === 'pending') {
      // Not yet approved — hold them at the pending page
      redirect('/auth/pending');
    }

    // status must be 'approved' or 'admin' to continue
    if (status !== 'approved' && status !== 'admin') {
      redirect('/auth/pending');
    }
  }

  // Fetch user's own papers
  const { data: ownPapers } = await supabase
    .from('question_papers')
    .select('*')
    .eq('owner_email', email)
    .order('updated_at', { ascending: false });

  // Fetch papers shared with user
  const { data: collabs } = await supabase
    .from('collaborations')
    .select('paper_id')
    .eq('collaborator_email', email);

  let sharedPapers: QuestionPaperRecord[] = [];
  if (collabs && collabs.length > 0) {
    const paperIds = collabs.map(c => c.paper_id);
    const { data: shared } = await supabase
      .from('question_papers')
      .select('*')
      .in('id', paperIds)
      .order('updated_at', { ascending: false });
    sharedPapers = (shared || []) as QuestionPaperRecord[];
  }

  const allOwn = (ownPapers || []) as QuestionPaperRecord[];
  const drafts = allOwn.filter(p => p.status === 'draft');
  const saved = allOwn.filter(p => p.status === 'saved');

  // Check if they are admin or superadmin
  const adminCheck = await getAdminRole();

  return (
    <DashboardClient
      user={{ email, name: user.user_metadata?.full_name || email }}
      drafts={drafts}
      savedPapers={saved}
      sharedPapers={sharedPapers}
      isAdmin={adminCheck.ok}
    />
  );
}
