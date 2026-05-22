export const metadata = {
  title: 'Property Listings — Affordable Akiya & Houses in Japan',
  description:
    'Browse curated listings of affordable Japanese houses, akiya, and rare properties. From rural farmhouses to beachside villas, find your next investment in Japan.',
  alternates: { canonical: '/listings' },
  openGraph: {
    title: 'Property Listings — Japan Cheap Houses',
    description: 'Curated affordable property listings across Japan.',
    url: '/listings',
  },
};

export default function ListingsLayout({ children }) {
  return children;
}
