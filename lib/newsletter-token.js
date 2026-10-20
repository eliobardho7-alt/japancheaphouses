import crypto from 'node:crypto';
import { normalizeEmail } from '@/lib/newsletter';

/**
 * Signed unsubscribe links.
 *
 * Unlike the guide download these never expire — an unsubscribe link has to
 * keep working in an email someone opens a year later, or it isn't a real
 * unsubscribe. The signature means a link only ever removes the address it
 * was issued for: nobody can unsubscribe someone else by editing a URL.
 */
function signingKey() {
  return (
    process.env.GUIDE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    null
  );
}

export function signUnsubscribeToken(email) {
  const key = signingKey();
  if (!key) return null;
  const encoded = Buffer.from(normalizeEmail(email)).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(`unsub.${encoded}`).digest('base64url');
  return `${encoded}.${signature}`;
}

/** Returns the email for a valid token, otherwise null. */
export function verifyUnsubscribeToken(token) {
  const key = signingKey();
  if (!key || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = crypto
    .createHmac('sha256', key)
    .update(`unsub.${encoded}`)
    .digest('base64url');

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  return Buffer.from(encoded, 'base64url').toString('utf8');
}
