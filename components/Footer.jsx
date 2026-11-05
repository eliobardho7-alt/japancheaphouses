'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Mail, Linkedin, Instagram } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to subscribe');

      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-white border-t border-brand-border">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="lg:col-span-1">
            <Image
              src="/logo.svg"
              alt="Japan Cheap Houses"
              width={120}
              height={120}
              className="h-24 w-auto mb-4"
            />
            <p className="text-sm text-brand-gray leading-relaxed">
              Your trusted partner in discovering unique and affordable real estate
              opportunities across Japan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg mb-4 text-brand">Explore</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/services', label: 'Services' },
                { href: '/booking', label: 'Book a Consultation' },
                { href: '/blog', label: 'Blog & Listings' },
                { href: '/community', label: 'Community' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-gray hover:text-brand-accent transition-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg mb-4 text-brand">Contact</h4>
            <ul className="space-y-2 text-sm text-brand-gray">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:eliobardho7@gmail.com"
                  className="hover:text-brand-accent transition-base"
                >
                  eliobardho7@gmail.com
                </a>
              </li>
            </ul>

            {/* Brand social profiles (@japancheaphouses) plus Elio's LinkedIn. */}
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.instagram.com/japancheaphouses/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="Instagram — @japancheaphouses"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@japancheaphouses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="TikTok — @japancheaphouses"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/elio-bardho-2273a0231"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg mb-4 text-brand">Subscribe to Our Newsletter</h4>
            <p className="text-sm text-brand-gray mb-4">
              Get the latest listings and Japan real estate insights.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              {/* Honeypot field — invisible to humans, bots fill it */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-brand-border focus:border-brand outline-none text-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary text-xs"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
              {status === 'success' && (
                <p className="text-xs text-green-600">Thanks for subscribing!</p>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-600">Something went wrong. Try again.</p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-brand-gray">
            © {CURRENT_YEAR} Japan Cheap Houses. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-xs text-brand-gray hover:text-brand-accent transition-base"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-brand-gray hover:text-brand-accent transition-base"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
