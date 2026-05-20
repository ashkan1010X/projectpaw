'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Phone, PawPrint, CalendarPlus, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';

// LinkedIn-style profile-completion checklist with a celebration moment
// when the user hits 4/4. Lives on the dashboard; hides itself afterwards.
//
// Phone + pet steps fire callbacks so the parent can open a sheet (the
// dashboard never disappears behind a full-page nav). "Book first service"
// stays a Link because that step is a browse, not a quick form.

type Props = {
  firstName: string;
  hasPhone: boolean;
  hasPet: boolean;
  hasBooking: boolean;
  onAddPhone: () => void;
  onAddPet: () => void;
};

type StepKey = 'account' | 'phone' | 'pet' | 'booking';

type Step = {
  key: StepKey;
  label: string;
  helper: string;
  icon: typeof Phone;
  done: boolean;
};

// One-time celebration flag — survives a tab close, refreshes on logout/reset.
const CELEBRATED_KEY = 'projectpaw:onboarding-celebrated';

function encouragement(completed: number, total: number): string | null {
  const remaining = total - completed;
  if (completed === 0) return null;
  if (completed === total) return null;
  if (remaining === 1) return 'Almost there — one more step!';
  if (completed === total - 2) return 'Halfway there 🎯';
  return `Nice — ${remaining} more to go`;
}

