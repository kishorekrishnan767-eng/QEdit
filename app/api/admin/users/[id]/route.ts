import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';
import { ADMIN_EMAIL } from '@/lib/constants';

// PATCH /api/admin/users/[id] — update status (approve/reject/admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!['approved', 'rejected', 'pending', 'admin'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (status === 'admin' && adminCheck.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only Super Admins can promote users to Admin' }, { status: 403 });
  }

  // To demote an admin, you must also be a superadmin
  const { data: targetUser } = await getAdminSupabase()
    .from('authorized_users')
    .select('status')
    .eq('id', id)
    .single();
    
  if (targetUser?.status === 'admin' && adminCheck.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only Super Admins can modify Admins' }, { status: 403 });
  }

  const { data, error } = await getAdminSupabase()
    .from('authorized_users')
    .update({
      status,
      approved_by: status === 'approved' ? ADMIN_EMAIL : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// DELETE /api/admin/users/[id] — remove a user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  // Ensure an admin doesn't delete another admin unless they are superadmin
  const { data: targetUser } = await getAdminSupabase()
    .from('authorized_users')
    .select('status')
    .eq('id', id)
    .single();

  if (targetUser?.status === 'admin' && adminCheck.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only Super Admins can delete Admins' }, { status: 403 });
  }

  const { error } = await getAdminSupabase()
    .from('authorized_users')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
