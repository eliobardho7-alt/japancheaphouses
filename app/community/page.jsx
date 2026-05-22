'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, MessageCircle, Users, TrendingUp, Plus, X, Send } from 'lucide-react';
import { communityCategories } from '@/data/community';
import { supabase, getCurrentUser, getUserSubscription } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setIsSubscribed(true);
        } else {
          const sub = await getUserSubscription(currentUser.id);
          setIsSubscribed(!!sub);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  if (!user || !isSubscribed) return <CommunityGate user={user} />;
  return <CommunityDashboard user={user} />;
}

function CommunityGate({ user }) {
  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom max-w-5xl">
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
              {!user && (
                <Link href="/login" className="btn-secondary">
                  Already a Member? Sign In
                </Link>
              )}
              {user && (
                <Link href="/pricing" className="btn-secondary">
                  Upgrade to Access
                </Link>
              )}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="font-serif text-2xl text-brand text-center mb-8">
              Discussion Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityCategories.map((cat) => (
                <div key={cat.id} className={`${cat.color} border p-6`}>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-serif text-lg text-brand mb-2">{cat.name}</h3>
                  <p className="text-sm text-brand-gray">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-light p-12">
            <h2 className="font-serif text-2xl text-brand text-center mb-8">
              What You Get as a Member
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: 'Active Community',
                  description: 'Chat with fellow investors and property owners.',
                },
                {
                  icon: MessageCircle,
                  title: 'Discussion Threads',
                  description: 'Post questions, share experiences, get answers.',
                },
                {
                  icon: TrendingUp,
                  title: 'Premium Listings',
                  description: 'Access exclusive property listings before anyone else.',
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

function CommunityDashboard({ user }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [activeCategory]);

  const fetchTopics = async () => {
    setLoading(true);
    let query = supabase
      .from('topics')
      .select('*')
      .order('last_activity', { ascending: false });

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }

    const { data } = await query;
    setTopics(data || []);
    setLoading(false);
  };

  const handleNewTopic = async ({ title, category, content }) => {
    const authorName =
      user.user_metadata?.full_name || user.email.split('@')[0];

    const { data: topic } = await supabase
      .from('topics')
      .insert({ title, category, author_id: user.id, author_name: authorName })
      .select()
      .single();

    if (topic && content.trim()) {
      await supabase.from('posts').insert({
        topic_id: topic.id,
        author_id: user.id,
        author_name: authorName,
        content,
      });
    }

    // Auto-follow the topic you created
    if (topic) {
      await supabase
        .from('topic_followers')
        .upsert(
          { topic_id: topic.id, user_id: user.id, email: user.email },
          { onConflict: 'topic_id,user_id' }
        );
    }

    setShowNewTopic(false);
    fetchTopics();
  };

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

            <main className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-brand">
                  {activeCategory === 'all'
                    ? 'Recent Discussions'
                    : communityCategories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button
                  onClick={() => setShowNewTopic(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Topic
                </button>
              </div>

              {loading ? (
                <p className="text-brand-gray text-sm py-8">Loading topics...</p>
              ) : topics.length === 0 ? (
                <div className="text-center py-16 border border-brand-border">
                  <MessageCircle className="h-10 w-10 text-brand-gray mx-auto mb-3 opacity-40" />
                  <p className="text-brand-gray mb-4">No topics yet. Start the conversation!</p>
                  <button onClick={() => setShowNewTopic(true)} className="btn-primary">
                    Create First Topic
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/community/topic/${topic.id}`}
                      className="block border border-brand-border p-4 hover:border-brand transition-base"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="font-serif text-lg text-brand mb-1">{topic.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-brand-gray">
                            <span>by {topic.author_name}</span>
                            <span>•</span>
                            <span>
                              {new Date(topic.last_activity).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              {communityCategories.find((c) => c.id === topic.category)?.name ||
                                topic.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-brand-gray shrink-0">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {topic.reply_count}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {showNewTopic && (
        <NewTopicModal
          onSubmit={handleNewTopic}
          onClose={() => setShowNewTopic(false)}
        />
      )}
    </div>
  );
}

function NewTopicModal({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(communityCategories[0]?.id || '');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await onSubmit({ title, category, content });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <h2 className="font-serif text-2xl text-brand">New Topic</h2>
          <button onClick={onClose} className="text-brand-gray hover:text-brand">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-brand-gray mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-brand-border"
              placeholder="What do you want to discuss?"
            />
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-brand-border"
            >
              {communityCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Your message *</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-brand-border resize-none"
              placeholder="Share your thoughts, question, or experience..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-brand-border">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {saving ? 'Posting...' : 'Post Topic'}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
