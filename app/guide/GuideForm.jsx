'use client';

import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';

export default function GuideForm() {
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

      // Start the download straight away; the link stays on screen as a
      // fallback if the browser blocks the navigation.
      if (data.downloadUrl) window.location.assign(data.downloadUrl);
    } catch {
      setError('Could not reach the server. Please try again.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="bg-white border border-brand-border p-8 text-center">
        <Check className="h-10 w-10 text-brand-accent mx-auto mb-4" />
        <h3 className="font-serif text-2xl text-brand mb-3">You&apos;re subscribed</h3>
        <p className="text-brand-gray mb-6">
          Your download should have started. We&apos;ve emailed you a copy of the
          link as well.
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

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-brand-border p-8">
      <h3 className="font-serif text-2xl text-brand mb-2">Get the guide free</h3>
      <p className="text-sm text-brand-gray mb-6">
        Enter your email and the {' '}
        <span className="whitespace-nowrap">29-slide</span> guide downloads
        immediately.
      </p>

      <label htmlFor="guide-email" className="block text-sm text-brand mb-2">
        Email address
      </label>
      <input
        id="guide-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border border-brand-border px-4 py-3 mb-4 focus:outline-none focus:border-brand-accent"
      />

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="guide-website">Website</label>
        <input
          id="guide-website"
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
        Submitting subscribes you to the Yama Vista newsletter — listings,
        market notes and buying advice. Unsubscribe any time. We never sell
        your address.
      </p>
    </form>
  );
}
