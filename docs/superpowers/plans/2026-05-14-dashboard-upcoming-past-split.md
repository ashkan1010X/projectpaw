# Dashboard Upcoming/Past Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `app/dashboard/page.tsx` to show the next upcoming booking as a hero card, remaining upcoming bookings in a compact list below, and past/cancelled bookings dimmed at the bottom — matching Option C from the design session.

**Architecture:** Pure UI change to one file. `GET /api/bookings` already returns all needed data. Data is split client-side by comparing `datetime` to `now` and checking `status`. No API or schema changes required.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, ProjectPaw tokens (`doggy` = #B2A4FF, `paw` = #F5CBA7, `accent` = #F9D923, `font-elegant` = Playfair Display, `font-pawprint` = Baloo 2, dark bg = `#0f0d09`, card bg = `#1a1612`, deeper bg = `#141210`)

---

## Codebase Context

The file to modify is `app/dashboard/page.tsx`. Read it before starting. Key things to know:

- `Booking` type: `{ id, service_id, service_name, dog_name, datetime, notes, status }`
- `statusBadge(booking, now)` helper already exists — keep it
- `handleCancel(booking)` already exists — keep it unchanged
- `rebookTarget` state and `BookingModal` already exist — keep them unchanged
- `pendingCancelBooking` state and `ConfirmDialog` already exist — keep them unchanged
- `cancellingId` and `cancelErrors` already exist — keep them unchanged
- The existing booking list is inside `{bookings.length > 0 && (...)}` — this is what gets replaced
- Stats row: middle card currently shows "Last Service" / `lastService` — this changes to "Next Up"
- Import alias `@/` maps to project root

---

## Task 1: Add data-splitting logic and countdown helper

**Files:**

- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add the `daysAway` helper function**

Add this function just above `function DashboardSkeleton()` (before the component definitions, after the `statusBadge` function):

```typescript
function daysAway(datetime: string): string {
  const diff = Math.ceil((new Date(datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days away`;
}
```

- [ ] **Step 2: Replace the `lastService` derived value with split arrays**

Find this line in `DashboardPage` (currently around line 151):

```typescript
const lastService = bookings[0]?.service_name ?? '—';
```

Replace it with:

```typescript
const now = new Date();

const upcoming = bookings
  .filter((b) => b.status !== 'cancelled' && new Date(b.datetime) > now)
  .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

const past = bookings
  .filter((b) => b.status === 'cancelled' || new Date(b.datetime) <= now)
  .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

const heroBooking = upcoming[0] ?? null;
const alsoUpcoming = upcoming.slice(1);
const nextUpLabel = heroBooking?.service_name ?? '—';
```

- [ ] **Step 3: Update the stats row middle card**

Find this block in the stats row (currently around line 167):

```tsx
<div className="hidden rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:block sm:p-6">
  <div className="truncate font-elegant text-xl font-black text-doggy">{lastService}</div>
  <div className="mt-1 font-pawprint text-xs text-paw/40">Last Service</div>
</div>
```

Replace with:

```tsx
<div className="hidden rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:block sm:p-6">
  <div className="truncate font-elegant text-xl font-black text-doggy">{nextUpLabel}</div>
  <div className="mt-1 font-pawprint text-xs text-paw/40">Next Up</div>
</div>
```

- [ ] **Step 4: Verify the file compiles**

```bash
cd C:/Users/ashka/OneDrive/Desktop/projectPaw && npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings, no new errors).

- [ ] **Step 5: Commit**

```bash
cd C:/Users/ashka/OneDrive/Desktop/projectPaw && git add app/dashboard/page.tsx && git commit -m "feat(dashboard): add booking split logic and countdown helper"
```

---

## Task 2: Replace booking list with hero + upcoming + history sections

**Files:**

- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Replace the entire booking list block**

Find and replace the entire `{bookings.length > 0 && (...)}` block that currently renders `<h2>Recent Bookings</h2>` and the flat booking map. Replace it with the three-section layout below.

The block to remove starts at:

```tsx
{/* Booking list */}
{bookings.length > 0 && (
  <div className="space-y-3">
    <h2 className="mb-4 font-elegant text-lg font-bold text-paw/70">Recent Bookings</h2>
    {(() => {
```

...and ends at the closing `)}` of the entire bookings block.

Replace the `{/* Booking list */}` block and the `{/* Empty state */}` block both with the following complete replacement (this handles all states):

