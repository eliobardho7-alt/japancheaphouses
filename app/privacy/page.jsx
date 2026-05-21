import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Yama Vista collects, uses, and protects information from visitors and customers.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = 'May 20, 2026';

export default function PrivacyPage() {
  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-brand-gray mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-neutral max-w-none text-brand-gray space-y-6 leading-relaxed">
            <p>
              Yama Vista (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates this site and provides real estate consulting services. This policy explains what information we collect, how we use it, and the choices you have.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Information we collect</h2>
            <p>We collect only what we need to deliver our services and respond to you:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Account data:</strong> name, email address, and password hash, stored via Supabase Auth when you create an account.</li>
              <li><strong>Booking and contact data:</strong> the name, email, phone (optional), and message you submit through our forms.</li>
              <li><strong>Newsletter data:</strong> the email address you provide when subscribing to our newsletter.</li>
              <li><strong>Payment data:</strong> handled entirely by Stripe. We never see or store your card details. We receive only a subscription status and a Stripe customer/subscription ID.</li>
              <li><strong>Technical data:</strong> standard server logs (IP address, user agent, request paths) and aggregated traffic insights via Vercel Speed Insights.</li>
            </ul>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">How we use it</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To respond to your inquiries and deliver the consultation, inspection, or property services you request.</li>
              <li>To send transactional emails (booking confirmations, account notifications) and, if you opt in, our newsletter.</li>
              <li>To operate the membership and gate premium content for active subscribers.</li>
              <li>To protect the service from abuse (rate limiting, anti-spam).</li>
            </ul>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Who we share it with</h2>
            <p>We don&apos;t sell your data. We share limited information with processors that help us run the service:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Supabase</strong> &mdash; account and form data storage.</li>
              <li><strong>Stripe</strong> &mdash; payment processing for subscriptions.</li>
              <li><strong>Resend</strong> &mdash; transactional email delivery.</li>
              <li><strong>Vercel</strong> &mdash; hosting and performance analytics.</li>
            </ul>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Cookies</h2>
            <p>
              We use first-party cookies that are strictly necessary for authentication (Supabase session) and for keeping the site running smoothly. We do not use advertising cookies.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Your choices</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You can request a copy of your data, correct it, or have it deleted by emailing <a href="mailto:eliobardho7@gmail.com" className="underline">eliobardho7@gmail.com</a>.</li>
              <li>You can unsubscribe from our newsletter at any time using the link in any email we send.</li>
              <li>You can cancel a subscription from your Stripe customer portal at any time.</li>
            </ul>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Data retention</h2>
            <p>
              We retain account data for as long as your account is active. Booking and contact submissions are retained for up to 36 months for record-keeping, unless you ask us to delete them sooner.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be posted on this page with a new &ldquo;Last updated&rdquo; date.
            </p>

            <h2 className="font-serif text-2xl text-brand mt-10 mb-3">Contact</h2>
            <p>
              Questions about this policy? <Link href="/contact" className="underline">Contact us</Link> or email <a href="mailto:eliobardho7@gmail.com" className="underline">eliobardho7@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
