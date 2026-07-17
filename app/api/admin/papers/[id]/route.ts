import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { id } = await params;

  const { data, error } = await getAdminSupabase()
    .from('question_papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Paper not found' }, { status: 404 });
  }

  return NextResponse.json({ paper: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok || !adminCheck.email) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const reviewStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await getAdminSupabase()
    .from('question_papers')
    .update({
      review_status: reviewStatus,
      reviewed_by: adminCheck.email,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paper: data });
}

