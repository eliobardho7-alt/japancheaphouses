import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader, isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  // Rate limit: 5 submissions per minute per IP
  const rl = rateLimit(request, { key: 'contact', limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { name, email, subject, message, website } = body || {};

    // Honeypot — bots fill hidden fields
    if (website) return NextResponse.json({ success: true });

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (String(name).length > 200 || String(message).length > 5000 || String(subject || '').length > 200) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';

    // Escaped values for HTML interpolation
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || 'No subject');
    const safeMessage = escapeHtml(message);

    if (process.env.RESEND_API_KEY) {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Yama Vista <${sanitizeHeader(fromAddress)}>`,
          to: [sanitizeHeader(adminEmail)],
          reply_to: sanitizeHeader(email),
          subject: sanitizeHeader(`New Contact: ${subject || 'No subject'} — from ${name}`),
          html: `
<div style="font-family: sans-serif; max-width: 600px; margin: auto;">
  <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
  <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
  <p><strong>Subject:</strong> ${safeSubject}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <h3 style="color: #1a1a1a;">Message:</h3>
  <p style="white-space: pre-wrap;">${safeMessage}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <p style="color: #6b7280; font-size: 12px;">Reply directly to this email to respond to ${safeName}.</p>
</div>`,
        }),
      });

      const result = await emailRes.json();
      if (!emailRes.ok) {
        console.error('Resend contact email error:', JSON.stringify(result));
      }
    } else {
      console.warn('RESEND_API_KEY not configured — contact form not emailed');
    }

    // Save to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error: dbError } = await supabase.from('contact_submissions').insert({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 254),
        subject: String(subject || '').slice(0, 200),
        message: String(message).slice(0, 5000),
        created_at: new Date().toISOString(),
      });
      if (dbError) console.error('Supabase contact insert error:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
