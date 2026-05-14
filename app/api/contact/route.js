import { NextResponse } from 'next/server';

// API route to handle contact form submissions
// Uses Resend.com for sending emails (free tier: 100 emails/day)
// Get your API key at https://resend.com

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

    // Send email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yama Vista <onboarding@resend.dev>',
          to: [adminEmail],
          reply_to: email,
          subject: `New Contact: ${subject || 'No subject'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb;" />
              <h3 style="color: #1a1a1a;">Message:</h3>
              <p style="white-space: pre-wrap;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb;" />
              <p style="color: #6b7280; font-size: 12px;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error('Resend error:', errorData);
      }
    } else {
      console.log('Contact form submission (Resend not configured):', {
        name,
        email,
        subject,
        message,
      });
    }

    // Optional: Also save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from('contact_submissions').insert({
        name,
        email,
        subject: subject || '',
        message,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
