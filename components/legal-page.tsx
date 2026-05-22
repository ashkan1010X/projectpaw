import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface LegalPageProps {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}

/**
 * Shared wrapper for /privacy and /terms. Matches the dark theme of
 * the rest of the marketing site (paw-light text, doggy accents) but
 * gives long-form text a comfortable max-width and reading rhythm.
 */
export function LegalPage({ title, intro, updated, children }: LegalPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-32 -translate-x-1/2 size-[600px] rounded-full bg-doggy/[0.06] blur-[140px]" />
      </div>

      <article className="relative z-10 mx-auto max-w-3xl px-6 pb-32 pt-24 md:pt-32">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 font-pawprint text-xs text-paw/45 transition-colors hover:text-doggy"
        >
          <ArrowLeft className="size-3" strokeWidth={2} />
          Back to home
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="font-elegant text-4xl font-black tracking-tight text-paw md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 font-pawprint text-sm text-paw/45">
            Last updated: <span className="text-paw/65">{updated}</span>
          </p>
          <p className="mt-6 font-pawprint text-base leading-[1.75] text-paw/70 md:text-[17px]">
            {intro}
          </p>
        </header>

        {/* Body */}
        <div className="legal-body space-y-10 font-pawprint text-[15px] leading-[1.85] text-paw/65 md:text-base">
          {children}
        </div>
      </article>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 font-elegant text-2xl font-bold tracking-tight text-paw md:text-3xl">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Subhead({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 font-pawprint text-base font-semibold text-paw/85 md:text-lg">
      {children}
    </h3>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-paw/90">{children}</strong>;
}
