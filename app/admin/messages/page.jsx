'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
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

    if (supabase) {
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setMessages(data);
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

        {!supabase && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6 text-sm text-yellow-800">
            ⚠️ Supabase is not configured yet. Messages are only sent via email. See README.md for setup.
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
