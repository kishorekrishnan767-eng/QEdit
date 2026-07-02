import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';
import { ADMIN_EMAIL } from '@/lib/constants';

// GET /api/admin/users — list all users
export async function GET() {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { data, error } = await getAdminSupabase()
    .from('authorized_users')
    .select('id, email, status, approved_by, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { email, status = 'approved' } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  if (status === 'superadmin' && adminCheck.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only Super Admins can add Super Admins' }, { status: 403 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await getAdminSupabase()
    .from('authorized_users')
    .upsert(
      { email: normalizedEmail, status, approved_by: ADMIN_EMAIL },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
