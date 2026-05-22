import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
  try {
    const { address, prefecture } = await request.json();
    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
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
    if (!coords && prefecture) {
      coords = await nominatim(`${prefecture}, Japan`);
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
