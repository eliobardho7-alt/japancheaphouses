import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { rateLimit } from '@/lib/rate-limit';
import { verifyGuideToken, GUIDE_FORMATS, DEFAULT_FORMAT } from '@/lib/guide';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve the buyer's guide to anyone holding a valid, unexpired token from
 * /api/guide/subscribe. Both files live outside public/, so this route is the
 * only way to get them.
 *
 * ?f=pdf (default) or ?f=pptx. If the requested format isn't on disk we fall
 * back to the other rather than failing — a missing PDF should degrade to the
 * PowerPoint, not to an error page.
 */
export async function GET(request) {
  const rl = rateLimit(request, { key: 'guide-download', limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const url = new URL(request.url);
  const claim = verifyGuideToken(url.searchParams.get('t'));
  if (!claim) {
    return NextResponse.json(
      { error: 'This download link is invalid or has expired. Request a new one at /guide.' },
      { status: 403 }
    );
  }

  const requested = url.searchParams.get('f');
  const preference = GUIDE_FORMATS[requested] ? requested : DEFAULT_FORMAT;
  const order = [preference, ...Object.keys(GUIDE_FORMATS).filter((k) => k !== preference)];

  for (const key of order) {
    const format = GUIDE_FORMATS[key];
    let file;
    try {
      file = await readFile(format.filePath);
    } catch {
      continue; // not shipped in this build; try the next format
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': format.contentType,
        'Content-Disposition': `attachment; filename="${format.downloadName}"`,
        'Content-Length': String(file.length),
        // Never let a shared cache hold a copy keyed on a single visitor's token.
        'Cache-Control': 'private, no-store',
      },
    });
  }

  console.error('Guide download failed: no format available on disk');
  return NextResponse.json({ error: 'The guide is temporarily unavailable.' }, { status: 503 });
}
