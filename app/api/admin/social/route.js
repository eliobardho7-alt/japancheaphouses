import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';
import { buildPost, CARD_FORMATS } from '@/lib/social/post-content';

export const dynamic = 'force-dynamic';

const LISTING_FIELDS =
  'id, title, price_jpy, price_usd, address_english, prefecture, layout, land_area_sqm, floor_area_sqm, estimated_gross_yield, source_url';

const STATUSES = ['draft', 'approved', 'rejected', 'posted'];

/** List posts in the queue, newest first, with their listing attached. */
export async function GET(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const status = new URL(request.url).searchParams.get('status');

  let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });
  if (status && STATUSES.includes(status)) query = query.eq('status', status);

  const { data: posts, error } = await query;
  if (error) {
    console.error('Social queue list failed:', error.message);
    return NextResponse.json({ error: 'Could not load the queue' }, { status: 500 });
  }

  // Attach the listing each post was built from, so the reviewer can sanity
  // check the numbers against the source without leaving the page.
  const ids = [...new Set((posts || []).map((p) => p.listing_id))];
  let listings = [];
  if (ids.length) {
    const { data } = await supabase.from('scraped_listings').select(LISTING_FIELDS).in('id', ids);
    listings = data || [];
  }
  const byId = Object.fromEntries(listings.map((l) => [l.id, l]));

  return NextResponse.json({
    posts: (posts || []).map((p) => ({ ...p, listing: byId[p.listing_id] || null })),
    formats: CARD_FORMATS,
  });
}

/**
 * Generate drafts for listings that don't have one yet in this format.
 *
 * Nothing is published here — drafts land in the queue for review. Listings
 * already drafted in the same format are skipped, so this is safe to run
 * repeatedly (and later, on a schedule).
 */
export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Defaults are fine.
  }

  const format = CARD_FORMATS[body.format] ? body.format : 'square';
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 25);

  const { data: existing } = await supabase
    .from('social_posts')
    .select('listing_id')
    .eq('format', format);
  const drafted = new Set((existing || []).map((r) => r.listing_id));

  // Cheapest listings first: they are the ones that actually stop a scroll.
  const { data: listings, error } = await supabase
    .from('scraped_listings')
    .select(LISTING_FIELDS)
    .not('price_jpy', 'is', null)
    .order('price_jpy', { ascending: true })
    .limit(count + drafted.size + 25);

  if (error) {
    console.error('Social generate: listing query failed:', error.message);
    return NextResponse.json({ error: 'Could not read listings' }, { status: 500 });
  }

  const candidates = (listings || []).filter((l) => !drafted.has(l.id)).slice(0, count);
  if (!candidates.length) {
    return NextResponse.json({ created: 0, message: 'Every listing already has a draft in this format.' });
  }

  const rows = candidates.map((listing) => {
    const post = buildPost(listing, format);
    return {
      listing_id: listing.id,
      format,
      caption: post.caption,
      hashtags: post.hashtags,
      alt_text: post.altText,
      status: 'draft',
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('social_posts')
    .upsert(rows, { onConflict: 'listing_id,format' })
    .select('id');

  if (insertError) {
    console.error('Social generate: insert failed:', insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ created: inserted?.length || 0 });
}

/** Approve, reject, or edit the caption of a queued post. */
export async function PATCH(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { id, status, caption } = body || {};
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update = {};
  if (status) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }
    update.status = status;
    update.reviewed_at = new Date().toISOString();
  }
  if (typeof caption === 'string') update.caption = caption.slice(0, 5000);

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await supabase.from('social_posts').update(update).eq('id', id);
  if (error) {
    console.error('Social queue update failed:', error.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
