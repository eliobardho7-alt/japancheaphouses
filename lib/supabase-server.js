/**
 * Server-side Supabase clients.
 *
 * - getServerSupabase(): reads the user's session from cookies (use in
 *   Route Handlers / Server Components that need to know who's signed in).
 * - getServiceSupabase(): elevated client with the service-role key, used
 *   for admin operations after we've already verified the caller is admin.
 */

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export function getServerSupabase() {
  return createRouteHandlerClient({ cookies });
}

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Throws if the current request isn't from the admin user.
 * Returns the authenticated user on success.
 */
export async function requireAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { error: 'ADMIN_EMAIL not configured', status: 500 };
  }
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401 };
  if (user.email !== adminEmail) return { error: 'Forbidden', status: 403 };
  return { user };
}
