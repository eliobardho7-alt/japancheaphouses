import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { rateLimit } from '@/lib/rate-limit';
import { verifyGuideToken, GUIDE } from '@/lib/guide';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve the buyer's guide to anyone holding a valid, unexpired token from
 * /api/guide/subscribe. The file itself lives outside public/, so this route
 * is the only way to get it.
 */
export async function GET(request) {
  const rl = rateLimit(request, { key: 'guide-download', limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = new URL(request.url).searchParams.get('t');
  const claim = verifyGuideToken(token);
  if (!claim) {
    return NextResponse.json(
      { error: 'This download link is invalid or has expired. Request a new one at /guide.' },
      { status: 403 }
    );
  }

  let file;
  try {
    file = await readFile(GUIDE.filePath);
  } catch (error) {
    console.error('Guide file unavailable:', error.message);
    return NextResponse.json({ error: 'The guide is temporarily unavailable.' }, { status: 503 });
  }

  return new NextResponse(file, {
    headers: {
      'Content-Type': GUIDE.contentType,
      'Content-Disposition': `attachment; filename="${GUIDE.downloadName}"`,
      'Content-Length': String(file.length),
      // Never let a shared cache hold a copy keyed on a single visitor's token.
      'Cache-Control': 'private, no-store',
    },
  });
}
