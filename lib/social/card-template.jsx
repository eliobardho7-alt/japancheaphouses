import { CARD_FORMATS, formatLocation, formatSpecs, formatYen, formatUsd } from '@/lib/social/post-content';

const BRAND = '#1a1a1a';
const ACCENT = '#8B0000';
const LIGHT = '#f8f7f4';
const GRAY = '#6b7280';
const GOLD = '#c8a96e';

/**
 * The post card, as a React element tree for satori (next/og).
 *
 * Kept separate from the route so it can be rendered without an admin session
 * when checking the layout. Satori is strict: every element with more than one
 * child needs an explicit display value, hence display:flex almost everywhere.
 *
 * Built from listing DATA, not the scraped photographs — those are hot-linked
 * from municipal akiya sites, and republishing them to a social platform is a
 * different matter from showing them on our own pages.
 */
export function buildCardElement(listing, formatKey = 'square') {
  const format = CARD_FORMATS[formatKey] ? formatKey : 'square';
  const { width, height } = CARD_FORMATS[format];

  const yen = formatYen(listing.price_jpy);
  const usd = formatUsd(listing.price_usd);
  const location = formatLocation(listing);
  const specs = formatSpecs(listing);
  const grossYield = Number.isFinite(Number(listing.estimated_gross_yield))
    ? `${Number(listing.estimated_gross_yield).toFixed(1)}% est. gross yield`
    : null;

  const tall = height > width;
  const pad = tall ? 96 : 84;

  const chips = [...specs.map((s) => ({ text: s, accent: false }))];
  if (grossYield) chips.push({ text: grossYield, accent: true });

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: LIGHT,
        color: BRAND,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: BRAND,
          color: '#ffffff',
          padding: `${tall ? 40 : 32}px ${pad}px`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, letterSpacing: 8, fontWeight: 600 }}>
          YAMA VISTA
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: GOLD, letterSpacing: 2 }}>
          japancheaphouses.com
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'center',
          padding: `${pad}px`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: ACCENT, letterSpacing: 4 }}>
          FOR SALE IN JAPAN
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: tall ? 140 : 118,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 24,
          }}
        >
          {yen || 'Price on application'}
        </div>

        {usd ? (
          <div style={{ display: 'flex', fontSize: 40, color: GRAY, marginTop: 12 }}>
            around {usd}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            width: 140,
            height: 6,
            backgroundColor: ACCENT,
            marginTop: tall ? 56 : 40,
            marginBottom: tall ? 56 : 40,
          }}
        />

        <div style={{ display: 'flex', fontSize: tall ? 62 : 54, lineHeight: 1.2 }}>
          {location}
        </div>

        {chips.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 40 }}>
            {chips.map((chip) => (
              <div
                key={chip.text}
                style={{
                  display: 'flex',
                  fontSize: 32,
                  marginRight: 16,
                  marginBottom: 16,
                  padding: '14px 24px',
                  color: chip.accent ? '#ffffff' : BRAND,
                  backgroundColor: chip.accent ? ACCENT : '#ffffff',
                  border: chip.accent ? `2px solid ${ACCENT}` : '2px solid #e5e7eb',
                }}
              >
                {chip.text}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '2px solid #e5e7eb',
          padding: `${tall ? 44 : 34}px ${pad}px`,
          fontSize: 28,
          color: GRAY,
        }}
      >
        <div style={{ display: 'flex' }}>Road access · zoning · hazard checks — free</div>
        <div style={{ display: 'flex', color: BRAND }}>Listing #{String(listing.id)}</div>
      </div>
    </div>
  );
}
