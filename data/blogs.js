// Blog posts — Educational content, guides, and market analysis
// Most blogs are FREE for everyone. Some can be marked premium.
// You can edit these directly OR use the admin dashboard at /admin

export const blogPosts = [
  {
    id: 1,
    slug: 'how-investing-in-japan-akiya-could-go-wrong',
    title: "How Investing in Japan Akiya's Could Go Wrong!",
    category: 'Guides',
    date: '2025-03-04',
    readTime: '2 min read',
    author: 'Elio Bardho',
    excerpt:
      "MOST PEOPLE DON'T LIKE TO TALK ABOUT THIS! Japan's real estate market has become increasingly attractive to foreign investors, but there are real risks you need to know.",
    coverImage: '/blog/akiya-warning.jpg',
    isPremium: false,
    tags: ['akiya', 'investment', 'risks'],
    content: `
      Japan's real estate market has become increasingly attractive to foreign investors,
      particularly with the rise of akiya (vacant houses) selling for shockingly low prices.
      However, there are several pitfalls that many overlook.

      ## Key Risks to Consider

      1. **Hidden Structural Issues** - Many akiya have been vacant for years with no maintenance.
      2. **Renovation Costs** - The "cheap" house could need millions of yen in repairs.
      3. **Location Concerns** - Many are in rural areas with declining populations.
      4. **Legal Complications** - Unregistered additions, shared utilities, inheritance issues.

      ## How to Protect Yourself

      Always get a professional inspection before purchasing.
      Research the local area's long-term outlook.
      Budget realistically for renovations.
    `,
    linkedinUrl:
      'https://www.linkedin.com/posts/elio-bardho-2273a0231_realestate-japan-investing-activity-7302179182468284416-gCT8',
  },
  {
    id: 2,
    slug: 'japan-real-estate-new-laws-2025',
    title: "Japan's Real Estate Is Changing: New Laws on Brokerage Fees & Renovations",
    category: 'Market Analysis',
    date: '2025-02-14',
    readTime: '3 min read',
    author: 'Elio Bardho',
    excerpt:
      "Japan's real estate market is undergoing a major transformation in 2024 and 2025. New brokerage fee caps and renovation regulations will reshape the market.",
    coverImage: '/blog/japan-laws.jpg',
    isPremium: false,
    tags: ['regulations', 'market-update', 'laws'],
    content: `
      Japan's real estate market is undergoing a major transformation in 2024 and 2025.

      ## Key Changes

      ### Brokerage Fee Caps
      New caps on brokerage fees come into effect, making transactions more affordable
      for buyers and sellers.

      ### Renovation Requirements
      New regulations around renovations will impact how properties can be updated and resold.

      ## What This Means for Investors

      - Lower transaction costs
      - More transparent pricing
      - Stricter renovation standards
      - Better consumer protection
    `,
    linkedinUrl: '',
  },
  {
    id: 3,
    slug: 'discover-unique-japan-real-estate-yama-vista',
    title: 'Discover Unique Japan Real Estate with Yama Vista',
    category: 'Guides',
    date: '2024-10-22',
    readTime: '1 min read',
    author: 'Elio Bardho',
    excerpt:
      'Are you someone who is always on the lookout for unique and affordable real estate opportunities in Japan? Look no further than Yama-Vista.',
    coverImage: '/blog/yama-vista-intro.jpg',
    isPremium: false,
    tags: ['introduction', 'about'],
    content: `
      Are you someone who is always on the lookout for unique and affordable real estate
      opportunities in Japan? Look no further than Yama-Vista.

      ## What We Offer

      - Curated listings of affordable Japan properties
      - Expert consulting for international buyers
      - Property management services
      - Community of like-minded investors
    `,
    linkedinUrl:
      'https://www.linkedin.com/posts/elio-bardho-2273a0231_realestate-japan-japanhousingmarket-activity-7286272721238245378-VUph',
  },
  {
    id: 4,
    slug: 'tokyo-real-estate-investment-opportunity',
    title: 'Tokyo Real Estate: A High-Yield Investment Opportunity',
    category: 'Market Analysis',
    date: '2024-10-15',
    readTime: '2 min read',
    author: 'Elio Bardho',
    excerpt:
      "Japan's capital offers unique investment opportunities that combine stability with potential for strong returns. Here's what you need to know.",
    coverImage: '/blog/tokyo-investment.jpg',
    isPremium: true,
    tags: ['tokyo', 'investment', 'high-yield'],
    content: `
      Japan's capital offers unique investment opportunities that combine stability
      with potential for strong returns.

      ## Why Tokyo?

      - Stable economy
      - Growing tourism
      - Olympic legacy infrastructure
      - Strong rental demand
    `,
    linkedinUrl:
      'https://www.linkedin.com/posts/elio-bardho-2273a0231_tokyorealestate-japanpropertyinvestment-highyieldinvestments-activity-7290996743184306176-Srra',
  },
];

export const categories = ['All Posts', 'Guides', 'Market Analysis'];

export function getFeaturedPosts(count = 2) {
  return blogPosts.slice(0, count);
}

export function getPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category) {
  if (category === 'All Posts') return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}
