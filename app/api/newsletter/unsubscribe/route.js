import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken } from '@/lib/newsletter-token';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * One-click unsubscribe.
 *
 * Deliberately handles GET as well as POST. Mail clients and the List-Unsubscribe
 * header follow links with GET, and an unsubscribe that only works from a form
 * is one that quietly fails for the people least likely to chase it.
 *
 * Removing the row is the unsubscribe: the table has no opt-out column, and
 * deleting is unambiguous — the address is simply no longer on the list.
 */
async function unsubscribe(token) {
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false, status: 400, message: 'This unsubscribe link is not valid.' };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, status: 503, message: 'Unsubscribe is temporarily unavailable.' };

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('email', email);
    if (error) {
      console.error('Unsubscribe failed:', error.message);
      return { ok: false, status: 500, message: 'Could not unsubscribe. Please email us instead.' };
    }
  } catch (error) {
    console.error('Unsubscribe error:', error.message);
    return { ok: false, status: 500, message: 'Could not unsubscribe. Please email us instead.' };
  }

  return { ok: true, status: 200, email };
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('t');
  const result = await unsubscribe(token);
  const site = getSiteUrl();

  // Plain HTML: this is opened from a mail client, often logged out.
  const body = result.ok
    ? `<h1>You're unsubscribed</h1><p>We've removed your address from the Yama Vista newsletter. You won't receive further emails from us.</p><p>Changed your mind? You can sign up again any time at <a href="${site}/guide">${site.replace(/^https?:\/\//, '')}/guide</a>.</p>`
    : `<h1>We couldn't unsubscribe you</h1><p>${result.message}</p><p>Email us and we'll remove you by hand.</p>`;

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribe — Yama Vista</title><style>body{font-family:system-ui,sans-serif;max-width:34rem;margin:12vh auto;padding:0 1.5rem;color:#1a1a1a;line-height:1.6}h1{font-size:1.6rem;margin-bottom:1rem}a{color:#8B0000}</style></head><body>${body}</body></html>`,
    { status: result.status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function POST(request) {
  let token = new URL(request.url).searchParams.get('t');
  if (!token) {
    try {
      token = (await request.json())?.token;
    } catch {
      // keep token null
    }
  }
  const result = await unsubscribe(token);
  return NextResponse.json(
    result.ok ? { success: true } : { error: result.message },
    { status: result.status }
  );
}
