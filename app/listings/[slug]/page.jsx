import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, ArrowLeft, Lock, Home, Calendar } from 'lucide-react';
import { listings, getListingBySlug } from '@/data/listings';
import { realEstateListingJsonLd, breadcrumbList } from '@/lib/jsonld';
import ViewGate from '@/components/ViewGate';

export async function generateStaticParams() {
  return listings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) return {};

  const url = `/listings/${listing.slug}`;
  const image = listing.coverImage || '/og-image.jpg';

  return {
    title: `${listing.title} — ${listing.location} ${listing.price}`,
    description: listing.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: listing.title,
      description: listing.excerpt,
      url,
      images: [{ url: image, alt: listing.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description: listing.excerpt,
      images: [image],
    },
  };
}

export default async function ListingDetailPage({ params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  // TODO: Check user subscription status server-side
  const isSubscribed = false;
  const showFullContent = !listing.isPremium || isSubscribed;

  const jsonLd = [
    realEstateListingJsonLd(listing),
    breadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Listings', path: '/listings' },
      { name: listing.title, path: `/listings/${listing.slug}` },
    ]),
  ];

  return (
    <ViewGate listingId={`static-${listing.id}`}>
    <article className="pt-24">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-custom max-w-4xl py-12">
        <Link
          href="/listings"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent transition-base mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all listings
        </Link>

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

        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 mb-12 flex items-center justify-center overflow-hidden">
          {listing.coverImage ? (
            <Image
              src={listing.coverImage}
              alt={`${listing.title} — ${listing.location}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          ) : (
            <span className="text-8xl opacity-30" aria-hidden="true">🏡</span>
          )}
        </div>

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
                <Link href="/booking" className="btn-primary">Book Consultation</Link>
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
                  <Link href="/pricing" className="btn-primary">Subscribe Now</Link>
                  <Link href="/login" className="btn-secondary">Sign In</Link>
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
