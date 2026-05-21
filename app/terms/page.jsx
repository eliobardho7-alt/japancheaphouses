import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of Yama Vista and the services we offer.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = 'May 20, 2026';

export default function TermsPage() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-brand-gray mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-neutral max-w-none text-brand-gray space-y-6 leading-relaxed">
            <p>
              By using Yama Vista (the &ldquo;Service&rdquo;) you agree to these Terms. Please read them carefully. If you do not agree, do not use the Service.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Who we are</h2>
            <p>
              Yama Vista is an independent real estate consulting service operated by Elio Bardho, based in Japan, that helps international buyers research, evaluate, purchase, renovate, and manage Japanese property.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Accounts</h2>
            <p>
              You are responsible for keeping your login credentials confidential and for activity that happens on your account. You must be at least 18 years old to create an account. You agree to provide accurate information and to update it when it changes.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Subscriptions and payments</h2>
            <p>
              Paid plans are billed monthly via Stripe at the price displayed on the <Link href="/pricing" className="underline">pricing page</Link>. Subscriptions renew automatically until cancelled. You can cancel at any time and will retain access through the end of the current billing period. We do not offer refunds for partial periods.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Listings and information</h2>
            <p>
              Property listings, blog posts, market data, and other content on this site are provided for general informational purposes only. They are <strong>not</strong> an offer to sell, a binding quote, or financial, legal, or tax advice. Property availability, condition, and pricing can change at any time. You should perform your own due diligence and consult qualified professionals before making any purchase.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Consulting services</h2>
            <p>
              Bookings made through the site are subject to availability. We&apos;ll do our best to honour the scheduled time, but we may need to reschedule. Consultation outputs (recommendations, summaries, introductions) are best-effort and based on the information you share with us.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Service to break any law or to harm anyone.</li>
              <li>Scrape, copy, or republish our listings, blog posts, or community content without permission.</li>
              <li>Attempt to gain unauthorised access to other accounts, the admin area, or our infrastructure.</li>
              <li>Abuse our forms or APIs (spam, denial of service, automated abuse).</li>
            </ul>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Intellectual property</h2>
            <p>
              The Yama Vista name, logo, site design, written content, and curated listings belong to us. You may share short excerpts with attribution and a link back, but you may not reproduce the content in full.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">No warranty; limitation of liability</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, Yama Vista is not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the twelve months before the claim.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Termination</h2>
            <p>
              We may suspend or terminate your access if you violate these Terms. You can stop using the Service at any time. Sections that by their nature should survive termination (intellectual property, limitations of liability, governing law) will survive.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Governing law</h2>
            <p>
              These Terms are governed by the laws of Japan. Any dispute will be resolved in the courts of Tokyo, Japan, unless local consumer-protection law gives you a non-waivable right to a different forum.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Changes</h2>
            <p>
              We may update these Terms. We&apos;ll post the new version here with an updated date. Continued use of the Service after a change means you accept the updated Terms.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Contact</h2>
            <p>
              Questions? <Link href="/contact" className="underline">Contact us</Link> or email <a href="mailto:eliobardho7@gmail.com" className="underline">eliobardho7@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
