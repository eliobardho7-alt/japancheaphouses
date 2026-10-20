import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';
import { loadPost } from '@/lib/blog';
import { sendMail } from '@/lib/mail';
import { buildEmail } from '@/lib/newsletter-email';
import { signUnsubscribeToken } from '@/lib/newsletter-token';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

// A broadcast is irreversible, so it never happens by default: a caller has to
// ask for it explicitly with confirm: true. Anything else is a dry run.
const MAX_RECIPIENTS = 2000;

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // defaults below
  }

  const slug = String(body.slug || '').trim();
  const confirm = body.confirm === true;
  if (!slug) return NextResponse.json({ error: 'Missing post slug' }, { status: 400 });

  const post = await loadPost(slug);
  if (!post) return NextResponse.json({ error: 'No post with that slug' }, { status: 404 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .limit(MAX_RECIPIENTS);

  if (error) {
    console.error('Newsletter send: subscriber read failed:', error.message);
    return NextResponse.json({ error: 'Could not read the subscriber list' }, { status: 500 });
  }

  const recipients = (subscribers || []).map((s) => s.email).filter(Boolean);
  const siteUrl = getSiteUrl();
  const fromConfigured = Boolean(process.env.RESEND_FROM_EMAIL);

  // Dry run: report exactly what would happen, send nothing.
  if (!confirm) {
    const sample = recipients[0] || 'nobody@example.com';
    return NextResponse.json({
      dryRun: true,
      wouldSendTo: recipients.length,
      post: { slug: post.slug, title: post.title, url: `${siteUrl}/blog/${post.slug}` },
      fromAddress: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (shared test sender)',
      fromConfigured,
      warning: fromConfigured
        ? null
        : "RESEND_FROM_EMAIL is not set. Resend's shared onboarding sender can only deliver to the account owner's own address, so a broadcast to real subscribers will not arrive. Verify a domain in Resend and set RESEND_FROM_EMAIL first.",
      previewHtml: buildEmail({
        post,
        siteUrl,
        unsubscribeUrl: `${siteUrl}/api/newsletter/unsubscribe?t=${signUnsubscribeToken(sample)}`,
      }),
    });
  }

  if (!recipients.length) {
    return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers to send to.' });
  }

  let sent = 0;
  const failed = [];

  for (const email of recipients) {
    const token = signUnsubscribeToken(email);
    if (!token) {
      failed.push(email);
      continue;
    }
    const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?t=${token}`;

    const ok = await sendMail({
      to: email,
      subject: post.title,
      html: buildEmail({ post, siteUrl, unsubscribeUrl }),
    });

    if (ok) sent++;
    else failed.push(email);
  }

  console.log(`Newsletter broadcast "${post.slug}": ${sent} sent, ${failed.length} failed`);
  return NextResponse.json({ sent, failed: failed.length, total: recipients.length });
}
