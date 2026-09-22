'use client';

import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';

/**
 * Newsletter-for-guide signup form.
 *
 * Shared by the /guide page and the entry popup so the two cannot drift
 * apart. `compact` tightens it for the modal; `onSuccess` lets the popup
 * close itself once the download has started.
 */
export default function GuideSignup({ compact = false, onSuccess }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');

    try {
      const res = await fetch('/api/guide/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('idle');
        return;
      }

      setDownloadUrl(data.downloadUrl);
      setStatus('done');
      if (data.downloadUrl) window.location.assign(data.downloadUrl);
      if (onSuccess) onSuccess();
    } catch {
      setError('Could not reach the server. Please try again.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className={compact ? 'text-center' : 'bg-white border border-brand-border p-8 text-center'}>
        <Check className="h-10 w-10 text-brand-accent mx-auto mb-4" />
        <h3 className="font-serif text-2xl text-brand mb-3">You&apos;re subscribed</h3>
        <p className="text-brand-gray mb-6">
          Your download should have started. We&apos;ve emailed you a copy of the link as well.
        </p>
        {downloadUrl && (
          <a href={downloadUrl} className="btn-primary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download again
          </a>
        )}
      </div>
    );
  }

  const inputId = compact ? 'popup-guide-email' : 'guide-email';

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? '' : 'bg-white border border-brand-border p-8'}
    >
      {!compact && (
        <>
          <h3 className="font-serif text-2xl text-brand mb-2">Get the guide free</h3>
          <p className="text-sm text-brand-gray mb-6">
            Enter your email and the <span className="whitespace-nowrap">29-slide</span> guide
            downloads immediately.
          </p>
        </>
      )}

      <label htmlFor={inputId} className="block text-sm text-brand mb-2">
        Email address
      </label>
      <input
        id={inputId}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border border-brand-border px-4 py-3 mb-4 focus:outline-none focus:border-brand-accent"
      />

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${inputId}-website`}>Website</label>
        <input
          id={`${inputId}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending it over…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Send me the guide
          </>
        )}
      </button>

      <p className="text-xs text-brand-gray mt-4">
        Submitting subscribes you to the Yama Vista newsletter — listings, market notes and
        buying advice. Unsubscribe any time. We never sell your address.
      </p>
    </form>
  );
}
