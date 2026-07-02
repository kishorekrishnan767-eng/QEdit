import { NextResponse } from 'next/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';

export async function GET() {
  const adminCheck = await getAdminRole();
  // Ensure the user is strictly a superadmin
  if (!adminCheck.ok || adminCheck.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { data, error } = await getAdminSupabase()
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inquiries: data });
}
