import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, MapPin, Home, Maximize2, TrendingUp, Calendar, ExternalLink, BookOpen } from 'lucide-react';
import InterestForm from './InterestForm';
import ViewGate from '@/components/ViewGate';
import ViewCounter from '@/components/ViewCounter';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function getListing(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const { data } = await db()
    .from('scraped_listings')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function getRelated(listing, limit = 4) {
  if (!listing) return [];
  const { data } = await db()
    .from('scraped_listings')
    .select('id, title, prefecture, cover_image_url, price_jpy, address_english')
    .eq('status', 'active')
    .eq('prefecture', listing.prefecture)
    .neq('id', listing.id)
    .limit(limit);
  return data || [];
}

export async function generateMetadata({ params }) {
  const listing = await getListing(params.id);
  if (!listing) return { title: 'Listing not found' };

  return {
    title: listing.title,
    description: listing.description_english?.slice(0, 160) || listing.title,
    alternates: { canonical: `/map/listing/${listing.id}` },
    openGraph: {
      title: listing.title,
      description: listing.description_english?.slice(0, 160),
      url: `/map/listing/${listing.id}`,
      type: 'article',
      images: listing.cover_image_url ? [{ url: listing.cover_image_url }] : [],
    },
  };
}

export default async function ListingDetailPage({ params }) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  const related = await getRelated(listing);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description_english,
    image: listing.cover_image_url,
    category: 'Real Estate',
    brand: { '@type': 'Brand', name: 'Japan Cheap Houses' },
    offers: listing.price_jpy
      ? {
          '@type': 'Offer',
          price: listing.price_jpy,
          priceCurrency: 'JPY',
          availability: listing.status === 'active'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
        }
      : undefined,
  };

  // First image often duplicates cover; show unique ones in the gallery
  const gallery = (listing.image_urls || []).filter((u) => u !== listing.cover_image_url).slice(0, 12);

  return (
    <ViewGate listingId={`scraped-${listing.id}`}>
    <article className="pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="container-custom max-w-5xl py-8">
        <Link
          href="/map"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Map
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs text-brand-accent uppercase tracking-wider">
            {listing.prefecture}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-brand mt-2 mb-3 leading-tight">
            {listing.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.address_english}
            </span>
            <ViewCounter type="listing" recordId={listing.id} initialCount={listing.view_count} />
          </div>
        </div>

        {/* Cover image */}
        {listing.cover_image_url && (
          <div className="mb-8 aspect-video bg-brand-light overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.cover_image_url}
              alt={listing.title}
              referrerPolicy="no-referrer"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main column */}
          <div className="lg:col-span-2">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-brand-border">
              <Stat
                icon={Home}
                label="Layout"
                value={listing.layout || '—'}
              />
              <Stat
                icon={Maximize2}
                label="Floor"
                value={listing.floor_area_sqm ? `${listing.floor_area_sqm} m²` : '—'}
              />
              <Stat
                icon={Maximize2}
                label="Land"
                value={listing.land_area_sqm ? `${listing.land_area_sqm} m²` : '—'}
              />
              <Stat
                icon={TrendingUp}
                label="Est. Yield"
                value={listing.estimated_gross_yield ? `${listing.estimated_gross_yield}%` : '—'}
              />
            </div>

            {/* Description */}
            <h2 className="font-serif text-2xl text-brand mb-4">About this property</h2>
            <div className="prose prose-sm max-w-none text-brand-gray leading-relaxed whitespace-pre-wrap mb-6">
              {listing.description_english}
            </div>

            {/* Link to long-form blog analysis (if generated) */}
            {listing.blog_content && (
              <Link
                href={`/blog/property/${listing.id}`}
                className="inline-flex items-center gap-2 bg-brand-light border border-brand-border p-4 mb-8 hover:border-brand transition-base w-full"
              >
                <BookOpen className="h-5 w-5 text-brand-accent shrink-0" />
                <div className="flex-grow">
                  <p className="text-sm font-medium text-brand">Read our full analysis</p>
                  <p className="text-xs text-brand-gray">
                    Market context, buyer profile, renovation expectations →
                  </p>
                </div>
              </Link>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <>
                <h2 className="font-serif text-2xl text-brand mb-4">More photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {gallery.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={src}
                      alt={`${listing.title} – photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full aspect-square object-cover bg-brand-light"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Original source link */}
            {listing.source_url && !listing.source_url.startsWith('manual://') && (
              <div className="bg-brand-light p-4 flex items-center justify-between mb-8">
                <span className="text-xs text-brand-gray">
                  Originally listed by the municipal akiya bank
                </span>
                <a
                  href={listing.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-brand hover:text-brand-accent"
                >
                  View original (Japanese)
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Sidebar — price + CTA */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-brand-border p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-1">Asking Price</p>
                <p className="font-serif text-3xl text-brand">
                  ¥{(listing.price_jpy || 0).toLocaleString()}
                </p>
                <p className="text-sm text-brand-gray">
                  ≈ ${(listing.price_usd || 0).toLocaleString()} USD
                </p>
              </div>

              {listing.status === 'sold' && (
                <div className="bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-800">
                  This property has been sold.
                </div>
              )}

              <InterestForm
                listingId={listing.id}
                listingTitle={listing.title}
                listingUrl={listing.source_url}
              />

              <p className="text-xs text-brand-gray mt-4 text-center">
                Free consultation. No obligation.
              </p>
            </div>
          </aside>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <section className="border-t border-brand-border pt-10 mt-4">
            <h2 className="font-serif text-2xl text-brand mb-6">
              Similar properties in {listing.prefecture}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/map/listing/${r.id}`}
                  className="block group"
                >
                  {r.cover_image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="aspect-square w-full object-cover mb-2 bg-brand-light"
                    />
                  )}
                  <h3 className="font-serif text-sm text-brand line-clamp-2 group-hover:text-brand-accent transition-base">
                    {r.title}
                  </h3>
                  <p className="text-xs text-brand-gray mt-1">
                    ¥{(r.price_jpy || 0).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
    </ViewGate>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <Icon className="h-4 w-4 text-brand-accent mb-1" />
      <p className="text-xs text-brand-gray uppercase tracking-wider">{label}</p>
      <p className="text-sm text-brand font-medium">{value}</p>
    </div>
  );
}
