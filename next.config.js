/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  serverExternalPackages: ['stripe'],

  // 301 redirects from old Wix URLs to current site structure
  async redirects() {
    return [
      // Old Wix language paths → English homepage
      { source: '/zh', destination: '/', permanent: true },
      { source: '/zh/:path*', destination: '/', permanent: true },
      { source: '/fr', destination: '/', permanent: true },
      { source: '/fr/:path*', destination: '/booking', permanent: true },
      { source: '/es', destination: '/', permanent: true },
      { source: '/es/:path*', destination: '/', permanent: true },
      { source: '/ru', destination: '/', permanent: true },
      { source: '/ru/:path*', destination: '/', permanent: true },
      { source: '/de', destination: '/', permanent: true },
      { source: '/de/:path*', destination: '/', permanent: true },
      { source: '/ja', destination: '/', permanent: true },
      { source: '/ja/:path*', destination: '/', permanent: true },

      // Old Wix Service Pages
      { source: '/service-page/free-initial-consultation', destination: '/booking', permanent: true },
      { source: '/service-page/:path*', destination: '/services', permanent: true },

      // Old Wix Pricing Plans
      { source: '/pricing-plans/list', destination: '/pricing', permanent: true },
      { source: '/pricing-plans/:path*', destination: '/pricing', permanent: true },

      // Old Wix booking
      { source: '/book-online', destination: '/booking', permanent: true },
      { source: '/book-online/:path*', destination: '/booking', permanent: true },

      // Common Wix URL patterns
      { source: '/post/:slug*', destination: '/blog', permanent: true },
      { source: '/blog-1/:slug*', destination: '/blog', permanent: true },
    ];
  },
};

module.exports = nextConfig;
