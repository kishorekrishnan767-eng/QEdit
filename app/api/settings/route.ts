import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminRole, getAdminSupabase } from '@/lib/admin';

// GET /api/settings - Fetch system settings (accessible to all authenticated users)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.warn('[GET /api/settings] Table not found or error occurred, using defaults:', error.message);
      return NextResponse.json({
        institutionName: 'SRM Institute of Science and Technology',
        college: 'Faculty of Science and Humanities, KTR',
      });
    }

    const settings: Record<string, string> = {};
    data?.forEach((row) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({
      institutionName: settings.institutionName || 'SRM Institute of Science and Technology',
      college: settings.college || 'Faculty of Science and Humanities, KTR',
    });
  } catch (err: any) {
    console.error('[GET /api/settings] Unexpected error, using defaults:', err.message);
    return NextResponse.json({
      institutionName: 'SRM Institute of Science and Technology',
      college: 'Faculty of Science and Humanities, KTR',
    });
  }
}

// POST /api/settings - Update system settings (Admin only)
export async function POST(req: NextRequest) {
  const adminCheck = await getAdminRole();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized: insufficient privileges' }, { status: 403 });
  }

  try {
    const { institutionName, college } = await req.json();
    if (!institutionName || !college) {
      return NextResponse.json({ error: 'Institution Name and College are required' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Upsert key-values
    const { error: err1 } = await supabase
      .from('system_settings')
      .upsert({ key: 'institutionName', value: institutionName.trim() }, { onConflict: 'key' });

    const { error: err2 } = await supabase
      .from('system_settings')
      .upsert({ key: 'college', value: college.trim() }, { onConflict: 'key' });

    if (err1 || err2) {
      console.error('[POST /api/settings] Upsert error:', err1 || err2);
      return NextResponse.json({ error: err1?.message || err2?.message || 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/settings] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
