'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Home,
  Calendar,
  Mail,
  LogOut,
} from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookings: 0,
    messages: 0,
    blogs: 0,
    listings: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Server-side middleware already gates this route, but read the user
        // for the welcome banner.
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        setUser(currentUser);

        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStats(data);
        } else if (res.status === 401 || res.status === 403) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Admin load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl text-brand mb-1">Admin Dashboard</h1>
            <p className="text-sm text-brand-gray">Welcome back{user?.email ? `, ${user.email}` : ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-accent transition-base"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Bookings', value: stats.bookings, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: 'Messages', value: stats.messages, icon: Mail, color: 'bg-purple-50 text-purple-600' },
            { label: 'Blog Posts', value: stats.blogs, icon: FileText, color: 'bg-green-50 text-green-600' },
            { label: 'Listings', value: stats.listings, icon: Home, color: 'bg-yellow-50 text-yellow-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-brand-border p-6">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded ${stat.color} mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-serif text-brand">{stat.value}</div>
              <div className="text-sm text-brand-gray">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/blogs" className="bg-white border border-brand-border p-6 card-hover block">
            <FileText className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Manage Blogs</h3>
            <p className="text-sm text-brand-gray mb-3">Add, edit, or delete blog posts. Mark as free or premium.</p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link href="/admin/listings" className="bg-white border border-brand-border p-6 card-hover block">
            <Home className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Manage Listings</h3>
            <p className="text-sm text-brand-gray mb-3">Add new property listings. Set as free or premium.</p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link href="/admin/bookings" className="bg-white border border-brand-border p-6 card-hover block">
            <Calendar className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">View Bookings</h3>
            <p className="text-sm text-brand-gray mb-3">See all consultation bookings and service requests.</p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link href="/admin/messages" className="bg-white border border-brand-border p-6 card-hover block">
            <Mail className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Messages</h3>
            <p className="text-sm text-brand-gray mb-3">Read messages submitted through the contact form.</p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
