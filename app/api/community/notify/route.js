import { NextResponse } from 'next/server';
import { escapeHtml, sanitizeHeader } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase-server';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

// Upper bound on fan-out per reply, so one topic can't drain the Resend quota.
const MAX_RECIPIENTS = 200;

/**
 * Notify followers of a topic that a new reply landed.
 *
 * The caller sends only ids. Everything that ends up in the email body —
 * topic title, author name, reply text — is read back from the database and
 * HTML-escaped, so a caller cannot inject markup or links into mail sent from
 * our domain. The request is only honoured for the authenticated author of the
 * post being announced.
 */
export async function POST(request) {
  const rl = rateLimit(request, { key: 'community-notify', limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Identify the caller from their session cookie, never from the body.
  let user;
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (error) {
    console.error('Community notify: auth lookup failed:', error.message);
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topicId = Number(body?.topicId);
  const postId = Number(body?.postId);
  if (!Number.isInteger(topicId) || !Number.isInteger(postId)) {
    return NextResponse.json({ error: 'Missing or invalid topicId/postId' }, { status: 400 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: 'Notifications are not configured' }, { status: 503 });
  }

  // The post must exist, belong to this topic, and belong to the caller.
  const { data: post, error: postError } = await service
    .from('posts')
    .select('id, topic_id, author_id, author_name, content')
    .eq('id', postId)
    .maybeSingle();

  if (postError) {
    console.error('Community notify: post lookup failed:', postError.message);
    return NextResponse.json({ error: 'Could not send notifications' }, { status: 500 });
  }
  if (!post || post.topic_id !== topicId) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  if (post.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: topic, error: topicError } = await service
    .from('topics')
    .select('id, title')
    .eq('id', topicId)
    .maybeSingle();

  if (topicError || !topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  const { data: followers, error: followerError } = await service
    .from('topic_followers')
    .select('email, user_id')
    .eq('topic_id', topicId)
    .neq('user_id', user.id)
    .limit(MAX_RECIPIENTS);

  if (followerError) {
    console.error('Community notify: follower lookup failed:', followerError.message);
    return NextResponse.json({ error: 'Could not send notifications' }, { status: 500 });
  }
  if (!followers || followers.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const topicUrl = `${getSiteUrl()}/community/topic/${topicId}`;
  const rawPreview = String(post.content || '').slice(0, 200);
  const preview = escapeHtml(rawPreview) + (String(post.content || '').length > 200 ? '…' : '');
  const safeAuthor = escapeHtml(post.author_name || 'A member');
  const safeTitle = escapeHtml(topic.title || '');

  let sent = 0;
  for (const follower of followers) {
    if (!follower?.email) continue;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Japan Cheap Houses Community <${sanitizeHeader(fromAddress)}>`,
          to: [sanitizeHeader(follower.email)],
          subject: sanitizeHeader(`New reply on "${topic.title}"`),
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #1a1a1a;">
              <div style="background: #1a1a1a; padding: 24px 32px; margin-bottom: 32px;">
                <h2 style="color: #fff; margin: 0; font-size: 20px;">Japan Cheap Houses Community</h2>
              </div>
              <div style="padding: 0 32px 32px;">
                <p style="margin-top: 0;"><strong>${safeAuthor}</strong> replied to a topic you're following:</p>
                <h3 style="font-size: 18px; margin-bottom: 8px;">${safeTitle}</h3>
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
    } catch (error) {
      console.error('Community notify: send failed:', error.message);
    }
  }

  return NextResponse.json({ success: true, sent });
}
