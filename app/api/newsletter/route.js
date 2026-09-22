import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/escape-html';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeEmail, storeSubscriber, notifyAdminOfSubscriber } from '@/lib/newsletter';

export async function POST(request) {
  const rl = rateLimit(request, { key: 'newsletter', limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { email, website } = body || {};
    if (website) return NextResponse.json({ success: true }); // honeypot

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);

    // Unlike the guide form, this one is collection-only: if the store fails
    // we still report success rather than making the visitor retry, because
    // nothing is being handed over in exchange.
    await storeSubscriber(normalized);
    await notifyAdminOfSubscriber(normalized, 'footer newsletter form');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
