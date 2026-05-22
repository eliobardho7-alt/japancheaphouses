'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { signUp } from '@/lib/supabase';

const MIN_PASSWORD_LENGTH = 10;

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    // Encourage some character variety. Not foolproof — Supabase Auth should
    // also have a min-length policy set on the dashboard.
    const variety =
      /[a-z]/.test(formData.password) +
      /[A-Z]/.test(formData.password) +
      /[0-9]/.test(formData.password) +
      /[^A-Za-z0-9]/.test(formData.password);
    if (variety < 2) {
      setError('Password must include at least two of: lowercase, uppercase, numbers, symbols.');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.fullName);
      router.push('/community');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center bg-brand-light py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white border border-brand-border p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-brand mb-2">Create an Account</h1>
            <p className="text-sm text-brand-gray">Join Yama Vista and start exploring properties.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>
            )}

            <div>
              <label className="block text-xs text-brand-gray mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-brand-gray mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-brand-gray mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-brand-gray mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            <p className="text-xs text-brand-gray text-center">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-sm text-brand-gray text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
