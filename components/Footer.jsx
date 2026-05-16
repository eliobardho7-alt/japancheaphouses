'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Mail, Instagram, Linkedin, Twitter } from 'lucide-react';

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
              src="/logo.png"
              alt="Yama Vista"
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

            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.linkedin.com/in/elio-bardho-2273a0231"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-brand-gray hover:text-brand-accent transition-base"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
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
            © {new Date().getFullYear()} Yama Vista Real Estate Consulting. All rights reserved.
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
