# Dashboard + Bookings Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Supabase `bookings` table, persist bookings on every email confirmation, and build a `/dashboard` page where logged-in users see their booking history.

**Architecture:** A Supabase service role client handles all server-side DB writes (bypasses RLS safely). The `/api/bookings/email` route is updated to insert a row after sending the email. A new `GET /api/bookings` route reads the authenticated user's bookings. The `/dashboard` client component fetches from that route and renders a stats row + booking list.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (service role for writes, RLS for reads), Tailwind CSS v4, shadcn/ui, Playwright (e2e)

---

## File Map

| Action | Path                                           | Responsibility                                   |
| ------ | ---------------------------------------------- | ------------------------------------------------ |
| Create | `lib/supabase-admin.ts`                        | Service role Supabase client — server-side only  |
| Modify | `.env.local`                                   | Add `SUPABASE_SERVICE_ROLE_KEY`                  |
| Modify | `app/api/bookings/email/route.ts`              | Also insert booking row after sending email      |
| Create | `app/api/bookings/route.ts`                    | GET — return authenticated user's bookings       |
| Create | `app/dashboard/page.tsx`                       | Client component: stats + booking list           |
| Create | `app/dashboard/loading.tsx`                    | Skeleton matching stats + list layout            |
| Modify | `components/nav-bar.tsx`                       | Dashboard link (desktop + mobile) when logged in |
| Create | `C:\Windows\Temp\playwright-test-dashboard.js` | E2E test: login → book → view dashboard          |

---

## Task 1: Get Service Role Key + Update .env.local

**Files:**

- Modify: `.env.local`

> **Manual step (user must do this):**
>
> 1. Go to https://supabase.com/dashboard/project/ncxaphqjduzjybptbict/settings/api-keys
> 2. Under **Secret keys**, copy the `service_role` key (starts with `eyJ...`)
> 3. Add it to `.env.local`

- [ ] **Step 1: Add service role key to .env.local**

Append this line to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key_here...
```

> **Security note:** This key bypasses all RLS. It must NEVER be used in client-side code and must NEVER be prefixed with `NEXT_PUBLIC_`.

- [ ] **Step 2: Verify .env.local has all four keys**

The file should contain exactly:

```
NEXT_PUBLIC_SUPABASE_URL=https://ncxaphqjduzjybptbict.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MlGCrKqa4NfCMHyuHDdr3Q_JOHjQqyj
SMTP_USER=ashkan861@gmail.com
SMTP_PASS=giepemumtikemxyf
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Task 2: Create Bookings Table in Supabase

**Files:** (no code files — SQL run in Supabase dashboard)

> **Manual step (user must do this):**
>
> 1. Go to https://supabase.com/dashboard/project/ncxaphqjduzjybptbict/sql/new
> 2. Paste and run the SQL below

- [ ] **Step 1: Run this SQL in the Supabase SQL editor**

```sql
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id text not null,
  service_name text not null,
  dog_name text not null,
  datetime timestamptz not null,
  notes text,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "Users can read own bookings"
  on bookings for select
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Verify in Supabase Table Editor**

Navigate to https://supabase.com/dashboard/project/ncxaphqjduzjybptbict/editor and confirm the `bookings` table exists with the columns above.

---

## Task 3: Create Service Role Supabase Client

**Files:**

- Create: `lib/supabase-admin.ts`

- [ ] **Step 1: Create lib/supabase-admin.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase-admin.ts .env.local
git commit -m "feat(db): add service role supabase client and bookings table"
```

> Note: `.env.local` is in `.gitignore` — `git add` will silently skip it. That's correct — never commit secrets.

---

## Task 4: Update Email Route to Insert Booking

**Files:**

- Modify: `app/api/bookings/email/route.ts`

The current route sends the email and returns. Add a DB insert using `supabaseAdmin` after the email sends. If the insert fails, log it but still return success (email already sent).

