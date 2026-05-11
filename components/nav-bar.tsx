'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Home, Info, Images, Scissors } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: Info },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/services', label: 'Services', icon: Scissors },
] as const;

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-paw/[0.08] bg-[#0f0d09]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-elegant text-xl font-black tracking-tight text-paw transition-all duration-300"
        >
          <span className="relative">
            <span className="absolute inset-0 size-5 rounded-full bg-doggy/30 blur-md transition-all duration-500 group-hover:bg-doggy/60 group-hover:blur-lg" />
            <PawPrint
              className="relative size-5 text-doggy transition-transform duration-500 group-hover:rotate-12"
              strokeWidth={2.5}
            />
          </span>
          <span className="transition-all duration-300 group-hover:tracking-wider">ProjectPaw</span>
        </Link>

        {/* Desktop links */}
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

        {/* Right side: desktop auth + mobile hamburger */}
        <div className="flex items-center gap-3">

          {/* Desktop auth — hidden on mobile */}
          {user ? (
            <>
              <span className="hidden font-pawprint text-sm font-medium text-paw/70 sm:block">
                Hi, <span className="text-paw">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="hidden cursor-pointer rounded-lg border border-paw/15 px-4 py-2 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-300 hover:border-paw/35 hover:bg-paw/[0.04] hover:text-paw md:block"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden font-pawprint text-sm font-medium text-paw/60 transition-colors duration-300 hover:text-paw md:block"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="group relative hidden cursor-pointer overflow-hidden rounded-lg bg-doggy px-5 py-2 font-pawprint text-xs font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50 md:block"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Sign Up</span>
              </Link>
            </>
          )}

          {/* Mobile hamburger + Sheet */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="relative flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-paw/15 transition-colors duration-300 hover:border-paw/35 hover:bg-paw/[0.04] md:hidden"
            >
              <span
                className={cn(
                  'h-px w-5 rounded-full bg-paw/70 transition-all duration-300 ease-in-out',
                  isOpen && 'translate-y-[6px] rotate-45',
                )}
              />
              <span
                className={cn(
                  'h-px w-5 rounded-full bg-paw/70 transition-all duration-300 ease-in-out',
                  isOpen && 'scale-x-0 opacity-0',
                )}
              />
              <span
                className={cn(
                  'h-px w-5 rounded-full bg-paw/70 transition-all duration-300 ease-in-out',
                  isOpen && '-translate-y-[6px] -rotate-45',
                )}
              />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-[280px] flex-col border-l border-paw/[0.08] bg-[#0f0d09] p-0"
            >
              {/* Drawer header */}
              <div className="flex items-center gap-2.5 border-b border-paw/[0.08] px-6 py-5">
                <span className="relative">
                  <span className="absolute inset-0 size-5 rounded-full bg-doggy/30 blur-md" />
                  <PawPrint className="relative size-5 text-doggy" strokeWidth={2.5} />
                </span>
                <span className="font-elegant text-lg font-black tracking-tight text-paw">
                  ProjectPaw
                </span>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-3 py-4">
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map(({ href, label, icon: Icon }, index) => {
                    const isActive = pathname === href;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setIsOpen(false)}
                          style={{ animationDelay: `${index * 50}ms` }}
                          className={cn(
                            'animate-fade-up flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
                            isActive
                              ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
                              : 'border-l-2 border-transparent text-paw/60 hover:bg-paw/[0.04] hover:text-paw',
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn(isActive ? 'text-doggy' : 'text-paw/40')}
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Drawer footer */}
              <div className="border-t border-paw/[0.08] px-6 py-5">
                <p className="font-elegant text-sm italic text-paw/30">
                  Find your perfect paw match
                </p>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </nav>
  );
}
