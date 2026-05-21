/**
 * Escape a string for safe insertion into HTML.
 * Use for ANY user-supplied value interpolated into email bodies, error pages,
 * or other HTML output. Returns an empty string for null/undefined.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strip CR/LF characters from a value being placed in an email header
 * (Subject, From, To, Reply-To). Prevents header injection.
 */
export function sanitizeHeader(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, 250);
}

/**
 * Lightweight email-format check. Not RFC-perfect, just rejects obvious junk.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  if (value.length > 254) return false;
  // Disallow CR/LF (header injection) and require one @ with non-empty parts.
  if (/[\r\n]/.test(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
