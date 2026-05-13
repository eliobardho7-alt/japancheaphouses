'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/booking', label: 'Free Initial Consultation' },
    { href: '/services', label: 'Services' },
    { href: '/pricing', label: 'Plans & Pricing' },
  ];

  const moreLinks = [
    { href: '/blog', label: 'Blog & Listings' },
    { href: '/community', label: 'Community' },
  ];

  const footerLinks = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-base ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Yama Vista"
              width={70}
              height={70}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand hover:text-brand-accent transition-base"
              >
                {link.label}
              </Link>
            ))}

            {/* More Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowMoreMenu(true)}
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <button className="flex items-center text-sm font-medium text-brand hover:text-brand-accent transition-base">
                More
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg border border-brand-border animate-slide-down">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-3 text-sm text-brand hover:bg-brand-light transition-base"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-brand-border">
                    {footerLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-3 text-sm text-brand hover:bg-brand-light transition-base"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <select className="text-sm border border-brand-border px-3 py-1.5 bg-white text-brand cursor-pointer hover:border-brand transition-base">
              <option value="en">EN</option>
              <option value="ja">JP</option>
            </select>

            {/* Login / Account */}
            <Link
              href="/login"
              className="flex items-center text-sm font-medium text-brand hover:text-brand-accent transition-base"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-brand-border py-4 animate-slide-down">
            <div className="flex flex-col space-y-3">
              {[...navLinks, ...moreLinks, ...footerLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-brand hover:text-brand-accent transition-base px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="text-sm font-medium text-brand hover:text-brand-accent transition-base px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Login / Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
