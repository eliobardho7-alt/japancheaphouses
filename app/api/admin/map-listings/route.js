import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * CRUD for the listings behind /map (the scraped_listings table).
 *
 * The admin page used to write to Supabase straight from the browser. Reads
 * happened to work because /map needs a public select policy, but writes
 * depend on a policy for the signed-in role that may or may not exist —
 * going through the service role here removes that uncertainty entirely and
 * matches how every other admin screen works.
 */

// Only columns that actually exist on the table; anything else is dropped so a
// stray field from the form can't fail the whole write.
const WRITABLE = [
  'source_url',
  'title',
  'price_jpy',
  'price_usd',
  'address_english',
  'address_japanese',
  'prefecture',
  'layout',
  'land_area_sqm',
  'floor_area_sqm',
  'estimated_gross_yield',
  'description_english',
  'latitude',
  'longitude',
  'status',
  'image_urls',
  'cover_image_url',
  'blog_content',
  'blog_published_at',
];

function clean(body) {
  const row = {};
  for (const key of WRITABLE) {
    if (body[key] !== undefined) row[key] = body[key] === '' ? null : body[key];
  }
  return row;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ listings: [] });

  const { data, error } = await supabase
    .from('scraped_listings')
    .select('*')
    .order('scraped_at', { ascending: false });

  if (error) {
    console.error('Map listings read failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ listings: data || [] });
}

export async function POST(request) {
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

  const { data, error } = await supabase
    .from('scraped_listings')
    .insert(clean(body))
    .select()
    .single();

  if (error) {
    console.error('Map listing insert failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ listing: data });
}

export async function PUT(request) {
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

  const id = Number(body?.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scraped_listings')
    .update({ ...clean(body), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Map listing update failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ listing: data });
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  const { error } = await supabase.from('scraped_listings').delete().eq('id', id);
  if (error) {
    console.error('Map listing delete failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
