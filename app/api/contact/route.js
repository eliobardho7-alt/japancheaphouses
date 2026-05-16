import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';

    if (process.env.RESEND_API_KEY) {
      // IMPORTANT: 'onboarding@resend.dev' can ONLY deliver to your own verified email.
      // To send to customers, verify a domain in Resend and set RESEND_FROM_EMAIL.
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Yama Vista <${fromAddress}>`,
          to: [adminEmail],
          reply_to: email,
          subject: `New Contact: ${subject || 'No subject'} — from ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb;" />
              <h3 style="color: #1a1a1a;">Message:</h3>
              <p style="white-space: pre-wrap;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb;" />
              <p style="color: #6b7280; font-size: 12px;">Reply directly to this email to respond to ${name}.</p>
            </div>
          `,
        }),
      });

      const result = await emailRes.json();
      if (!emailRes.ok) {
        console.error('Resend contact email error:', JSON.stringify(result));
      } else {
        console.log('Contact email sent, id:', result.id);
      }
    } else {
      console.warn('RESEND_API_KEY not configured — contact form not emailed:', { name, email, subject, message });
    }

    // Save to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error: dbError } = await supabase.from('contact_submissions').insert({
        name,
        email,
        subject: subject || '',
        message,
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
