import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripe webhook for subscription lifecycle.
// Configure in Stripe Dashboard with: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.

/**
 * `current_period_end` moved from the subscription onto its items in Stripe's
 * 2025-03-31 API version. Read whichever shape this account sends, and skip
 * the column entirely rather than writing an invalid date (which would throw,
 * 500, and leave Stripe retrying the event forever).
 */
function subscriptionPeriodEnd(subscription) {
  const seconds =
    subscription?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end;
  if (!Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false, autoRefreshToken: false } }
        )
      : null;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // user_id is now set server-side at checkout creation, so we can trust it.
        const userId = session.metadata?.userId || session.client_reference_id;

        if (!userId) {
          console.error('checkout.session.completed without userId — refusing to upsert');
          break;
        }

        if (supabase) {
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              status: 'active',
              email: session.customer_email,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        }

        if (process.env.RESEND_API_KEY) {
          const adminEmail = process.env.ADMIN_EMAIL || 'eliobardho7@gmail.com';
          const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
          const customerEmail = session.customer_email || 'unknown';
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `Yama Vista <${fromAddress}>`,
              to: [adminEmail],
              subject: `New Subscriber: ${customerEmail}`,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
  <h2>New Subscription</h2>
  <p><strong>Email:</strong> ${customerEmail}</p>
  <p><strong>Stripe Customer:</strong> ${session.customer || 'N/A'}</p>
  <p><strong>Subscription ID:</strong> ${session.subscription || 'N/A'}</p>
  <p style="color:#6b7280;font-size:12px;">Checkout session completed at ${new Date().toUTCString()}</p>
</div>`,
            }),
          }).catch((e) => console.error('Resend stripe notification error:', e));
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        if (supabase) {
          const update = { status: subscription.status };
          const periodEnd = subscriptionPeriodEnd(subscription);
          if (periodEnd) update.current_period_end = periodEnd;
          await supabase
            .from('subscriptions')
            .update(update)
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      default:
        // Unhandled events are normal; ignore.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
