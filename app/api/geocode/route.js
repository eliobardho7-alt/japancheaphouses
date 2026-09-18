import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Always run on request; never prerender (depends on cookies + env at runtime)
export const dynamic = 'force-dynamic';

// Nominatim's usage policy caps us at roughly one request per second and will
// block the whole site's IP for abuse, so this stays admin-only (its only
// caller is /admin/map-listings) with a rate limit behind that.
async function nominatim(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'jp');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'japancheaphouses.com listing geocoder (contact: eliobardho7@gmail.com)',
    },
  });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = rateLimit(request, { key: 'geocode', limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { address, prefecture } = await request.json();
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }
    if (address.length > 300) {
      return NextResponse.json({ error: 'Address too long' }, { status: 400 });
    }

    // Try full address first
    let coords = await nominatim(address);

    // Fallback: drop street, keep last 3 segments (city + prefecture + Japan)
    if (!coords) {
      const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        coords = await nominatim(parts.slice(-3).join(', '));
      }
    }

    // Fallback: just prefecture
    if (!coords && prefecture && typeof prefecture === 'string') {
      coords = await nominatim(`${prefecture.slice(0, 100)}, Japan`);
    }

    if (!coords) {
      return NextResponse.json({ error: 'No match found' }, { status: 404 });
    }
    return NextResponse.json(coords);
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
