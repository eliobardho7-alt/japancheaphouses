import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Routes that require authentication AND admin email match.
const ADMIN_MATCHER = ['/admin'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  const needsAdmin = ADMIN_MATCHER.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!needsAdmin) {
    return NextResponse.next();
  }

  // Send the user back to where they were headed after a successful login.
  const loginUrl = (params) => {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url;
  };

  // If Supabase isn't configured at all, lock /admin shut.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(loginUrl({ error: 'admin_disabled' }));
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // getUser() revalidates the token with Supabase. getSession() only decodes
  // the cookie, which the client controls — never authorize on it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  const norm = (e) => String(e || '').trim().toLowerCase();

  if (!user || !adminEmail || norm(user.email) !== norm(adminEmail)) {
    return NextResponse.redirect(loginUrl({ error: 'unauthorized' }));
  }

  return res;
}

export const config = {
  // Match every /admin and /admin/* request.
  matcher: ['/admin/:path*'],
};
