'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Calendar, Clock, Heart } from 'lucide-react';
import { blogPosts, categories } from '@/data/blogs';

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All Posts');

  const filteredPosts =
    activeCategory === 'All Posts'
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
              Blog
            </h1>
            <p className="text-brand-gray max-w-2xl">
              Guides, market analysis, and insights about investing in Japan real estate.
              Most blogs are free for everyone to read.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-12 border-b border-brand-border pb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 text-sm transition-base ${
                  activeCategory === category
                    ? 'text-brand-accent border-b-2 border-brand-accent -mb-[18px]'
                    : 'text-brand-gray hover:text-brand'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          <div className="space-y-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-brand-border"
              >
                {/* Image */}
                <div className="md:col-span-1">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      {post.isPremium && (
                        <div className="absolute top-3 right-3 z-10 bg-brand-accent text-white px-2 py-1 text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Premium
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-30">📖</span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Content */}
                <div className="md:col-span-2 flex flex-col">
                  <div className="flex items-center gap-4 mb-3 text-xs text-brand-gray">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs">
                        EB
                      </div>
                      <span>{post.author}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
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

                  <span className="text-xs text-brand-accent uppercase tracking-wider mb-2">
                    {post.category}
                  </span>

                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="font-serif text-2xl md:text-3xl text-brand mb-3 hover:text-brand-accent transition-base">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-brand-gray text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm text-brand underline hover:text-brand-accent transition-base"
                    >
                      Read More
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-brand-gray">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />0
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="mt-16 bg-brand text-white p-12 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Looking for property listings?
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-6">
              Browse our curated collection of unique properties across Japan.
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand text-sm font-medium tracking-wide transition-base hover:bg-brand-light"
            >
              View Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
