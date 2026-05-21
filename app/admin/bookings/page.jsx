'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Mail, Phone } from 'lucide-react';

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (e) {
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const updateStatus = async (id, status) => {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    } else {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12">
        <Link href="/admin" className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="font-serif text-4xl text-brand mb-8">Booking Requests</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-6">{error}</div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white border border-brand-border p-12 text-center">
            <Calendar className="h-12 w-12 text-brand-gray mx-auto mb-4" />
            <p className="text-brand-gray">No bookings yet. They&apos;ll appear here when customers book.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-brand-border p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-serif text-xl text-brand">{booking.full_name}</h3>
                    <p className="text-sm text-brand-gray">
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      at {booking.time}
                    </p>
                  </div>
                  <select
                    value={booking.status}
                    onChange={(e) => updateStatus(booking.id, e.target.value)}
                    className={`px-3 py-1 text-xs border ${
                      booking.status === 'confirmed'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : booking.status === 'completed'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-brand-gray">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${booking.email}`} className="hover:text-brand-accent">{booking.email}</a>
                  </div>
                  {booking.phone && (
                    <div className="flex items-center gap-2 text-brand-gray">
                      <Phone className="h-4 w-4" />
                      <span>{booking.phone}</span>
                    </div>
                  )}
                  <div className="text-brand-gray">
                    <strong>Service:</strong> {booking.service}
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-4 p-3 bg-brand-light text-sm">
                    <strong className="text-brand-gray">Notes:</strong>
                    <p className="mt-1 text-brand-gray whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
