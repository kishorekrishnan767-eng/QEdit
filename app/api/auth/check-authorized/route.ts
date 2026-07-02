import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email) {
      return NextResponse.json({ authorized: false, error: 'Email required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || serviceKey === 'your-service-role-key-here') {
      console.error('[check-authorized] SUPABASE_SERVICE_ROLE_KEY is not configured.');
      return NextResponse.json(
        { authorized: false, error: 'Server not configured: missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    // Create client inside handler so env errors are caught cleanly
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const normalizedEmail = body.email.toLowerCase().trim();

    const { data, error } = await supabaseAdmin
      .from('authorized_users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      // Table might not exist yet — log the real error
      console.error('[check-authorized] DB error:', error.message, '| Code:', error.code);
      const isTableMissing = error.code === '42P01'; // PostgreSQL: undefined_table
      return NextResponse.json(
        {
          authorized: false,
          error: isTableMissing
            ? 'authorized_users table not found. Run supabase-authorized-users.sql first.'
            : `DB error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ authorized: !!data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[check-authorized] Unhandled error:', message);
    return NextResponse.json({ authorized: false, error: `Server error: ${message}` }, { status: 500 });
  }
}
