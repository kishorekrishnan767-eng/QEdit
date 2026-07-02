import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email?.toLowerCase() ?? '';

      // Admin goes to dashboard
      if (email === ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Check/insert in authorized_users using service role
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: existing } = await supabaseAdmin
        .from('authorized_users')
        .select('status')
        .eq('email', email)
        .maybeSingle();

      if (!existing) {
        // First login — auto-insert as pending
        await supabaseAdmin.from('authorized_users').insert({ email, status: 'pending' });
        return NextResponse.redirect(`${origin}/auth/pending`);
      }

      if (existing.status === 'admin' || existing.status === 'approved') {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (existing.status === 'rejected') {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth?error=rejected`);
      }

      // pending
      return NextResponse.redirect(`${origin}/auth/pending`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
