import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import transporter from '@/lib/mailer';
import crypto from 'crypto';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the email is in authorized_users table
    const { data: authorized } = await supabaseAdmin
      .from('authorized_users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!authorized) {
      // Return success anyway to avoid revealing which emails are registered
      return NextResponse.json({ success: true });
    }

    // Check if an account with this email actually exists in Supabase Auth
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = users?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!userExists) {
      return NextResponse.json({ success: true });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('email', normalizedEmail);

    // Store token
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Token insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create reset token' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    // Send reset email
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `QEdit <${process.env.MAIL_USER}>`,
      to: normalizedEmail,
      subject: '🔐 Reset your QEdit password',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <div style="margin-bottom: 28px; text-align: center;">
            <div style="display: inline-block; background: linear-gradient(135deg, #0a1628, #0f2027); padding: 16px 24px; border-radius: 12px; margin-bottom: 16px;">
              <span style="font-size: 22px; font-weight: 800; color: #3fa97c; letter-spacing: -0.5px;">QEdit</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px;">Reset your password</h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">You requested a password reset for your QEdit account.</p>
          </div>

          <div style="background: #f0faf6; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #c4e5d3;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #2a7d5f; font-weight: 500;">RESET LINK (expires in 1 hour)</p>
            <a href="${resetLink}" style="display: inline-block; margin-top: 4px; padding: 12px 28px; background: linear-gradient(135deg, #2a7d5f, #1e6b4f); color: #fff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
              Reset Password →
            </a>
          </div>

          <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email. This link will expire in <strong>1 hour</strong>.
          </p>

          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
          <p style="font-size: 11px; color: #d1d5db; text-align: center; margin: 0;">
            QEdit · Question Paper Management System
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
