import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';
import { CARD_FORMATS } from '@/lib/social/post-content';
import { buildCardElement } from '@/lib/social/card-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Render a branded post card for one listing.
 *
 * Admin-only: this is a drafting tool, not a public endpoint.
 */
export async function GET(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const id = Number(params.get('id'));
  const format = CARD_FORMATS[params.get('format')] ? params.get('format') : 'square';

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Missing or invalid listing id' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: listing, error } = await supabase
    .from('scraped_listings')
    .select(
      'id, title, price_jpy, price_usd, address_english, prefecture, layout, land_area_sqm, floor_area_sqm, estimated_gross_yield'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Card render: listing lookup failed:', error.message);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const { width, height } = CARD_FORMATS[format];
  return new ImageResponse(buildCardElement(listing, format), { width, height });
}
