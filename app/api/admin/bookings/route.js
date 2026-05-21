import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ bookings: [] });

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data || [] });
}

export async function PATCH(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await request.json();
  if (!body.id || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: body.status })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
