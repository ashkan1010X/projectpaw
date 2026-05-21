'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// Marketing pages where a "Book Now" anchor at the bottom of the screen
// gives mobile users a thumb-reach CTA without scrolling back to the hero.
// Excludes /services because the CTA's destination IS /services — once the
// user arrives, every card on the page is itself a booking action.
const ALLOWED_PATHS = new Set(['/', '/about', '/gallery']);

// Once the user has scrolled past this many pixels the hero CTAs are offscreen
// and a thumb-reach bar starts paying for itself. Tuned to clear the hero on
// the smallest supported viewport (Galaxy S20, 360×800).
const SHOW_AFTER_PX = 480;

export function StickyMobileCta() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolledPast, setScrolledPast] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  // Track scroll position
  useEffect(() => {
    if (!ALLOWED_PATHS.has(pathname)) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolledPast(window.scrollY > SHOW_AFTER_PX);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Hide the bar when the page footer enters view — Rover/Wag pattern.
  // Stops the CTA from covering the footer nav links at the bottom of the page.
  useEffect(() => {
    if (!ALLOWED_PATHS.has(pathname)) return;

    const footer = document.querySelector('footer');
    if (!footer) return;

    const obs = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, [pathname]);

  // Logged-in users are past acquisition; the in-app nav has their actions.
  if (user) return null;
  if (!ALLOWED_PATHS.has(pathname)) return null;

  const visible = scrolledPast && !footerInView;

  return (
    <div
      // `inert` removes the bar entirely from the a11y tree + focus order
      // when hidden, so keyboard users don't land on an invisible button.
      // Safari/older browsers fall back to aria-hidden + tabIndex on the link.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- inert is a valid HTML attribute, React 19 supports it
      inert={visible ? undefined : true}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 motion-safe:transition-all motion-safe:duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      style={{
        background:
          'linear-gradient(180deg, rgba(15,13,9,0) 0%, rgba(15,13,9,0.85) 35%, rgba(15,13,9,0.96) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Link
        href="/services"
        tabIndex={visible ? 0 : -1}
        className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-doggy font-pawprint text-base font-bold text-white shadow-2xl shadow-doggy/40 ring-1 ring-doggy/40 motion-safe:transition-all motion-safe:duration-300 active:scale-[0.98]"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:transition-transform motion-safe:duration-700 group-hover:translate-x-full" />
        <span className="relative">Book Now</span>
        <ArrowRight className="relative size-4 motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
