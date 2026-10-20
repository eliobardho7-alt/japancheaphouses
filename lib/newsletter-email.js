import { escapeHtml } from '@/lib/escape-html';

/**
 * The article announcement email.
 *
 * Kept in lib rather than the route so the template can be rendered and
 * reviewed without sending anything to anyone.
 */
export function buildEmail({ post, siteUrl, unsubscribeUrl }) {
  const url = `${siteUrl}/blog/${post.slug}`;

  // First few paragraphs of the post, skipping headings, as the preview.
  const preview = String(post.content || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('-') && !/^\d+\./.test(l))
    .slice(0, 3);

  return `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6;">
  <div style="background:#1a1a1a;padding:24px 32px;">
    <div style="color:#fff;font-size:18px;letter-spacing:6px;">YAMA VISTA</div>
  </div>
  <div style="padding:32px;">
    <div style="color:#8B0000;font-size:12px;letter-spacing:2px;text-transform:uppercase;">New article</div>
    <h1 style="font-size:26px;line-height:1.25;margin:10px 0 18px;">${escapeHtml(post.title)}</h1>
    ${preview.map((p) => `<p style="margin:0 0 14px;color:#374151;">${escapeHtml(p)}</p>`).join('\n    ')}
    <a href="${url}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:13px 26px;text-decoration:none;font-size:14px;margin:12px 0 4px;">Read the full article</a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
    <p style="color:#6b7280;font-size:13px;margin:0 0 10px;">
      Everything on japancheaphouses.com is free — every listing, every price, and the full 29-slide buyer's guide.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      You're receiving this because you subscribed at japancheaphouses.com.
      <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>.
    </p>
  </div>
</div>`;
}
