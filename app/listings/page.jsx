'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Lock, Filter, MapPin } from 'lucide-react';
import { listings as staticListings } from '@/data/listings';
import { supabase, getCurrentUser, getUserSubscription } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

// Normalize a static-data listing into the unified shape used by the cards.
function fromStatic(item) {
  return {
    key: `static-${item.id}`,
    href: `/listings/${item.slug}`,
    title: item.title,
    location: item.location,
    prefecture: item.prefecture,
    excerpt: item.excerpt,
    price: item.price,
    coverImage: null, // static listings don't have cover images
    propertyType: item.propertyType,
    isPremium: !!item.isPremium,
  };
}

function fromScraped(row) {
  return {
    key: `scraped-${row.id}`,
    href: `/map/listing/${row.id}`,
    title: row.title,
    location: row.address_english,
    prefecture: row.prefecture,
    excerpt: row.description_english?.slice(0, 180),
    price: row.price_jpy ? `¥${row.price_jpy.toLocaleString('en-US')}` : '—',
    coverImage: row.cover_image_url || null,
    propertyType: row.layout || 'House',
    isPremium: false, // scraped listings are all free-tier visible
  };
}

export default function ListingsPage() {
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  const [activePrefecture, setActivePrefecture] = useState('All');
  const [allListings, setAllListings] = useState(staticListings.map(fromStatic));
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch scraped listings from Supabase
      if (supabase) {
        const { data } = await supabase
          .from('scraped_listings')
          .select('id, title, address_english, prefecture, description_english, price_jpy, cover_image_url, layout')
          .eq('status', 'active')
          .order('scraped_at', { ascending: false });
        if (data && data.length > 0) {
          setAllListings([
            ...staticListings.map(fromStatic),
            ...data.map(fromScraped),
          ]);
        }
      }

      // Check subscription
      const user = await getCurrentUser();
      if (user) {
        if (user.email === ADMIN_EMAIL) {
          setIsSubscribed(true);
        } else {
          const sub = await getUserSubscription(user.id);
          setIsSubscribed(!!sub);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const prefectures = useMemo(() => {
    const set = new Set(allListings.map((l) => l.prefecture).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [allListings]);

  const filteredListings = useMemo(() => {
    let result = allListings;
    if (showOnlyFree) result = result.filter((l) => !l.isPremium);
    if (activePrefecture !== 'All') {
      result = result.filter((l) => l.prefecture === activePrefecture);
    }
    return result;
  }, [allListings, showOnlyFree, activePrefecture]);

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
              Property Listings
            </h1>
            <p className="text-brand-gray max-w-2xl">
              Browse our full collection of unique and affordable properties across Japan.
              Free visitors can see up to 5 detailed listings per day; subscribers unlock everything.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="border-b border-brand-border pb-4 mb-8 space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-brand-gray">
                <Filter className="h-4 w-4" />
                <span>{filteredListings.length} of {allListings.length} listings</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-brand cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyFree}
                  onChange={(e) => setShowOnlyFree(e.target.checked)}
                  className="rounded border-brand-border"
                />
                Show only free-access listings
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-brand-gray">Prefecture:</span>
              {prefectures.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePrefecture(p)}
                  className={`text-xs px-3 py-1 transition-base ${
                    activePrefecture === p
                      ? 'bg-brand text-white'
                      : 'text-brand-gray hover:text-brand border border-brand-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Free-tier note (only show to non-subscribed visitors) */}
          {!loading && !isSubscribed && (
            <div className="bg-brand-light border border-brand-accent p-4 mb-8 flex items-start gap-3">
              <Lock className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-brand font-medium mb-1">Free preview mode</p>
                <p className="text-brand-gray text-xs leading-relaxed">
                  Prices are hidden in preview cards. You can open up to <strong>5 listing detail pages per day</strong>.{' '}
                  <Link href="/pricing" className="underline hover:text-brand-accent">
                    Subscribe to unlock everything →
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link
                key={listing.key}
                href={listing.href}
                className="group block bg-white border border-brand-border card-hover overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                  {listing.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={listing.coverImage}
                      alt={listing.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-30">🏡</span>
                    </div>
                  )}
                  {listing.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-brand-accent text-white px-2 py-1 text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Premium
                    </div>
                  )}
                  {!listing.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-green-600/90 text-white px-2 py-1 text-xs">
                      Free
                    </div>
                  )}
                  {isSubscribed && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="text-white text-lg font-serif">{listing.price}</div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-brand mb-2 line-clamp-2 group-hover:text-brand-accent transition-base">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-brand-gray mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{listing.location}</span>
                  </div>
                  {listing.excerpt && (
                    <p className="text-xs text-brand-gray line-clamp-2 mb-3">
                      {listing.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-brand-border">
                    {isSubscribed ? (
                      <span className="text-brand-gray">{listing.propertyType}</span>
                    ) : (
                      <span className="text-brand-gray flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Price hidden
                      </span>
                    )}
                    <span className="text-brand-accent">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-16 text-brand-gray text-sm">
              No listings match your filters. Try changing the prefecture or clearing "free only".
            </div>
          )}

          {/* CTA */}
          {!isSubscribed && (
            <div className="mt-16 bg-brand-light p-12 text-center">
              <h2 className="font-serif text-3xl text-brand mb-4">
                Want full access to every listing?
              </h2>
              <p className="text-brand-gray max-w-2xl mx-auto mb-6">
                Subscribe to see all prices, view unlimited detail pages, unlock premium listings,
                and join our community of investors.
              </p>
              <Link href="/pricing" className="btn-primary">
                Start Free — 2 Months on Us
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
