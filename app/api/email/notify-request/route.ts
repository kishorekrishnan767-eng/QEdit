import { NextRequest, NextResponse } from 'next/server';
import transporter from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { ownerEmail, requesterEmail, requesterName, paperTitle, paperId } = await req.json();

    if (!ownerEmail || !requesterEmail || !paperTitle || !paperId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: ownerEmail,
      subject: `Access Request for "${paperTitle}" — QEdit`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px;">Access Request</h1>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">QEdit · Question Paper System</p>
          </div>

          <div style="background: #f8f9fb; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e5ea;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Someone wants to access your paper:</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">📄 ${paperTitle}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; color: #374151; margin: 0 0 4px;"><strong>From:</strong> ${requesterName || requesterEmail}</p>
            <p style="font-size: 14px; color: #374151; margin: 0;"><strong>Email:</strong> ${requesterEmail}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard"
            style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2a7d5f, #1e6b4f); color: #fff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
            Review in Dashboard →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Open the Share modal on the paper to approve or deny this request.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
