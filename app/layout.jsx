import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

export const metadata = {
  title: 'Yama Vista | Japan Real Estate Consulting',
  description:
    'Discover affordable and rare properties in Japan. Specialized in akiya homes, property management, and real estate consulting for international investors.',
  keywords: 'Japan real estate, akiya, property investment, Tokyo properties, Japan houses, real estate consulting',
  openGraph: {
    title: 'Yama Vista | Japan Real Estate Consulting',
    description: 'Discover affordable and rare properties in Japan with expert consulting.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
