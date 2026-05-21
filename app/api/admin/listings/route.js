import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ listings: [] });

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  const listing = { ...body, slug: body.slug || slugify(body.title) };
  delete listing.id;

  const { data, error } = await supabase.from('listings').insert(listing).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data });
}

export async function PUT(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const update = { ...body, slug: body.slug || slugify(body.title) };
  delete update.id;

  const { data, error } = await supabase
    .from('listings')
    .update(update)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data });
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
