import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, MapPin, Calendar, BookOpen, ExternalLink, Home,
} from 'lucide-react';
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
    .select('id, title, prefecture, cover_image_url, address_english')
    .eq('status', 'active')
    .eq('prefecture', listing.prefecture)
    .neq('id', listing.id)
    .limit(limit);
  return data || [];
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: 'Property not found' };

  return {
    title: listing.title,
    description: listing.blog_content
      ? listing.blog_content.replace(/[#*_`>\[\]]/g, '').slice(0, 160)
      : listing.description_english?.slice(0, 160),
    alternates: { canonical: `/blog/property/${listing.id}` },
    openGraph: {
      title: listing.title,
      description: listing.description_english?.slice(0, 160),
      url: `/blog/property/${listing.id}`,
      type: 'article',
      publishedTime: listing.blog_published_at,
      images: listing.cover_image_url ? [{ url: listing.cover_image_url }] : [],
    },
  };
}

// Minimal, safe markdown renderer (server-side). No HTML escapes / no script tags allowed in upstream content.
function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split('\n');
  const out = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="list-disc ml-6 mb-4 space-y-1 text-brand-gray">
          {listBuffer.map((item, i) => <li key={i}>{inline(item)}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  const inline = (text) => {
    // bold (**) then italic (*) then inline-code (`)
    const parts = [];
    let key = 0;
    let remaining = text;
    const patterns = [
      [/\*\*([^*]+)\*\*/, (m) => <strong key={key++}>{m[1]}</strong>],
      [/`([^`]+)`/, (m) => <code key={key++} className="bg-brand-light px-1 text-sm">{m[1]}</code>],
    ];
    while (remaining) {
      let matched = false;
      for (const [pattern, render] of patterns) {
        const m = remaining.match(pattern);
        if (m && m.index !== undefined) {
          if (m.index > 0) parts.push(remaining.slice(0, m.index));
          parts.push(render(m));
          remaining = remaining.slice(m.index + m[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        parts.push(remaining);
        break;
      }
    }
    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      out.push(
        <h2 key={idx} className="font-serif text-2xl text-brand mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      out.push(
        <h3 key={idx} className="font-serif text-xl text-brand mt-6 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    flushList();
    out.push(
      <p key={idx} className="text-brand-gray leading-relaxed mb-4">
        {inline(trimmed)}
      </p>
    );
  });
  flushList();
  return out;
}

export default async function PropertyBlogPage({ params }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const related = await getRelated(listing);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: listing.title,
    image: listing.cover_image_url,
    datePublished: listing.blog_published_at || listing.scraped_at,
    author: { '@type': 'Organization', name: 'Japan Cheap Houses' },
    publisher: {
      '@type': 'Organization',
      name: 'Japan Cheap Houses',
      logo: { '@type': 'ImageObject', url: 'https://www.japancheaphouses.com/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.japancheaphouses.com/blog/property/${listing.id}`,
    },
  };

  return (
    <ViewGate listingId={`scraped-${listing.id}`}>
    <article className="pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="container-custom max-w-3xl py-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mb-8">
          <span className="text-xs text-brand-accent uppercase tracking-wider">
            Property Analysis — {listing.prefecture}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-brand mt-2 mb-4 leading-tight">
            {listing.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-brand-gray">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {listing.address_english}
            </span>
            {listing.blog_published_at && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(listing.blog_published_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </>
            )}
            <span>•</span>
            <ViewCounter type="listing" recordId={listing.id} initialCount={listing.view_count} />
          </div>
        </header>

        {listing.cover_image_url && (
          <div className="mb-10 aspect-video bg-brand-light overflow-hidden">
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

        <div className="prose prose-lg max-w-none">
          {listing.blog_content ? (
            renderMarkdown(listing.blog_content)
          ) : (
            <div className="bg-brand-light p-6 text-center text-brand-gray text-sm">
              The full editorial analysis for this property is being prepared. In the meantime,
              the structured details are on the{' '}
              <Link href={`/map/listing/${listing.id}`} className="underline text-brand">
                listing page
              </Link>.
            </div>
          )}
        </div>

        {/* CTA back to listing */}
        <div className="bg-brand text-white p-8 my-12 text-center">
          <Home className="h-8 w-8 mx-auto mb-3" />
          <h2 className="font-serif text-2xl mb-2">Interested in this property?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            See the full specs, photos, exact location on the map, and contact us about viewing or buying.
          </p>
          <Link
            href={`/map/listing/${listing.id}`}
            className="inline-block bg-white text-brand px-8 py-3 text-sm font-medium hover:bg-brand-light transition-base"
          >
            View Full Listing →
          </Link>
        </div>

        {/* Source attribution */}
        {listing.source_url && !listing.source_url.startsWith('manual://') && (
          <div className="bg-brand-light p-4 flex items-center justify-between text-xs text-brand-gray mb-12">
            <span>Sourced from the municipal akiya bank</span>
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-brand"
            >
              View original
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        )}

        {/* Related listings */}
        {related.length > 0 && (
          <section className="border-t border-brand-border pt-10">
            <h2 className="font-serif text-2xl text-brand mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              More properties in {listing.prefecture}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/property/${r.id}`}
                  className="block group"
                >
                  {r.cover_image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="aspect-video w-full object-cover mb-3 bg-brand-light"
                    />
                  )}
                  <h3 className="font-serif text-base text-brand group-hover:text-brand-accent transition-base">
                    {r.title}
                  </h3>
                  <p className="text-xs text-brand-gray mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.address_english}
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
