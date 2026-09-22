import { sanitizeHeader } from '@/lib/escape-html';

/**
 * Send one transactional email through Resend.
 *
 * Returns false (never throws) when mail isn't configured or the send fails,
 * so callers can decide whether that should fail the request. Every caller
 * must escape anything user-supplied before putting it in `html` — this
 * helper only sanitises the header fields.
 */
export async function sendMail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY) return false;

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((address) => sanitizeHeader(address));

  if (!recipients.length) return false;

  const payload = {
    from: `Yama Vista <${sanitizeHeader(fromAddress)}>`,
    to: recipients,
    subject: sanitizeHeader(subject),
    html,
  };
  if (replyTo) payload.reply_to = sanitizeHeader(replyTo);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Resend send failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Resend send error:', error.message);
    return false;
  }
}