```tsx
{
  /* Empty state — no bookings at all */
}
{
  !error && bookings.length === 0 && (
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
  );
}

{
  bookings.length > 0 && (
    <div className="space-y-8">
      {/* ── Hero: next upcoming booking ── */}
      {heroBooking ? (
        <div>
          <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-doggy/60">
            Next Appointment
          </p>
          <div className="space-y-1.5">
            <div className="rounded-2xl border border-doggy/[0.2] bg-gradient-to-br from-doggy/[0.1] to-doggy/[0.03] p-5 animate-fade-in">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-elegant text-xl font-black text-paw leading-tight">
                    {heroBooking.service_name}
                  </p>
                  <p className="mt-0.5 font-pawprint text-sm text-paw/55">{heroBooking.dog_name}</p>
                  <p className="mt-1.5 font-pawprint text-xs text-paw/40">
                    {new Date(heroBooking.datetime).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-pawprint text-xs font-semibold text-doggy/70">
                    {daysAway(heroBooking.datetime)}
                  </span>
                  <button
                    onClick={() => setPendingCancelBooking(heroBooking)}
                    disabled={cancellingId === heroBooking.id}
                    aria-label={`Cancel booking for ${heroBooking.service_name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancellingId === heroBooking.id ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      'Cancel'
                    )}
                  </button>
                </div>
              </div>
            </div>
            {cancelErrors[heroBooking.id] && (
              <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                {cancelErrors[heroBooking.id]}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Empty upcoming state — has past bookings but nothing upcoming */
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-6 py-8 text-center">
          <p className="mb-1 font-elegant text-lg text-paw/50">No upcoming bookings</p>
          <p className="mb-4 font-pawprint text-sm text-paw/30">Ready to book again?</p>
          <Link
            href="/services"
            className="inline-block rounded-lg border border-doggy/30 px-5 py-2 font-pawprint text-sm font-semibold text-doggy transition-all duration-300 hover:border-doggy/60 hover:bg-doggy/10"
          >
            Book Again →
          </Link>
        </div>
      )}

      {/* ── Also upcoming (compact) ── */}
      {alsoUpcoming.length > 0 && (
        <div>
          <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/35">
            Also Upcoming
          </p>
          <div className="space-y-2">
            {alsoUpcoming.map((booking) => (
              <div key={booking.id} className="space-y-1.5">
                <div className="flex flex-col gap-3 rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <div className="min-w-0">
                    <p className="font-pawprint text-sm font-semibold text-paw">
                      {booking.service_name}
                      <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                    </p>
                    <p className="mt-0.5 font-pawprint text-xs text-paw/40">
                      {new Date(booking.datetime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-pawprint text-xs font-semibold text-doggy/60">
                      {daysAway(booking.datetime)}
                    </span>
                    <button
                      onClick={() => setPendingCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                      aria-label={`Cancel booking for ${booking.service_name}`}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Cancelling…
                        </>
                      ) : (
                        'Cancel'
                      )}
                    </button>
                  </div>
                </div>
                {cancelErrors[booking.id] && (
                  <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                    {cancelErrors[booking.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── History (past + cancelled) ── */}
      {past.length > 0 && (
        <div>
          <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/25">
            History
          </p>
          <div className="space-y-2">
            {past.map((booking) => {
              const badge = statusBadge(booking, now);
              return (
                <div key={booking.id} className="space-y-1.5">
                  <div className="flex flex-col gap-3 rounded-xl border border-paw/[0.05] bg-[#141210] px-5 py-4 opacity-60 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    <div className="min-w-0">
                      <p className="font-pawprint text-sm font-semibold text-paw">
                        {booking.service_name}
                        <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                      </p>
                      <p className="mt-0.5 font-pawprint text-xs text-paw/40">
                        {new Date(booking.datetime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() =>
                          setRebookTarget({
                            serviceId: booking.service_id,
                            serviceName: booking.service_name,
                            dogName: booking.dog_name,
                          })
                        }
                        aria-label={`Rebook ${booking.service_name} for ${booking.dog_name}`}
                        className="rounded-lg border border-doggy/30 px-3 py-1 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10"
                      >
                        Rebook
                      </button>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 font-pawprint text-xs font-semibold',
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  {cancelErrors[booking.id] && (
                    <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                      {cancelErrors[booking.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles clean**

```bash
cd C:/Users/ashka/OneDrive/Desktop/projectPaw && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors, no import errors.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/ashka/OneDrive/Desktop/projectPaw && git add app/dashboard/page.tsx && git commit -m "feat(dashboard): hero next appointment + upcoming/history split"
```

---

## Task 3: Playwright verification across 4 viewports

**Files:**

- Create: `/tmp/playwright-test-dashboard-split.js` (temp, auto-cleaned)

- [ ] **Step 1: Write and run the Playwright test**

Write the following to `/tmp/playwright-test-dashboard-split.js` and run it with:

```bash
cd C:/Users/ashka/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill && node run.js /tmp/playwright-test-dashboard-split.js
```

```javascript
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';
const EMAIL = 'ashkan861@gmail.com';
const PASSWORD = 'Motorola100!';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();

  // Log in
  await p.goto(`${TARGET_URL}/login`);
  await p.waitForLoadState('networkidle');
  await p.fill('input[type="email"]', EMAIL);
  await p.fill('input[type="password"]', PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForURL('**/', { timeout: 8000 }).catch(() => {});

  // Go to dashboard
  await p.goto(`${TARGET_URL}/dashboard`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);

  const viewports = [
    { name: 'Galaxy-S20', width: 360, height: 800 },
    { name: 'iPhone-14', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 900 },
  ];

  for (const vp of viewports) {
    await p.setViewportSize({ width: vp.width, height: vp.height });
    await p.waitForTimeout(300);

    const heroVisible = await p
      .locator('text=Next Appointment')
      .isVisible()
      .catch(() => false);
    const historyVisible = await p
      .locator('text=History')
      .isVisible()
      .catch(() => false);
    const nextUpStat = await p
      .locator('text=Next Up')
      .isVisible()
      .catch(() => false);

    console.log(`\n${vp.name} (${vp.width}px):`);
    console.log(`  "Next Appointment" section: ${heroVisible ? '✅' : '❌'}`);
    console.log(`  "History" section: ${historyVisible ? '✅' : '❌'}`);
    console.log(`  "Next Up" stat card: ${nextUpStat ? '✅' : '❌'}`);

    await p.screenshot({ path: `C:/Users/ashka/AppData/Local/Temp/dashboard-${vp.name}.png` });
    console.log(`  📸 Screenshot saved`);
  }

  await browser.close();
  console.log('\nDone.');
})();
```

Expected output per viewport:

```
Galaxy-S20 (360px):
  "Next Appointment" section: ✅
  "History" section: ✅
  "Next Up" stat card: ✅
```

- [ ] **Step 2: Fix any layout issues found, then push**

```bash
cd C:/Users/ashka/OneDrive/Desktop/projectPaw && git push origin main
```