- [ ] **Step 1: Update app/api/bookings/email/route.ts**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const { serviceId, serviceName, dogName, datetime, notes } = (await req.json()) as {
    serviceId: string;
    serviceName: string;
    dogName: string;
    datetime: string;
    notes?: string;
  };

  const formattedDate = new Date(datetime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #A67C52); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">🐾 Booking Confirmed!</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">Hi there! Your booking for <strong>${dogName}</strong> is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Dog</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${dogName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
          ${notes ? `<tr><td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Notes</td><td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${notes}</td></tr>` : ''}
        </table>
        <p style="margin: 32px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">Questions? Reply to this email anytime.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Confirmed — ${serviceName} for ${dogName}`,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ message: 'Failed to send confirmation email.' }, { status: 500 });
  }

  // Persist booking to DB — non-blocking failure (email already sent)
  const { error: insertError } = await supabaseAdmin.from('bookings').insert({
    user_id: user.id,
    service_id: serviceId,
    service_name: serviceName,
    dog_name: dogName,
    datetime,
    notes: notes ?? null,
  });

  if (insertError) {
    console.error('Booking insert error:', insertError);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/bookings/email/route.ts
git commit -m "feat(db): persist booking to supabase on confirmation"
```

---

## Task 5: Create GET /api/bookings Route

**Files:**

- Create: `app/api/bookings/route.ts`

- [ ] **Step 1: Create app/api/bookings/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Booking = {
  id: string;
  service_id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, service_id, service_name, dog_name, datetime, notes, status, created_at')
    .eq('user_id', user.id)
    .order('datetime', { ascending: false });

  if (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings.' }, { status: 500 });
  }

  return NextResponse.json({ bookings: (data ?? []) as Booking[] });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/bookings/route.ts
git commit -m "feat(api): add GET /api/bookings for authenticated user"
```

---

## Task 6: Create Dashboard Loading Skeleton

**Files:**

- Create: `app/dashboard/loading.tsx`

- [ ] **Step 1: Create app/dashboard/loading.tsx**

```typescript
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-paw/10" />
        <div className="h-4 w-64 animate-pulse rounded bg-paw/[0.06]" />
      </div>

      {/* Stats row skeleton */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6">
            <div className="mb-2 h-8 w-10 rounded bg-paw/10" />
            <div className="h-3 w-20 rounded bg-paw/[0.06]" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-paw/10" />
                <div className="h-3 w-48 rounded bg-paw/[0.06]" />
              </div>
              <div className="h-6 w-20 rounded-full bg-paw/10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/loading.tsx
git commit -m "feat(dashboard): add loading skeleton"
```

---

## Task 7: Create Dashboard Page

**Files:**

- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create app/dashboard/page.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
};

function statusBadge(datetime: string) {
  const isUpcoming = new Date(datetime) > new Date();
  return isUpcoming
    ? { label: 'Upcoming', className: 'bg-doggy/20 text-doggy' }
    : { label: 'Completed', className: 'bg-paw/10 text-paw/50' };
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load bookings');
        return res.json() as Promise<{ bookings: Booking[] }>;
      })
      .then(({ bookings }) => setBookings(bookings))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [user, token, router]);

  if (loading) return null; // loading.tsx handles this

  const lastService = bookings[0]?.service_name ?? '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-elegant text-3xl font-black text-paw">
          Hi, {user?.name} 👋
        </h1>
        <p className="mt-1 font-pawprint text-sm text-paw/50">Your booking history</p>
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-3xl font-black text-accent">{bookings.length}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Total Bookings</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-doggy">{lastService}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Last Service</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-emerald-400">Active</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Status</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-pawprint text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && bookings.length === 0 && (
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-8 py-16 text-center">
          <p className="mb-2 font-elegant text-xl text-paw/60">No bookings yet</p>
          <p className="mb-6 font-pawprint text-sm text-paw/40">
            Book your first service and it will appear here.
          </p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50"
          >
            Book Your First Service
          </Link>
        </div>
      )}

      {/* Booking list */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="mb-4 font-elegant text-lg font-bold text-paw/70">Recent Bookings</h2>
          {bookings.map((booking) => {
            const badge = statusBadge(booking.datetime);
            const formatted = new Date(booking.datetime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4"
              >
                <div>
                  <p className="font-pawprint text-sm font-semibold text-paw">
                    {booking.service_name}
                    <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                  </p>
                  <p className="mt-0.5 font-pawprint text-xs text-paw/40">{formatted}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-pawprint text-xs font-semibold',
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): add booking history page with stats and list"
```

---

## Task 8: Add Dashboard Link to NavBar

**Files:**

- Modify: `components/nav-bar.tsx`

Two places need the Dashboard link: the desktop nav (right side, between the greeting and logout button) and the mobile Sheet drawer (in the nav links list).

- [ ] **Step 1: Add LayoutDashboard icon import**

In `components/nav-bar.tsx`, update the lucide-react import to include `LayoutDashboard`:

```typescript
import { PawPrint, Home, Info, Images, Scissors, LayoutDashboard } from 'lucide-react';
```

- [ ] **Step 2: Add Dashboard link to desktop auth section**

Replace the desktop auth block (the `{user ? (...)  : (...)}` block inside the `hidden md:flex` div) with:

```tsx
{
  user ? (
    <>
      <span className="hidden font-pawprint text-sm font-medium text-paw/70 md:block">
        Hi, <span className="text-paw">{user.name}</span>
      </span>
      <Link
        href="/dashboard"
        className={cn(
          'hidden items-center gap-1.5 rounded-lg border border-paw/15 px-4 py-2 font-pawprint text-xs font-semibold transition-all duration-300 hover:border-paw/35 hover:bg-paw/[0.04] md:flex',
          pathname === '/dashboard' ? 'border-doggy/40 text-doggy' : 'text-paw/70 hover:text-paw',
        )}
      >
        <LayoutDashboard size={13} />
        Dashboard
      </Link>
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
  );
}
```

- [ ] **Step 3: Add Dashboard link to mobile Sheet drawer nav list**

In the mobile `<ul>` that maps `NAV_LINKS`, add a Dashboard link after the list — only when user is logged in. After the closing `</ul>` in the mobile nav section, add:

```tsx
{
  user && (
    <li>
      <Link
        href="/dashboard"
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
          pathname === '/dashboard'
            ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
            : 'border-l-2 border-transparent text-paw/60 hover:bg-paw/[0.04] hover:text-paw',
        )}
      >
        <LayoutDashboard
          size={18}
          className={cn(pathname === '/dashboard' ? 'text-doggy' : 'text-paw/40')}
        />
        Dashboard
      </Link>
    </li>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/nav-bar.tsx
git commit -m "feat(nav): add dashboard link for logged-in users"
```

---

## Task 9: End-to-End Playwright Test

**Files:**

- Create: `C:\Windows\Temp\playwright-test-dashboard.js`

- [ ] **Step 1: Write the Playwright test**

```javascript
// C:\Windows\Temp\playwright-test-dashboard.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const EMAIL = 'ashkan861@gmail.com';
const PASSWORD = 'Motorola100!';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Login
  console.log('Step 1: Logging in...');
  await page.goto(`${TARGET_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="email"]', EMAIL);
  await page.fill('input[id="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/services', { timeout: 8000 });
  console.log('✅ Logged in');

  // 2. Verify Dashboard link appears in nav
  console.log('Step 2: Checking Dashboard nav link...');
  const dashLink = page.locator('a[href="/dashboard"]').first();
  await dashLink.waitFor({ timeout: 5000 });
  console.log('✅ Dashboard link visible in nav');
  await page.screenshot({ path: 'C:\\Windows\\Temp\\dashboard-nav.png' });

  // 3. Book a service
  console.log('Step 3: Booking a service...');
  const bookBtn = page.locator('button:has-text("Book Now")').first();
  await bookBtn.waitFor({ timeout: 5000 });
  await bookBtn.click();
  await page.waitForSelector('input[id="dogName"]', { timeout: 5000 });
  await page.fill('input[id="dogName"]', 'Buddy');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  await page.fill('input[id="datetime"]', tomorrow.toISOString().slice(0, 16));
  await page.fill('textarea[id="notes"]', 'Dashboard test booking');
  await page.click('button[type="submit"]');
  try {
    await page.waitForSelector('text=Booking Confirmed', { timeout: 10000 });
    console.log('✅ Booking confirmed');
  } catch {
    console.log('❌ Booking confirmation not shown');
    await page.screenshot({ path: 'C:\\Windows\\Temp\\dashboard-booking-error.png' });
    await browser.close();
    return;
  }

  // 4. Navigate to /dashboard
  console.log('Step 4: Navigating to /dashboard...');
  await page.goto(`${TARGET_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:\\Windows\\Temp\\dashboard-page.png' });
  console.log('✅ Dashboard loaded');

  // 5. Verify booking appears
  console.log('Step 5: Checking booking appears in list...');
  try {
    await page.waitForSelector('text=Buddy', { timeout: 8000 });
    console.log('✅ Booking visible in dashboard list');
    await page.screenshot({ path: 'C:\\Windows\\Temp\\dashboard-with-booking.png' });
  } catch {
    console.log('❌ Booking not found in dashboard');
    await page.screenshot({ path: 'C:\\Windows\\Temp\\dashboard-empty.png' });
  }

  // 6. Verify stats row
  const statsCount = await page.locator('text=Total Bookings').count();
  console.log(statsCount > 0 ? '✅ Stats row visible' : '❌ Stats row missing');

  // 7. Test unauthenticated redirect
  console.log('Step 6: Testing auth guard (open incognito)...');
  const incognito = await browser.newContext();
  const guardPage = await incognito.newPage();
  await guardPage.goto(`${TARGET_URL}/dashboard`);
  await guardPage.waitForURL('**/login', { timeout: 5000 });
  console.log('✅ Unauthenticated user redirected to /login');
  await incognito.close();

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\n🎉 All dashboard tests complete. Check screenshots in C:\\Windows\\Temp\\');
})();
```

- [ ] **Step 2: Run the test**

```bash
cd C:\Users\ashka\.claude\plugins\cache\playwright-skill\playwright-skill\4.1.0\skills\playwright-skill
node run.js C:\Windows\Temp\playwright-test-dashboard.js
```

Expected output:

```
✅ Logged in
✅ Dashboard link visible in nav
✅ Booking confirmed
✅ Dashboard loaded
✅ Booking visible in dashboard list
✅ Stats row visible
✅ Unauthenticated user redirected to /login
🎉 All dashboard tests complete.
```

---

## Task 10: Final Commit + Ruflo Brain Update

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any errors before committing.

- [ ] **Step 2: Final commit**

```bash
git add -p
git commit -m "feat(dashboard): bookings table, history page, nav link, e2e test"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

- [ ] **Step 4: Store to Ruflo**

Call `mcp__ruflo__agentdb_pattern-store` with:

- Pattern: Dashboard + Bookings DB feature pattern for ProjectPaw
- What was built: bookings table in Supabase, service role client, email route updated to persist, GET /api/bookings, /dashboard page with stats + list, nav link

Call `mcp__ruflo__memory_store` (namespace: `projectpaw`) with:

- bookings table schema, RLS policy, service role key usage pattern, dashboard layout decisions, status badge logic

---

## Reminders

- **Re-enable email confirmation in Supabase** before going to production:
  https://supabase.com/dashboard/project/ncxaphqjduzjybptbict/auth/providers
- **Deferred:** Add address/phone field to user profile (user acknowledged, not in this feature)
