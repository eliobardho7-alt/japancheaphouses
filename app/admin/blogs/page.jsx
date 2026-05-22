'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, Lock, Eye } from 'lucide-react';

const emptyPost = () => ({
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
});

export default function AdminBlogsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/blogs', { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setPosts(data.posts || []);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (post) => {
    setError('');
    const method = isCreating ? 'POST' : 'PUT';
    const res = await fetch('/api/admin/blogs', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg || 'Failed to save');
      return;
    }
    await load();
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await fetch(`/api/admin/blogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg || 'Failed to delete');
      return;
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
        post={editingPost || emptyPost()}
        onSave={handleSave}
        onCancel={() => {
          setEditingPost(null);
          setIsCreating(false);
        }}
        error={error}
      />
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12">
        <Link href="/admin" className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-brand">Manage Blog Posts</h1>
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-6">{error}</div>
        )}

        <div className="bg-white border border-brand-border">
          {posts.length === 0 ? (
            <p className="p-8 text-center text-brand-gray">No blog posts yet. Click &quot;New Post&quot; to create one.</p>
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
                        <Link href={`/blog/${post.slug}`} target="_blank" className="text-brand-gray hover:text-brand-accent" title="View">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setEditingPost(post)} className="text-brand-gray hover:text-brand-accent" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="text-brand-gray hover:text-red-600" title="Delete">
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

function BlogEditor({ post, onSave, onCancel, error }) {
  const [form, setForm] = useState(post);

  return (
    <div className="pt-24 min-h-screen bg-brand-light">
      <div className="container-custom py-12 max-w-4xl">
        <button onClick={onCancel} className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Blog List
        </button>

        <h1 className="font-serif text-3xl text-brand mb-8">{post.id ? 'Edit Blog Post' : 'New Blog Post'}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 mb-4">{error}</div>
        )}

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
