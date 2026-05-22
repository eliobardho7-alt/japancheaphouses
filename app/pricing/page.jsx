'use client';

import Link from 'next/link';
import { Check, X, Sparkles, Clock, TrendingDown } from 'lucide-react';

export default function PricingPage() {
  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', userId: '' }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Sorry, there was a problem. Please try again.');
    }
  };

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
              Plans & Pricing
            </h1>
            <p className="text-brand-gray max-w-2xl mx-auto">
              Choose the right plan for your Japan real estate journey. Cancel anytime.
            </p>
          </div>

          {/* Founders' Offer Banner */}
          <div className="max-w-4xl mx-auto mb-16 bg-brand-accent text-white p-6 md:p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white text-brand-accent text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
              <Sparkles className="h-3 w-3" />
              Founders' Offer — Limited Time
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mb-2">
              First 2 months FREE → then just $1/month for 10 months
            </h2>
            <p className="text-white/90 text-sm md:text-base">
              Lock in this price for your first year. Cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free plan */}
            <div className="border-2 border-brand-border bg-white p-8">
              <h3 className="font-serif text-2xl text-brand mb-1">Free</h3>
              <p className="text-sm text-brand-gray mb-6">For browsers and the curious</p>

              <div className="mb-6">
                <span className="font-serif text-5xl text-brand">$0</span>
                <span className="text-brand-gray text-sm ml-2">forever</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                {[
                  { text: 'See every listing on the map', included: true },
                  { text: 'Browse free blog posts', included: true },
                  { text: 'Free initial consultation', included: true },
                  { text: 'Newsletter access', included: true },
                  { text: '5 listing views per day', included: 'limited' },
                  { text: 'See listing prices', included: false },
                  { text: 'Full property descriptions & photos', included: false },
                  { text: 'Premium listings', included: false },
                  { text: 'Community forum', included: false },
                  { text: 'Direct messaging & priority support', included: false },
                ].map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {f.included === true && <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
                    {f.included === false && <X className="h-4 w-4 text-brand-gray shrink-0 mt-0.5 opacity-40" />}
                    {f.included === 'limited' && <Check className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />}
                    <span className={f.included === false ? 'text-brand-gray opacity-60' : 'text-brand'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="block text-center w-full border border-brand text-brand py-3 text-sm font-medium hover:bg-brand hover:text-white transition-base"
              >
                Get Started
              </Link>
            </div>

            {/* Community plan — featured */}
            <div className="border-2 border-brand-accent bg-brand text-white p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-brand-accent text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                  Best Value
                </div>
              </div>

              <h3 className="font-serif text-2xl mb-1">Community</h3>
              <p className="text-sm text-white/70 mb-6">Full access to everything</p>

              {/* Pricing breakdown */}
              <div className="mb-6 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl">$0</span>
                  <span className="text-white/70 text-sm">/ month — first 2 months</span>
                </div>
                <div className="text-sm text-white/80 flex items-center gap-2">
                  <TrendingDown className="h-3 w-3" />
                  <span>then <strong className="text-white">$1/mo</strong> for the next 10 months</span>
                </div>
                <div className="text-xs text-white/60 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>then $5/mo standard rate</span>
                </div>
                <div className="mt-3 inline-block bg-white/10 text-xs px-3 py-1">
                  Total for year 1: only <strong>$10</strong>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                {[
                  'Unlimited daily listing views',
                  'See every listing price',
                  'Full property descriptions & photos',
                  'Premium-only listings',
                  'Community discussion forum',
                  'Direct messaging with members',
                  'Free 30-min consultation per quarter',
                  'Priority email support',
                  'Cancel anytime — no commitment',
                ].map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                className="block w-full bg-white text-brand py-3 text-sm font-medium hover:bg-brand-light transition-base"
              >
                Start Free — 2 Months on Us
              </button>
              <p className="text-xs text-white/60 text-center mt-3">
                No payment until day 60. Cancel during trial = no charge.
              </p>
            </div>
          </div>

          {/* Founders' Offer breakdown */}
          <div className="max-w-3xl mx-auto mt-16 bg-brand-light p-8">
            <h3 className="font-serif text-2xl text-brand mb-4 text-center">
              How the founders' offer works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm">
              <div>
                <div className="font-serif text-3xl text-brand-accent mb-2">$0</div>
                <p className="font-medium text-brand mb-1">Month 1 – 2</p>
                <p className="text-brand-gray text-xs">
                  Try everything completely free. No payment required up front.
                </p>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-accent mb-2">$1</div>
                <p className="font-medium text-brand mb-1">Month 3 – 12</p>
                <p className="text-brand-gray text-xs">
                  Reduced rate for the rest of your first year. Auto-billed monthly.
                </p>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-accent mb-2">$5</div>
                <p className="font-medium text-brand mb-1">Month 13+</p>
                <p className="text-brand-gray text-xs">
                  Standard rate kicks in. Cancel anytime through Stripe billing portal.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mt-16">
            <h3 className="font-serif text-2xl text-brand mb-6 text-center">
              Questions
            </h3>
            <div className="space-y-4 text-sm">
              {[
                {
                  q: 'Will I be charged during the 2-month free trial?',
                  a: 'No. You only enter a payment method to reserve your spot. Cancel before day 60 and you pay nothing.',
                },
                {
                  q: 'What happens after the first year?',
                  a: 'On month 13, the price changes to $5/month. You can cancel any time before that with no obligation.',
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes. Stripe handles all billing — you can cancel one-click from your account portal at any time.',
                },
                {
                  q: 'What happens to my access if I cancel?',
                  a: 'You keep access until the end of your billing period. After that, you drop back to the free tier (3 listing views per day, no prices, no premium content).',
                },
              ].map((item, idx) => (
                <details key={idx} className="border border-brand-border p-4 group">
                  <summary className="font-medium text-brand cursor-pointer flex justify-between items-center">
                    {item.q}
                    <span className="text-brand-accent group-open:rotate-45 transition-transform text-lg">+</span>
                  </summary>
                  <p className="text-brand-gray mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
