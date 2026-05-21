const FALLBACK_SITE_URL = 'https://japancheaphouses.vercel.app';

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;
  const cleanedUrl = rawUrl.replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');

  try {
    return new URL(cleanedUrl).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
