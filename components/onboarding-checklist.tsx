'use client';

import Link from 'next/link';
import { Check, Phone, PawPrint, CalendarPlus, ArrowRight, Sparkles } from 'lucide-react';

// LinkedIn-style profile-completion checklist. Lives on the dashboard and
// hides itself once every step is done. Each row links directly to the
// page that finishes that step, so there's never a "now where do I go?"
// moment for a new user.

type Props = {
  firstName: string;
  hasPhone: boolean;
  hasPet: boolean;
  hasBooking: boolean;
};

type Step = {
  key: string;
  label: string;
  helper: string;
  href: string;
  icon: typeof Phone;
  done: boolean;
};

export function OnboardingChecklist({ firstName, hasPhone, hasPet, hasBooking }: Props) {
  const steps: Step[] = [
    {
      key: 'account',
      label: 'Create your account',
      helper: 'Done — welcome aboard',
      href: '/profile',
      icon: Sparkles,
      done: true,
    },
    {
      key: 'phone',
      label: 'Add your phone number',
      helper: 'So we can text you booking confirmations and reminders',
      href: '/profile',
      icon: Phone,
      done: hasPhone,
    },
    {
      key: 'pet',
      label: 'Add your first pet',
      helper: 'Tell us their name, breed, and add a photo',
      href: '/profile',
      icon: PawPrint,
      done: hasPet,
    },
    {
      key: 'booking',
      label: 'Book your first service',
      helper: 'Grooming, walking, boarding — see what we offer',
      href: '/services',
      icon: CalendarPlus,
      done: hasBooking,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  // Don't render if everything's done — the user is past onboarding.
  if (completed === total) return null;

  // Find the next incomplete step so we can surface it prominently
  const nextStep = steps.find((s) => !s.done);

  return (
    <section
      aria-label="Profile completion checklist"
      className="mb-8 overflow-hidden rounded-2xl border border-doggy/20 bg-gradient-to-br from-doggy/[0.08] via-[#1a1612] to-[#1a1612] animate-fade-in"
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
          </div>
          <span className="font-pawprint text-xs font-bold text-paw/55">
            {completed} of {total} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paw/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-doggy to-[#F9D923] transition-[width] duration-700 ease-out"
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
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                tabIndex={step.done ? -1 : 0}
                aria-disabled={step.done}
                className={`group flex items-center gap-3 px-5 py-3.5 transition-colors duration-200 sm:gap-4 sm:px-7 sm:py-4 ${
                  step.done
                    ? 'cursor-default'
                    : 'hover:bg-paw/[0.03] focus:bg-paw/[0.04] focus:outline-none'
                }`}
              >
                {/* Check or icon */}
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
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

                {/* Text */}
                <span className="min-w-0 flex-1">
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

                {/* CTA arrow — only on actionable rows */}
                {!step.done && (
                  <ArrowRight
                    className={`size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                      isNext ? 'text-doggy' : 'text-paw/40'
                    }`}
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
