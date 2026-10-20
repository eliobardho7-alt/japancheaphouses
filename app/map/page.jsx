import MapClient from './MapClient';

export const metadata = {
  title: 'Map of Akiya & Cheap Houses in Japan',
  description:
    'Interactive map of affordable akiya and houses across every Japanese prefecture. Browse by location, see prices and land size. Free, no account needed.',
  alternates: { canonical: '/map' },
  openGraph: {
    images: ['/og-image.png'],
    title: 'Property Map — Japan Cheap Houses',
    description: 'Explore Japanese real estate listings on an interactive map.',
    url: '/map',
  },
};

export default function MapPage() {
  return (
    <>
      {/* The map itself is client-only (Leaflet needs `window`), so without
          this block a crawler sees an empty page. Server-rendered copy gives
          both search engines and a first-time visitor something to read while
          the map loads. */}
      <section className="pt-28 pb-8 bg-white">
        <div className="container-custom max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl text-brand mb-4 leading-tight">
            Map of akiya and cheap houses in Japan
          </h1>
          <p className="text-brand-gray mb-4">
            Every listing we track, plotted by location. Most are akiya —
            vacant homes left behind as Japan&apos;s rural population shrank —
            and many sell for less than the price of a used car. Prices, land
            and floor area are shown on every pin, free and without an account.
          </p>
          <p className="text-sm text-brand-gray">
            A cheap house is usually cheap for a findable reason: no legal road
            access, a hazard-zone designation, a leasehold, or a structure no
            lender will touch. Before you travel to see anything, we check the
            road, the zoning, the hazard maps and the register for free — and
            the{' '}
            <a href="/guide" className="underline hover:text-brand-accent">
              free buyer&apos;s guide
            </a>{' '}
            explains what to look for yourself.
          </p>
        </div>
      </section>
      <MapClient />
    </>
  );
}
