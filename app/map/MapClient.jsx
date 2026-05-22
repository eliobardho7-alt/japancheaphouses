'use client';

import dynamic from 'next/dynamic';

// Leaflet requires `window` — must be client-rendered only.
// Importing dynamic() with ssr:false has to happen from a Client Component in Next 16.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <p className="text-brand-gray">Loading map…</p>
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
