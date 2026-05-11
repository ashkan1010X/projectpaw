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
    <nav className="sticky top-0 z-50 w-full border-b border-paw/[0.08] bg-[#0f0d09]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-elegant text-xl font-black tracking-tight text-paw transition-all duration-300"
        >
          <span className="relative">
            <span className="absolute inset-0 size-5 rounded-full bg-doggy/30 blur-md transition-all duration-500 group-hover:bg-doggy/60 group-hover:blur-lg" />
            <PawPrint className="relative size-5 text-doggy transition-transform duration-500 group-hover:rotate-12" strokeWidth={2.5} />
          </span>
          <span className="transition-all duration-300 group-hover:tracking-wider">ProjectPaw</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'group relative flex items-center px-4 py-2 font-pawprint text-sm font-medium transition-colors duration-300',
                    isActive ? 'text-paw' : 'text-paw/50 hover:text-paw',
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'absolute inset-x-4 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-doggy via-[#F9D923] to-doggy transition-transform duration-500 ease-out',
                      isActive ? 'scale-x-100' : 'group-hover:scale-x-100',
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden font-pawprint text-sm font-medium text-paw/70 sm:block">
                Hi, <span className="text-paw">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="group cursor-pointer rounded-lg border border-paw/15 px-4 py-2 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-300 hover:border-paw/35 hover:bg-paw/[0.04] hover:text-paw"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-pawprint text-sm font-medium text-paw/60 transition-colors duration-300 hover:text-paw"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="group relative cursor-pointer overflow-hidden rounded-lg bg-doggy px-5 py-2 font-pawprint text-xs font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:shadow-doggy/50 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
