'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock, Filter, MapPin } from 'lucide-react';
import { listings } from '@/data/listings';

export default function ListingsPage() {
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  const filteredListings = showOnlyFree
    ? listings.filter((l) => !l.isPremium)
    : listings;

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
              Browse our curated collection of unique and affordable properties across Japan.
              Most listings are exclusive to subscribers, with select free listings available to everyone.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-brand-gray">
              <Filter className="h-4 w-4" />
              <span>{filteredListings.length} listings</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyFree}
                onChange={(e) => setShowOnlyFree(e.target.checked)}
                className="rounded border-brand-border"
              />
              Show only free listings
            </label>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.slug}`}
                className="group block bg-white border border-brand-border card-hover overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300">
                  {listing.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-brand-accent text-white px-2 py-1 text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Premium
                    </div>
                  )}
                  {!listing.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-green-600 text-white px-2 py-1 text-xs">
                      Free
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-30">🏡</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-white text-lg font-serif">{listing.price}</div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-brand mb-2 line-clamp-2 group-hover:text-brand-accent transition-base">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-brand-gray mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.location}</span>
                  </div>
                  <p className="text-xs text-brand-gray line-clamp-2 mb-3">
                    {listing.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-brand-gray pt-3 border-t border-brand-border">
                    <span>{listing.propertyType}</span>
                    <span className="text-brand-accent">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-brand-light p-12 text-center">
            <h2 className="font-serif text-3xl text-brand mb-4">
              Want access to all listings?
            </h2>
            <p className="text-brand-gray max-w-2xl mx-auto mb-6">
              Subscribe for $5/month to unlock all premium listings, get personalized property
              alerts, and join our community of investors.
            </p>
            <Link href="/pricing" className="btn-primary">
              View Membership Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
