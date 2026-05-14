// Real Estate Listings — Most are locked to premium subscribers
// You can edit these directly OR use the admin dashboard at /admin
// Listings are auto-loaded from Supabase if you connect it

export const listings = [
  {
    id: 1,
    slug: 'minamisoma-fukushima-510000-yen',
    title: 'Detached House in Minamisoma, Fukushima',
    location: 'Minamisoma, Fukushima',
    price: '¥510,000',
    priceUSD: '$3,400',
    propertyType: 'Detached House',
    landIncluded: true,
    date: '2025-02-18',
    excerpt:
      "It's insane to think that for the price of a used car, you can own a house with land in Japan! Perfect entry-level investment.",
    coverImage: '/listings/minamisoma.jpg',
    isPremium: false, // FREE listing
    tags: ['akiya', 'fukushima', 'cheap-house'],
    content: `
      ## Property Details

      - **Location:** Minamisoma, Fukushima
      - **Price:** ¥510,000 (~$3,400 USD)
      - **Type:** Detached house with land

      ## What Makes This Special

      - Affordable entry point into Japan real estate
      - Includes land (true ownership)
      - Potential for renovation or rental income
    `,
  },
  {
    id: 2,
    slug: 'beachside-villa-wakayama-100k',
    title: 'Beachside Villa in Wakayama',
    location: 'Hirokawa-cho, Wakayama',
    price: '$100,000',
    priceUSD: '$100,000',
    propertyType: 'Villa',
    landIncluded: true,
    date: '2025-02-04',
    excerpt:
      'Ever dreamed of waking up to ocean breezes and sunset views? This cozy 74㎡ home is just 5 minutes from the beach.',
    coverImage: '/listings/wakayama-villa.jpg',
    isPremium: true,
    tags: ['wakayama', 'beachside', 'villa'],
    content: `
      ## Property Highlights

      - **Location:** Hirokawa-cho, Wakayama
      - **Size:** 74㎡
      - **Distance to beach:** 5 minutes
      - **Price:** ~$100,000

      Perfect for vacation home buyers or those looking to relocate to a coastal paradise.
    `,
  },
  {
    id: 3,
    slug: 'newly-built-house-miyazaki-19000',
    title: 'Newly Built House in Miyazaki',
    location: 'Miyazaki',
    price: '$19,000',
    priceUSD: '$19,000',
    propertyType: 'Detached House',
    landIncluded: true,
    date: '2025-01-22',
    excerpt:
      'Japan never ceases to surprise me. A newly built house (2015) for only $19,000 with parking for 2 cars.',
    coverImage: '/listings/miyazaki.jpg',
    isPremium: true,
    tags: ['miyazaki', 'newly-built', 'cheap'],
    content: `
      ## Property Details

      - **Location:** Miyazaki
      - **Built:** 2015 (newer than most akiya!)
      - **Parking:** Up to 2 cars
      - **Price:** ~$19,000

      Perfect for singles, seniors, or anyone seeking an affordable place in Japan.
    `,
  },
  {
    id: 4,
    slug: 'affordable-home-kashiwa-chiba-28000',
    title: 'Affordable Home in Kashiwa, Chiba',
    location: 'Kashiwa City, Chiba',
    price: '$28,000',
    priceUSD: '$28,000',
    propertyType: 'House',
    landIncluded: true,
    date: '2024-11-14',
    excerpt:
      'Budget-friendly property in the Tokyo metropolitan area. Perfect for investors looking for proximity to Tokyo without the Tokyo price tag.',
    coverImage: '/listings/kashiwa.jpg',
    isPremium: true,
    tags: ['chiba', 'tokyo-area', 'investment'],
    content: `
      ## Why This Property?

      - Close to Tokyo (commutable)
      - Affordable price point at $28,000
      - Investment potential
      - Established neighborhood
    `,
  },
  {
    id: 5,
    slug: 'akiya-koshigaya-saitama-25300',
    title: 'Spacious 2-Story Akiya in Saitama',
    location: 'Koshigaya City, Saitama',
    price: '$25,300',
    priceUSD: '$25,300',
    propertyType: '2-Story Akiya',
    landIncluded: true,
    date: '2024-11-04',
    excerpt:
      'Incredible deal on this 2-story vacant house. Saitama offers great value compared to Tokyo with good commuting options.',
    coverImage: '/listings/koshigaya.jpg',
    isPremium: true,
    tags: ['saitama', 'akiya', 'opportunity'],
    content: `
      ## Property Overview

      - **Location:** Koshigaya City, Saitama
      - **Type:** 2-story akiya (vacant house)
      - **Price:** $25,300

      Saitama offers excellent value compared to Tokyo proper, with good commuting options.
    `,
  },
];

export function getListingBySlug(slug) {
  return listings.find((listing) => listing.slug === slug);
}

export function getFreeListings() {
  return listings.filter((listing) => !listing.isPremium);
}

export function getPremiumListings() {
  return listings.filter((listing) => listing.isPremium);
}
