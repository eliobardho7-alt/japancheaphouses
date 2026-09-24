import { getSiteUrl } from '@/lib/site-url';

/**
 * Turn a scraped_listings row into the text half of a social post.
 *
 * Deliberately template-driven rather than generated prose: every number here
 * comes straight from the listing row, so a post can never invent a price or a
 * yield. Anything missing is simply left out rather than guessed at.
 */

const BRAND_TAGS = ['akiya', 'japanrealestate', 'japanproperty', 'movetojapan', 'yamavista'];

const PREFECTURE_TAGS = {
  Hokkaido: ['hokkaido', 'niseko'],
  Aomori: ['aomori', 'tohoku'],
  Akita: ['akita', 'tohoku'],
  Iwate: ['iwate', 'tohoku'],
  Miyagi: ['miyagi', 'sendai'],
  Yamagata: ['yamagata', 'tohoku'],
  Fukushima: ['fukushima', 'tohoku'],
  Tochigi: ['tochigi', 'nikko'],
  Gunma: ['gunma'],
  Ibaraki: ['ibaraki'],
  Saitama: ['saitama', 'greatertokyo'],
  Chiba: ['chiba', 'greatertokyo'],
  Tokyo: ['tokyo'],
  Kanagawa: ['kanagawa', 'yokohama'],
  Niigata: ['niigata', 'snowcountry'],
  Nagano: ['nagano', 'japanalps'],
  Yamanashi: ['yamanashi', 'mtfuji'],
  Shizuoka: ['shizuoka', 'mtfuji'],
  Aichi: ['aichi', 'nagoya'],
  Kyoto: ['kyoto', 'kansai'],
  Osaka: ['osaka', 'kansai'],
  Hyogo: ['hyogo', 'kobe'],
  Nara: ['nara', 'kansai'],
  Wakayama: ['wakayama', 'kansai'],
  Hiroshima: ['hiroshima', 'chugoku'],
  Ehime: ['ehime', 'shikoku'],
  Kochi: ['kochi', 'shikoku'],
  Fukuoka: ['fukuoka', 'kyushu'],
  Nagasaki: ['nagasaki', 'kyushu'],
  Kumamoto: ['kumamoto', 'kyushu'],
  Oita: ['oita', 'kyushu', 'onsen'],
  Miyazaki: ['miyazaki', 'kyushu'],
  Kagoshima: ['kagoshima', 'kyushu'],
  Okinawa: ['okinawa'],
};

export function formatYen(value) {
  if (!Number.isFinite(Number(value))) return null;
  return '¥' + Number(value).toLocaleString('en-US');
}

export function formatUsd(value) {
  if (!Number.isFinite(Number(value))) return null;
  return '$' + Number(value).toLocaleString('en-US');
}

/** "Miyazaki, Miyazaki" reads badly — collapse it to one name. */
export function formatLocation(listing) {
  const city = (listing.address_english || '').split(',')[0].trim();
  const pref = (listing.prefecture || '').trim();
  if (city && pref && city.toLowerCase() !== pref.toLowerCase()) return `${city}, ${pref}`;
  return city || pref || 'Japan';
}

/** Short "3LDK · 120 m² land · 85 m² floor" style line. Omits missing fields. */
export function formatSpecs(listing) {
  const parts = [];
  if (listing.layout) parts.push(String(listing.layout).trim());
  if (Number.isFinite(Number(listing.land_area_sqm))) {
    parts.push(`${Math.round(listing.land_area_sqm)} m² land`);
  }
  if (Number.isFinite(Number(listing.floor_area_sqm))) {
    parts.push(`${Math.round(listing.floor_area_sqm)} m² floor`);
  }
  return parts;
}

export function buildHashtags(listing) {
  const pref = (listing.prefecture || '').trim();
  const extra = PREFECTURE_TAGS[pref] || (pref ? [pref.toLowerCase().replace(/[^a-z]/g, '')] : []);
  const all = [...BRAND_TAGS, ...extra].filter(Boolean);
  return [...new Set(all)].map((t) => `#${t}`);
}

export function listingUrl(listing) {
  return `${getSiteUrl()}/map/listing/${listing.id}`;
}

/**
 * Build the caption. Keeps the hook short, the facts stacked, and the link
 * before the hashtags so it survives truncation in most feeds.
 */
export function buildCaption(listing) {
  const yen = formatYen(listing.price_jpy);
  const usd = formatUsd(listing.price_usd);
  const price = [yen, usd && `~${usd}`].filter(Boolean).join(' · ');
  const location = formatLocation(listing);
  const specs = formatSpecs(listing);

  const lines = [];
  lines.push(price ? `${price}` : 'Price on application');
  lines.push(`A house in ${location}.`);
  lines.push('');

  if (specs.length) lines.push(specs.join(' · '));
  if (Number.isFinite(Number(listing.estimated_gross_yield))) {
    lines.push(`Estimated gross yield ${Number(listing.estimated_gross_yield).toFixed(1)}%`);
  }
  if (specs.length || listing.estimated_gross_yield) lines.push('');

  lines.push(
    'Cheap is never just cheap — check the road access, the zoning and the hazard map before you fall for it. We do that check free.'
  );
  lines.push('');
  lines.push(listingUrl(listing));
  lines.push('');
  lines.push(buildHashtags(listing).join(' '));

  return lines.join('\n').trim();
}

/** Screen-reader / alt text. Required by Instagram for accessibility. */
export function buildAltText(listing) {
  const price = formatYen(listing.price_jpy);
  const bits = [
    'Property listing card',
    price && `priced ${price}`,
    `in ${formatLocation(listing)}`,
    ...formatSpecs(listing),
  ].filter(Boolean);
  return bits.join(', ') + '.';
}

export const CARD_FORMATS = {
  square: { width: 1080, height: 1080, label: 'Square 1:1 — feed' },
  portrait: { width: 1080, height: 1350, label: 'Portrait 4:5 — feed' },
  story: { width: 1080, height: 1920, label: 'Story 9:16 — stories & reels' },
};

/** Everything needed to review and later publish one post. */
export function buildPost(listing, format = 'square') {
  return {
    listingId: listing.id,
    format,
    caption: buildCaption(listing),
    hashtags: buildHashtags(listing),
    altText: buildAltText(listing),
    cardUrl: `/api/social/card?id=${listing.id}&format=${format}`,
    sourceUrl: listing.source_url || null,
    listingUrl: listingUrl(listing),
  };
}
