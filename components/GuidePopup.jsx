'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import GuideSignup from '@/components/GuideSignup';

// Bump the suffix to show the offer again to people who already dismissed it.
const STORAGE_KEY = 'jch_guide_popup_v1';
const DELAY_MS = 6000;

// Don't interrupt someone who is already converting, signing in, or working.
const SUPPRESSED_PREFIXES = ['/guide', '/login', '/signup', '/admin', '/pricing'];

export default function GuidePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Private mode or blocked storage — the popup simply shows again later.
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (SUPPRESSED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    let seen = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Treat unreadable storage as "not seen" rather than suppressing forever.
    }
    if (seen) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Close on Escape, and stop the page behind from scrolling while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-popup-title"
      onClick={dismiss}
    >
      <div
        className="bg-white border border-brand-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-brand-gray hover:text-brand transition-base"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <span className="text-xs text-brand-accent uppercase tracking-wider">
            Free download · 29 slides
          </span>
          <h2
            id="guide-popup-title"
            className="font-serif text-2xl md:text-3xl text-brand mt-2 mb-3 leading-tight"
          >
            Buying a Home in Japan
          </h2>
          <p className="text-brand-gray mb-6">
            What you can legally own, what it really costs, and the six findings
            that should end a deal on the spot. Free with a newsletter
            subscription.
          </p>

          <GuideSignup compact onSuccess={dismiss} />

          <button
            type="button"
            onClick={dismiss}
            className="block w-full text-center text-xs text-brand-gray hover:text-brand mt-4 transition-base"
          >
            No thanks, keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
