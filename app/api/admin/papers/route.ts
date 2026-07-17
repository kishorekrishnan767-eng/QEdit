import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  const { data, error } = await getAdminSupabase()
    .from('question_papers')
    .select('*')
    .eq('exam_category', category)
    .neq('review_status', 'not_submitted')
    .order('submitted_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ papers: data });
}
