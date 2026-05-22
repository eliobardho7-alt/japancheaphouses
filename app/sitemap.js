import { blogPosts } from '@/data/blogs';
import { listings } from '@/data/listings';
import { getSiteUrl } from '@/lib/site-url';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = getSiteUrl();

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/listings', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/map', changeFrequency: 'daily', priority: 0.9 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/booking', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/community', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Static manual blog posts (data/blogs.js fallback)
  const staticBlogRoutes = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Static manual listings (data/listings.js)
  const staticListingRoutes = listings.map((listing) => ({
    url: `${SITE_URL}/listings/${listing.slug}`,
    lastModified: listing.date ? new Date(listing.date) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic scraped listings (Supabase) — adds /map/listing/[id] and /blog/property/[id]
  // routes per active listing. Big SEO win: ~130+ extra indexable pages.
  let scrapedRoutes = [];
  let dbBlogRoutes = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const db = createClient(supabaseUrl, supabaseKey);

      const { data: scraped } = await db
        .from('scraped_listings')
        .select('id, updated_at, blog_content, blog_published_at')
        .eq('status', 'active')
        .limit(5000);
      if (scraped) {
        scraped.forEach((l) => {
          scrapedRoutes.push({
            url: `${SITE_URL}/map/listing/${l.id}`,
            lastModified: new Date(l.updated_at || Date.now()),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
          if (l.blog_content) {
            scrapedRoutes.push({
              url: `${SITE_URL}/blog/property/${l.id}`,
              lastModified: new Date(l.blog_published_at || l.updated_at || Date.now()),
              changeFrequency: 'monthly',
              priority: 0.7,
            });
          }
        });
      }

      // DB-managed manual blog posts (blog_posts table)
      const { data: dbBlogs } = await db
        .from('blog_posts')
        .select('slug, date')
        .limit(500);
      if (dbBlogs) {
        dbBlogRoutes = dbBlogs.map((post) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.date ? new Date(post.date) : now,
          changeFrequency: 'monthly',
          priority: 0.7,
        }));
      }
    } catch (e) {
      // Fail silently — keep static routes
    }
  }

  // Dedup blogs (DB entries override static ones)
  const dbBlogUrls = new Set(dbBlogRoutes.map((r) => r.url));
  const mergedBlogs = [
    ...dbBlogRoutes,
    ...staticBlogRoutes.filter((r) => !dbBlogUrls.has(r.url)),
  ];

  return [...staticRoutes, ...mergedBlogs, ...staticListingRoutes, ...scrapedRoutes];
}
