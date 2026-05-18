'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, Lock, Eye, EyeOff, Loader2, CheckCircle2, Circle, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isPasswordPwned } from '@/lib/hibp';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // HIBP live check
  const [hibpStatus, setHibpStatus] = useState<'idle' | 'checking' | 'safe' | 'pwned'>('idle');
  const [hibpBreachCount, setHibpBreachCount] = useState(0);

  useEffect(() => {
    if (password.length < 8) {
      setHibpStatus('idle');
      return;
    }
    setHibpStatus('checking');
    const handle = setTimeout(async () => {
      const result = await isPasswordPwned(password);
      setHibpStatus((prev) => {
        if (prev !== 'checking') return prev;
        if (result.pwned) {
          setHibpBreachCount(result.breachCount);
          return 'pwned';
        }
        return 'safe';
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [password]);

  // Supabase fires PASSWORD_RECOVERY when the recovery link is opened
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidLink(true);
      setReady(true);
    });

    // Also check if a session already exists from the recovery hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidLink(true);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const strength = Object.values(reqs).filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-[#F9D923]', 'bg-emerald-500'][strength];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    // Final HIBP check on submit (in case the live check hasn't completed yet
    // OR the user managed to submit before debounce fired). Defense in depth.
    const pwnCheck = await isPasswordPwned(password);
    if (pwnCheck.pwned) {
      setLoading(false);
      setError(
        `This password has appeared in ${pwnCheck.breachCount.toLocaleString()} known data breaches. Please choose a different one.`,
      );
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-doggy" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-doggy/[0.08] blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center animate-fade-down">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-paw/15 bg-paw/[0.05]">
            <PawPrint className="size-6 text-doggy" strokeWidth={1.5} />
          </div>
        </div>

        {success ? (
          <div className="text-center animate-fade-up">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="size-7 text-emerald-400" strokeWidth={1.8} />
            </div>
            <h1 className="mb-3 font-elegant text-4xl font-black tracking-tight text-paw">
              Password updated
            </h1>
            <p className="font-pawprint text-sm text-paw/65">
              Redirecting you to sign in...
            </p>
          </div>
        ) : !validLink ? (
          <div className="text-center animate-fade-up">
            <h1 className="mb-3 font-elegant text-4xl font-black tracking-tight text-paw">
              Link expired
            </h1>
            <p className="mb-8 font-pawprint text-sm text-paw/65">
              This reset link is invalid or has expired. Request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-doggy px-6 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all hover:shadow-doggy/50 focus:outline-none focus:ring-2 focus:ring-doggy/50"
            >
              Get a new link
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 animate-fade-up">
              <h1 className="font-elegant text-5xl font-black tracking-tight text-paw">
                New <em className="not-italic text-doggy">password</em>
              </h1>
              <p className="mt-3 font-pawprint text-sm text-paw/65">
                Choose a strong password you haven&apos;t used before.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-up delay-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/60"
                  >
                    New password
                  </label>
                  {password && (
                    <span className="font-pawprint text-xs font-semibold text-paw/60">
                      {strengthLabel}
                    </span>
                  )}
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
                    autoFocus
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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
                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-paw/30 transition-colors hover:text-paw/70 focus:outline-none focus:ring-2 focus:ring-doggy/30"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          bar <= strength ? strengthColor : 'bg-paw/[0.08]',
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Password requirements checklist */}
                {password && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 animate-fade-in">
                    {([
                      [reqs.length,  '8+ characters'],
                      [reqs.upper,   'Uppercase A–Z'],
                      [reqs.number,  'Number 0–9'],
                      [reqs.special, 'Special character'],
                    ] as [boolean, string][]).map(([met, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        {met
                          ? <CheckCircle2 className="size-3 shrink-0 text-emerald-400 transition-colors duration-300" />
                          : <Circle className="size-3 shrink-0 text-paw/20 transition-colors duration-300" />
                        }
                        <span className={cn(
                          'font-pawprint text-[11px] transition-colors duration-300',
                          met ? 'text-emerald-400' : 'text-paw/35',
                        )}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* HIBP breach check — live, debounced */}
                {hibpStatus === 'checking' && (
                  <div className="flex items-center gap-1.5 font-pawprint text-xs text-paw/45 animate-fade-in">
                    <Loader2 className="size-3 animate-spin" />
                    Checking against known breaches...
                  </div>
                )}
                {hibpStatus === 'safe' && (
                  <div className="flex items-center gap-1.5 font-pawprint text-xs text-emerald-400 animate-fade-in">
                    <ShieldCheck className="size-3.5" />
                    Not found in any known breach
                  </div>
                )}
                {hibpStatus === 'pwned' && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2 animate-fade-in"
                  >
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-pawprint text-xs font-semibold text-red-400">
                        Found in {hibpBreachCount.toLocaleString()} known data breach
                        {hibpBreachCount === 1 ? '' : 'es'}
                      </p>
                      <p className="mt-0.5 font-pawprint text-[11px] text-red-400/80">
                        Pick a different password — this one is on attacker dictionaries.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirm"
                  className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/60"
                >
                  Confirm password
                </label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/30 transition-colors duration-300 group-focus-within:text-doggy"
                    strokeWidth={1.5}
                  />
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className={cn(
                      'w-full rounded-xl border border-paw/[0.1] bg-paw/[0.03] py-3.5 pl-11 pr-4',
                      'font-pawprint text-sm text-paw placeholder:text-paw/25',
                      'outline-none transition-all duration-300',
                      'focus:border-doggy/60 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15',
                    )}
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in"
                >
                  <p className="font-pawprint text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || hibpStatus === 'pwned' || hibpStatus === 'checking'}
                className="group relative mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 focus:outline-none focus:ring-2 focus:ring-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {loading ? (
                  <>
                    <Loader2 className="relative size-4 animate-spin" />
                    <span className="relative">Updating...</span>
                  </>
                ) : (
                  <span className="relative">Update password</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
