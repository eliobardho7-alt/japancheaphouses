import crypto from 'node:crypto';
import path from 'node:path';
import { normalizeEmail } from '@/lib/newsletter';

export const GUIDE = {
  title: "Buying a Home in Japan — The Complete Buyer's Guide",
  slides: 29,
};

/**
 * Available formats, in preference order.
 *
 * PDF first because most readers have nothing that opens a .pptx — no Office
 * on the machine means Windows cannot even identify the download. The
 * PowerPoint stays available for anyone who wants the editable deck.
 *
 * Both live OUTSIDE public/ on purpose: anything under public/ is served to
 * anyone who knows the URL, which would make the newsletter gate decorative.
 */
export const GUIDE_FORMATS = {
  pdf: {
    filePath: path.join(process.cwd(), 'assets', 'buying-a-home-in-japan.pdf'),
    downloadName: 'Buying-a-Home-in-Japan-Yama-Vista.pdf',
    contentType: 'application/pdf',
    label: 'PDF',
  },
  pptx: {
    filePath: path.join(process.cwd(), 'assets', 'buying-a-home-in-japan.pptx'),
    downloadName: 'Buying-a-Home-in-Japan-Yama-Vista.pptx',
    contentType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    label: 'PowerPoint',
  },
};

export const DEFAULT_FORMAT = 'pdf';

// A download link is meant to be used immediately after subscribing, and to be
// useless if it leaks into a referrer log or a shared screenshot later.
const TTL_MS = 60 * 60 * 1000;

/**
 * The signing key. Prefers a dedicated secret, but falls back to another
 * server-only secret so the feature works without new configuration. Returns
 * null if the deployment has no secrets at all, in which case downloads fail
 * closed rather than being signed with something guessable.
 */
function signingKey() {
  return (
    process.env.GUIDE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    null
  );
}

export function signGuideToken(email) {
  const key = signingKey();
  if (!key) return null;

  const payload = `${Buffer.from(normalizeEmail(email)).toString('base64url')}.${Date.now() + TTL_MS}`;
  const signature = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/** Returns { email } for a valid, unexpired token, otherwise null. */
export function verifyGuideToken(token) {
  const key = signingKey();
  if (!key || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedEmail, expiry, signature] = parts;
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${encodedEmail}.${expiry}`)
    .digest('base64url');

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return { email: Buffer.from(encodedEmail, 'base64url').toString('utf8') };
}
