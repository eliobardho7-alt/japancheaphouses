import Link from 'next/link';
import { FileText, MapPin, Scale, Coins, FileSignature, KeyRound, AlertTriangle } from 'lucide-react';
import GuideForm from './GuideForm';
import { GUIDE } from '@/lib/guide';

export const metadata = {
  title: "Free Guide: Buying a Home in Japan",
  description:
    "A free 29-slide buyer's guide to purchasing property in Japan — what foreigners can legally own, the real acquisition costs, seismic codes, road access rules, and the six findings that should end a deal on the spot.",
  alternates: { canonical: '/guide' },
  openGraph: {
    title: "Free Guide: Buying a Home in Japan",
    description:
      "29 slides on what you can legally own, what it really costs, and the six findings that should end a deal on the spot.",
    url: '/guide',
    type: 'article',
  },
};

const SECTIONS = [
  {
    icon: MapPin,
    number: '01',
    title: 'Orientation',
    body: 'Who may buy, what ownership does and does not give you, and the shape of the whole process.',
  },
  {
    icon: FileText,
    number: '02',
    title: 'What you are buying',
    body: 'Property types, the depreciation curve, land rights and the two seismic-code dates.',
  },
  {
    icon: Scale,
    number: '03',
    title: 'Land and law',
    body: 'Road frontage, zoning, hazard maps, title and the disclosure document that carries the truth.',
  },
  {
    icon: Coins,
    number: '04',
    title: 'The money',
    body: 'Closing costs, annual taxes, who can actually borrow, and renovation budgeting.',
  },
  {
    icon: FileSignature,
    number: '05',
    title: 'The transaction',
    body: 'Offer to handover, the clauses that protect you, inspection and settlement day.',
  },
  {
    icon: KeyRound,
    number: '06',
    title: 'After you own it',
    body: 'Living, renting, short-term letting limits, exit strategy and the deal-breaker summary.',
  },
];

const DEAL_BREAKERS = [
  'No legal road access — the plot cannot be rebuilt on',
  'Red-zone hazard land',
  'Title you cannot clear',
  'Structure beyond the budget',
  'Use you cannot have',
  'A seller who will not disclose',
];

export default function GuidePage() {
  return (
    <div className="pt-24">
      {/* Hero + form */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs text-brand-accent uppercase tracking-wider">
                Free download · {GUIDE.slides} slides
              </span>
              <h1 className="font-serif text-4xl md:text-5xl text-brand mt-3 mb-6 leading-tight">
                Buying a Home in Japan
              </h1>
              <p className="text-lg text-brand-gray mb-6">
                What you can legally own, what it really costs, and the six
                findings that should end a deal on the spot.
              </p>
              <p className="text-brand-gray mb-6">
                This guide is deliberately unromantic. Most people arrive
                excited about a cheap house and leave understanding that the
                land, the road and the paperwork decide everything. It is
                written for international buyers, and it is the same material we
                walk clients through before they spend money on a viewing trip.
              </p>

              <div className="bg-brand-light border-l-4 border-brand-accent p-6">
                <p className="text-brand font-medium mb-2">
                  Japan lets almost anyone buy. It does not let almost anyone
                  borrow.
                </p>
                <p className="text-sm text-brand-gray">
                  There is no nationality requirement and no permit needed to
                  own land outright. The constraint is the mortgage — and after
                  that, the condition of what you bought.
                </p>
              </div>
            </div>

            <div className="lg:sticky lg:top-28">
              <GuideForm />
            </div>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom">
          <h2 className="font-serif text-3xl text-brand mb-3">What&apos;s inside</h2>
          <p className="text-brand-gray mb-10 max-w-2xl">
            Six sections, {GUIDE.slides} slides, roughly 45 minutes of reading.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTIONS.map((section) => (
              <div
                key={section.number}
                className="bg-white border border-brand-border p-6 card-hover"
              >
                <section.icon className="h-8 w-8 text-brand-accent mb-3" />
                <span className="text-xs text-brand-gray">{section.number}</span>
                <h3 className="font-serif text-lg text-brand mb-2">{section.title}</h3>
                <p className="text-sm text-brand-gray">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deal breakers */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="flex items-start gap-4 mb-8">
            <AlertTriangle className="h-8 w-8 text-brand-accent shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-3xl text-brand mb-3">
                Six findings that should stop a purchase
              </h2>
              <p className="text-brand-gray">
                Everything else — dated kitchens, tired interiors, an awkward
                layout — is negotiable and priceable. These six are structural
                to the deal, and the guide explains how to find each one before
                you sign.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEAL_BREAKERS.map((item, idx) => (
              <li
                key={item}
                className="flex items-baseline gap-3 bg-brand-light p-4 text-sm text-brand-gray"
              >
                <span className="text-brand-accent font-medium">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* After the guide */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="font-serif text-3xl text-brand mb-4">
            Found a property you like?
          </h2>
          <p className="text-brand-gray mb-8">
            Send us the listing and we will check the road, the zoning, the
            hazard maps and the register before you spend money on a viewing
            trip.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/booking" className="btn-primary">
              Book a free consultation
            </Link>
            <Link href="/map" className="btn-secondary">
              Browse the listings map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
