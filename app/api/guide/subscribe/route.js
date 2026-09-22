import { NextResponse } from 'next/server';
import { escapeHtml, isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeEmail, storeSubscriber, notifyAdminOfSubscriber } from '@/lib/newsletter';
import { sendMail } from '@/lib/mail';
import { signGuideToken, GUIDE } from '@/lib/guide';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * Subscribe to the newsletter in exchange for the buyer's guide.
 *
 * The download link is only issued once the address is actually stored — if
 * the write fails we return an error instead of handing over the file, so the
 * guide is never given away without the subscription it is trading for.
 */
export async function POST(request) {
  const rl = rateLimit(request, { key: 'guide-subscribe', limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, website } = body || {};

  // Honeypot — bots fill hidden fields. Answer as if it worked, but hand over
  // a link that was never issued.
  if (website) return NextResponse.json({ success: true, downloadUrl: null });

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const normalized = normalizeEmail(email);

  const stored = await storeSubscriber(normalized, 'buyers-guide');
  if (!stored) {
    return NextResponse.json(
      { error: 'We could not complete your subscription. Please try again shortly.' },
      { status: 503 }
    );
  }

  const token = signGuideToken(normalized);
  if (!token) {
    console.error('Guide download is unavailable: no signing secret configured');
    return NextResponse.json(
      { error: 'The download is temporarily unavailable. We have saved your subscription.' },
      { status: 503 }
    );
  }

  const downloadUrl = `/api/guide/download?t=${encodeURIComponent(token)}`;

  // Also mail the link. This doubles as a soft check that the address is real,
  // without making the visitor wait for an email to get the file.
  const absoluteUrl = `${getSiteUrl()}${downloadUrl}`;
  await sendMail({
    to: normalized,
    subject: `Your copy of ${GUIDE.title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a1a;">
  <div style="background:#1a1a1a;padding:24px 32px;margin-bottom:32px;">
    <h2 style="color:#fff;margin:0;font-size:20px;">Yama Vista</h2>
  </div>
  <div style="padding:0 32px 32px;">
    <p style="margin-top:0;">Thanks for subscribing. Here is your copy of
      <strong>${escapeHtml(GUIDE.title)}</strong> — ${GUIDE.slides} slides covering
      what you can legally own, what it really costs, and the six findings that
      should end a deal on the spot.</p>
    <a href="${absoluteUrl}"
       style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;font-size:14px;margin:8px 0;">
      Download the guide
    </a>
    <p style="color:#6b7280;font-size:12px;">This link expires in an hour. If it
      stops working, request another copy at
      <a href="${getSiteUrl()}/guide" style="color:#6b7280;">${getSiteUrl()}/guide</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
    <p style="color:#9ca3af;font-size:12px;margin:0;">You are receiving this
      because you subscribed to the Yama Vista newsletter at japancheaphouses.com.</p>
  </div>
</div>`,
  });

  await notifyAdminOfSubscriber(normalized, "buyer's guide download");

  return NextResponse.json({ success: true, downloadUrl });
}
