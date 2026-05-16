import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel environment variables.' },
      { status: 500 }
    );
  }

  if (!process.env.STRIPE_PRICE_ID) {
    console.error('STRIPE_PRICE_ID is not set in environment variables');
    return NextResponse.json(
      { error: 'Stripe price not configured. Add STRIPE_PRICE_ID to Vercel environment variables.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { userId, email } = await request.json();
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
      customer_email: email || undefined,
      metadata: {
        userId: userId || '',
      },
      success_url: `${siteUrl}/community?success=true`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
    });

    console.log('Stripe checkout session created:', session.id);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
