import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, Lock, ExternalLink } from 'lucide-react';
import { getPostBySlug, blogPosts } from '@/data/blogs';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | Yama Vista`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // TODO: Check user subscription status server-side
  // For now, premium posts show paywall preview
  const isSubscribed = false; // Would come from auth/subscription check
  const showFullContent = !post.isPremium || isSubscribed;

  return (
    <article className="pt-24">
      <div className="container-custom max-w-4xl py-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-brand-gray hover:text-brand-accent transition-base mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all posts
        </Link>

        {/* Header */}
        <header className="mb-8">
          <span className="text-xs text-brand-accent uppercase tracking-wider">
            {post.category}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-brand mt-3 mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-brand-gray">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm">
                EB
              </div>
              <span>{post.author}</span>
            </div>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTime}
            </span>
          </div>
        </header>

        {/* Featured Image Placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 mb-12 flex items-center justify-center">
          <span className="text-8xl opacity-30">🏡</span>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {showFullContent ? (
            <div className="text-brand-gray leading-relaxed whitespace-pre-line">
              {post.content.split('\n').map((paragraph, idx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="font-serif text-2xl text-brand mt-8 mb-4">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="font-serif text-xl text-brand mt-6 mb-3">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
                  return (
                    <p key={idx} className="ml-4 mb-2">
                      {trimmed}
                    </p>
                  );
                }
                return (
                  <p key={idx} className="mb-4">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          ) : (
            <>
              {/* Preview (first paragraph) */}
              <p className="text-brand-gray leading-relaxed mb-6">
                {post.excerpt}
              </p>

              {/* Paywall */}
              <div className="bg-brand-light border-2 border-brand-border p-8 my-8 text-center">
                <Lock className="h-12 w-12 text-brand-accent mx-auto mb-4" />
                <h3 className="font-serif text-2xl text-brand mb-3">
                  Premium Content
                </h3>
                <p className="text-brand-gray mb-6 max-w-md mx-auto">
                  This listing is exclusive to our subscribers. Join our community for $5/month
                  to access all premium listings, the discussion board, and more.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/pricing" className="btn-primary">
                    Subscribe Now
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Source link */}
          {post.linkedinUrl && showFullContent && (
            <div className="mt-12 p-4 bg-brand-light flex items-center justify-between">
              <span className="text-sm text-brand-gray">
                Originally posted on LinkedIn
              </span>
              <a
                href={post.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-brand hover:text-brand-accent transition-base"
              >
                View original
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {showFullContent && post.tags && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 bg-brand-light text-brand-gray"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related posts */}
        <section className="mt-16 pt-12 border-t border-brand-border">
          <h2 className="font-serif text-2xl text-brand mb-6">More from Yama Vista</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="block group"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 mb-4 flex items-center justify-center">
                    <span className="text-4xl opacity-30">🏡</span>
                  </div>
                  <span className="text-xs text-brand-accent uppercase tracking-wider">
                    {related.category}
                  </span>
                  <h3 className="font-serif text-lg text-brand mt-2 group-hover:text-brand-accent transition-base">
                    {related.title}
                  </h3>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </article>
  );
}
