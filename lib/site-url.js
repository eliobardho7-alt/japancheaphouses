// Must match the host that actually serves the site. www is the primary
// domain — the apex 307-redirects to it — so canonicals, the sitemap and
// robots.txt all have to use www or every one of them points at a redirect.
// NEXT_PUBLIC_SITE_URL overrides this, so it must agree.
const FALLBACK_SITE_URL = 'https://www.japancheaphouses.com';

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;
  const cleanedUrl = rawUrl.replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');

  try {
    return new URL(cleanedUrl).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
