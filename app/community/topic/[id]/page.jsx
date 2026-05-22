'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bell, BellOff } from 'lucide-react';
import { supabase, getCurrentUser, getUserSubscription } from '@/lib/supabase';
import { communityCategories } from '@/data/community';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

export default function TopicPage({ params }) {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setIsSubscribed(true);
        } else {
          const sub = await getUserSubscription(currentUser.id);
          setIsSubscribed(!!sub);
        }

        // Check if user already follows this topic
        const { data: follow } = await supabase
          .from('topic_followers')
          .select('id')
          .eq('topic_id', params.id)
          .eq('user_id', currentUser.id)
          .single();
        setIsFollowing(!!follow);
      }

      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', params.id)
        .single();
      setTopic(topicData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('topic_id', params.id)
        .order('created_at', { ascending: true });
      setPosts(postsData || []);

      setLoading(false);
    }
    load();
  }, [params.id]);

  const toggleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase
        .from('topic_followers')
        .delete()
        .eq('topic_id', params.id)
        .eq('user_id', user.id);
      setIsFollowing(false);
    } else {
      await supabase.from('topic_followers').insert({
        topic_id: parseInt(params.id),
        user_id: user.id,
        email: user.email,
      });
      setIsFollowing(true);
    }

    setFollowLoading(false);
  };

  const handleReply = async () => {
    if (!reply.trim() || !user) return;
    setPosting(true);

    const authorName = user.user_metadata?.full_name || user.email.split('@')[0];

    await supabase.from('posts').insert({
      topic_id: parseInt(params.id),
      author_id: user.id,
      author_name: authorName,
      content: reply,
    });

    await supabase
      .from('topics')
      .update({
        reply_count: (topic.reply_count || 0) + 1,
        last_activity: new Date().toISOString(),
      })
      .eq('id', params.id);

    // Auto-follow the topic when replying
    if (!isFollowing) {
      await supabase
        .from('topic_followers')
        .upsert(
          { topic_id: parseInt(params.id), user_id: user.id, email: user.email },
          { onConflict: 'topic_id,user_id' }
        );
      setIsFollowing(true);
    }

    // Notify other followers
    await fetch('/api/community/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: parseInt(params.id),
        topicTitle: topic.title,
        authorName,
        postContent: reply,
        authorUserId: user.id,
      }),
    });

    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('topic_id', params.id)
      .order('created_at', { ascending: true });

    setPosts(data || []);
    setTopic((prev) => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }));
    setReply('');
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="pt-24">
        <div className="container-custom max-w-4xl py-12">
          <p className="text-brand-gray">Topic not found.</p>
          <Link href="/community" className="text-brand-accent underline mt-4 inline-block">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const categoryName =
    communityCategories.find((c) => c.id === topic.category)?.name || topic.category;

  return (
    <div className="pt-24">
      <div className="container-custom max-w-4xl py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/community"
            className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Link>

          {user && isSubscribed && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`inline-flex items-center gap-2 text-sm px-4 py-2 border transition-base disabled:opacity-50 ${
                isFollowing
                  ? 'border-brand bg-brand text-white hover:bg-transparent hover:text-brand'
                  : 'border-brand-border text-brand-gray hover:border-brand hover:text-brand'
              }`}
            >
              {isFollowing ? (
                <>
                  <BellOff className="h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Follow Topic
                </>
              )}
            </button>
          )}
        </div>

        <div className="mb-8">
          <span className="text-xs text-brand-accent uppercase tracking-wider">{categoryName}</span>
          <h1 className="font-serif text-3xl text-brand mt-2 mb-2">{topic.title}</h1>
          <p className="text-sm text-brand-gray">
            Started by <span className="font-medium">{topic.author_name}</span> ·{' '}
            {new Date(topic.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              className={`border p-5 ${
                idx === 0 ? 'border-brand bg-brand-light' : 'border-brand-border'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-medium">
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-brand">{post.author_name}</p>
                  <p className="text-xs text-brand-gray">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {idx === 0 && (
                  <span className="ml-auto text-xs bg-brand text-white px-2 py-0.5">OP</span>
                )}
              </div>
              <p className="text-brand-gray text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          ))}
        </div>

        {user && isSubscribed ? (
          <div className="border border-brand-border p-6">
            <h3 className="font-serif text-lg text-brand mb-1">Post a Reply</h3>
            {!isFollowing && (
              <p className="text-xs text-brand-gray mb-4">
                You'll automatically follow this topic when you reply.
              </p>
            )}
            <textarea
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full px-3 py-2 border border-brand-border resize-none mb-4"
              placeholder="Write your reply..."
            />
            <button
              onClick={handleReply}
              disabled={!reply.trim() || posting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {posting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        ) : (
          <div className="text-center p-8 bg-brand-light border border-brand-border">
            <p className="text-brand-gray mb-4">
              {user
                ? 'Subscribe to participate in discussions.'
                : 'Log in to reply to this topic.'}
            </p>
            <Link href={user ? '/pricing' : '/login'} className="btn-primary">
              {user ? 'Subscribe Now' : 'Log In'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
