import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  // Unauthenticated by design (it fires right after a topic insert), and it
  // only ever mails the admin — but without a limit anyone can flood that
  // inbox and burn the Resend quota. Fail quietly: never block topic creation.
  const rl = rateLimit(request, { key: 'notify-admin', limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: true });

  try {
    const body = await request.json();
    const { title, category, authorName, authorEmail, content, topicId } = body || {};

    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true });

    const adminEmail = process.env.ADMIN_EMAIL || 'eliobardho7@gmail.com';
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Yama Vista <${sanitizeHeader(fromAddress)}>`,
        to: [sanitizeHeader(adminEmail)],
        subject: sanitizeHeader(`New Community Topic: ${title || 'Untitled'}`),
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
  <h2>New Community Topic</h2>
  <p><strong>Title:</strong> ${escapeHtml(title || '')}</p>
  <p><strong>Category:</strong> ${escapeHtml(category || '')}</p>
  <p><strong>Author:</strong> ${escapeHtml(authorName || '')} (${escapeHtml(authorEmail || '')})</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;" />
  <p style="white-space:pre-wrap;">${escapeHtml((content || '').slice(0, 500))}${(content || '').length > 500 ? '...' : ''}</p>
  <p style="color:#6b7280;font-size:12px;">Posted at ${new Date().toUTCString()}</p>
</div>`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('community notify-admin error:', e);
    return NextResponse.json({ ok: true });
  }
}