export function OnboardingChecklist({
  firstName,
  hasPhone,
  hasPet,
  hasBooking,
  onAddPhone,
  onAddPet,
}: Props) {
  const steps: Step[] = [
    {
      key: 'account',
      label: 'Create your account',
      helper: 'Done — welcome aboard',
      icon: Sparkles,
      done: true,
    },
    {
      key: 'phone',
      label: 'Add your phone number',
      helper: 'So we can text you booking confirmations and reminders',
      icon: Phone,
      done: hasPhone,
    },
    {
      key: 'pet',
      label: 'Add your first pet',
      helper: 'Tell us their name, breed, and add a photo',
      icon: PawPrint,
      done: hasPet,
    },
    {
      key: 'booking',
      label: 'Book your first service',
      helper: 'Grooming, walking, boarding — see what we offer',
      icon: CalendarPlus,
      done: hasBooking,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  const [celebrating, setCelebrating] = useState(false);
  // Track previous count so we only fire on a real transition. Without this,
  // existing users who completed onboarding *before* this feature shipped
  // would get a "Welcome!" the first time they opened the dashboard.
  const prevCompletedRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevCompletedRef.current;
    prevCompletedRef.current = completed;

    // Initial render: just record the count, never fire.
    if (prev === null) return;

    // Only fire on the precise transition from incomplete → complete.
    if (prev >= total || completed !== total) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(CELEBRATED_KEY)) return;

    setCelebrating(true);
    window.localStorage.setItem(CELEBRATED_KEY, '1');
    const t = window.setTimeout(() => setCelebrating(false), 4500);
    return () => window.clearTimeout(t);
  }, [completed, total]);

  // Don't render anything once the user is past onboarding (after celebration).
  if (completed === total && !celebrating) return null;

  const nextStep = steps.find((s) => !s.done);
  const cheer = encouragement(completed, total);

  function handleClick(key: StepKey) {
    if (key === 'phone') onAddPhone();
    else if (key === 'pet') onAddPet();
  }

  // ─── Celebration view ──────────────────────────────────────────
  if (celebrating) {
    return (
      <section
        aria-label="Onboarding complete"
        className="relative mb-8 overflow-hidden rounded-2xl border border-doggy/30 bg-gradient-to-br from-doggy/[0.18] via-[#1a1612] to-[#1a1612] motion-safe:animate-fade-in"
      >
        {/* Floating paws (decorative — hidden when reduced-motion) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden motion-safe:block">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-70 motion-safe:animate-float"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '3.5s',
              }}
            >
              🐾
            </span>
          ))}
        </div>

        <div className="relative px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-doggy/15 ring-1 ring-doggy/40 motion-safe:animate-scale-in">
            <PartyPopper className="size-8 text-doggy" strokeWidth={1.75} />
          </div>
          <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-doggy/75 sm:text-xs">
            🎉 You&apos;re all set
          </p>
          <h2 className="mt-2 font-elegant text-2xl font-black text-paw sm:text-3xl">
            Welcome to ProjectPaw, {firstName}!
          </h2>
          <p className="mx-auto mt-3 max-w-md font-pawprint text-sm text-paw/55 sm:text-base">
            Your account is fully set up. Sit back — we&apos;ll text you with appointment reminders.
          </p>
          {/* Full progress bar — locked at 100% as a victory lap */}
          <div className="mx-auto mt-6 h-1.5 max-w-md overflow-hidden rounded-full bg-paw/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-doggy to-[#F9D923]"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </section>
    );
  }

  // ─── Normal checklist view ──────────────────────────────────────
  return (
    <section
      aria-label="Profile completion checklist"
      className="mb-8 overflow-hidden rounded-2xl border border-doggy/20 bg-gradient-to-br from-doggy/[0.08] via-[#1a1612] to-[#1a1612] motion-safe:animate-fade-in"
    >
      {/* Header */}
      <div className="border-b border-paw/[0.06] px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-doggy/75 sm:text-xs">
              Welcome to ProjectPaw, {firstName} 🐾
            </p>
            <h2 className="mt-1 font-elegant text-lg font-black text-paw sm:text-xl">
              Let&apos;s get you set up
            </h2>
            {cheer && (
              <p
                key={cheer}
                className="mt-1 font-pawprint text-xs text-doggy/80 motion-safe:animate-fade-in sm:text-sm"
                aria-live="polite"
              >
                {cheer}
              </p>
            )}
          </div>
          <span className="font-pawprint text-xs font-bold text-paw/55">
            {completed} of {total} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paw/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-doggy to-[#F9D923] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Steps */}
      <ul className="divide-y divide-paw/[0.05]">
        {steps.map((step) => {
          const Icon = step.icon;
          const isNext = step.key === nextStep?.key;
          const isBooking = step.key === 'booking';

          const inner = (
            <>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full motion-safe:transition-all motion-safe:duration-300 ${
                  step.done
                    ? 'bg-doggy/15 text-doggy ring-1 ring-doggy/30'
                    : isNext
                    ? 'bg-doggy text-white shadow-lg shadow-doggy/35 ring-1 ring-doggy/40'
                    : 'bg-paw/[0.06] text-paw/45 ring-1 ring-paw/10'
                }`}
                aria-hidden
              >
                {step.done ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Icon className="size-4" strokeWidth={2} />
                )}
              </span>

              <span className="min-w-0 flex-1 text-left">
                <span
                  className={`block font-pawprint text-sm font-bold sm:text-base ${
                    step.done ? 'text-paw/45 line-through' : 'text-paw'
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`mt-0.5 block font-pawprint text-xs sm:text-sm ${
                    step.done ? 'text-paw/30' : 'text-paw/55'
                  }`}
                >
                  {step.helper}
                </span>
              </span>

              {!step.done && (
                <ArrowRight
                  className={`size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-x-1 ${
                    isNext ? 'text-doggy' : 'text-paw/40'
                  }`}
                  aria-hidden
                />
              )}
            </>
          );

          const rowClass = `group flex w-full items-center gap-3 px-5 py-3.5 motion-safe:transition-colors motion-safe:duration-200 sm:gap-4 sm:px-7 sm:py-4 ${
            step.done
              ? 'cursor-default'
              : 'cursor-pointer hover:bg-paw/[0.03] focus:bg-paw/[0.04] focus:outline-none'
          }`;

          return (
            <li key={step.key}>
              {step.done ? (
                <div className={rowClass}>{inner}</div>
              ) : isBooking ? (
                <Link href="/services" className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={() => handleClick(step.key)} className={rowClass}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
