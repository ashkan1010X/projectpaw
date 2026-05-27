'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PawPrint,
  Home,
  Info,
  Images,
  Scissors,
  LayoutDashboard,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: Info },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/services', label: 'Services', icon: Scissors },
] as const;

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'My Profile', icon: User },
] as const;

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  // Click-away + ESC + initial focus for desktop dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    function onClickAway(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstItemRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [dropdownOpen]);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  function handleLogoutConfirmed() {
    setConfirmLogout(false);
    setDropdownOpen(false);
    setIsOpen(false);
    logout();
  }

  return (
    <>
      {/* Skip link for keyboard / screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-doggy focus:px-4 focus:py-2 focus:font-pawprint focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main"
        className="sticky top-0 z-50 w-full border-b border-paw/[0.08] bg-[#0f0d09]/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link
            href="/"
            aria-label="ProjectPaw home"
            className="group flex items-center gap-2.5 font-elegant text-xl font-black tracking-tight text-paw transition-all duration-300"
          >
            <span className="relative">
              <span className="absolute inset-0 size-5 rounded-full bg-doggy/30 blur-md transition-all duration-500 group-hover:bg-doggy/60 group-hover:blur-lg" />
              <PawPrint
                className="relative size-5 text-doggy transition-transform duration-500 group-hover:rotate-12"
                strokeWidth={2.5}
              />
            </span>
            <span className="transition-all duration-300 group-hover:tracking-wider">
              ProjectPaw
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center px-4 py-2 font-pawprint text-sm font-medium transition-colors duration-300',
                      isActive ? 'text-paw' : 'text-paw/65 hover:text-paw',
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
              <div ref={dropdownRef} className="relative hidden md:block">
                {/* Pill chip */}
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  aria-controls="account-menu"
                  className="flex items-center gap-2 rounded-full border border-doggy/25 bg-doggy/[0.08] py-1.5 pl-1.5 pr-3 font-pawprint text-sm font-semibold text-paw transition-all duration-300 hover:border-doggy/50 hover:bg-doggy/[0.12]"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark text-xs font-black text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{user.name}</span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      'text-paw/40 transition-transform duration-200',
                      dropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    id="account-menu"
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-paw/[0.1] bg-[#1a1612] shadow-2xl shadow-black/40"
                  >
                    {/* Identity header */}
                    <div className="flex items-center gap-3 border-b border-paw/[0.06] px-4 py-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark text-sm font-black text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-pawprint text-sm font-bold text-paw">
                          {user.name}
                        </span>
                        <span className="block truncate font-pawprint text-xs text-paw/50">
                          {user.email}
                        </span>
                      </span>
                    </div>

                    <div className="py-1">
                      {ACCOUNT_LINKS.map(({ href, label, icon: Icon }, idx) => {
                        const isActive = pathname === href;
                        return (
                          <Link
                            key={href}
                            ref={idx === 0 ? firstItemRef : undefined}
                            href={href}
                            role="menuitem"
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => setDropdownOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm transition-colors',
                              isActive
                                ? 'bg-doggy/10 text-paw'
                                : 'text-paw/75 hover:bg-paw/[0.04] hover:text-paw',
                            )}
                          >
                            <Icon size={15} className={isActive ? 'text-doggy' : 'text-paw/60'} />
                            {label}
                          </Link>
                        );
                      })}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          aria-current={pathname === '/admin' ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm transition-colors',
                            pathname === '/admin'
                              ? 'bg-doggy/10 text-paw'
                              : 'text-paw/75 hover:bg-paw/[0.04] hover:text-paw',
                          )}
                        >
                          <ShieldCheck
                            size={15}
                            className={pathname === '/admin' ? 'text-doggy' : 'text-paw/60'}
                          />
                          Admin
                        </Link>
                      )}
                      <div className="my-1 h-px bg-paw/[0.06]" />
                      <button
                        role="menuitem"
                        onClick={() => {
                          setDropdownOpen(false);
                          setConfirmLogout(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm text-paw/75 transition-colors hover:bg-paw/[0.04] hover:text-paw"
                      >
                        <LogOut size={15} className="text-paw/60" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden font-pawprint text-sm font-medium text-paw/65 transition-colors duration-300 hover:text-paw md:block"
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

            {/* Mobile: Log in shortcut — visible only when logged out */}
            {!user && (
              <Link
                href="/login"
                className="font-pawprint text-sm font-medium text-paw/65 transition-colors duration-300 hover:text-paw md:hidden"
              >
                Log in
              </Link>
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
                className="flex w-[300px] flex-col border-l border-paw/[0.08] bg-[#0f0d09] p-0"
              >
                {/* Drawer header */}
                <div className="flex items-center gap-2.5 border-b border-paw/[0.08] px-6 py-5">
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <span className="relative" aria-hidden="true">
                    <span className="absolute inset-0 size-5 rounded-full bg-doggy/30 blur-md" />
                    <PawPrint className="relative size-5 text-doggy" strokeWidth={2.5} />
                  </span>
                  <span className="font-elegant text-lg font-black tracking-tight text-paw">
                    ProjectPaw
                  </span>
                </div>

                {/* Mobile identity block — only when logged in */}
                {user && (
                  <div className="flex items-center gap-3 border-b border-paw/[0.08] bg-doggy/[0.05] px-6 py-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark text-sm font-black text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-pawprint text-sm font-bold text-paw">
                        {user.name}
                      </span>
                      <span className="block truncate font-pawprint text-xs text-paw/55">
                        {user.email}
                      </span>
                    </span>
                  </div>
                )}

                {/* Nav links */}
                <nav aria-label="Mobile menu" className="flex-1 overflow-y-auto px-3 py-4">
                  <ul className="flex flex-col gap-1">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href;
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
                              isActive
                                ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
                                : 'border-l-2 border-transparent text-paw/65 hover:bg-paw/[0.04] hover:text-paw',
                            )}
                          >
                            <Icon
                              size={18}
                              className={cn(isActive ? 'text-doggy' : 'text-paw/60')}
                            />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {user && (
                    <>
                      {/* Section divider + label */}
                      <div className="mb-1 mt-5 flex items-center gap-2 px-4">
                        <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.15em] text-paw/35">
                          Account
                        </span>
                        <span className="h-px flex-1 bg-paw/[0.06]" />
                      </div>

                      <ul className="flex flex-col gap-1">
                        {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => {
                          const isActive = pathname === href;
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
                                  isActive
                                    ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
                                    : 'border-l-2 border-transparent text-paw/65 hover:bg-paw/[0.04] hover:text-paw',
                                )}
                              >
                                <Icon
                                  size={18}
                                  className={cn(isActive ? 'text-doggy' : 'text-paw/60')}
                                />
                                {label}
                              </Link>
                            </li>
                          );
                        })}
                        {isAdmin && (
                          <li>
                            <Link
                              href="/admin"
                              aria-current={pathname === '/admin' ? 'page' : undefined}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
                                pathname === '/admin'
                                  ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
                                  : 'border-l-2 border-transparent text-paw/65 hover:bg-paw/[0.04] hover:text-paw',
                              )}
                            >
                              <ShieldCheck
                                size={18}
                                className={cn(pathname === '/admin' ? 'text-doggy' : 'text-paw/60')}
                              />
                              Admin
                            </Link>
                          </li>
                        )}
                      </ul>
                    </>
                  )}
                </nav>

                {/* Drawer auth */}
                <div className="border-t border-paw/[0.08] px-3 py-3">
                  {user ? (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        // Wait for drawer close animation so confirm dialog is clickable
                        setTimeout(() => setConfirmLogout(true), 220);
                      }}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-paw/15 px-4 py-3 font-pawprint text-sm font-semibold text-paw/75 transition-all duration-300 hover:border-paw/35 hover:bg-paw/[0.04] hover:text-paw"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="w-full rounded-lg border border-paw/20 bg-white/[0.03] px-4 py-3 text-center font-pawprint text-sm font-semibold text-paw/75 transition-all duration-300 hover:border-paw/40 hover:bg-white/[0.06] hover:text-paw"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsOpen(false)}
                        className="group relative overflow-hidden rounded-lg bg-doggy px-4 py-3 text-center font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:shadow-doggy/50"
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative">Sign Up Free</span>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Log out?"
        message="You'll need to sign back in to view your bookings and profile."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
