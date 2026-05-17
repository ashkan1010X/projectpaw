'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PawPrint, Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Live countdown for rate-limit cooldown
  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left === 0) {
        setCooldownUntil(null);
        setError(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  function formatCooldown(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m} min`;
    return `${m} min ${s}s`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cooldownLeft > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // 429 — rate limited; surface countdown using Retry-After header
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10);
        setCooldownUntil(Date.now() + retryAfter * 1000);
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Too many requests. Try again shortly.');
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Something went wrong. Try again.');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const isRateLimited = cooldownLeft > 0;

  return (
    <div className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-doggy/[0.08] blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 py-2 font-pawprint text-xs font-semibold text-paw/60 transition-colors hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>

        <div className="mb-8 flex flex-col items-center gap-4 text-center animate-fade-down">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-paw/15 bg-paw/[0.05]">
            <PawPrint className="size-6 text-doggy" strokeWidth={1.5} />
          </div>
        </div>

        {sent ? (
          <div className="text-center animate-fade-up">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="size-7 text-emerald-400" strokeWidth={1.8} />
            </div>
            <h1 className="mb-3 font-elegant text-4xl font-black tracking-tight text-paw">
              Check your inbox
            </h1>
            <p className="mb-2 font-pawprint text-sm text-paw/65">
              We sent a password reset link to
            </p>
            <p className="mb-8 font-pawprint text-sm font-semibold text-paw">{email}</p>
            <p className="mb-8 font-pawprint text-xs text-paw/45">
              The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-paw/15 bg-paw/[0.04] px-6 font-pawprint text-sm font-semibold text-paw/80 transition-all duration-200 hover:border-paw/30 hover:bg-paw/[0.07] hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 animate-fade-up">
              <h1 className="font-elegant text-5xl font-black tracking-tight text-paw">
                Forgot <em className="not-italic text-doggy">password</em>?
              </h1>
              <p className="mt-3 font-pawprint text-sm text-paw/65">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 animate-fade-up delay-100"
              noValidate
            >
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

              {error && !isRateLimited && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in"
                >
                  <p className="font-pawprint text-sm text-red-400">{error}</p>
                </div>
              )}

              {isRateLimited && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 animate-fade-in"
                >
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-pawprint text-sm font-semibold text-amber-300">
                      Too many requests
                    </p>
                    <p className="mt-0.5 font-pawprint text-xs text-amber-300/80">
                      For your security, please wait{' '}
                      <span className="font-bold tabular-nums">{formatCooldown(cooldownLeft)}</span>{' '}
                      before requesting another reset link.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || isRateLimited}
                className="group relative mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 focus:outline-none focus:ring-2 focus:ring-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {loading ? (
                  <>
                    <Loader2 className="relative size-4 animate-spin" />
                    <span className="relative">Sending link...</span>
                  </>
                ) : isRateLimited ? (
                  <>
                    <Clock className="relative size-4" />
                    <span className="relative tabular-nums">
                      Try again in {formatCooldown(cooldownLeft)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative">Send reset link</span>
                    <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center font-pawprint text-sm leading-9 text-paw/55">
              Remembered it?{' '}
              <Link
                href="/login"
                className="-my-1 inline-flex min-h-9 items-center rounded-md px-2 py-2 font-bold text-doggy transition-colors hover:text-doggy/80 focus:outline-none focus:ring-2 focus:ring-doggy/30"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
