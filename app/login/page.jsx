'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/supabase';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const urlError =
    searchParams.get('error') === 'unauthorized'
      ? 'That account does not have admin access. Sign in with the admin email.'
      : searchParams.get('error') === 'admin_disabled'
      ? 'Admin access is not configured.'
      : '';
  const [error, setError] = useState(urlError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const redirect = searchParams.get('redirect');
      const dest = redirect && redirect.startsWith('/') ? redirect : '/community';
      // Hard navigation (not router.push) so the freshly-set auth cookie is
      // sent on the next request — required for the /admin proxy guard to see
      // the session instead of bouncing back to /login.
      window.location.assign(dest);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center bg-brand-light">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white border border-brand-border p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-brand mb-2">Welcome Back</h1>
            <p className="text-sm text-brand-gray">
              Sign in to access your account and community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-brand-gray mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-brand-gray">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-accent hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <p className="text-sm text-brand-gray text-center mt-6">
            New to Yama Vista?{' '}
            <Link href="/signup" className="text-brand-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
