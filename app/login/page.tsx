'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PawPrint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Star,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
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
  const [authFailed, setAuthFailed] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Caps Lock detection while typing in any field
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (typeof e.getModifierState === 'function') {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthFailed(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<LoginResponse>;

      if (!res.ok) {
        if (res.status === 401) setAuthFailed(true);
        throw new Error(data.message ?? 'Login failed. Please check your credentials.');
      }

      if (!data.user || typeof data.token !== 'string' || typeof data.refreshToken !== 'string') {
        throw new Error('Unexpected response from server. Please try again.');
      }

      login(data.user, data.token, data.refreshToken);
      // Dashboard is the home base — new users see the onboarding checklist there,
      // returning users see their next appointment and stats.
      router.push('/dashboard');
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
              Sign <em className="not-italic text-doggy">in</em>
            </h1>
            <p className="mt-3 font-pawprint text-sm text-paw/65">
              Sign in to manage your bookings and your pup&apos;s profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-up delay-100" noValidate>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/60"
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
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
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
                  className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/60"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="-mr-2 inline-flex min-h-9 items-center rounded-md px-2 py-2 font-pawprint text-xs font-semibold text-doggy/80 transition-colors hover:text-doggy focus:outline-none focus:ring-2 focus:ring-doggy/30"
                >
                  Forgot password?
                </Link>
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
              {capsLockOn && password && (
                <div
                  role="status"
                  className="flex items-center gap-1.5 font-pawprint text-xs text-amber-400 animate-fade-in"
                >
                  <ShieldAlert className="size-3.5" />
                  Caps Lock is on
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-pawprint text-sm text-red-400">{error}</p>
                  {authFailed && (
                    <Link
                      href="/forgot-password"
                      className="mt-1 inline-block font-pawprint text-xs font-semibold text-red-300 underline underline-offset-2 hover:text-red-200"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 focus:outline-none focus:ring-2 focus:ring-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <Loader2 className="relative size-4 animate-spin" />
                  <span className="relative">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="relative">Sign In</span>
                  <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center font-pawprint text-sm leading-9 text-paw/55">
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
  );
}
