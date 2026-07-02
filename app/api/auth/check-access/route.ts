import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '@/lib/constants';

/**
 * POST /api/auth/check-access
 * Body: { email: string }
 * Returns: { access: 'admin' | 'approved' | 'pending' | 'rejected' }
 *
 * - Admin email always returns 'admin'
 * - If not found in authorized_users → auto-inserts as 'pending'
 * - Otherwise returns the current status
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[check-access] Missing env vars');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Admin always gets through without a DB check
    if (email === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ access: 'admin' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Look up in authorized_users
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('authorized_users')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('[check-access] DB fetch error:', fetchError.message);
      return NextResponse.json({ error: `DB error: ${fetchError.message}` }, { status: 500 });
    }

    if (!existing) {
      // First time seeing this user — auto-insert as pending
      const { error: insertError } = await supabaseAdmin
        .from('authorized_users')
        .insert({ email, status: 'pending' });

      if (insertError && insertError.code !== '23505') {
        // 23505 = unique_violation (race condition — user already inserted)
        console.error('[check-access] Insert error:', insertError.message);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
      }

      return NextResponse.json({ access: 'pending' });
    }

    // Return whatever status they currently have
    return NextResponse.json({ access: existing.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[check-access] Unhandled error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
