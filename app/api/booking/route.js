import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader, isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  const rl = rateLimit(request, { key: 'booking', limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { service, name, email, phone, notes, date, time, website } = body || {};

    if (website) return NextResponse.json({ success: true }); // honeypot

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (String(name).length > 200 || String(notes || '').length > 5000) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const serviceNames = {
      consultation: 'Free Initial Consultation (45 min)',
      inspection: 'Pre-Purchase Inspection (2 hr)',
      management: 'Property Management Consultation (1 hr)',
    };
    const serviceName = serviceNames[service] || String(service || '').slice(0, 100);

    // All escaped for HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || '');
    const safeNotes = escapeHtml(notes || '');
    const safeService = escapeHtml(serviceName);
    const safeDate = escapeHtml(formattedDate);
    const safeTime = escapeHtml(time);

    if (process.env.RESEND_API_KEY) {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Yama Vista <${sanitizeHeader(fromAddress)}>`,
          to: [sanitizeHeader(adminEmail)],
          reply_to: sanitizeHeader(email),
          subject: sanitizeHeader(`New Booking: ${serviceName} - ${formattedDate}`),
          html: `
<div style="font-family: sans-serif; max-width: 600px; margin: auto;">
  <h2 style="color: #1a1a1a;">New Booking Received</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeService}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeDate}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeTime} JST</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeName}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeEmail}</td></tr>
    ${safePhone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safePhone}</td></tr>` : ''}
  </table>
  ${safeNotes ? `<h3>Notes:</h3><p style="background:#f8f7f4;padding:12px;border-left:3px solid #8B0000;white-space:pre-wrap;">${safeNotes}</p>` : ''}
  <p style="color:#6b7280;font-size:12px;">Reply to this email to contact ${safeName} directly.</p>
</div>`,
        }),
      });

      const adminResult = await adminRes.json();
      if (!adminRes.ok) {
        console.error('Resend admin email error:', JSON.stringify(adminResult));
      }

      // Customer confirmation — only when sending from a verified custom domain
      if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL !== 'onboarding@resend.dev') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Yama Vista <${sanitizeHeader(process.env.RESEND_FROM_EMAIL)}>`,
            to: [sanitizeHeader(email)],
            reply_to: sanitizeHeader(adminEmail),
            subject: sanitizeHeader(`Booking Confirmed: ${serviceName}`),
            html: `
<div style="font-family: sans-serif; max-width: 600px; margin: auto;">
  <h2 style="color: #1a1a1a;">Hi ${safeName}, your booking is confirmed!</h2>
  <p>Thank you for booking with Yama Vista. Here are your appointment details:</p>
  <div style="background: #f8f7f4; padding: 20px; margin: 20px 0;">
    <p><strong>Service:</strong> ${safeService}</p>
    <p><strong>Date:</strong> ${safeDate}</p>
    <p><strong>Time:</strong> ${safeTime} (Japan Standard Time)</p>
  </div>
  <p>We will reach out to you shortly with meeting details.</p>
  <p>If you need to reschedule, just reply to this email.</p>
  <p><strong>Elio Bardho</strong><br />Yama Vista</p>
</div>`,
          }),
        });
      }
    } else {
      console.warn('RESEND_API_KEY not configured — email not sent.');
    }

    // Save to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error: dbError } = await supabase.from('bookings').insert({
        service: String(service || '').slice(0, 100),
        full_name: String(name).slice(0, 200),
        email: String(email).slice(0, 254),
        phone: String(phone || '').slice(0, 50),
        notes: String(notes || '').slice(0, 5000),
        date,
        time: String(time).slice(0, 20),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      if (dbError) console.error('Supabase booking insert error:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 });
  }
}
