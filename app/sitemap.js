import { blogPosts } from '@/data/blogs';
import { listings } from '@/data/listings';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.japancheaphouses.com';

export default async function sitemap() {
  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/listings', priority: 0.9, changeFrequency: 'daily' },
    { path: '/map', priority: 0.9, changeFrequency: 'daily' },
    { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/community', priority: 0.7, changeFrequency: 'daily' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/booking', priority: 0.7, changeFrequency: 'monthly' },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Static blog posts (fallback)
  const staticBlogRoutes = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic blog posts, topics, and scraped listings from Supabase
  let dbBlogRoutes = [];
  let topicRoutes = [];
  let scrapedListingRoutes = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const db = createClient(url, key);
      const { data: blogs } = await db.from('blog_posts').select('slug, date');
      if (blogs) {
        dbBlogRoutes = blogs.map((post) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.date || Date.now()),
          changeFrequency: 'monthly',
          priority: 0.7,
        }));
      }

      const { data: topics } = await db
        .from('topics')
        .select('id, last_activity')
        .order('last_activity', { ascending: false })
        .limit(200);
      if (topics) {
        topicRoutes = topics.map((t) => ({
          url: `${SITE_URL}/community/topic/${t.id}`,
          lastModified: new Date(t.last_activity || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.5,
        }));
      }

      // Scraped property listings — each gets BOTH a detail page and a blog post.
      // High priority: these are the site's primary long-tail SEO surface.
      const { data: scraped } = await db
        .from('scraped_listings')
        .select('id, updated_at, blog_content, blog_published_at')
        .eq('status', 'active')
        .limit(5000);
      if (scraped) {
        scraped.forEach((l) => {
          scrapedListingRoutes.push({
            url: `${SITE_URL}/map/listing/${l.id}`,
            lastModified: new Date(l.updated_at || Date.now()),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
          // Only include the blog post if it's been generated
          if (l.blog_content) {
            scrapedListingRoutes.push({
              url: `${SITE_URL}/blog/property/${l.id}`,
              lastModified: new Date(l.blog_published_at || l.updated_at || Date.now()),
              changeFrequency: 'monthly',
              priority: 0.7,
            });
          }
        });
      }
    } catch (e) {
      // ignore — fall back to static content
    }
  }

  // Listings
  const listingRoutes = listings.map((listing) => ({
    url: `${SITE_URL}/listings/${listing.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogUrlSet = new Set(dbBlogRoutes.map((r) => r.url));
  return [
    ...staticRoutes,
    ...dbBlogRoutes,
    ...staticBlogRoutes.filter((r) => !blogUrlSet.has(r.url)),
    ...listingRoutes,
    ...scrapedListingRoutes,
    ...topicRoutes,
  ];
}
