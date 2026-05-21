/**
 * JSON-LD helpers. Strings are NOT escaped here — `JSON.stringify` produces
 * valid JSON, and that JSON is injected with dangerouslySetInnerHTML inside
 * a <script type="application/ld+json"> tag, where HTML escaping isn't
 * meaningful. If you ever switch to inline `<script>` plain text, you'd
 * need to escape `</script>` patterns.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://japancheaphouses.vercel.app';

export function siteUrl() {
  return SITE_URL;
}

export function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}`),
    },
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : [absoluteUrl('/og-image.jpg')],
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author || 'Elio Bardho',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Yama Vista',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    keywords: (post.tags || []).join(', '),
    isAccessibleForFree: !post.isPremium,
  };
}

export function realEstateListingJsonLd(listing) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.excerpt,
    url: absoluteUrl(`/listings/${listing.slug}`),
    image: listing.coverImage ? [absoluteUrl(listing.coverImage)] : [absoluteUrl('/og-image.jpg')],
    datePosted: listing.date,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.location,
      addressCountry: 'JP',
    },
    offers: {
      '@type': 'Offer',
      price: extractNumericPrice(listing.priceUSD || listing.price),
      priceCurrency: detectCurrency(listing.priceUSD || listing.price),
      availability: 'https://schema.org/InStock',
    },
    isAccessibleForFree: !listing.isPremium,
  };
}

function extractNumericPrice(input) {
  if (!input) return undefined;
  const digits = String(input).replace(/[^0-9.]/g, '');
  return digits || undefined;
}

function detectCurrency(input) {
  if (!input) return 'JPY';
  if (String(input).includes('¥')) return 'JPY';
  if (String(input).includes('$')) return 'USD';
  if (String(input).includes('€')) return 'EUR';
  return 'JPY';
}
