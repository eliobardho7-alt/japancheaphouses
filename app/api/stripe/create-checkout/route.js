import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Founders' offer pricing structure
 * ─────────────────────────────────
 *   Month 1–2   →   $0   (Stripe-native trial via subscription_data.trial_period_days)
 *   Month 3–12  →   $1   (80% off via Stripe coupon, repeating 10 months)
 *   Month 13+   →   $5   (the underlying STRIPE_PRICE_ID rate kicks in)
 *
 * STRIPE_PROMO_COUPON_ID accepts: Coupon ID, Promotion Code ID (promo_...),
 * or a customer-facing code (looked up via API).
 */

const TRIAL_DAYS = 60;

async function buildDiscountParam(stripe, value) {
  if (!value) return null;
  if (value.startsWith('promo_')) return { promotion_code: value };
  if (/^[A-Z0-9_-]{1,30}$/i.test(value)) {
    try {
      const list = await stripe.promotionCodes.list({ code: value, active: true, limit: 1 });
      if (list.data.length) return { promotion_code: list.data[0].id };
    } catch {
      // Fall through to coupon-ID handling
    }
  }
  return { coupon: value };
}

export async function POST(request) {
  // Rate limit checkout creation
  const rl = rateLimit(request, { key: 'stripe-checkout', limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // CRITICAL: identify the user from the server-side session, NOT the request body.
  // Without this, anyone can assign a paid subscription to any user_id.
  let supabase;
  try {
    supabase = await getServerSupabase();
  } catch (error) {
    console.error('Supabase auth client error:', error.message);
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    console.error('Supabase auth lookup error:', error.message);
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to subscribe.' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Checkout is not configured' }, { status: 503 });
  }
  if (!process.env.STRIPE_PRICE_ID) {
    console.error('STRIPE_PRICE_ID is not set');
    return NextResponse.json({ error: 'Checkout is not configured' }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const siteUrl = getSiteUrl();

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        offer: 'founders_2026',
      },
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          userId: user.id,
          offer: 'founders_2026',
        },
      },
      billing_address_collection: 'auto',
      success_url: `${siteUrl}/community?success=true`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
    };

    // Apply founders' coupon / promotion code if configured
    const promoValue = process.env.STRIPE_PROMO_COUPON_ID;
    if (promoValue) {
      const discount = await buildDiscountParam(stripe, promoValue);
      if (discount) sessionParams.discounts = [discount];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    let msg = 'Could not start checkout';
    if (error.message?.includes('No such coupon') || error.message?.includes('No such promotion code')) {
      msg = 'Promotion code not found in this Stripe account. Check STRIPE_PROMO_COUPON_ID matches the right Stripe mode (test vs live).';
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
