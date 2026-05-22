'use client';

import Link from 'next/link';
import { ChevronRight, List, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export interface TocEntry {
  id: string;
  title: string;
}

interface LegalPageProps {
  title: string;
  intro: string;
  updated: string;
  toc: TocEntry[];
  children: ReactNode;
}

/**
 * Legal-page layout used by /privacy and /terms.
 *
 * Pattern modelled on Stripe / Notion / Vercel legal docs:
 *  - Breadcrumb (Home / This Page) instead of redundant "back" arrow
 *    — the real site nav is already at the top via app/layout.tsx
 *  - Sticky table of contents on the left at lg+ (proper jump nav)
 *  - Mobile TOC opens as a bottom sheet — saves screen space
 *  - Scrollspy highlights the section currently in view
 */
export function LegalPage({ title, intro, updated, toc, children }: LegalPageProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Scrollspy: highlight whichever section is currently in the upper third
  // of the viewport. IntersectionObserver is cheap + needs no scroll listener.
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  function handleTocClick(id: string) {
    setMobileTocOpen(false);
    setActiveId(id);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-32 -translate-x-1/2 size-[600px] rounded-full bg-doggy/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-32 pt-20 md:pt-24">
        {/* Breadcrumb — feels like nav context, not redundant "back" */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 font-pawprint text-xs text-paw/45"
        >
          <Link
            href="/"
            className="rounded px-1 py-0.5 transition-colors hover:text-doggy focus:outline-none focus-visible:ring-2 focus-visible:ring-doggy/30"
          >
            Home
          </Link>
          <ChevronRight className="size-3 text-paw/25" strokeWidth={2} />
          <span className="px-1 py-0.5 text-paw/70">{title}</span>
        </nav>

        {/* Mobile TOC trigger — pill that pins to top of content on small screens */}
        <button
          type="button"
          onClick={() => setMobileTocOpen(true)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-paw/[0.12] bg-paw/[0.03] px-3.5 py-2 font-pawprint text-xs font-semibold text-paw/70 transition-colors hover:border-doggy/40 hover:text-paw lg:hidden"
        >
          <List className="size-3.5 text-doggy/70" strokeWidth={2.5} />
          Jump to section
        </button>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          {/* Sticky TOC sidebar (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 font-pawprint text-[10px] font-semibold uppercase tracking-[0.18em] text-paw/40">
                On this page
              </p>
              <nav aria-label="Table of contents">
                <ul className="space-y-0.5 border-l border-paw/[0.08]">
                  {toc.map(({ id, title: t }) => {
                    const isActive = activeId === id;
                    return (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          className={`relative -ml-px block border-l-2 py-1.5 pl-4 font-pawprint text-[13px] leading-snug transition-colors duration-150 ${
                            isActive
                              ? 'border-doggy text-paw'
                              : 'border-transparent text-paw/50 hover:border-paw/30 hover:text-paw/80'
                          }`}
                        >
                          {t}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Article body */}
          <article>
            <header className="mb-12">
              <h1 className="font-elegant text-4xl font-black tracking-tight text-paw md:text-5xl lg:text-[3.5rem]">
                {title}
              </h1>
              <p className="mt-4 font-pawprint text-sm text-paw/45">
                Last updated: <span className="text-paw/65">{updated}</span>
              </p>
              <p className="mt-6 font-pawprint text-base leading-[1.75] text-paw/70 md:text-[17px]">
                {intro}
              </p>
            </header>

            <div className="legal-body space-y-10 font-pawprint text-[15px] leading-[1.85] text-paw/65 md:text-base">
              {children}
            </div>
          </article>
        </div>
      </div>

      {/* Mobile TOC bottom sheet */}
      {mobileTocOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close table of contents"
            onClick={() => setMobileTocOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-paw/[0.12] bg-[#1a1612] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-pawprint text-[10px] font-semibold uppercase tracking-[0.18em] text-paw/40">
                Jump to section
              </p>
              <button
                type="button"
                onClick={() => setMobileTocOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full border border-paw/[0.1] bg-paw/[0.04] text-paw/60 transition-colors hover:bg-paw/[0.08] hover:text-paw"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
            <ul className="space-y-1">
              {toc.map(({ id, title: t }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => handleTocClick(id)}
                    className="block rounded-lg px-3 py-2.5 font-pawprint text-sm text-paw/75 transition-colors hover:bg-paw/[0.04] hover:text-paw"
                  >
                    {t}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
