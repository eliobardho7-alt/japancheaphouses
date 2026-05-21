import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Routes that require authentication AND admin email match.
const ADMIN_MATCHER = ['/admin'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  const needsAdmin = ADMIN_MATCHER.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!needsAdmin) {
    return NextResponse.next();
  }

  // If Supabase isn't configured at all, lock /admin shut.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL('/login?error=admin_disabled', request.url));
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  }

  return res;
}

export const config = {
  // Match every /admin and /admin/* request.
  matcher: ['/admin/:path*'],
};
