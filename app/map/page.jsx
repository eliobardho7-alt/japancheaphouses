import MapClient from './MapClient';

export const metadata = {
  title: 'Map — Explore Japan Real Estate by Region',
  description:
    'Interactive map of affordable Japanese akiya, houses, and properties across all prefectures. Browse listings by location. Free tier sees 5 listing detail pages per day; subscribers see unlimited.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Property Map — Japan Cheap Houses',
    description: 'Explore Japanese real estate listings on an interactive map.',
    url: '/map',
  },
};

export default function MapPage() {
  return <MapClient />;
}
