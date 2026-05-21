import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader, isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  const rl = rateLimit(request, { key: 'newsletter', limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { email, website } = body || {};
    if (website) return NextResponse.json({ success: true }); // honeypot

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalized = String(email).trim().slice(0, 254).toLowerCase();

    // Save to Supabase newsletter_subscribers table
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email: normalized, created_at: new Date().toISOString() }, { onConflict: 'email' });
      if (error) console.error('Newsletter Supabase error:', error);
    }

    // Notify admin
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';
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
          subject: sanitizeHeader(`New Newsletter Subscriber: ${normalized}`),
          html: `<p>New subscriber: <strong>${escapeHtml(normalized)}</strong></p>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
