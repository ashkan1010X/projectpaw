'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/services', label: 'Services' },
];

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-paw/10 bg-[#0f0d09]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-elegant text-xl font-black text-paw transition-opacity hover:opacity-80"
        >
          <PawPrint className="size-5 text-doggy" strokeWidth={2.5} />
          ProjectPaw
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'font-pawprint text-sm font-medium transition-colors duration-200',
                  pathname === href
                    ? 'text-paw'
                    : 'text-paw/50 hover:text-paw',
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden font-pawprint text-sm font-medium text-paw/70 sm:block">
                Hi, {user.name}
              </span>
              <button
                onClick={logout}
                className="cursor-pointer rounded-lg border border-paw/20 px-4 py-2 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-200 hover:border-paw/40 hover:text-paw"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-pawprint text-sm font-medium text-paw/60 transition-colors duration-200 hover:text-paw"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="cursor-pointer rounded-lg bg-doggy px-4 py-2 font-pawprint text-xs font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-200 hover:bg-doggy/90 hover:shadow-doggy/40"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
