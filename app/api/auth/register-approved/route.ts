import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email.toLowerCase().trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Security Check: Verify they are actually approved in the database
    const { data: authorizedUser, error: checkError } = await supabaseAdmin
      .from('authorized_users')
      .select('status')
      .eq('email', cleanEmail)
      .single();

    // If they aren't approved (or they are admin but their email isn't in the DB, we shouldn't block admin but let's assume admin is in DB or handled)
    const isApproved = authorizedUser?.status === 'approved' || authorizedUser?.status === 'admin';
    const isAdminOverride = cleanEmail === 'admin@qedit.com' || cleanEmail === 'nagayajbl@srmist.edu.in' || cleanEmail === 'kikrishna@srmist.edu.in'; // Add your admin emails here if needed

    if (!isApproved && !isAdminOverride) {
      return NextResponse.json(
        { error: 'This endpoint is only for pre-approved users.' }, 
        { status: 403 }
      );
    }

    // They are approved! Create the user and bypass the email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true, 
    });

    // If the error says already registered, that's fine
    if (error && !error.message.includes('already registered')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data?.user });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
