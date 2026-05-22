import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowLeft, Lock, Home, Calendar } from 'lucide-react';
import { listings, getListingBySlug } from '@/data/listings';
import ViewGate from '@/components/ViewGate';

export async function generateStaticParams() {
  return listings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({ params }) {
  const listing = getListingBySlug(params.slug);
  if (!listing) return {};

  return {
    title: listing.title,
    description: listing.excerpt,
    alternates: { canonical: `/listings/${listing.slug}` },
    openGraph: {
      title: listing.title,
      description: listing.excerpt,
      url: `/listings/${listing.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description: listing.excerpt,
    },
  };
}

export default function ListingDetailPage({ params }) {
  const listing = getListingBySlug(params.slug);

  if (!listing) {
    notFound();
  }

  const isSubscribed = false;
  const showFullContent = !listing.isPremium || isSubscribed;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.japancheaphouses.com' },
      { '@type': 'ListItem', position: 2, name: 'Listings', item: 'https://www.japancheaphouses.com/listings' },
      { '@type': 'ListItem', position: 3, name: listing.title, item: `https://www.japancheaphouses.com/listings/${listing.slug}` },
    ],
  };

  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.excerpt,
    category: 'Real Estate',
    brand: { '@type': 'Brand', name: 'Japan Cheap Houses' },
    offers: listing.price
      ? {
          '@type': 'Offer',
          price: String(listing.price).replace(/[^0-9.]/g, '') || undefined,
          priceCurrency: 'JPY',
          availability: 'https://schema.org/InStock',
          url: `https://www.japancheaphouses.com/listings/${listing.slug}`,
        }
      : undefined,
  };

  return (
    <ViewGate listingId={`static-${listing.id}`}>
    <article className="pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container-custom max-w-4xl py-12">
        {/* Back link */}
        <Link
          href="/listings"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent transition-base mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all listings
        </Link>

        {/* Header */}
        <header className="mb-8">
          {listing.isPremium ? (
            <span className="inline-flex items-center gap-1 text-xs text-white bg-brand-accent px-2 py-1 mb-3">
              <Lock className="h-3 w-3" />
              Premium Listing
            </span>
          ) : (
            <span className="inline-block text-xs text-white bg-green-600 px-2 py-1 mb-3">
              Free Listing
            </span>
          )}
          <h1 className="font-serif text-4xl md:text-5xl text-brand mt-3 mb-6 leading-tight">
            {listing.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-brand-gray">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              {listing.propertyType}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Listed {new Date(listing.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="mt-6 text-3xl font-serif text-brand-accent">
            {listing.price}
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 mb-12 flex items-center justify-center">
          <span className="text-8xl opacity-30">🏡</span>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {showFullContent ? (
            <div className="text-brand-gray leading-relaxed">
              <p className="mb-4">{listing.excerpt}</p>
              {listing.content.split('\n').map((paragraph, idx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="font-serif text-2xl text-brand mt-8 mb-4">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('- ')) {
                  return (
                    <p key={idx} className="ml-4 mb-2">
                      {trimmed}
                    </p>
                  );
                }
                return <p key={idx} className="mb-4">{trimmed}</p>;
              })}

              <div className="mt-12 p-6 bg-brand-light">
                <h3 className="font-serif text-xl text-brand mb-3">Interested in this property?</h3>
                <p className="text-sm text-brand-gray mb-4">
                  Book a free consultation to discuss this listing and get personalized advice.
                </p>
                <Link href="/booking" className="btn-primary">
                  Book Consultation
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-brand-gray leading-relaxed mb-6">{listing.excerpt}</p>

              <div className="bg-brand-light border-2 border-brand-border p-8 my-8 text-center">
                <Lock className="h-12 w-12 text-brand-accent mx-auto mb-4" />
                <h3 className="font-serif text-2xl text-brand mb-3">Premium Listing</h3>
                <p className="text-brand-gray mb-6 max-w-md mx-auto">
                  This listing is exclusive to our subscribers. Join our community for $5/month
                  to access all premium listings, the discussion board, and more.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/pricing" className="btn-primary">
                    Subscribe Now
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
    </ViewGate>
  );
}
