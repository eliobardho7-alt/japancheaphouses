'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Eye, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Send a published post to the newsletter list.
 *
 * Two deliberate steps: a dry run that sends nothing and reports exactly who
 * would receive it, then an explicit confirmation. A broadcast cannot be
 * recalled, so it should never be one click away.
 */
export default function NewsletterSendPage() {
  const [slug, setSlug] = useState('');
  const [dry, setDry] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const call = async (confirm) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${res.status}`);
      if (confirm) {
        setResult(data);
        setDry(null);
      } else {
        setDry(data);
        setResult(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const n = dry?.wouldSendTo ?? 0;
    if (!confirm(`Send "${dry?.post?.title}" to ${n} subscriber${n === 1 ? '' : 's'}? This cannot be undone.`)) return;
    call(true);
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-3xl">
        <Link href="/admin" className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to admin
        </Link>

        <h1 className="font-serif text-4xl text-brand mb-2">Send to newsletter</h1>
        <p className="text-brand-gray mb-8">
          Preview first. Nothing is sent until you confirm the recipient count.
        </p>

        <div className="bg-white border border-brand-border p-6 mb-6">
          <label htmlFor="slug" className="block text-sm text-brand mb-2">
            Post slug
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="can-foreigners-buy-property-in-japan"
            className="w-full border border-brand-border px-4 py-3 mb-4 focus:outline-none focus:border-brand-accent"
          />
          <button
            onClick={() => call(false)}
            disabled={busy || !slug.trim()}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview (sends nothing)
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">Error: {error}</p>}

        {dry && (
          <div className="bg-white border border-brand-border p-6 mb-6">
            <h2 className="font-serif text-2xl text-brand mb-1">{dry.post.title}</h2>
            <a href={dry.post.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent underline">
              {dry.post.url}
            </a>

            <p className="text-sm text-brand-gray mt-4">
              Would send to <strong className="text-brand">{dry.wouldSendTo}</strong>{' '}
              subscriber{dry.wouldSendTo === 1 ? '' : 's'}, from{' '}
              <span className="font-mono text-xs">{dry.fromAddress}</span>
            </p>

            {dry.warning && (
              <div className="flex gap-3 bg-yellow-50 border border-yellow-200 p-4 mt-4 text-sm text-yellow-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{dry.warning}</span>
              </div>
            )}

            <div className="border border-brand-border mt-6">
              <div className="text-xs text-brand-gray px-3 py-2 border-b border-brand-border">
                Email preview
              </div>
              <iframe
                title="Email preview"
                srcDoc={dry.previewHtml}
                className="w-full h-[520px] bg-white"
              />
            </div>

            <button
              onClick={send}
              disabled={busy || dry.wouldSendTo === 0}
              className="btn-primary inline-flex items-center gap-2 mt-6 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {dry.wouldSendTo} subscriber{dry.wouldSendTo === 1 ? '' : 's'}
            </button>
          </div>
        )}

        {result && (
          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-serif text-2xl text-brand mb-3">Sent</h2>
            <p className="text-brand-gray">
              Delivered {result.sent} of {result.total}.
              {result.failed > 0 && ` ${result.failed} failed — check the sending domain in Resend.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
