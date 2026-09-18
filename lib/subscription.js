import { getServerSupabase, getServiceSupabase } from '@/lib/supabase-server';
import { ADMIN_EMAIL as PUBLIC_ADMIN_EMAIL } from '@/lib/constants';

const NO_ACCESS = { user: null, isSubscribed: false, isAdmin: false };

/**
 * Resolve the current viewer's entitlement from the server-side session.
 *
 * Use this — not a hardcoded flag — to decide whether premium content is
 * rendered. Any page calling it becomes dynamically rendered, so pair it with
 * `export const dynamic = 'force-dynamic'`.
 *
 * Fails closed: if auth or the subscription lookup errors, the viewer is
 * treated as unsubscribed.
 */
export async function getViewerAccess() {
  let supabase;
  try {
    supabase = await getServerSupabase();
  } catch (error) {
    console.error('Subscription check: auth client unavailable:', error.message);
    return NO_ACCESS;
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (error) {
    console.error('Subscription check: auth lookup failed:', error.message);
    return NO_ACCESS;
  }
  if (!user) return NO_ACCESS;

  const adminEmail = process.env.ADMIN_EMAIL || PUBLIC_ADMIN_EMAIL;
  if (adminEmail && user.email === adminEmail) {
    return { user, isSubscribed: true, isAdmin: true };
  }

  // Read the subscription with the service client where available. The user is
  // already authenticated above, and we only ever look up their own row — going
  // through the service client just stops a missing or restrictive RLS policy on
  // `subscriptions` from silently denying a paying customer their content.
  const reader = getServiceSupabase() || supabase;

  try {
    const { data: sub } = await reader
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    return { user, isSubscribed: !!sub, isAdmin: false };
  } catch (error) {
    console.error('Subscription lookup failed:', error.message);
    return { user, isSubscribed: false, isAdmin: false };
  }
}
