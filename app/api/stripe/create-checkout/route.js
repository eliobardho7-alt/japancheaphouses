import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  // Rate limit checkout creation
  const rl = rateLimit(request, { key: 'stripe-checkout', limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json(
      { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel environment variables.' },
      { status: 500 }
    );
  }
  if (!process.env.STRIPE_PRICE_ID) {
    console.error('STRIPE_PRICE_ID is not set');
    return NextResponse.json(
      { error: 'Stripe price not configured. Add STRIPE_PRICE_ID to Vercel environment variables.' },
      { status: 500 }
    );
  }

  // CRITICAL: identify the user from the server-side session, NOT the request body.
  // Without this, anyone can assign a paid subscription to any user_id.
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to subscribe.' }, { status: 401 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://japancheaphouses.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      // Trusted, server-derived identifiers only.
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
      success_url: `${siteUrl}/community?success=true`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
