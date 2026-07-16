import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { ADMIN_EMAIL } from '@/lib/constants';

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AdminRole = 'none' | 'admin' | 'superadmin';

export async function getAdminRole(): Promise<{ ok: boolean; role: AdminRole; email?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      console.warn('[getAdminRole] No authenticated user found in session');
      return { ok: false, role: 'none' };
    }
    
    const email = user.email.toLowerCase().trim();
    
    // Resolve admin email at call time (not module init) to avoid stale values
    const adminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      ''
    ).toLowerCase().trim();

    if (!adminEmail) {
      console.error('[getAdminRole] ADMIN_EMAIL env var is not set!');
    }

    if (adminEmail && email === adminEmail) {
      return { ok: true, role: 'superadmin', email };
    }
    
    const { data } = await getAdminSupabase()
      .from('authorized_users')
      .select('status')
      .eq('email', email)
      .single();
      
    if (data?.status === 'admin') {
      return { ok: true, role: 'admin', email };
    }
    
    console.warn(`[getAdminRole] User ${email} is not an admin. DB status: ${data?.status}, adminEmail: "${adminEmail}"`);
    return { ok: false, role: 'none', email };
  } catch (err: any) {
    console.error('[getAdminRole] Error:', err.message);
    return { ok: false, role: 'none' };
  }
}
