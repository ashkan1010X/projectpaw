'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Star } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface LoginResponse {
  user: { name: string; email?: string };
  token: string;
  refreshToken: string;
  message?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<LoginResponse>;

      if (!res.ok) {
        throw new Error(data.message ?? 'Login failed. Please check your credentials.');
      }

      if (!data.user || typeof data.token !== 'string' || typeof data.refreshToken !== 'string') {
        throw new Error('Unexpected response from server. Please try again.');
      }

      login(data.user, data.token, data.refreshToken);
      router.push('/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-5">
      {/* LEFT — Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-paw/[0.06] lg:col-span-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-1/3 size-[500px] rounded-full bg-doggy/[0.18] blur-[120px]" />
          <div className="absolute -right-32 bottom-1/4 size-[400px] rounded-full bg-[#F9D923]/[0.08] blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #F5CBA7 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <Link
          href="/"
          className="relative inline-flex items-center gap-2 font-elegant text-xl font-black text-paw"
        >
          <PawPrint className="size-5 text-doggy" strokeWidth={2.5} />
          ProjectPaw
        </Link>

        <div className="relative">
          <div className="mb-6 font-elegant text-7xl leading-none text-doggy/30">&ldquo;</div>
          <p className="font-elegant text-3xl font-bold italic leading-[1.3] text-paw">
            Because every wag deserves a reason.
          </p>
          <div className="mt-8 flex items-center gap-4 border-t border-paw/[0.08] pt-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark font-pawprint text-sm font-bold text-white shadow-lg">
              SM
            </div>
            <div>
              <p className="font-elegant font-bold text-paw">Sarah M.</p>
              <p className="font-pawprint text-sm text-paw/50">Golden Retriever mom</p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-[#F9D923] text-[#F9D923]" />
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-6 font-pawprint text-xs text-paw/40">
          <span>2,400+ happy dogs</span>
          <span className="h-1 w-1 rounded-full bg-paw/30" />
          <span>4.9 average rating</span>
          <span className="h-1 w-1 rounded-full bg-paw/30" />
          <span>Vetted pros</span>
        </div>
      </aside>

      {/* RIGHT — Form */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-16 lg:col-span-3">
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full bg-doggy/[0.06] blur-[100px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mark (mobile only) */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center lg:hidden animate-fade-down">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-paw/15 bg-paw/[0.05]">
              <PawPrint className="size-6 text-doggy" strokeWidth={1.5} />
            </div>
          </div>

          <div className="mb-8 animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/25 bg-[#F9D923]/[0.08] px-3 py-1">
              <Sparkles className="size-3 text-[#F9D923]" />
              <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9D923]">
                Welcome Back
              </span>
            </div>
            <h1 className="font-elegant text-5xl font-black tracking-tight text-paw">
              Sign <em className="not-italic text-doggy">in</em>.
            </h1>
            <p className="mt-2 font-pawprint text-sm text-paw/50">
              Pick up where you left off — your pup is waiting.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-up delay-100">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/50"
              >
                Email
              </label>
              <div className="group relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/30 transition-colors duration-300 group-focus-within:text-doggy"
                  strokeWidth={1.5}
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full rounded-xl border border-paw/[0.1] bg-paw/[0.03] py-3.5 pl-11 pr-4',
                    'font-pawprint text-sm text-paw placeholder:text-paw/25',
                    'outline-none transition-all duration-300',
                    'focus:border-doggy/60 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15',
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/50"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="-mr-2 inline-flex min-h-9 items-center rounded-md px-2 py-2 font-pawprint text-xs text-doggy/70 transition-colors hover:text-doggy focus:outline-none focus:ring-2 focus:ring-doggy/30"
                >
                  Forgot?
                </button>
              </div>
              <div className="group relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/30 transition-colors duration-300 group-focus-within:text-doggy"
                  strokeWidth={1.5}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border border-paw/[0.1] bg-paw/[0.03] py-3.5 pl-11 pr-11',
                    'font-pawprint text-sm text-paw placeholder:text-paw/25',
                    'outline-none transition-all duration-300',
                    'focus:border-doggy/60 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-paw/30 outline-none transition-colors duration-200 hover:text-paw/70 focus:ring-2 focus:ring-doggy/30"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="size-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in">
                <p className="font-pawprint text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && (
                <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </button>
          </form>

          <div className="relative my-8 flex items-center gap-4 animate-fade-in delay-200">
            <div className="h-px flex-1 bg-paw/[0.08]" />
            <span className="font-pawprint text-xs text-paw/35">or continue with</span>
            <div className="h-px flex-1 bg-paw/[0.08]" />
          </div>

          <div className="grid grid-cols-2 gap-3 animate-fade-up delay-300">
            <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-paw/[0.1] bg-paw/[0.03] py-3 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.06] hover:text-paw">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-paw/[0.1] bg-paw/[0.03] py-3 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.06] hover:text-paw">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="mt-8 text-center animate-fade-in delay-400">
            <p className="font-pawprint text-sm leading-9 text-paw/55">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="-my-1 inline-flex min-h-9 items-center rounded-md px-2 py-2 font-bold text-doggy transition-colors hover:text-doggy/80 focus:outline-none focus:ring-2 focus:ring-doggy/30"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
