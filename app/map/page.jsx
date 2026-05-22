import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Map — Explore Japan Real Estate by Region',
  description:
    'Interactive map of affordable Japanese akiya, houses, and properties across all prefectures. Browse listings by location. Free tier sees up to 5 listings per prefecture; subscribers see unlimited.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Property Map — Japan Cheap Houses',
    description: 'Explore Japanese real estate listings on an interactive map.',
    url: '/map',
  },
};

// Leaflet requires `window` — must be client-rendered only.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <p className="text-brand-gray">Loading map…</p>
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}
