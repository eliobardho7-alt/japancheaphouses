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
  Plus,
  TrendingUp,
} from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';

// Only this email can access the admin dashboard
const ADMIN_EMAIL = 'eliobardho7@gmail.com';

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
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadStats();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!supabase) return;
    try {
      const [bookings, messages] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase
          .from('contact_submissions')
          .select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        bookings: bookings.count || 0,
        messages: messages.count || 0,
        blogs: 0, // From data file
        listings: 0,
      });
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

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

  if (!user) return null;

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl text-brand mb-1">Admin Dashboard</h1>
            <p className="text-sm text-brand-gray">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-accent transition-base"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/blogs"
            className="bg-white border border-brand-border p-6 card-hover block"
          >
            <FileText className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Manage Blogs</h3>
            <p className="text-sm text-brand-gray mb-3">
              Add, edit, or delete blog posts. Mark as free or premium.
            </p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link
            href="/admin/listings"
            className="bg-white border border-brand-border p-6 card-hover block"
          >
            <Home className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Manage Listings</h3>
            <p className="text-sm text-brand-gray mb-3">
              Add new property listings. Set as free or premium.
            </p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link
            href="/admin/map-listings"
            className="bg-white border border-brand-border p-6 card-hover block"
          >
            <Home className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Map Listings</h3>
            <p className="text-sm text-brand-gray mb-3">
              Manage pins on the /map page. Geocodes addresses automatically.
            </p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link
            href="/admin/bookings"
            className="bg-white border border-brand-border p-6 card-hover block"
          >
            <Calendar className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">View Bookings</h3>
            <p className="text-sm text-brand-gray mb-3">
              See all consultation bookings and service requests.
            </p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>

          <Link
            href="/admin/messages"
            className="bg-white border border-brand-border p-6 card-hover block"
          >
            <Mail className="h-8 w-8 text-brand-accent mb-3" />
            <h3 className="font-serif text-lg text-brand mb-2">Messages</h3>
            <p className="text-sm text-brand-gray mb-3">
              Read messages submitted through the contact form.
            </p>
            <span className="text-sm text-brand-accent">Open →</span>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded">
          <h3 className="font-serif text-lg text-brand mb-2">💡 How to use this dashboard</h3>
          <ul className="text-sm text-brand-gray space-y-1">
            <li>• <strong>Manage Blogs</strong> — Add new blog posts with one click. They'll appear on your site instantly.</li>
            <li>• <strong>Manage Listings</strong> — Add new property listings. Mark as Premium to lock them.</li>
            <li>• <strong>View Bookings</strong> — All consultation requests are saved here AND emailed to you.</li>
            <li>• <strong>Messages</strong> — Contact form submissions are also emailed to you.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
