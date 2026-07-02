import { NextRequest, NextResponse } from 'next/server';
import transporter from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { requesterEmail, requesterName, paperTitle, paperId, permission, approved } = await req.json();

    if (!requesterEmail || !paperTitle || !paperId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paperUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/paper/${paperId}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: requesterEmail,
      subject: approved
        ? `✅ Access Granted — "${paperTitle}" on QEdit`
        : `❌ Access Request Denied — "${paperTitle}" on QEdit`,
      html: approved
        ? `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
            <div style="margin-bottom: 24px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px;">🎉 Access Granted!</h1>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">QEdit · Question Paper System</p>
            </div>

            <div style="background: #e8f5ee; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #c4e5d3;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #2a7d5f;">You now have <strong>${permission}</strong> access to:</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">📄 ${paperTitle}</p>
            </div>

            <a href="${paperUrl}"
              style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2a7d5f, #1e6b4f); color: #fff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
              Open Paper →
            </a>

            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
              You have been granted ${permission} access. ${permission === 'view' ? 'You can view but not edit this paper.' : 'You can view and edit this paper.'}
            </p>
          </div>
        `
        : `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
            <div style="margin-bottom: 24px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px;">Access Request Denied</h1>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">QEdit · Question Paper System</p>
            </div>

            <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #fecaca;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #dc2626;">Your request to access the following paper was denied:</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">📄 ${paperTitle}</p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              If you believe this is a mistake, please contact the paper owner directly.
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
