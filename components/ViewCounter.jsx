'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

const ADMIN_EMAIL = 'eliobardho7@gmail.com';

const RPC_CONFIG = {
  listing: { rpc: 'increment_listing_view', arg: 'listing_id' },
  blog: { rpc: 'increment_blog_view', arg: 'blog_id' },
};

/**
 * Displays "N views" and increments the counter on first visit.
 *
 * - Admin views are NOT counted (so the admin can browse without inflating stats).
 * - sessionStorage suppresses refresh-spam within a tab.
 * - The RPC is `security definer`, so anonymous visitors can still increment
 *   without write access to the underlying table.
 */
export default function ViewCounter({ type, recordId, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount || 0);

  useEffect(() => {
    if (!supabase) return;
    const config = RPC_CONFIG[type];
    if (!config) return;

    let cancelled = false;

    async function maybeIncrement() {
      // Skip increment for the admin account
      try {
        const user = await getCurrentUser();
        if (user?.email === ADMIN_EMAIL) return;
      } catch {
        // If auth lookup fails, fall through and count the visit
      }
      if (cancelled) return;

      // Suppress refresh-spam within the same browser tab
      const key = `vc_${type}_${recordId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      const { data, error } = await supabase.rpc(config.rpc, { [config.arg]: recordId });
      if (error || cancelled) return;
      if (typeof data === 'number') setCount(data);
    }

    maybeIncrement();
    return () => { cancelled = true; };
  }, [type, recordId]);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-brand-gray">
      <Eye className="h-3 w-3" />
      {count.toLocaleString()} {count === 1 ? 'view' : 'views'}
    </span>
  );
}
