# Mobile Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready right-side Sheet drawer with a morphing hamburger button and staggered link animations to the existing NavBar, visible only on mobile.

**Architecture:** Extend `components/nav-bar.tsx` with an `isOpen` state, a hamburger trigger, and a shadcn `Sheet` containing the branded drawer. Add a `@keyframes fade-up` animation to `globals.css`. Install Playwright and write headed tests for iPhone and desktop viewports.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui Sheet (Radix Dialog), lucide-react, Playwright

---

## File Map

| File                       | Action           | Responsibility                                       |
| -------------------------- | ---------------- | ---------------------------------------------------- |
| `components/nav-bar.tsx`   | Modify           | Add hamburger button, Sheet drawer, isOpen state     |
| `app/globals.css`          | Modify           | Add `@keyframes fade-up` + `--animate-fade-up` token |
| `components/ui/sheet.tsx`  | Create (via CLI) | shadcn Sheet component                               |
| `tests/mobile-nav.spec.ts` | Create           | Playwright tests for mobile and desktop viewports    |

---

## Task 1: Install shadcn Sheet component

**Files:**

- Create: `components/ui/sheet.tsx` (via shadcn CLI)

- [ ] **Step 1: Run shadcn add**

```bash
npx shadcn@latest add sheet
```

Expected output: creates `components/ui/sheet.tsx`, may install `@radix-ui/react-dialog`.

- [ ] **Step 2: Verify the file exists**

```bash
ls components/ui/
```

Expected: `button.tsx  sheet.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/ui/sheet.tsx package.json package-lock.json
git commit -m "chore: add shadcn Sheet component"
```

---

## Task 2: Add fade-up animation to globals.css

**Files:**

- Modify: `app/globals.css`

- [ ] **Step 1: Add keyframe and theme token**

Open `app/globals.css`. After the closing `}` of the `@theme inline { ... }` block (after line 56), add:

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Then inside the `@theme inline { ... }` block, add this line before the closing `}`:

```css
--animate-fade-up: fade-up 300ms ease-out both;
```

This registers `animate-fade-up` as a Tailwind utility class.

- [ ] **Step 2: Verify the build accepts it**

```bash
npm run build 2>&1 | tail -5
```

Expected: no CSS errors, exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore: add fade-up animation token"
```

---

## Task 3: Rewrite nav-bar.tsx with mobile drawer

**Files:**

- Modify: `components/nav-bar.tsx`

- [ ] **Step 1: Replace the entire file with this implementation**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Home, Info, Images, Scissors } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
                          <Icon size={18} className={cn(isActive ? 'text-doggy' : 'text-paw/40')} />
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
```

- [ ] **Step 2: Run the dev server and check for TypeScript errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors, no missing import errors.

- [ ] **Step 3: Commit**

```bash
git add components/nav-bar.tsx
git commit -m "feat: add mobile navigation drawer with hamburger button"
```

---

## Task 4: Install Playwright and write tests

**Files:**

- Create: `tests/mobile-nav.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: `@playwright/test` in devDependencies, Chromium browser downloaded.

- [ ] **Step 2: Create playwright.config.ts**

Create `playwright.config.ts` in the project root:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
```

- [ ] **Step 3: Create the test file**

Create `tests/mobile-nav.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('NavBar — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows desktop links, hides hamburger', async ({ page }) => {
    await page.goto('/');
    // Desktop links visible
    await expect(page.getByRole('link', { name: 'Services' })).toBeVisible();
    // Hamburger trigger not visible on desktop
    const hamburger = page.getByRole('button', { name: /navigation menu/i });
    await expect(hamburger).toBeHidden();
  });
});

test.describe('NavBar — mobile (iPhone 14)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows hamburger, hides desktop links', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(hamburger).toBeVisible();
    // Desktop link list is hidden on mobile
    const desktopNav = page.locator('ul.hidden.md\\:flex');
    await expect(desktopNav).toBeHidden();
  });

  test('opens drawer on hamburger tap', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: 'Open navigation menu' });
    await hamburger.click();
    // SheetContent slides in — all nav links visible inside drawer
    await expect(page.getByRole('link', { name: 'Home' }).nth(1)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    // Tagline visible
    await expect(page.getByText('Find your perfect paw match')).toBeVisible();
  });

  test('closes drawer when a link is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    // Click the About link inside the drawer
    await page.getByRole('link', { name: 'About' }).click();
    // Drawer should be gone (SheetContent unmounts or hides)
    await expect(page.getByText('Find your perfect paw match')).toBeHidden();
    // Should have navigated to /about
    await expect(page).toHaveURL('/about');
  });

  test('closes drawer via built-in close button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByText('Find your perfect paw match')).toBeVisible();
    // Radix/shadcn renders a Close button with sr-only "Close" text
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('Find your perfect paw match')).toBeHidden();
  });

  test('active route link has doggy highlight', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    // Home link (index 0) should have the active border class
    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Home' });
    await expect(homeLink).toHaveClass(/border-doggy/);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add tests/mobile-nav.spec.ts playwright.config.ts package.json package-lock.json
git commit -m "test: add Playwright mobile nav tests"
```

---

## Task 5: Run tests in headed mode

**Files:** none (runtime only)

- [ ] **Step 1: Start the dev server in the background**

In a separate terminal:

```bash
npm run dev
```

Wait until you see `Ready in Xms` before running tests.

- [ ] **Step 2: Run Playwright headed so you can watch live**

```bash
npx playwright test --headed --project=iphone --slow-mo=500
```

Expected: Chromium opens at iPhone 14 size (390×844), each test runs with 500ms slow-mo. All 5 tests pass.

- [ ] **Step 3: Run desktop tests**

```bash
npx playwright test --headed --project=desktop --slow-mo=500
```

Expected: Desktop viewport (1280×800), 1 test passes.

- [ ] **Step 4: Take screenshots of key states**

```bash
npx playwright test --headed --project=iphone --slow-mo=500 --reporter=html
npx playwright show-report
```

This opens an HTML report with screenshots attached to each test.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address any issues found during Playwright testing"
```

---

## Self-Review Checklist (pre-implementation)

- [x] Sheet component install covered (Task 1)
- [x] `@keyframes fade-up` + `--animate-fade-up` covered (Task 2)
- [x] Morphing X hamburger with 3 `<span>` bars covered (Task 3)
- [x] Sheet side="right", width 280px, dark background covered (Task 3)
- [x] Icons (Home/Info/Images/Scissors) with active/inactive colors covered (Task 3)
- [x] Stagger animation with `animationDelay` per index covered (Task 3)
- [x] Active link: `border-doggy bg-doggy/10` covered (Task 3)
- [x] Auto-close on link click covered (Task 3)
- [x] Branded header + footer tagline covered (Task 3)
- [x] Desktop auth buttons hidden on mobile (`hidden ... md:block`) covered (Task 3)
- [x] Playwright install + config covered (Task 4)
- [x] All 5 test cases from spec covered (Task 4)
- [x] Headed mode `--slow-mo=500` covered (Task 5)
- [x] No placeholders, no TBDs, complete code in every step
