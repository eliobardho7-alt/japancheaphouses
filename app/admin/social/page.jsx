'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, RefreshCw, Copy, Loader2, Download } from 'lucide-react';

const FORMATS = [
  { key: 'square', label: 'Square 1:1' },
  { key: 'portrait', label: 'Portrait 4:5' },
  { key: 'story', label: 'Story 9:16' },
];

const FILTERS = [
  { key: 'draft', label: 'Awaiting review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
];

export default function SocialQueuePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('draft');
  const [format, setFormat] = useState('square');
  const [note, setNote] = useState('');

  const load = useCallback(async (status) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/social${status ? `?status=${status}` : ''}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/social?status=draft', { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
        const data = await res.json();
        if (!cancelled) setPosts(data.posts || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    setBusy(true);
    setNote('');
    setError('');
    try {
      const res = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${res.status}`);
      setNote(data.created ? `Generated ${data.created} draft${data.created === 1 ? '' : 's'}.` : data.message || 'Nothing new to draft.');
      await load(filter);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const update = async (id, patch) => {
    try {
      const res = await fetch('/api/admin/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      await load(filter);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to admin
        </Link>

        <h1 className="font-serif text-4xl text-brand mb-2">Social queue</h1>
        <p className="text-brand-gray mb-8 max-w-2xl">
          Drafts are generated from listing data — never from invented numbers, and
          never reusing the scraped photographs. Review, edit the caption if you
          want, then approve. Nothing is published automatically.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="border border-brand-border px-3 py-2 text-sm bg-white"
          >
            {FORMATS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          <button
            onClick={generate}
            disabled={busy}
            className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generate 5 drafts
          </button>

          <div className="flex gap-1 ml-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key || 'all'}
                onClick={() => {
                  setFilter(f.key);
                  load(f.key);
                }}
                className={`px-3 py-2 text-sm transition-base ${
                  filter === f.key ? 'bg-brand text-white' : 'bg-white text-brand hover:bg-brand-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {note && <p className="text-sm text-brand-accent mb-4">{note}</p>}
        {error && <p className="text-sm text-red-600 mb-4">Error: {error}</p>}

        {loading ? (
          <p className="text-brand-gray">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-brand-border p-12 text-center">
            <p className="text-brand-gray">
              Nothing here yet. Pick a format and generate some drafts.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={update} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onUpdate }) {
  const [caption, setCaption] = useState(post.caption);
  const [copied, setCopied] = useState(false);
  const dirty = caption !== post.caption;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the textarea is selectable as a fallback.
    }
  };

  const cardSrc = `/api/social/card?id=${post.listing_id}&format=${post.format}`;

  return (
    <div className="bg-white border border-brand-border p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardSrc}
            alt={post.alt_text || 'Generated post card'}
            className="w-full border border-brand-border"
          />
          <div className="flex gap-3 mt-2">
            <a
              href={cardSrc}
              download={`yamavista-${post.listing_id}-${post.format}.png`}
              className="inline-flex items-center gap-1 text-xs text-brand-gray hover:text-brand"
            >
              <Download className="h-3 w-3" />
              Save image
            </a>
            {post.listing && (
              <a
                href={post.listing.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-gray hover:text-brand"
              >
                Source listing
              </a>
            )}
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-xs px-2 py-1 ${
                post.status === 'approved'
                  ? 'bg-green-600 text-white'
                  : post.status === 'rejected'
                  ? 'bg-brand-gray text-white'
                  : 'bg-brand-accent text-white'
              }`}
            >
              {post.status}
            </span>
            <span className="text-xs text-brand-gray">
              Listing #{post.listing_id} · {post.format}
            </span>
          </div>

          {post.listing && (
            <p className="text-xs text-brand-gray mb-3">
              Checks against source: {post.listing.price_jpy
                ? `¥${Number(post.listing.price_jpy).toLocaleString()}`
                : 'no price'}{' '}
              · {post.listing.prefecture || 'no prefecture'}
            </p>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={12}
            className="w-full border border-brand-border p-3 text-sm font-mono focus:outline-none focus:border-brand-accent"
          />

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={() => onUpdate(post.id, { status: 'approved', caption })}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => onUpdate(post.id, { status: 'rejected' })}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            {dirty && (
              <button
                onClick={() => onUpdate(post.id, { caption })}
                className="text-sm text-brand underline"
              >
                Save caption
              </button>
            )}
            <button
              onClick={copy}
              className="ml-auto inline-flex items-center gap-1 text-sm text-brand-gray hover:text-brand"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy caption'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
