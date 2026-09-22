import { createClient } from '@supabase/supabase-js';
import { escapeHtml } from '@/lib/escape-html';
import { sendMail } from '@/lib/mail';

export function normalizeEmail(value) {
  return String(value || '').trim().slice(0, 254).toLowerCase();
}

/**
 * Add an address to newsletter_subscribers. Idempotent — re-subscribing an
 * existing address is a no-op rather than an error.
 *
 * Returns true only when the row is actually stored. Callers that gate
 * something on subscribing (the buyer's guide) must treat false as a failure;
 * callers that are only collecting (the footer form) may ignore it.
 */
export async function storeSubscriber(email) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Newsletter: Supabase is not configured; subscriber not stored');
    return false;
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email, created_at: new Date().toISOString() }, { onConflict: 'email' });
    if (error) {
      console.error('Newsletter Supabase error:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Newsletter store error:', error.message);
    return false;
  }
}

/** Tell the admin someone subscribed, noting where they came from. */
export async function notifyAdminOfSubscriber(email, source = 'newsletter form') {
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eliobardho7@gmail.com';

  return sendMail({
    to: adminEmail,
    subject: `New Newsletter Subscriber: ${email}`,
    html: `<p>New subscriber: <strong>${escapeHtml(email)}</strong></p>
<p style="color:#6b7280;font-size:12px;">Source: ${escapeHtml(source)}</p>`,
  });
}
