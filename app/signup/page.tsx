'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface RegisterResponse {
  user: { name: string; email?: string };
  token: string;
  message?: string;
}

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<RegisterResponse>;

      if (!res.ok) {
        throw new Error(data.message ?? 'Registration failed. Please try again.');
      }

      if (!data.user || typeof data.token !== 'string') {
        throw new Error('Unexpected response from server. Please try again.');
      }

      login(data.user, data.token);
      router.push('/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0d09] px-4 py-16">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-doggy/8 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-paw/10 bg-paw/[0.05]">
            <PawPrint className="size-7 text-doggy" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-elegant text-3xl font-black text-paw">Join ProjectPaw</h1>
            <p className="mt-1 font-pawprint text-sm text-paw/50">
              Create your free account today
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-paw/10 bg-paw/[0.03] p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-pawprint text-xs font-semibold uppercase tracking-wider text-paw/50">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-paw/30" strokeWidth={1.5} />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={cn(
                    'w-full rounded-xl border border-paw/10 bg-paw/[0.04] py-3 pl-11 pr-4',
                    'font-pawprint text-sm text-paw placeholder:text-paw/25',
                    'outline-none transition-all duration-200',
                    'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-pawprint text-xs font-semibold uppercase tracking-wider text-paw/50">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-paw/30" strokeWidth={1.5} />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full rounded-xl border border-paw/10 bg-paw/[0.04] py-3 pl-11 pr-4',
                    'font-pawprint text-sm text-paw placeholder:text-paw/25',
                    'outline-none transition-all duration-200',
                    'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-pawprint text-xs font-semibold uppercase tracking-wider text-paw/50">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-paw/30" strokeWidth={1.5} />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border border-paw/10 bg-paw/[0.04] py-3 pl-11 pr-4',
                    'font-pawprint text-sm text-paw placeholder:text-paw/25',
                    'outline-none transition-all duration-200',
                    'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
                  )}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="font-pawprint text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-200 hover:bg-doggy/90 hover:shadow-doggy/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : (
                <>
                  Create Account
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Perks */}
          <div className="mt-6 flex justify-center gap-6 border-t border-paw/8 pt-6">
            {['Free to join', 'Cancel anytime', 'Email confirmations'].map((perk) => (
              <span key={perk} className="font-pawprint text-xs text-paw/30">✓ {perk}</span>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="font-pawprint text-sm text-paw/40">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-doggy transition-colors hover:text-doggy/80"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
