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

// Sentinel pixel height — once the user has scrolled past this much of the
// viewport, the hero CTA is offscreen and we surface the sticky bar.
const SHOW_AFTER_PX = 480;

export function StickyMobileCta() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ALLOWED_PATHS.has(pathname)) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > SHOW_AFTER_PX);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Don't show for logged-in users — they're past the acquisition funnel
  // and have full in-page actions (dashboard, profile).
  if (user) return null;
  if (!ALLOWED_PATHS.has(pathname)) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 transition-all duration-300 md:hidden ${
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
        className="group flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-doggy font-pawprint text-base font-bold text-white shadow-2xl shadow-doggy/40 ring-1 ring-doggy/40 transition-all duration-300 active:scale-[0.98]"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative">Book Now</span>
        <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
