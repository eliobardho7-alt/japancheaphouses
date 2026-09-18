import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    bookingsAll,
    bookingsRecent,
    contactAll,
    contactRecent,
    newsletterAll,
    newsletterRecent,
    subscriptionsAll,
    subscriptionsRecent,
    topicsRecent,
    postsRecent,
  ] = await Promise.all([
    supabase.from('bookings').select('id, status, service, full_name, email, created_at').order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('contact_submissions').select('id, name, email, subject, created_at').order('created_at', { ascending: false }),
    supabase.from('contact_submissions').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('newsletter_subscribers').select('id, email, created_at').order('created_at', { ascending: false }),
    supabase.from('newsletter_subscribers').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('subscriptions').select('id, email, status, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('topics').select('id, title, author_name, category, created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
    supabase.from('posts').select('id, author_name, created_at, topic_id').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
  ]);

  // Booking status breakdown
  const bookingStatuses = {};
  for (const b of bookingsAll.data || []) {
    bookingStatuses[b.status] = (bookingStatuses[b.status] || 0) + 1;
  }

  // Daily activity for last 30 days (buckets)
  const dailyActivity = {};
  const pad = (n) => String(n).padStart(2, '0');
  const toDay = (iso) => iso?.slice(0, 10);

  // Pre-fill last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dailyActivity[key] = { bookings: 0, contacts: 0, newsletter: 0, subscriptions: 0 };
  }

  for (const r of bookingsRecent.data || []) {
    const k = toDay(r.created_at);
    if (dailyActivity[k]) dailyActivity[k].bookings++;
  }
  for (const r of contactRecent.data || []) {
    const k = toDay(r.created_at);
    if (dailyActivity[k]) dailyActivity[k].contacts++;
  }
  for (const r of newsletterRecent.data || []) {
    const k = toDay(r.created_at);
    if (dailyActivity[k]) dailyActivity[k].newsletter++;
  }
  for (const r of subscriptionsRecent.data || []) {
    const k = toDay(r.created_at);
    if (dailyActivity[k]) dailyActivity[k].subscriptions++;
  }

  // Build recent activity feed (mix of all event types, sorted by date, last 40)
  const feed = [
    ...(bookingsAll.data || []).slice(0, 20).map((r) => ({
      type: 'booking',
      label: `Booking: ${r.full_name || r.email}`,
      detail: r.service || '',
      status: r.status,
      ts: r.created_at,
    })),
    ...(contactAll.data || []).slice(0, 20).map((r) => ({
      type: 'contact',
      label: `Contact: ${r.name || r.email}`,
      detail: r.subject || '',
      ts: r.created_at,
    })),
    ...(newsletterAll.data || []).slice(0, 20).map((r) => ({
      type: 'newsletter',
      label: `Newsletter: ${r.email}`,
      detail: '',
      ts: r.created_at,
    })),
    ...(subscriptionsAll.data || []).slice(0, 20).map((r) => ({
      type: 'subscription',
      label: `Subscription: ${r.email || 'unknown'}`,
      detail: r.status || '',
      ts: r.created_at,
    })),
    ...(topicsRecent.data || []).map((r) => ({
      type: 'topic',
      label: `New Topic: ${r.title}`,
      detail: r.author_name || '',
      ts: r.created_at,
    })),
    ...(postsRecent.data || []).map((r) => ({
      type: 'reply',
      label: `Community Reply`,
      detail: r.author_name || '',
      ts: r.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 40);

  return NextResponse.json({
    totals: {
      bookings: bookingsAll.data?.length || 0,
      contacts: contactAll.data?.length || 0,
      newsletter: newsletterAll.data?.length || 0,
      subscriptions: subscriptionsAll.data?.length || 0,
    },
    last30: {
      bookings: bookingsRecent.data?.length || 0,
      contacts: contactRecent.data?.length || 0,
      newsletter: newsletterRecent.data?.length || 0,
      subscriptions: subscriptionsRecent.data?.length || 0,
    },
    bookingStatuses,
    dailyActivity: Object.entries(dailyActivity).map(([date, counts]) => ({ date, ...counts })),
    feed,
  });
}
