'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';

export default function PricingPage() {
  const handleSubscribe = async () => {
    // TODO: Implement Stripe checkout
    // Example:
    // const { createCheckoutSession } = await import('@/lib/stripe');
    // await createCheckoutSession(user.id, user.email);
    alert('Stripe integration needed - see lib/stripe.js and README.md');
  };

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Get started with basic access',
      features: [
        { text: 'Browse free listings', included: true },
        { text: 'Read public blog posts', included: true },
        { text: 'Free initial consultation', included: true },
        { text: 'Newsletter access', included: true },
        { text: 'Premium listings', included: false },
        { text: 'Community discussion access', included: false },
        { text: 'Direct messaging', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started',
      ctaHref: '/signup',
      featured: false,
    },
    {
      name: 'Community',
      price: '5',
      period: 'per month',
      description: 'Full access to listings and community',
      features: [
        { text: 'Browse free listings', included: true },
        { text: 'Read public blog posts', included: true },
        { text: 'Free initial consultation', included: true },
        { text: 'Newsletter access', included: true },
        { text: 'Premium listings (all)', included: true },
        { text: 'Community discussion access', included: true },
        { text: 'Direct messaging', included: true },
        { text: 'Priority support', included: true },
      ],
      cta: 'Subscribe Now',
      ctaHref: null,
      featured: true,
      action: handleSubscribe,
    },
  ];

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
              Plans & Pricing
            </h1>
            <p className="text-brand-gray max-w-2xl mx-auto">
              Choose the right plan for your Japan real estate journey. Cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 border-2 ${
                  plan.featured
                    ? 'border-brand-accent bg-brand text-white'
                    : 'border-brand-border bg-white'
                }`}
              >
                {plan.featured && (
                  <span className="absolute top-0 right-0 -translate-y-1/2 bg-brand-accent text-white text-xs px-3 py-1">
                    MOST POPULAR
                  </span>
                )}

                <h2
                  className={`font-serif text-3xl mb-2 ${
                    plan.featured ? 'text-white' : 'text-brand'
                  }`}
                >
                  {plan.name}
                </h2>
                <p
                  className={`text-sm mb-6 ${
                    plan.featured ? 'text-white/80' : 'text-brand-gray'
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span
                    className={`text-5xl font-serif ${
                      plan.featured ? 'text-white' : 'text-brand'
                    }`}
                  >
                    ${plan.price}
                  </span>
                  <span
                    className={`text-sm ml-2 ${
                      plan.featured ? 'text-white/80' : 'text-brand-gray'
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      {feature.included ? (
                        <Check
                          className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                            plan.featured ? 'text-white' : 'text-brand-accent'
                          }`}
                        />
                      ) : (
                        <X
                          className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                            plan.featured ? 'text-white/40' : 'text-gray-300'
                          }`}
                        />
                      )}
                      <span
                        className={
                          plan.featured
                            ? feature.included
                              ? 'text-white'
                              : 'text-white/40'
                            : feature.included
                            ? 'text-brand-gray'
                            : 'text-gray-400'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.action ? (
                  <button onClick={plan.action} className="btn-primary bg-white text-brand hover:bg-brand-light w-full">
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`block text-center w-full px-6 py-3 text-sm font-medium tracking-wide transition-base ${
                      plan.featured
                        ? 'bg-white text-brand hover:bg-brand-light'
                        : 'bg-brand text-white hover:bg-opacity-90'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mt-24">
            <h2 className="font-serif text-3xl text-brand text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe, our secure payment processor.',
                },
                {
                  q: 'Are the listings exclusive?',
                  a: 'Yes, our premium listings are sourced through our network of local Japanese contacts and not available on mainstream platforms.',
                },
                {
                  q: 'Do I get a refund if I cancel?',
                  a: 'We do not offer refunds, but you can cancel anytime to prevent future charges.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="border-b border-brand-border pb-6">
                  <h3 className="font-serif text-lg text-brand mb-2">{faq.q}</h3>
                  <p className="text-sm text-brand-gray">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
