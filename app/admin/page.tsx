import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAdminRole } from '@/lib/admin';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Only allow admins
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    redirect('/dashboard');
  }

  return (
    <AdminClient 
      user={{ email: user.email || '', name: user.user_metadata?.full_name || user.email || '' }} 
      role={adminCheck.role}
    />
  );
}
