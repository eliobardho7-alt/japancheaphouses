'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Lock, MapPin, Filter, X } from 'lucide-react';
import { listings as staticListings } from '@/data/listings';
import { supabase, getCurrentUser, getUserSubscription } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';
const JAPAN_CENTER = [37.5, 137.5];
const JAPAN_ZOOM = 5;

// Fix Leaflet's default icon paths (broken when bundled by webpack/Turbopack)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const premiumIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: 'premium-marker',
});

function normalizeStatic(item) {
  return {
    id: `static-${item.id}`,
    slug: item.slug,
    title: item.title,
    prefecture: item.prefecture,
    latitude: item.latitude,
    longitude: item.longitude,
    price: item.price,
    location: item.location,
    isPremium: !!item.isPremium,
    href: `/listings/${item.slug}`,
    coverImage: null,
  };
}

// Tiny deterministic offset for listings that share an exact geocoded point
// (e.g. several houses on the same block, all returned by GSI at one coordinate).
// Spread is ~±0.0005° (~50 m) — enough to make each pin clickable at street zoom
// without misrepresenting the true location.
function jitterCoords(listings) {
  const grouped = new Map();
  listings.forEach((l) => {
    if (l.latitude == null || l.longitude == null) return;
    const key = `${l.latitude.toFixed(4)},${l.longitude.toFixed(4)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(l);
  });

  const out = [];
  grouped.forEach((group) => {
    if (group.length === 1) {
      out.push(group[0]);
      return;
    }
    group.forEach((l, idx) => {
      const seed = String(l.id)
        .split('')
        .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
      const angle = ((seed % 360) + (idx * 47)) * (Math.PI / 180);
      const radius = 0.0002 + ((Math.abs(seed) % 30) / 100000); // ~30–80 m
      out.push({
        ...l,
        latitude: l.latitude + Math.cos(angle) * radius,
        longitude: l.longitude + Math.sin(angle) * radius,
      });
    });
  });
  return out;
}

function normalizeScraped(row) {
  return {
    id: `scraped-${row.id}`,
    slug: row.id,
    title: row.title,
    prefecture: row.prefecture,
    latitude: row.latitude,
    longitude: row.longitude,
    price: row.price_jpy ? `¥${row.price_jpy.toLocaleString('en-US')}` : '—',
    location: row.address_english,
    isPremium: false,
    href: `/map/listing/${row.id}`,
    coverImage: row.cover_image_url || null,
  };
}

export default function MapView() {
  const [allListings, setAllListings] = useState(
    staticListings
      .filter((l) => l.latitude && l.longitude)
      .map(normalizeStatic)
  );
  const [activePrefecture, setActivePrefecture] = useState('All');
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load scraped listings from Supabase + check user subscription
  useEffect(() => {
    async function load() {
      if (supabase) {
        const { data } = await supabase
          .from('scraped_listings')
          .select('*')
          .eq('status', 'active')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        if (data && data.length > 0) {
          setAllListings((prev) => [...prev, ...data.map(normalizeScraped)]);
        }
      }

      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setIsSubscribed(true);
        } else {
          const sub = await getUserSubscription(currentUser.id);
          setIsSubscribed(!!sub);
        }
      }
    }
    load();
  }, []);

  const prefectures = useMemo(() => {
    const set = new Set(allListings.map((l) => l.prefecture).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [allListings]);

  // Apply prefecture filter and de-stack same-coordinate markers
  const visibleListings = useMemo(() => {
    let filtered = allListings;
    if (activePrefecture !== 'All') {
      filtered = filtered.filter((l) => l.prefecture === activePrefecture);
    }
    return jitterCoords(filtered);
  }, [allListings, activePrefecture]);

  return (
    <div className="pt-20 relative">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-24 left-4 z-[1000] bg-brand text-white p-3 shadow-lg"
        aria-label="Toggle filters"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
      </button>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 bg-white border-r border-brand-border overflow-y-auto fixed lg:relative inset-0 z-40 lg:z-auto pt-20 lg:pt-6 px-6 pb-6`}
        >
          <h1 className="font-serif text-2xl text-brand mb-2">Property Map</h1>
          <p className="text-xs text-brand-gray mb-6">
            {visibleListings.length} of {allListings.length} listings shown
          </p>

          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-brand-gray mb-3">
              Filter by Prefecture
            </h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {prefectures.map((pref) => {
                const count = pref === 'All'
                  ? allListings.length
                  : allListings.filter((l) => l.prefecture === pref).length;
                return (
                  <button
                    key={pref}
                    onClick={() => {
                      setActivePrefecture(pref);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm transition-base ${
                      activePrefecture === pref
                        ? 'bg-brand text-white'
                        : 'text-brand hover:bg-brand-light'
                    }`}
                  >
                    <span>{pref}</span>
                    <span className={`text-xs ${activePrefecture === pref ? 'text-white/70' : 'text-brand-gray'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {!isSubscribed && (
            <div className="bg-brand-light border border-brand-accent p-4">
              <Lock className="h-5 w-5 text-brand-accent mb-2" />
              <p className="text-sm text-brand mb-2">
                <strong>Free preview</strong>
              </p>
              <p className="text-xs text-brand-gray mb-3 leading-relaxed">
                You can see every property's location. Subscribe to unlock:
              </p>
              <ul className="text-xs text-brand-gray mb-4 space-y-1 ml-4 list-disc">
                <li>Prices on each preview</li>
                <li>Unlimited daily detail views (free tier: 5 per day)</li>
                <li>Full property descriptions & photos</li>
              </ul>
              <Link href="/pricing" className="btn-primary text-xs px-4 py-2 inline-block">
                Subscribe for $5/mo
              </Link>
            </div>
          )}

          {isSubscribed && (
            <div className="bg-green-50 border border-green-200 p-3">
              <p className="text-xs text-green-800">
                ✓ Premium access — viewing all listings
              </p>
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-grow relative">
          <MapContainer
            center={JAPAN_CENTER}
            zoom={JAPAN_ZOOM}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleListings.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={listing.isPremium ? premiumIcon : defaultIcon}
              >
                <Popup>
                  <div className="min-w-[220px] max-w-[260px]">
                    {listing.coverImage && (
                      <img
                        src={listing.coverImage}
                        alt={listing.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-full h-32 object-cover mb-2"
                      />
                    )}
                    {listing.isPremium && (
                      <span className="inline-flex items-center gap-1 bg-brand-accent text-white text-xs px-2 py-0.5 mb-2">
                        <Lock className="h-3 w-3" />
                        Premium
                      </span>
                    )}
                    <h3 className="font-serif text-base text-brand mb-1">{listing.title}</h3>
                    <p className="text-xs text-brand-gray mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.location}
                    </p>
                    {isSubscribed ? (
                      <p className="text-sm font-semibold text-brand mb-3">{listing.price}</p>
                    ) : (
                      <p className="text-xs text-brand-gray mb-3 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Price hidden — <Link href="/pricing" className="underline hover:text-brand-accent">subscribe to view</Link>
                      </p>
                    )}
                    <Link
                      href={listing.href}
                      className="inline-block bg-brand text-white text-xs px-3 py-1.5 hover:bg-brand-accent transition-base"
                    >
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
