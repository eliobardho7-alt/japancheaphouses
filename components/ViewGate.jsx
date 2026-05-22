'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Clock } from 'lucide-react';
import { getCurrentUser, getUserSubscription } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';
const DAILY_VIEW_LIMIT = 5;
const STORAGE_KEY = 'jch_listing_views_v1';

/**
 * Wraps a listing detail page to enforce a daily-view cap on free users.
 *
 * Children are always rendered (so search engines index the full content),
 * but a fixed overlay covers the page if the visitor is over the limit.
 * Subscribers and the admin bypass the gate entirely.
 *
 * View tracking is in localStorage — soft paywall, not anti-piracy.
 */
export default function ViewGate({ listingId, children }) {
  const [blocked, setBlocked] = useState(false);
  const [resetAt, setResetAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      // Bypass for admin and subscribers
      try {
        const user = await getCurrentUser();
        if (user) {
          if (user.email === ADMIN_EMAIL) return;
          const sub = await getUserSubscription(user.id);
          if (sub) return;
        }
      } catch (e) {
        // If auth check fails, proceed with the free-tier gate (fail-safe).
      }

      if (cancelled) return;

      const today = new Date().toISOString().slice(0, 10);
      let log;
      try {
        log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch {
        log = {};
      }
      const viewed = log.date === today ? (log.viewed || []) : [];
      const idStr = String(listingId);

      // Same listing visited again today — free re-view, doesn't add to count.
      if (viewed.includes(idStr)) return;

      if (viewed.length >= DAILY_VIEW_LIMIT) {
        // Compute next-day reset for the countdown message
        const tomorrow = new Date();
        tomorrow.setUTCHours(24, 0, 0, 0);
        if (!cancelled) {
          setResetAt(tomorrow);
          setBlocked(true);
        }
        return;
      }

      // Record this view
      viewed.push(idStr);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, viewed })
      );
    }

    evaluate();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  return (
    <>
      {children}
      {blocked && (
        <div
          className="fixed inset-0 z-[2000] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 pt-24"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-brand-border shadow-xl max-w-md w-full p-8 text-center">
            <Lock className="h-12 w-12 text-brand-accent mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-brand mb-3">
              You've viewed your {DAILY_VIEW_LIMIT} listings for today
            </h2>
            <p className="text-brand-gray mb-6">
              Free visitors can browse {DAILY_VIEW_LIMIT} property pages per day.
              Subscribe for $5/month to see unlimited listings, full details, and exclusive properties.
            </p>

            <div className="space-y-3">
              <Link
                href="/pricing"
                className="btn-primary w-full block py-3"
              >
                Subscribe for $5/mo
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full block py-3"
              >
                Already a member? Sign in
              </Link>
            </div>

            {resetAt && (
              <p className="text-xs text-brand-gray mt-6 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Free limit resets in{' '}
                {Math.max(
                  1,
                  Math.ceil((resetAt.getTime() - Date.now()) / (1000 * 60 * 60))
                )}{' '}
                hours
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
