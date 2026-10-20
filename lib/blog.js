import { getServiceSupabase } from '@/lib/supabase-server';
import { getPostBySlug, blogPosts } from '@/data/blogs';

/**
 * Load a blog post by slug.
 *
 * The listing page reads blog_posts from Supabase while the detail page only
 * ever read data/blogs.js, so anything written through /admin/blogs appeared
 * in the list and then 404'd when clicked. This loader closes that gap:
 * database first, the static file as a fallback for the original posts.
 */

function fromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    date: row.date,
    readTime: row.read_time,
    author: row.author,
    excerpt: row.excerpt,
    content: row.content,
    isPremium: !!row.is_premium,
    tags: row.tags || [],
    linkedinUrl: row.linkedin_url || null,
    coverImage: row.cover_image || null,
  };
}

export async function loadPost(slug) {
  const supabase = getServiceSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) return fromRow(data);
    } catch (error) {
      // Fall through to the static posts rather than 404ing on a DB blip.
      console.error('Blog load failed, falling back to static posts:', error.message);
    }
  }
  return getPostBySlug(slug) || null;
}

/** Every post, database and static merged, newest first. Used for related posts. */
export async function loadAllPosts() {
  const supabase = getServiceSupabase();
  let rows = [];
  if (supabase) {
    try {
      const { data } = await supabase.from('blog_posts').select('*');
      rows = (data || []).map(fromRow);
    } catch (error) {
      console.error('Blog list load failed:', error.message);
    }
  }
  const seen = new Set(rows.map((p) => p.slug));
  const merged = [...rows, ...blogPosts.filter((p) => !seen.has(p.slug))];
  return merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}
