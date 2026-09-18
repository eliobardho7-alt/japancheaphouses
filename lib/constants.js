/**
 * Shared constants.
 *
 * ADMIN_EMAIL is used by client components for cosmetic checks only (hiding
 * admin-only buttons, skipping view counters). It is inherently visible in the
 * browser bundle — never treat it as a secret or as an access control.
 * Real authorization happens server-side in proxy.js and lib/supabase-server.js
 * via the non-public ADMIN_EMAIL env var.
 */
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'eliobardho7@gmail.com';
