'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, Lock, Eye } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { blogPosts as initialBlogs } from '@/data/blogs';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

const toDb = (post) => ({
  title: post.title,
  slug: post.slug,
  category: post.category,
  date: post.date,
  read_time: post.readTime,
  author: post.author,
  excerpt: post.excerpt,
  content: post.content,
  is_premium: post.isPremium,
  tags: post.tags || [],
  linkedin_url: post.linkedinUrl || '',
  cover_image: post.coverImage || '',
});

const fromDb = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  category: row.category,
  date: row.date,
  readTime: row.read_time,
  author: row.author,
  excerpt: row.excerpt,
  content: row.content,
  isPremium: row.is_premium,
  tags: row.tags || [],
  linkedinUrl: row.linkedin_url || '',
  coverImage: row.cover_image || '',
});

export default function AdminBlogsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState(initialBlogs);
  const [editingPost, setEditingPost] = useState(null);
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

    if (supabase) {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .order('date', { ascending: false });
      if (data && data.length > 0) setPosts(data.map(fromDb));
    }
    setLoading(false);
  };

  const emptyPost = {
    title: '',
    slug: '',
    category: 'Guides',
    excerpt: '',
    content: '',
    isPremium: false,
    author: 'Elio Bardho',
    date: new Date().toISOString().split('T')[0],
    readTime: '2 min read',
    tags: [],
  };

  const handleSave = async (post) => {
    const slug =
      post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const postToSave = { ...post, slug };

    if (supabase) {
      if (isCreating) {
        await supabase.from('blog_posts').insert(toDb(postToSave));
      } else {
        await supabase.from('blog_posts').update(toDb(postToSave)).eq('id', post.id);
      }

      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .order('date', { ascending: false });
      if (data) setPosts(data.map(fromDb));
    } else {
      // No Supabase: just update local state
      if (isCreating) {
        setPosts([{ ...postToSave, id: Date.now() }, ...posts]);
      } else {
        setPosts(posts.map((p) => (p.id === post.id ? postToSave : p)));
      }
      alert('Note: Without Supabase, changes are not saved permanently. Set up Supabase in README.md to enable persistence.');
    }

    setEditingPost(null);
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    if (supabase) {
      await supabase.from('blog_posts').delete().eq('id', id);
    }
    setPosts(posts.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  if (editingPost || isCreating) {
    return (
      <BlogEditor
        post={editingPost || emptyPost}
        onSave={handleSave}
        onCancel={() => {
          setEditingPost(null);
          setIsCreating(false);
        }}
      />
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-brand">Manage Blog Posts</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>

        {!supabase && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6 text-sm text-yellow-800">
            ⚠️ Supabase is not configured yet. Changes won't be saved permanently. See README.md for setup instructions.
          </div>
        )}

        <div className="bg-white border border-brand-border">
          {posts.length === 0 ? (
            <p className="p-8 text-center text-brand-gray">No blog posts yet. Click "New Post" to create one.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-brand-light">
                <tr>
                  <th className="text-left p-4 text-sm text-brand">Title</th>
                  <th className="text-left p-4 text-sm text-brand">Category</th>
                  <th className="text-left p-4 text-sm text-brand">Type</th>
                  <th className="text-left p-4 text-sm text-brand">Date</th>
                  <th className="text-right p-4 text-sm text-brand">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-brand-border">
                    <td className="p-4 text-sm">{post.title}</td>
                    <td className="p-4 text-sm text-brand-gray">{post.category}</td>
                    <td className="p-4 text-sm">
                      {post.isPremium ? (
                        <span className="bg-brand-accent text-white px-2 py-1 text-xs">Premium</span>
                      ) : (
                        <span className="bg-green-600 text-white px-2 py-1 text-xs">Free</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-brand-gray">{post.date}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-brand-gray hover:text-brand-accent"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setEditingPost(post)}
                          className="text-brand-gray hover:text-brand-accent"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-brand-gray hover:text-red-600"
                          title="Delete"
                        >
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

function BlogEditor({ post, onSave, onCancel }) {
  const [form, setForm] = useState(post);

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-4xl">
        <button
          onClick={onCancel}
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Blog List
        </button>

        <h1 className="font-serif text-3xl text-brand mb-8">
          {post.id ? 'Edit Blog Post' : 'New Blog Post'}
        </h1>

        <div className="bg-white border border-brand-border p-8 space-y-5">
          <div>
            <label className="block text-sm text-brand-gray mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border"
              placeholder="e.g., Top 5 Tips for Buying Akiya in Japan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-gray mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
              >
                <option value="Guides">Guides</option>
                <option value="Market Analysis">Market Analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-brand-gray mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Excerpt (short summary)</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border resize-none"
              placeholder="A brief description that appears in the blog list..."
            />
          </div>

          <div>
            <label className="block text-sm text-brand-gray mb-1">Content (supports headings with ##)</label>
            <textarea
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border resize-none font-mono text-sm"
              placeholder={`Write your blog post here. Use ## for headings.

Example:

## Introduction

This is the introduction paragraph.

## Main Points

1. First point
2. Second point
3. Third point`}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-brand">
                <Lock className="inline h-4 w-4 mr-1" />
                Premium content (subscribers only)
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-border">
            <button
              onClick={() => onSave(form)}
              disabled={!form.title || !form.excerpt}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Post
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
