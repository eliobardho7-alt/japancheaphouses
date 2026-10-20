'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

import { ADMIN_EMAIL } from '@/lib/constants';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      router.push('/login');
      return;
    }

    // Read through the admin API, not the browser client. contact_submissions
    // is private data with no public select policy, so a query from the
    // browser returns an empty list rather than an error — which is why the
    // dashboard could count messages this page could not show.
    try {
      const res = await fetch('/api/admin/contact-submissions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.submissions || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?redirect=/admin/messages');
        return;
      } else {
        setError((await res.json()).error || `Could not load messages (${res.status})`);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
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
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="font-serif text-4xl text-brand mb-8">Contact Messages</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 text-sm text-red-800">
            Could not load messages: {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="bg-white border border-brand-border p-12 text-center">
            <MessageSquare className="h-12 w-12 text-brand-gray mx-auto mb-4" />
            <p className="text-brand-gray">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white border border-brand-border p-6">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-serif text-lg text-brand">{msg.name}</h3>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-sm text-brand-accent hover:underline"
                    >
                      {msg.email}
                    </a>
                  </div>
                  <span className="text-xs text-brand-gray">
                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {msg.subject && (
                  <p className="text-sm text-brand mb-2">
                    <strong>Subject:</strong> {msg.subject}
                  </p>
                )}

                <p className="text-sm text-brand-gray whitespace-pre-wrap mt-3 p-3 bg-brand-light">
                  {msg.message}
                </p>

                <div className="mt-4">
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message to Yama Vista'}`}
                    className="text-sm text-brand-accent hover:underline inline-flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Reply via email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
