import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { topicId, topicTitle, authorName, postContent, authorUserId } =
      await request.json();

    if (!topicId || !topicTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all followers except the person who just posted
    const { data: followers } = await supabase
      .from('topic_followers')
      .select('email, user_id')
      .eq('topic_id', topicId)
      .neq('user_id', authorUserId);

    if (!followers || followers.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.japancheaphouses.com';
    const topicUrl = `${siteUrl}/community/topic/${topicId}`;
    const preview = postContent?.slice(0, 200) + (postContent?.length > 200 ? '...' : '');

    let sent = 0;
    for (const follower of followers) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Japan Cheap Houses Community <${fromAddress}>`,
          to: [follower.email],
          subject: `New reply on "${topicTitle}"`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #1a1a1a;">
              <div style="background: #1a1a1a; padding: 24px 32px; margin-bottom: 32px;">
                <h2 style="color: #fff; margin: 0; font-size: 20px;">Japan Cheap Houses Community</h2>
              </div>
              <div style="padding: 0 32px 32px;">
                <p style="margin-top: 0;"><strong>${authorName}</strong> replied to a topic you're following:</p>
                <h3 style="font-size: 18px; margin-bottom: 8px;">${topicTitle}</h3>
                <div style="background: #f9f9f7; border-left: 3px solid #c8a96e; padding: 12px 16px; margin: 16px 0; color: #555;">
                  ${preview}
                </div>
                <a href="${topicUrl}"
                   style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 14px; margin-top: 8px;">
                  View Reply
                </a>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  You're receiving this because you follow this topic.
                  <a href="${topicUrl}" style="color: #9ca3af;">Unfollow</a> to stop notifications.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('Community notify error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
