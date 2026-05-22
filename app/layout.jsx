import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

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

const SITE_URL = 'https://www.japancheaphouses.com';
const SITE_NAME = 'Japan Cheap Houses';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Japan Cheap Houses | Affordable Akiya & Real Estate in Japan',
    template: '%s | Japan Cheap Houses',
  },
  description:
    'Discover affordable Japanese akiya (vacant homes), rare property listings, and expert real estate consulting for international investors. Buy, renovate, and invest in Japan with confidence.',
  keywords: [
    'Japan real estate',
    'akiya',
    'cheap houses Japan',
    'Japan property investment',
    'buy house in Japan',
    'Japanese vacant homes',
    'Tokyo property',
    'Japan property consulting',
    'akiya for sale',
    'foreign investors Japan',
    'rural Japan property',
    'Japan house renovation',
  ],
  authors: [{ name: 'Elio Bardho' }],
  creator: 'Elio Bardho',
  publisher: 'Japan Cheap Houses',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Japan Cheap Houses | Affordable Akiya & Real Estate in Japan',
    description:
      'Find affordable Japanese homes and akiya. Expert consulting for international investors.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Japan Cheap Houses — Affordable Japanese Real Estate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Japan Cheap Houses | Affordable Akiya & Real Estate in Japan',
    description:
      'Find affordable Japanese homes and akiya. Expert consulting for international investors.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  category: 'Real Estate',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  alternateName: 'Yama Vista',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Affordable Japanese real estate and akiya consulting for international investors.',
  founder: {
    '@type': 'Person',
    name: 'Elio Bardho',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'eliobardho7@gmail.com',
    contactType: 'customer service',
    areaServed: 'Worldwide',
    availableLanguage: ['English', 'Japanese'],
  },
  sameAs: [
    'https://www.linkedin.com/in/elio-bardho-2273a0231',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/listings?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Script
          id="schema-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <SpeedInsights />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E30KB03XNZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E30KB03XNZ');
          `}
        </Script>
      </body>
    </html>
  );
}
