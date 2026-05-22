'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, Lock, Eye } from 'lucide-react';

const emptyListing = () => ({
  title: '',
  slug: '',
  location: '',
  price: '',
  priceUSD: '',
  propertyType: 'Detached House',
  landIncluded: true,
  excerpt: '',
  content: '',
  isPremium: true,
  date: new Date().toISOString().split('T')[0],
  tags: [],
});

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/listings', { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setListings(data.listings || []);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (listing) => {
    setError('');
    const method = isCreating ? 'POST' : 'PUT';
    const res = await fetch('/api/admin/listings', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg || 'Failed to save');
      return;
    }
    await load();
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const res = await fetch(`/api/admin/listings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg || 'Failed to delete');
      return;
    }
    setListings(listings.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  if (editing || isCreating) {
    return (
      <ListingEditor
        listing={editing || emptyListing()}
        onSave={handleSave}
        onCancel={() => {
          setEditing(null);
          setIsCreating(false);
        }}
        error={error}
      />
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12">
        <Link href="/admin" className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-brand">Manage Listings</h1>
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-6">{error}</div>
        )}

        <div className="bg-white border border-brand-border">
          {listings.length === 0 ? (
            <p className="p-8 text-center text-brand-gray">No listings yet.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-brand-light">
                <tr>
                  <th className="text-left p-4 text-sm text-brand">Title</th>
                  <th className="text-left p-4 text-sm text-brand">Location</th>
                  <th className="text-left p-4 text-sm text-brand">Price</th>
                  <th className="text-left p-4 text-sm text-brand">Type</th>
                  <th className="text-right p-4 text-sm text-brand">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t border-brand-border">
                    <td className="p-4 text-sm">{listing.title}</td>
                    <td className="p-4 text-sm text-brand-gray">{listing.location}</td>
                    <td className="p-4 text-sm">{listing.price}</td>
                    <td className="p-4 text-sm">
                      {listing.isPremium ? (
                        <span className="bg-brand-accent text-white px-2 py-1 text-xs">Premium</span>
                      ) : (
                        <span className="bg-green-600 text-white px-2 py-1 text-xs">Free</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/listings/${listing.slug}`} target="_blank" className="text-brand-gray hover:text-brand-accent">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setEditing(listing)} className="text-brand-gray hover:text-brand-accent">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(listing.id)} className="text-brand-gray hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingEditor({ listing, onSave, onCancel, error }) {
  const [form, setForm] = useState(listing);

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-4xl">
        <button onClick={onCancel} className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <h1 className="font-serif text-3xl text-brand mb-8">{listing.id ? 'Edit Listing' : 'New Listing'}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-4">{error}</div>
        )}

        <div className="bg-white border border-brand-border p-8 space-y-5">
          <div>
            <label className="block text-sm text-brand-gray mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border"
              placeholder="e.g., Charming House in Osaka"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Location *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
                placeholder="e.g., Osaka, Japan"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
              >
                <option>Detached House</option>
                <option>Apartment</option>
                <option>Akiya</option>
                <option>Villa</option>
                <option>Land</option>
                <option>Commercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Price (display) *</label>
              <input
                type="text"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
                placeholder="e.g., ¥5,000,000 or $50,000"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Short Description (Excerpt)</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border resize-none"
              placeholder="Brief description shown on listing cards..."
            />
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Full Description (supports ## for headings)</label>
            <textarea
              rows={10}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border resize-none font-mono text-sm"
              placeholder="Detailed property information, features, and notes..."
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-brand">
                <Lock className="inline h-4 w-4 mr-1" />
                Premium listing (subscribers only)
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-border">
            <button
              onClick={() => onSave(form)}
              disabled={!form.title || !form.location || !form.price}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Listing
            </button>
            <button onClick={onCancel} className="btn-secondary flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
