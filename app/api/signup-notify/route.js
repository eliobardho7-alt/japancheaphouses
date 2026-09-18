import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader, isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  const rl = rateLimit(request, { key: 'signup-notify', limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: true }); // silently skip, don't block the signup flow

  try {
    const body = await request.json();
    const { email, name } = body || {};

    if (!email || !isValidEmail(email)) return NextResponse.json({ ok: true });

    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true });

    const adminEmail = process.env.ADMIN_EMAIL || 'eliobardho7@gmail.com';
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const safeEmail = escapeHtml(email);
    const safeName = escapeHtml(name || email.split('@')[0]);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Yama Vista <${sanitizeHeader(fromAddress)}>`,
        to: [sanitizeHeader(adminEmail)],
        subject: sanitizeHeader(`New Sign Up: ${name || email}`),
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
  <h2>New User Sign Up</h2>
  <p><strong>Name:</strong> ${safeName}</p>
  <p><strong>Email:</strong> ${safeEmail}</p>
  <p style="color:#6b7280;font-size:12px;">Signed up at ${new Date().toUTCString()}</p>
</div>`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('signup-notify error:', e);
    return NextResponse.json({ ok: true });
  }
}
