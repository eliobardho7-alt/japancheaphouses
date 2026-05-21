import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ submissions: [] });

  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data || [] });
}
