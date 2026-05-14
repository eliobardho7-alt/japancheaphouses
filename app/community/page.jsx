'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, MessageCircle, Users, TrendingUp } from 'lucide-react';
import { communityCategories } from '@/data/community';

// Mock recent topics (in production, this comes from Supabase)
const mockTopics = [
  {
    id: 1,
    category: 'newcomers',
    title: 'Just moved to Tokyo - where should I start looking for property?',
    author: 'Sarah K.',
    replies: 12,
    lastActivity: '2 hours ago',
  },
  {
    id: 2,
    category: 'repairs',
    title: 'Best contractors in Kanagawa for renovation work?',
    author: 'Mike R.',
    replies: 8,
    lastActivity: '5 hours ago',
  },
  {
    id: 3,
    category: 'investments',
    title: 'ROI calculations for Akiya in remote areas - my experience',
    author: 'David L.',
    replies: 24,
    lastActivity: '1 day ago',
  },
  {
    id: 4,
    category: 'potential-purchases',
    title: 'Looking at this property in Wakayama - thoughts?',
    author: 'Anna P.',
    replies: 6,
    lastActivity: '3 hours ago',
  },
];

export default function CommunityPage() {
  // TODO: Check user auth and subscription status
  const isAuthenticated = false;
  const isSubscribed = false;

  if (!isAuthenticated || !isSubscribed) {
    return <CommunityGate />;
  }

  return <CommunityDashboard />;
}

function CommunityGate() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Lock className="h-12 w-12 text-brand-accent mx-auto mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl text-brand mb-4">
              Join the Yama Vista Community
            </h1>
            <p className="text-brand-gray max-w-2xl mx-auto mb-8">
              Connect with fellow real estate enthusiasts, get advice from experienced investors,
              and access exclusive listings — all for just $5/month.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/pricing" className="btn-primary">
                Subscribe Now
              </Link>
              <Link href="/login" className="btn-secondary">
                Already a Member? Sign In
              </Link>
            </div>
          </div>

          {/* Preview of Categories */}
          <div className="mb-16">
            <h2 className="font-serif text-2xl text-brand text-center mb-8">
              Discussion Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`${cat.color} border p-6 relative overflow-hidden`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-serif text-lg text-brand mb-2">{cat.name}</h3>
                  <p className="text-sm text-brand-gray">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-brand-light p-12">
            <h2 className="font-serif text-2xl text-brand text-center mb-8">
              What You Get as a Member
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: 'Active Community',
                  description:
                    'Chat with hundreds of fellow investors and property owners.',
                },
                {
                  icon: MessageCircle,
                  title: 'Direct Messaging',
                  description:
                    'Connect privately with members to discuss deals and share insights.',
                },
                {
                  icon: TrendingUp,
                  title: 'Premium Listings',
                  description:
                    'Access exclusive property listings before anyone else.',
                },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <item.icon className="h-8 w-8 text-brand-accent mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-brand mb-2">{item.title}</h3>
                  <p className="text-sm text-brand-gray">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CommunityDashboard() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTopics =
    activeCategory === 'all'
      ? mockTopics
      : mockTopics.filter((t) => t.category === activeCategory);

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl text-brand mb-2">Community</h1>
            <p className="text-brand-gray">
              Discuss real estate, share experiences, and connect with members.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <aside className="lg:col-span-1">
              <h3 className="font-serif text-lg text-brand mb-4">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left px-3 py-2 text-sm transition-base ${
                    activeCategory === 'all'
                      ? 'bg-brand text-white'
                      : 'text-brand hover:bg-brand-light'
                  }`}
                >
                  All Topics
                </button>
                {communityCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-base flex items-center gap-2 ${
                      activeCategory === cat.id
                        ? 'bg-brand text-white'
                        : 'text-brand hover:bg-brand-light'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-brand">
                  {activeCategory === 'all'
                    ? 'Recent Discussions'
                    : communityCategories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button className="btn-primary">+ New Topic</button>
              </div>

              <div className="space-y-3">
                {filteredTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/community/topic/${topic.id}`}
                    className="block border border-brand-border p-4 hover:border-brand transition-base"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow">
                        <h3 className="font-serif text-lg text-brand mb-1">
                          {topic.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-brand-gray">
                          <span>by {topic.author}</span>
                          <span>•</span>
                          <span>{topic.lastActivity}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-brand-gray">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {topic.replies}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
