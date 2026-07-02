import { NextRequest, NextResponse } from 'next/server';
import transporter from '@/lib/mailer';
import { getAdminSupabase } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, whatsapp, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Embed whatsapp securely in the message for DB compatibility
    const finalMessage = whatsapp ? `[WhatsApp: ${whatsapp}]\n\n${message}` : message;

    // 1. Save to Supabase
    const { error: dbError } = await getAdminSupabase()
      .from('inquiries')
      .insert({ name, email, organization, message: finalMessage });

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json({ error: 'Failed to save inquiry to database' }, { status: 500 });
    }

    // 2. Send email via native nodemailer transporter
    const targetEmail = process.env.MAIL_USER;
    if (targetEmail) {
      await transporter.sendMail({
        from: `"${name} via QEdit" <${targetEmail}>`,
        replyTo: email,
        to: targetEmail,
        subject: `New Inquiry from ${name} - QEdit`,
        text: `You have received a new inquiry.\n\nName: ${name}\nEmail: ${email}\nOrganization: ${organization || 'N/A'}\nWhatsApp: ${whatsapp || 'N/A'}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
            <h2 style="color: #2a7d5f;">New QEdit Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>WhatsApp:</strong> ${whatsapp || 'N/A'}</p>
            <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <p style="background: #f9f9f9; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${message}</p>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
