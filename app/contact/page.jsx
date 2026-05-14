'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState('');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) throw new Error('Failed to send');

      setContactStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setContactStatus(''), 5000);
    } catch (error) {
      setContactStatus('error');
      setTimeout(() => setContactStatus(''), 5000);
    }
  };

  return (
    <div className="pt-24">
      {/* Header */}
      <section className="section-padding bg-white border-b border-brand-border">
        <div className="container-custom">
          <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">
            Get in Touch
          </h1>
          <p className="text-brand-gray max-w-2xl">
            Have questions? Want to book a consultation? Or just want to chat about Japan real
            estate? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-brand-border p-8 text-center">
              <Mail className="h-8 w-8 text-brand-accent mx-auto mb-4" />
              <h3 className="font-serif text-lg text-brand mb-2">Email</h3>
              <a
                href="mailto:eliobardho7@gmail.com"
                className="text-sm text-brand-gray hover:text-brand-accent transition-base"
              >
                eliobardho7@gmail.com
              </a>
            </div>
            <div className="bg-white border border-brand-border p-8 text-center">
              <Clock className="h-8 w-8 text-brand-accent mx-auto mb-4" />
              <h3 className="font-serif text-lg text-brand mb-2">Response Time</h3>
              <p className="text-sm text-brand-gray">
                We typically respond within 24 hours
              </p>
            </div>
            <div className="bg-white border border-brand-border p-8 text-center">
              <MapPin className="h-8 w-8 text-brand-accent mx-auto mb-4" />
              <h3 className="font-serif text-lg text-brand mb-2">Operating in</h3>
              <p className="text-sm text-brand-gray">Japan, Korea, and other Asian markets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Layout: Booking + Contact Form */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Free Consultation */}
            <div>
              <h2 className="font-serif text-3xl text-brand mb-6">Schedule a Free Consultation</h2>
              <p className="text-brand-gray mb-6">
                Ready to explore Japan real estate opportunities? Book a free 45-minute consultation
                with our team. We'll discuss your goals, answer your questions, and outline the next
                steps.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-serif text-brand mb-1">Personalized Guidance</h4>
                    <p className="text-sm text-brand-gray">
                      We discuss your specific goals and investment timeline.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-serif text-brand mb-1">Zero Commitment</h4>
                    <p className="text-sm text-brand-gray">
                      No obligation. Just honest advice from experienced investors.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-serif text-brand mb-1">Local Expertise</h4>
                    <p className="text-sm text-brand-gray">
                      We know Japan's market inside and out.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/booking"
                className="block btn-primary text-center w-full"
              >
                Book Your Free Consultation
              </Link>

              <p className="text-xs text-brand-gray text-center mt-4">
                Takes 2 minutes. Available Monday–Friday, 8 AM–6 PM JST.
              </p>
            </div>

            {/* Right: General Contact Form */}
            <div>
              <h2 className="font-serif text-3xl text-brand mb-6">Send us a Message</h2>
              <p className="text-brand-gray mb-6">
                Have a question that doesn't require a full consultation? Want to inquire about
                something specific? Fill out the form below and we'll get back to you as soon as
                possible.
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-brand-gray mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-brand-gray mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, subject: e.target.value })
                    }
                    placeholder="e.g., Question about property management"
                    className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-brand-gray mb-1">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, message: e.target.value })
                    }
                    placeholder="Tell us what you're interested in..."
                    className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactStatus === 'sending'}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {contactStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                {contactStatus === 'success' && (
                  <p className="text-sm text-green-600 text-center">
                    Thank you! We'll be in touch soon.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom max-w-3xl">
          <h2 className="font-serif text-3xl text-brand text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How quickly can you respond to inquiries?',
                a: 'We typically respond to all inquiries within 24 hours. For urgent matters, please mention it in your message.',
              },
              {
                q: 'Do you offer consultations in languages other than English?',
                a: 'We primarily work in English and Japanese. If you need translation assistance, please let us know and we will do our best to help.',
              },
              {
                q: 'What time zone are you in?',
                a: 'We operate in Japan Standard Time (JST, UTC+9). Our consultation hours are Monday-Friday, 8 AM-6 PM JST.',
              },
              {
                q: 'Can I contact you on weekends?',
                a: 'You can submit a form anytime, but we respond to messages Monday-Friday. For urgent matters, mention it in your message and we will prioritize it.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-brand-border pb-6 last:border-b-0">
                <h3 className="font-serif text-lg text-brand mb-2">{faq.q}</h3>
                <p className="text-sm text-brand-gray">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
