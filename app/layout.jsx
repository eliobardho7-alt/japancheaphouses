import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteUrl } from '@/lib/site-url';
import { SpeedInsights } from '@vercel/speed-insights/next';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const SITE_URL = getSiteUrl();

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Yama Vista | Japan Real Estate Consulting',
    template: '%s | Yama Vista',
  },
  description:
    'Discover affordable and rare properties in Japan. Specialized in akiya homes, property management, and real estate consulting for international investors.',
  keywords: [
    'Japan real estate',
    'akiya',
    'property investment',
    'Tokyo properties',
    'Japan houses',
    'real estate consulting',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Yama Vista | Japan Real Estate Consulting',
    description:
      'Discover affordable and rare properties in Japan with expert consulting.',
    url: SITE_URL,
    siteName: 'Yama Vista',
    type: 'website',
    locale: 'en_US',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yama Vista | Japan Real Estate Consulting',
    description:
      'Discover affordable and rare properties in Japan with expert consulting.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Yama Vista',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Boutique real estate consultancy helping international buyers acquire and manage property in Japan.',
  founder: {
    '@type': 'Person',
    name: 'Elio Bardho',
  },
  sameAs: [
    'https://www.linkedin.com/in/elio-bardho-2273a0231',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'eliobardho7@gmail.com',
    contactType: 'customer service',
    areaServed: 'JP',
    availableLanguage: ['English', 'Japanese'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <SpeedInsights />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
