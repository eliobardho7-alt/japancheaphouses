'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Mail,
  Users,
  CreditCard,
  TrendingUp,
  MessageCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

const TYPE_CONFIG = {
  booking: { label: 'Booking', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  contact: { label: 'Contact', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  newsletter: { label: 'Newsletter', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  subscription: { label: 'Subscriber', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  topic: { label: 'Topic', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  reply: { label: 'Reply', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Sparkline({ data, field, color }) {
  if (!data?.length) return null;
  const vals = data.map((d) => d[field]);
  const max = Math.max(...vals, 1);
  const w = 120;
  const h = 36;
  const step = w / (vals.length - 1 || 1);

  const points = vals
    .map((v, i) => `${i * step},${h - (v / max) * (h - 4)}`)
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function BarChart({ data }) {
  if (!data?.length) return null;
  const allVals = data.flatMap((d) => [d.bookings, d.contacts, d.newsletter, d.subscriptions]);
  const max = Math.max(...allVals, 1);
  const cols = ['bookings', 'contacts', 'newsletter', 'subscriptions'];
  const colColors = ['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-yellow-400'];

  // Show last 14 days
  const slice = data.slice(-14);

  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {slice.map((day) => (
        <div key={day.date} className="flex-1 flex items-end gap-px h-full" title={day.date}>
          {cols.map((col, i) => (
            <div
              key={col}
              className={`flex-1 ${colColors[i]} rounded-t-sm opacity-80`}
              style={{ height: `${(day[col] / max) * 100}%`, minHeight: day[col] > 0 ? 2 : 0 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MetricsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/metrics', { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statCards = data
    ? [
        {
          label: 'Bookings',
          total: data.totals.bookings,
          last30: data.last30.bookings,
          icon: Calendar,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          sparkField: 'bookings',
          sparkColor: '#3b82f6',
        },
        {
          label: 'Messages',
          total: data.totals.contacts,
          last30: data.last30.contacts,
          icon: Mail,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          sparkField: 'contacts',
          sparkColor: '#9333ea',
        },
        {
          label: 'Newsletter',
          total: data.totals.newsletter,
          last30: data.last30.newsletter,
          icon: Users,
          color: 'text-green-600',
          bg: 'bg-green-50',
          sparkField: 'newsletter',
          sparkColor: '#16a34a',
        },
        {
          label: 'Subscribers',
          total: data.totals.subscriptions,
          last30: data.last30.subscriptions,
          icon: CreditCard,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          sparkField: 'subscriptions',
          sparkColor: '#ca8a04',
        },
      ]
    : [];

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin" className="text-brand-gray hover:text-brand transition-base">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="font-serif text-3xl text-brand">Metrics</h1>
            </div>
            <p className="text-sm text-brand-gray pl-7">
              {lastRefresh ? `Last updated ${timeAgo(lastRefresh.toISOString())}` : 'Loading…'}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand transition-base disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 mb-6">
            Failed to load metrics: {error}
          </div>
        )}

        {/* Stat cards */}
        {loading && !data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-brand-border p-6 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white border border-brand-border p-5">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded ${s.bg} ${s.color} mb-3`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-3xl font-serif text-brand">{s.total}</div>
                <div className="text-xs text-brand-gray mb-3">{s.label}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-gray">+{s.last30} last 30d</span>
                  <Sparkline data={data.dailyActivity} field={s.sparkField} color={s.sparkColor} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity chart */}
          <div className="lg:col-span-2 bg-white border border-brand-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-brand">Activity — Last 14 Days</h2>
              <div className="flex items-center gap-3 text-xs text-brand-gray">
                {[
                  { label: 'Bookings', color: 'bg-blue-400' },
                  { label: 'Contacts', color: 'bg-purple-400' },
                  { label: 'Newsletter', color: 'bg-green-400' },
                  { label: 'Subscriptions', color: 'bg-yellow-400' },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-sm ${l.color}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            {data ? (
              <BarChart data={data.dailyActivity} />
            ) : (
              <div className="h-24 bg-gray-50 animate-pulse rounded" />
            )}
          </div>

          {/* Booking statuses */}
          <div className="bg-white border border-brand-border p-6">
            <h2 className="font-serif text-lg text-brand mb-4">Booking Status</h2>
            {data ? (
              Object.keys(data.bookingStatuses).length === 0 ? (
                <p className="text-sm text-brand-gray">No bookings yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.bookingStatuses).map(([status, count]) => {
                    const total = data.totals.bookings || 1;
                    const pct = Math.round((count / total) * 100);
                    const colors = {
                      pending: 'bg-yellow-400',
                      confirmed: 'bg-blue-400',
                      completed: 'bg-green-400',
                      cancelled: 'bg-red-400',
                    };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-brand-gray">{status}</span>
                          <span className="text-brand font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[status] || 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-6 bg-gray-50 animate-pulse rounded" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-brand-border p-6 mt-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-brand-accent" />
            <h2 className="font-serif text-lg text-brand">Recent Activity</h2>
          </div>
          {loading && !data ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-50 animate-pulse rounded" />
              ))}
            </div>
          ) : data?.feed?.length === 0 ? (
            <p className="text-sm text-brand-gray">No activity yet.</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {(data?.feed || []).map((item, i) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.reply;
                return (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-sm text-brand flex-1 truncate">{item.label}</span>
                    {item.detail && (
                      <span className="text-xs text-brand-gray truncate max-w-[160px] hidden sm:block">
                        {item.detail}
                      </span>
                    )}
                    {item.status && (
                      <span className="text-xs text-brand-gray capitalize hidden sm:block">
                        {item.status}
                      </span>
                    )}
                    <span className="text-xs text-brand-gray shrink-0 ml-auto">
                      {timeAgo(item.ts)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
