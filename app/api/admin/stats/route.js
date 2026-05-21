import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

// Always run on request; never prerender (depends on cookies + env at runtime)
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ bookings: 0, messages: 0, blogs: 0, listings: 0 });
  }

  const [bookings, messages, blogs, listings] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    bookings: bookings.count || 0,
    messages: messages.count || 0,
    blogs: blogs.count || 0,
    listings: listings.count || 0,
  });
}
