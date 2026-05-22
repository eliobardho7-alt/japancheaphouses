import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripe webhook for subscription lifecycle.
// Configure in Stripe Dashboard with: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.

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
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        if (supabase) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
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
