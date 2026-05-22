/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      // Municipal akiya bank hosts (cover images hot-linked from .lg.jp / .city.X.Y.jp)
      { protocol: 'https', hostname: '*.lg.jp' },
      { protocol: 'https', hostname: '*.city.akita.lg.jp' },
      { protocol: 'https', hostname: 'akiya.city.hachinohe.aomori.jp' },
    ],
  },
  serverExternalPackages: ['stripe'],
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // 301 redirects from old Wix URLs to current site structure
  async redirects() {
    return [
      // Old Wix language paths
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

      // Old Wix service pages
      { source: '/service-page/free-initial-consultation', destination: '/booking', permanent: true },
      { source: '/service-page/:path*', destination: '/services', permanent: true },

      // Old Wix pricing plans
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
