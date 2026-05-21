import { blogPosts } from '@/data/blogs';
import { listings } from '@/data/listings';
import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();

export default function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/listings', changeFrequency: 'weekly', priority: 0.9 },
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

  const blogRoutes = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const listingRoutes = listings.map((listing) => ({
    url: `${SITE_URL}/listings/${listing.slug}`,
    lastModified: listing.date ? new Date(listing.date) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...listingRoutes];
}
