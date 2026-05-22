import { NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Founders' offer pricing
 * ───────────────────────
 *   Month 1–2   →   $0   (Stripe-native trial via subscription_data.trial_period_days)
 *   Month 3–12  →   $1   (80% off the $5 base — Stripe coupon, repeating 10 months)
 *   Month 13+   →   $5   (the underlying STRIPE_PRICE_ID rate kicks in after coupon expires)
 *
 * STRIPE_PROMO_COUPON_ID accepts any of:
 *   - Coupon ID            (e.g. "AbC12345")
 *   - Promotion Code ID    (e.g. "promo_1ABC...")
 *   - Customer-facing code (e.g. "FOUNDERS") — we look up its promotion_code ID via API
 */

const TRIAL_DAYS = 60;

async function buildDiscountParam(stripe, value) {
  if (!value) return null;

  // Promotion Code IDs always start with "promo_"
  if (value.startsWith('promo_')) {
    return { promotion_code: value };
  }

  // If it looks like a customer-facing code (alphanumeric, short, no special chars),
  // try to resolve it to a promotion_code ID via API first
  if (/^[A-Z0-9_-]{1,30}$/i.test(value)) {
    try {
      const list = await stripe.promotionCodes.list({
        code: value,
        active: true,
        limit: 1,
      });
      if (list.data.length) {
        return { promotion_code: list.data[0].id };
      }
    } catch (e) {
      // Fall through to treating as a coupon ID
    }
  }

  // Default: treat as a raw Coupon ID
  return { coupon: value };
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel environment variables.' },
      { status: 500 }
    );
  }
  if (!process.env.STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: 'Stripe price not configured. Add STRIPE_PRICE_ID to Vercel environment variables.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { userId, email } = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.japancheaphouses.com';

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email || undefined,
      metadata: {
        userId: userId || '',
        offer: 'founders_2024',
      },
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          userId: userId || '',
          offer: 'founders_2024',
        },
      },
      billing_address_collection: 'auto',
      success_url: `${siteUrl}/community?success=true`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
    };

    // Resolve the discount param — handles coupons, promo codes, and customer codes
    const promoValue = process.env.STRIPE_PROMO_COUPON_ID;
    if (promoValue) {
      const discount = await buildDiscountParam(stripe, promoValue);
      if (discount) {
        sessionParams.discounts = [discount];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);

    // Friendlier error for the common coupon mis-config case
    let msg = error.message;
    if (msg.includes('No such coupon') || msg.includes('No such promotion code')) {
      msg =
        'The configured promotion code/coupon was not found in this Stripe account. ' +
        'Check that STRIPE_PROMO_COUPON_ID matches a coupon or promotion code in the ' +
        'correct Stripe mode (test vs live).';
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
