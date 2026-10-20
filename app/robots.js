import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/login', '/signup'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // host: a Yandex-only directive Google ignores; it has to agree with the
    // canonical host or it is just one more conflicting signal.
    host: SITE_URL,
  };
}
