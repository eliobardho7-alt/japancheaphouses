import { NextResponse } from 'next/server';

// API route to handle booking submissions
// Sends email to admin + confirmation to user
// Uses Resend.com for emails

export async function POST(request) {
  try {
    const { service, name, email, phone, notes, date, time } = await request.json();

    if (!name || !email || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';
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

    const serviceName = serviceNames[service] || service;

    // Send notification to admin
    if (process.env.RESEND_API_KEY) {
      // Email to admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yama Vista <onboarding@resend.dev>',
          to: [adminEmail],
          reply_to: email,
          subject: `New Booking: ${serviceName} - ${formattedDate}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #1a1a1a;">🎉 New Booking Received</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${time} JST</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${phone}</td>
                </tr>
                ` : ''}
              </table>
              ${notes ? `
                <h3 style="color: #1a1a1a;">Notes from client:</h3>
                <p style="background: #f8f7f4; padding: 12px; border-left: 3px solid #8B0000; white-space: pre-wrap;">${notes}</p>
              ` : ''}
              <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                Reply to this email to contact ${name} directly.
              </p>
            </div>
          `,
        }),
      });

      // Confirmation email to customer
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yama Vista <onboarding@resend.dev>',
          to: [email],
          reply_to: adminEmail,
          subject: `Booking Confirmed: ${serviceName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #1a1a1a;">Hi ${name}, your booking is confirmed!</h2>
              <p>Thank you for booking with Yama Vista. Here are your appointment details:</p>
              <div style="background: #f8f7f4; padding: 20px; margin: 20px 0;">
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${time} (Japan Standard Time)</p>
              </div>
              <p>We will reach out to you shortly with meeting details and any additional information.</p>
              <p>If you need to reschedule or have any questions, just reply to this email.</p>
              <p>Looking forward to our conversation!</p>
              <p><strong>Elio Bardho</strong><br />Yama Vista</p>
            </div>
          `,
        }),
      });
    } else {
      console.log('Booking submission (Resend not configured):', {
        service: serviceName,
        name,
        email,
        date,
        time,
      });
    }

    // Save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from('bookings').insert({
        service,
        full_name: name,
        email,
        phone: phone || '',
        notes: notes || '',
        date,
        time,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to book' },
      { status: 500 }
    );
  }
}
