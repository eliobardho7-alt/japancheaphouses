/**
 * Scraped listings hotlink their photos from municipal akiya-bank sites, and
 * those links rot: a Nov 2026 scan found 13 of 66 active listings with every
 * photo dead (the source city had restructured its site). The database's
 * public key is read-only, so dead listings are filtered at render time
 * instead — a listing whose images no longer load quietly disappears from
 * the grid, map, sitemap and detail pages rather than showing broken images.
 */

const cache = new Map();

// Server-side probe. A 403 counts as alive: some hosts bot-block datacenter
// IPs while still serving the image fine to real visitors. Only definitive
// failures (404/410, DNS/connection errors, timeouts) count as dead.
export async function isImageAlive(url) {
  if (!url) return false;
  if (cache.has(url)) return cache.get(url);
  let alive = false;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Range: 'bytes=0-1023' },
      signal: AbortSignal.timeout(6000),
    });
    alive = res.ok || res.status === 403;
  } catch {
    alive = false;
  }
  cache.set(url, alive);
  return alive;
}

// Filter a URL list down to the ones that still load (order preserved).
export async function liveImages(urls, limit = 12) {
  const list = [...new Set((urls || []).filter(Boolean))].slice(0, limit);
  const checked = await Promise.all(
    list.map(async (u) => ((await isImageAlive(u)) ? u : null)),
  );
  return checked.filter(Boolean);
}

// True when at least one of the listing's first few images still loads.
export async function listingHasLiveImages(listing) {
  const imgs = await liveImages(
    [listing.cover_image_url, ...(listing.image_urls || [])],
    4,
  );
  return imgs.length > 0;
}

// Browser-side probe (client components): what a visitor's browser can load
// is the ground truth there.
export function probeImageClient(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    const timer = setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

// Keep items whose cover image loads; items without a cover always stay.
export async function filterLiveCoversClient(items, getCover) {
  const checks = await Promise.all(
    items.map(async (item) => {
      const cover = getCover(item);
      if (!cover) return true;
      return probeImageClient(cover);
    }),
  );
  return items.filter((_, i) => checks[i]);
}
