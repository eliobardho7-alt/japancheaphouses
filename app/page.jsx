import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Home, Search } from 'lucide-react';
import { services } from '@/data/services';
import { getFeaturedPosts } from '@/data/blogs';
import { listings } from '@/data/listings';

export default function HomePage() {
  const featuredPosts = getFeaturedPosts(2);
  const featuredListings = listings.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[700px] flex items-center pt-20">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80"
            alt="Real estate consultation"
            fill
            priority
            className="object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        {/* Content */}
        <div className="container-custom relative z-10">
          <div className="max-w-2xl animate-fade-up">
            <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-6">
              EXPLORE UNIQUE
              <br />
              PROPERTIES
            </h1>
            <p className="text-white/90 text-lg mb-8 max-w-xl">
              Discover a world of affordable and rare properties in Japan with Yama Vista.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/listings" className="btn-primary bg-white text-brand hover:bg-brand-light">
                View More
              </Link>
              <Link href="/booking" className="btn-secondary bg-transparent text-white border-white hover:bg-white hover:text-brand">
                Book Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About/Introduction Section */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-brand mb-6">
              About Yama Vista
            </h2>
            <p className="text-brand-gray mb-4 leading-relaxed">
              Hi, I'm Elio. After living in Japan for three years and working in both marketing and real estate, I created Yama Vista to help people like you find and invest in their dream home in Japan.
            </p>
            <p className="text-brand-gray mb-6 leading-relaxed">
              I personally own three properties and have helped countless people navigate Japan's unique real estate market—from inspections to renovations to property management. Japan's market has incredible opportunities, but there are nuances and things you need to know to succeed. That's where we come in.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[120px]">
                <div className="text-2xl font-serif text-brand">3</div>
                <div className="text-sm text-brand-gray">Properties Owned</div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-2xl font-serif text-brand">3 yrs</div>
                <div className="text-sm text-brand-gray">In Japan</div>
              </div>
              <div className="flex-1 min-w-[140px]">
                <div className="text-2xl font-serif text-brand">Hands-on</div>
                <div className="text-sm text-brand-gray">Purchase & Renovation Experience</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-72 h-72 rounded-full overflow-hidden border-4 border-brand shadow-lg">
              <Image
                src="/elio-profile.jpg"
                alt="Elio Bardho, Founder of Yama Vista"
                width={288}
                height={288}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Quick Access */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-brand-border p-8 card-hover bg-white"
              >
                <h3 className="font-serif text-2xl text-brand mb-4">{service.title}</h3>
                <div className="w-full h-px bg-brand-border mb-4" />
                {service.price !== 'Free' && service.price !== 'Contact for pricing' && (
                  <p className="text-brand-gray text-sm mb-4">{service.price}</p>
                )}
                <div className="flex flex-col gap-2 mt-6">
                  {service.bookingType === 'book' ? (
                    <Link href="/booking" className="btn-primary w-full text-center">
                      Book Now
                    </Link>
                  ) : (
                    <>
                      <Link href="/booking" className="btn-primary w-full text-center">
                        Book Now
                      </Link>
                      <Link
                        href="/pricing"
                        className="text-sm text-brand underline hover:text-brand-accent text-center"
                      >
                        Explore Plans
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Listings & Guides */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-brand mb-2">
                Latest from the Blog
              </h2>
              <p className="text-brand-gray">Free guides and market insights.</p>
            </div>
            <Link href="/blog" className="btn-secondary">
              View All Posts
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {featuredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white border border-brand-border card-hover overflow-hidden"
              >
                <div className="relative h-64 bg-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <Home className="h-16 w-16 text-white/50" />
                  </div>
                </div>
                <div className="p-6">
                  <span className="text-xs text-brand-accent uppercase tracking-wider">
                    {post.category}
                  </span>
                  <h3 className="font-serif text-xl text-brand mt-2 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-brand-gray line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-sm text-brand hover:text-brand-accent transition-base"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Featured Listings */}
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-brand mb-2">
                Featured Listings
              </h2>
              <p className="text-brand-gray">Curated properties across Japan.</p>
            </div>
            <Link href="/listings" className="btn-secondary">
              View All Listings
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.slug}`}
                className="bg-white border border-brand-border card-hover overflow-hidden group block"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300">
                  {listing.isPremium ? (
                    <div className="absolute top-3 right-3 bg-brand-accent text-white px-2 py-1 text-xs">
                      Premium
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 text-xs">
                      Free
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-30">🏡</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="text-white font-serif">{listing.price}</div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base text-brand line-clamp-2 group-hover:text-brand-accent transition-base">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-brand-gray mt-1">{listing.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props / Why Choose Us */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-brand mb-4">
              Why Choose Yama Vista
            </h2>
            <p className="text-brand-gray max-w-2xl mx-auto">
              We bring transparency, local expertise, and a curated approach to Japan real estate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'Curated Listings',
                description:
                  'Hand-picked properties from across Japan, vetted for value and authenticity.',
              },
              {
                icon: Calendar,
                title: 'Expert Consulting',
                description:
                  'Free initial consultations to understand your goals and find the right opportunities.',
              },
              {
                icon: Home,
                title: 'End-to-End Support',
                description:
                  'From inspection to property management, we handle the entire journey.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-brand mb-4">
                  <item.icon className="h-7 w-7 text-brand" />
                </div>
                <h3 className="font-serif text-xl text-brand mb-2">{item.title}</h3>
                <p className="text-brand-gray text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-brand text-white">
        <div className="container-custom text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-4">
            Ready to Find Your Japan Property?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Book a free 45-minute consultation and let us help you discover the perfect investment.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand text-sm font-medium tracking-wide transition-base hover:bg-brand-light"
          >
            Book Free Consultation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
