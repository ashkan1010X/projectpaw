'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PawPrint,
  User,
  Mail,
  MailCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  Circle,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isPasswordPwned } from '@/lib/hibp';
import { cn } from '@/lib/utils';

interface RegisterResponse {
  user: { name: string; email?: string };
  token: string;
  refreshToken: string;
  message?: string;
}

const PERKS = [
  'Free to join, cancel anytime',
  'Book in under 2 minutes',
  'Vetted, certified professionals',
  'Email confirmations for every booking',
];

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // HIBP live check: debounce ~500ms after typing stops, only run for 8+ chars
  const [hibpStatus, setHibpStatus] = useState<'idle' | 'checking' | 'safe' | 'pwned'>('idle');
  const [hibpBreachCount, setHibpBreachCount] = useState(0);

  useEffect(() => {
    // Debounced async breach check against the HIBP API — a genuine effect
    // synchronizing with an external system. The transient idle/checking states
    // are intentional, hence the targeted disable.
    if (password.length < 8) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHibpStatus('idle');
      return;
    }
    setHibpStatus('checking');
    const handle = setTimeout(async () => {
      const result = await isPasswordPwned(password);
      // Guard against stale check if user kept typing — only apply if password unchanged
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

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordStrength = Object.values(reqs).filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-[#F9D923]', 'bg-emerald-500'][
    passwordStrength
  ];

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

      if (res.status === 202) {
        setSuccess(data.message ?? 'Check your email to confirm your account.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message ?? 'Registration failed. Please try again.');
      }

      if (!data.user || typeof data.token !== 'string' || typeof data.refreshToken !== 'string') {
        throw new Error('Unexpected response from server. Please try again.');
      }

      login(data.user, data.token, data.refreshToken);
      // New users land on the dashboard so the onboarding checklist greets them.
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-5">
      {/* LEFT — Brand benefits */}
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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/25 bg-[#F9D923]/[0.08] px-3 py-1">
            <Sparkles className="size-3 text-[#F9D923]" />
            <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9D923]">
              Join 400+ families
            </span>
          </div>

          <h2 className="mb-8 font-elegant text-4xl font-black leading-[1.05] tracking-tight text-paw">
            Premium care.
            <br />
            <em className="not-italic text-doggy">Zero hassle.</em>
          </h2>

          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-doggy/35 bg-doggy/15">
                  <Check className="size-3 text-doggy" strokeWidth={3} />
                </div>
                <span className="font-pawprint text-base text-paw/75">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 font-pawprint text-xs text-paw/40">
          <div className="flex -space-x-2">
            {['SM', 'JK', 'PL', 'AN'].map((i, idx) => (
              <div
                key={i}
                className="flex size-7 items-center justify-center rounded-full border-2 border-[#0f0d09] bg-gradient-to-br from-doggy to-paw-dark font-pawprint text-[10px] font-bold text-white"
                style={{ zIndex: 4 - idx }}
              >
                {i}
              </div>
            ))}
          </div>
          <span>Loved by 400+ dog families</span>
        </div>
      </aside>

      {/* RIGHT — Form */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-16 lg:col-span-3">
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full bg-doggy/[0.06] blur-[100px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {/* ── Email confirmation success screen ── */}
          {success && (
            <div className="flex flex-col items-center gap-6 text-center animate-fade-up">
              <div className="flex size-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <MailCheck className="size-7 text-emerald-400" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="mb-3 font-elegant text-4xl font-black tracking-tight text-paw">
                  Check your inbox
                </h1>
                <p className="font-pawprint text-sm text-paw/60">We sent a confirmation link to</p>
                <p className="mt-1 font-pawprint text-sm font-semibold text-paw/90">{email}</p>
                <p className="mt-3 font-pawprint text-sm text-paw/50">
                  Click the link to activate your account.
                  <br />
                  It may take a minute — check your spam folder too.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-doggy px-6 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all hover:shadow-doggy/50 focus:outline-none focus:ring-2 focus:ring-doggy/50"
              >
                Go to sign in
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}

          {/* ── Main form (hidden once success) ── */}
          {!success && (
            <>
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
                    Free Forever
                  </span>
                </div>
                <h1 className="font-elegant text-5xl font-black tracking-tight text-paw">
                  Create <em className="not-italic text-doggy">account</em>.
                </h1>
                <p className="mt-2 font-pawprint text-sm text-paw/50">
                  Takes less than a minute. No card required.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 animate-fade-up delay-100"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/50"
                  >
                    Full Name
                  </label>
                  <div className="group relative">
                    <User
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/30 transition-colors duration-300 group-focus-within:text-doggy"
                      strokeWidth={1.5}
                    />
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
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
                      className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-paw/30 outline-none transition-colors duration-200 hover:text-paw/70 focus:ring-2 focus:ring-doggy/30"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="size-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            bar <= passwordStrength ? strengthColor : 'bg-paw/[0.08]',
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Password requirements checklist */}
                  {password && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 animate-fade-in">
                      {(
                        [
                          [reqs.length, '8+ characters'],
                          [reqs.upper, 'Uppercase A–Z'],
                          [reqs.number, 'Number 0–9'],
                          [reqs.special, 'Special character'],
                        ] as [boolean, string][]
                      ).map(([met, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {met ? (
                            <CheckCircle2 className="size-3 shrink-0 text-emerald-400 transition-colors duration-300" />
                          ) : (
                            <Circle className="size-3 shrink-0 text-paw/20 transition-colors duration-300" />
                          )}
                          <span
                            className={cn(
                              'font-pawprint text-[11px] transition-colors duration-300',
                              met ? 'text-emerald-400' : 'text-paw/35',
                            )}
                          >
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
                      className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 animate-fade-in"
                    >
                      <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-pawprint text-xs font-semibold text-amber-300">
                          Seen in {hibpBreachCount.toLocaleString()} password leak
                          {hibpBreachCount === 1 ? '' : 's'}
                        </p>
                        <p className="mt-0.5 font-pawprint text-[11px] text-amber-300/75">
                          Pick one only you&apos;d think of — even a single custom word keeps it
                          yours.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in">
                    <p className="font-pawprint text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || hibpStatus === 'pwned' || hibpStatus === 'checking'}
                  className="group relative mt-2 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </span>
                  {!loading && (
                    <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </button>

                <p className="text-center font-pawprint text-xs leading-7 text-paw/35">
                  By creating an account, you agree to our{' '}
                  <a
                    href="#"
                    className="inline-block rounded px-1 py-1 text-paw/65 underline underline-offset-2 hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a
                    href="#"
                    className="inline-block rounded px-1 py-1 text-paw/65 underline underline-offset-2 hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>

              <div className="mt-8 border-t border-paw/[0.06] pt-6 text-center animate-fade-in delay-300">
                <p className="font-pawprint text-sm leading-9 text-paw/55">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="-my-1 inline-flex min-h-9 items-center rounded-md px-2 py-2 font-bold text-doggy transition-colors hover:text-doggy/80 focus:outline-none focus:ring-2 focus:ring-doggy/30"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
