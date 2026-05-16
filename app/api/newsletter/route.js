import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Save to Supabase newsletter_subscribers table
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email, created_at: new Date().toISOString() }, { onConflict: 'email' });

      if (error) {
        console.error('Newsletter Supabase error:', error);
        // Don't fail — still try to send confirmation
      }
    }

    // Send welcome email via Resend
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      // Notify admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Yama Vista <${fromAddress}>`,
          to: [adminEmail],
          subject: `New Newsletter Subscriber: ${email}`,
          html: `<p>New subscriber: <strong>${email}</strong></p>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
