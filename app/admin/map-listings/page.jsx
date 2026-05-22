'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit2, Trash2, ArrowLeft, Save, X, MapPin, Search,
} from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

const PREFECTURES = [
  'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima',
  'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa',
  'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu',
  'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara',
  'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi',
  'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki',
  'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa',
];

export default function AdminMapListingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    await loadListings();
    setLoading(false);
  };

  const loadListings = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('scraped_listings')
      .select('*')
      .order('scraped_at', { ascending: false });
    if (data) setListings(data);
  };

  const emptyListing = {
    source_url: '',
    title: '',
    price_jpy: 0,
    price_usd: 0,
    address_english: '',
    prefecture: 'Fukushima',
    layout: '',
    land_area_sqm: 0,
    floor_area_sqm: 0,
    estimated_gross_yield: 0,
    description_english: '',
    latitude: null,
    longitude: null,
    status: 'active',
  };

  const handleSave = async (listing) => {
    if (!supabase) {
      alert('Supabase not configured.');
      return;
    }
    // Manual entries get a synthetic source_url so they don't collide with scraped ones
    const finalListing = {
      ...listing,
      source_url: listing.source_url || `manual://${Date.now()}-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    };

    if (isCreating) {
      const { error } = await supabase.from('scraped_listings').insert(finalListing);
      if (error) {
        alert('Save failed: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('scraped_listings')
        .update(finalListing)
        .eq('id', listing.id);
      if (error) {
        alert('Save failed: ' + error.message);
        return;
      }
    }
    await loadListings();
    setEditing(null);
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('scraped_listings').delete().eq('id', id);
    await loadListings();
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading…</p>
      </div>
    );
  }

  if (editing || isCreating) {
    return (
      <MapListingForm
        listing={editing || emptyListing}
        onSave={handleSave}
        onCancel={() => {
          setEditing(null);
          setIsCreating(false);
        }}
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
          <div>
            <h1 className="font-serif text-4xl text-brand">Map Listings</h1>
            <p className="text-sm text-brand-gray mt-1">
              These show as pins on /map. Use the Add button or run the Python scraper.
            </p>
          </div>
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Listing
          </button>
        </div>

        <div className="bg-white border border-brand-border">
          {listings.length === 0 ? (
            <p className="p-8 text-center text-brand-gray">
              No map listings yet. Add one manually or run the Python scraper.
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-brand-light">
                <tr>
                  <th className="text-left p-4 text-sm text-brand">Title</th>
                  <th className="text-left p-4 text-sm text-brand">Prefecture</th>
                  <th className="text-left p-4 text-sm text-brand">Price</th>
                  <th className="text-left p-4 text-sm text-brand">Geocoded</th>
                  <th className="text-left p-4 text-sm text-brand">Status</th>
                  <th className="text-right p-4 text-sm text-brand">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t border-brand-border">
                    <td className="p-4 text-sm">{listing.title}</td>
                    <td className="p-4 text-sm text-brand-gray">{listing.prefecture}</td>
                    <td className="p-4 text-sm text-brand-gray">
                      {listing.price_jpy ? `¥${listing.price_jpy.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-sm">
                      {listing.latitude && listing.longitude ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-0.5 text-xs ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700' :
                        listing.status === 'sold' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
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

function MapListingForm({ listing, onSave, onCancel }) {
  const [form, setForm] = useState(listing);
  const [geocoding, setGeocoding] = useState(false);

  const geocode = async () => {
    if (!form.address_english) {
      alert('Enter an address first.');
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address_english,
          prefecture: form.prefecture,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ ...form, latitude: data.lat, longitude: data.lng });
      } else {
        alert('Geocoding failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      alert('Geocoding error: ' + e.message);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-4xl">
        <button onClick={onCancel} className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Map Listings
        </button>

        <h1 className="font-serif text-3xl text-brand mb-8">
          {listing.id ? 'Edit Listing' : 'New Map Listing'}
        </h1>

        <div className="bg-white border border-brand-border p-8 space-y-5">
          <div>
            <label className="block text-sm text-brand-gray mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border"
              placeholder="e.g., Spacious 4DK in Wakayama"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Prefecture *</label>
              <select
                value={form.prefecture}
                onChange={(e) => setForm({ ...form, prefecture: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
              >
                {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Layout</label>
              <input
                type="text"
                value={form.layout}
                onChange={(e) => setForm({ ...form, layout: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
                placeholder="e.g., 3DK, 4LDK"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">
              Full Address (English) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.address_english}
                onChange={(e) => setForm({ ...form, address_english: e.target.value })}
                className="flex-grow px-3 py-2 border border-brand-border"
                placeholder="e.g., 6470 Shibushicho Cho, Shibushi City, Kagoshima, Japan"
              />
              <button
                onClick={geocode}
                disabled={geocoding || !form.address_english}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <Search className="h-4 w-4" />
                {geocoding ? 'Locating…' : 'Geocode'}
              </button>
            </div>
            {form.latitude && form.longitude && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Pinned: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Price (JPY)</label>
              <input
                type="number"
                value={form.price_jpy}
                onChange={(e) => {
                  const jpy = parseInt(e.target.value || 0);
                  setForm({ ...form, price_jpy: jpy, price_usd: Math.round(jpy / 150) });
                }}
                className="w-full px-3 py-2 border border-brand-border"
                placeholder="e.g., 2500000"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Price (USD, auto)</label>
              <input
                type="number"
                value={form.price_usd}
                readOnly
                className="w-full px-3 py-2 border border-brand-border bg-gray-50 text-brand-gray"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Land (m²)</label>
              <input
                type="number"
                step="0.01"
                value={form.land_area_sqm}
                onChange={(e) => setForm({ ...form, land_area_sqm: parseFloat(e.target.value || 0) })}
                className="w-full px-3 py-2 border border-brand-border"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Floor (m²)</label>
              <input
                type="number"
                step="0.01"
                value={form.floor_area_sqm}
                onChange={(e) => setForm({ ...form, floor_area_sqm: parseFloat(e.target.value || 0) })}
                className="w-full px-3 py-2 border border-brand-border"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Est. Yield (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.estimated_gross_yield}
                onChange={(e) => setForm({ ...form, estimated_gross_yield: parseFloat(e.target.value || 0) })}
                className="w-full px-3 py-2 border border-brand-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Description (English)</label>
            <textarea
              rows={8}
              value={form.description_english}
              onChange={(e) => setForm({ ...form, description_english: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border resize-none"
              placeholder="Detailed English description for the listing popup and detail page…"
            />
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-border">
            <button
              onClick={() => onSave(form)}
              disabled={!form.title || !form.prefecture}
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
