# Date & Time Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native `datetime-local` input in the booking modal with a polished custom calendar + fixed hourly time slot picker that matches ProjectPaw's dark theme.

**Architecture:** Build `components/date-time-picker.tsx` — a fully self-contained component with a custom calendar grid (pure React, no new npm deps) and a `createPortal`-based popover so it renders above the modal. Swap it into `components/booking-modal.tsx` replacing the `datetime-local` input. The output value is the same ISO string format (`"YYYY-MM-DDTHH:MM"`) so no API or validation changes are needed.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, React `createPortal`, `lucide-react` (already installed), `cn` from `@/lib/utils`

---

## Files

| Action | Path                              |
| ------ | --------------------------------- |
| Create | `components/date-time-picker.tsx` |
| Modify | `components/booking-modal.tsx`    |

---

### Task 1: Create the DateTimePicker component

**Files:**

- Create: `components/date-time-picker.tsx`

- [ ] **Step 1: Create the file with the full component**

```typescript
// components/date-time-picker.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_SLOTS = [
  { label: '9 AM',  hour: 9  },
  { label: '10 AM', hour: 10 },
  { label: '11 AM', hour: 11 },
  { label: '12 PM', hour: 12 },
  { label: '1 PM',  hour: 13 },
  { label: '2 PM',  hour: 14 },
  { label: '3 PM',  hour: 15 },
  { label: '4 PM',  hour: 16 },
  { label: '5 PM',  hour: 17 },
  { label: '6 PM',  hour: 18 },
];

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  minDate?: Date;
}

function toIsoLocal(date: Date, hour: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:00`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, min: Date): boolean {
  const ac = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const mc = new Date(min.getFullYear(), min.getMonth(), min.getDate());
  return ac < mc;
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingNulls: null[] = Array(first.getDay()).fill(null);
  const days: Date[] = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1),
  );
  return [...leadingNulls, ...days];
}

export function DateTimePicker({
  value,
  onChange,
  error,
  minDate,
}: DateTimePickerProps) {
  const min = minDate ?? new Date();
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const currentHour = now.getHours();
  const isToday = selectedDate ? sameDay(selectedDate, now) : false;
  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  const openPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 400;
    const top =
      spaceBelow < estimatedHeight && rect.top > estimatedHeight
        ? rect.top - estimatedHeight - 6
        : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 280));
    setPopoverPos({ top, left, width: rect.width });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(date: Date) {
    if (isBeforeDay(date, min)) return;
    setSelectedDate(date);
    setSelectedHour(null);
    setSelectedLabel('');
  }

  function handleSlotClick(hour: number, label: string) {
    if (!selectedDate) return;
    setSelectedHour(hour);
    setSelectedLabel(label);
    onChange(toIsoLocal(selectedDate, hour));
    setOpen(false);
  }

  const triggerText = (() => {
    if (!selectedDate || selectedHour === null) return null;
    const wd = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    const mo = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    return `${wd}, ${mo} ${selectedDate.getDate()} · ${selectedLabel}`;
  })();

  const popoverContent = (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: popoverPos.top,
        left: popoverPos.left,
        minWidth: Math.max(popoverPos.width, 272),
        zIndex: 9999,
      }}
      className="w-[272px] rounded-2xl border border-paw/[0.12] bg-[#1a1612] p-4 shadow-2xl shadow-black/70 animate-fade-in"
    >
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-paw/[0.1] bg-paw/[0.04] p-1.5 text-paw/50 transition-colors duration-150 hover:bg-paw/[0.08] hover:text-paw"
        >
          <ChevronLeft className="size-3.5" strokeWidth={2} />
        </button>
        <span className="font-pawprint text-[11px] font-semibold text-paw/75">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-paw/[0.1] bg-paw/[0.04] p-1.5 text-paw/50 transition-colors duration-150 hover:bg-paw/[0.08] hover:text-paw"
        >
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="font-pawprint text-[9px] font-semibold uppercase tracking-[0.1em] text-paw/25"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar day grid */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const disabled = isBeforeDay(date, min);
          const selected = selectedDate ? sameDay(date, selectedDate) : false;
          const todayDate = sameDay(date, now);
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(date)}
              className={cn(
                'mx-auto flex size-7 items-center justify-center rounded-full font-pawprint text-[11px] transition-all duration-150',
                selected
                  ? 'bg-doggy font-semibold text-white'
                  : disabled
                    ? 'cursor-not-allowed text-paw/[0.18]'
                    : todayDate
                      ? 'cursor-pointer text-paw ring-1 ring-accent/40 hover:bg-paw/[0.08]'
                      : 'cursor-pointer text-paw/65 hover:bg-paw/[0.08] hover:text-paw',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <hr className="my-3 border-paw/[0.07]" />

      {/* Time label */}
      <p className="mb-2 font-pawprint text-[9px] font-semibold uppercase tracking-[0.13em] text-paw/30">
        {selectedDate ? 'Select Time' : 'Pick a date first'}
      </p>

      {/* Time slot grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {TIME_SLOTS.map(({ label, hour }) => {
          const slotDisabled = !selectedDate || (isToday && hour <= currentHour);
          const active = selectedHour === hour;
          return (
            <button
              key={hour}
              type="button"
              disabled={slotDisabled}
              onClick={() => handleSlotClick(hour, label)}
              className={cn(
                'rounded-lg py-1.5 font-pawprint text-[10px] font-medium transition-all duration-150',
                active
                  ? 'bg-doggy text-white'
                  : slotDisabled
                    ? 'cursor-not-allowed text-paw/[0.18]'
                    : 'cursor-pointer border border-paw/[0.1] text-paw/60 hover:border-doggy/40 hover:bg-doggy/[0.07] hover:text-paw',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={openPopover}
        className={cn(
          'w-full rounded-xl border bg-paw/[0.03] px-4 py-3',
          'flex items-center justify-between gap-3',
          'font-pawprint text-sm outline-none transition-all duration-300',
          'focus:ring-2 focus:ring-doggy/15',
          open
            ? 'border-doggy/60 bg-paw/[0.05] ring-2 ring-doggy/15'
            : error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10'
              : 'border-paw/[0.1] hover:border-paw/25',
        )}
      >
        {triggerText ? (
          <span className="text-paw">{triggerText}</span>
        ) : (
          <span className="text-paw/25">Select date &amp; time</span>
        )}
        <CalendarIcon className="size-4 shrink-0 text-doggy/50" strokeWidth={1.5} />
      </button>

      {mounted && open && createPortal(popoverContent, document.body)}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors related to `date-time-picker.tsx`. If you see "Cannot find module 'react-dom'" errors, that means React 19 types need updating — this is fine, `createPortal` is available in React 19.

- [ ] **Step 3: Start dev server and open the booking modal**

Run:

```bash
npm run dev
```

Open http://localhost:3000, go to Services, click "Book Now" on any service (must be logged in).

Expected: The "Date & Time" field shows a button with "Select date & time" placeholder. Clicking it opens the popover with a calendar grid and time slots.

- [ ] **Step 4: Commit**

```bash
git add components/date-time-picker.tsx
git commit -m "feat(picker): add custom DateTimePicker component with calendar grid and hourly slots"
```

---

### Task 2: Wire DateTimePicker into BookingModal

**Files:**

- Modify: `components/booking-modal.tsx`

Context: The booking modal currently has a `datetime-local` input at lines 304–327. The `minDatetime` const at line 73 is also no longer needed.

- [ ] **Step 1: Add the import at the top of booking-modal.tsx**

In `components/booking-modal.tsx`, add this import after the last existing import line (currently line 8):

```typescript
import { DateTimePicker } from '@/components/date-time-picker';
```

- [ ] **Step 2: Remove the minDatetime const**

Delete line 73:

```typescript
const minDatetime = new Date().toISOString().slice(0, 16);
```

- [ ] **Step 3: Replace the datetime-local FieldWrapper block**

Find this block (lines 304–327 in the original file):

```tsx
<FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
  <input
    id="datetime"
    type="datetime-local"
    min={minDatetime}
    value={datetime}
    onChange={(e) => {
      setDatetime(e.target.value);
      setFieldErrors((fe) => ({ ...fe, datetime: undefined }));
    }}
    onBlur={(e) => {
      const err = validateBookingField('datetime', e.target.value);
      setFieldErrors((fe) => ({ ...fe, datetime: err }));
    }}
    className={cn(
      inputClass,
      fieldErrors.datetime && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
    )}
    style={{ colorScheme: 'dark' }}
  />
  {fieldErrors.datetime && (
    <p className="font-pawprint text-xs text-red-400">{fieldErrors.datetime}</p>
  )}
</FieldWrapper>
```

Replace it with:

```tsx
<FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
  <DateTimePicker
    value={datetime}
    onChange={(v) => {
      setDatetime(v);
      setFieldErrors((fe) => ({ ...fe, datetime: undefined }));
    }}
    error={!!fieldErrors.datetime}
  />
  {fieldErrors.datetime && (
    <p className="font-pawprint text-xs text-red-400">{fieldErrors.datetime}</p>
  )}
</FieldWrapper>
```

- [ ] **Step 4: Verify TypeScript is clean**

Run:

```bash
npx tsc --noEmit
```

Expected: 0 errors. If `minDatetime` still appears in a TypeScript error, search for any remaining references and remove them.

- [ ] **Step 5: Visual test in browser**

With dev server running (http://localhost:3000), go to Services and open any booking modal.

Test these flows:

1. Click "Date & Time" field → popover opens with calendar
2. Click a future date → date is highlighted in purple, time slots activate
3. Click a time slot → popover closes, trigger shows "Wed, May 21 · 10 AM" format
4. Click submit without selecting → red border appears on trigger + error message shows
5. Navigate to previous month → prev month button works, can't go before current month
6. Click today → today has yellow ring, past hours are greyed out

- [ ] **Step 6: Commit**

```bash
git add components/booking-modal.tsx
git commit -m "feat(booking): replace datetime-local with DateTimePicker popover"
```

---

### Task 3: Playwright visual verification

**Files:**

- Test script (temp, auto-cleaned): `/tmp/playwright-test-datepicker.js`

- [ ] **Step 1: Write the Playwright test**

Write this file to `/tmp/playwright-test-datepicker.js`:

```javascript
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';
const EMAIL = 'ashkan861@gmail.com';
const PASSWORD = 'Motorola100!';
const SKILL_DIR =
  'C:/Users/ashka/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();

  // Log in
  await p.goto(TARGET_URL + '/login');
  await p.waitForLoadState('networkidle');
  await p.fill('input[type="email"]', EMAIL);
  await p.fill('input[type="password"]', PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);

  // Open services page and click first Book Now
  await p.goto(TARGET_URL + '/services');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);

  const viewports = [
    { name: 'iPhone-14', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 900 },
  ];

  for (const vp of viewports) {
    await p.setViewportSize({ width: vp.width, height: vp.height });
    await p.waitForTimeout(300);

    // Open booking modal
    const bookBtn = p.locator('button', { hasText: 'Book Now' }).first();
    await bookBtn.click();
    await p.waitForTimeout(500);

    // Check trigger renders
    const triggerVisible = await p
      .locator('button:has-text("Select date")')
      .isVisible()
      .catch(() => false);

    // Click the date picker trigger
    await p.locator('button:has-text("Select date")').click();
    await p.waitForTimeout(400);

    // Check popover opened (calendar grid visible)
    const calendarVisible = await p
      .locator(
        'text=January, February, March, April, May, June, July, August, September, October, November, December',
      )
      .isVisible()
      .catch(() => {
        // Try checking for Su Mo headers
        return p
          .locator('div:has-text("Su")')
          .isVisible()
          .catch(() => false);
      });

    // Click a future date (20th of current displayed month)
    const dayButtons = p.locator('[style*="fixed"] button').filter({ hasText: '20' });
    const dayCount = await dayButtons.count();
    if (dayCount > 0) {
      await dayButtons.first().click();
      await p.waitForTimeout(300);
    }

    // Click a time slot (10 AM)
    const slot10am = p.locator('[style*="fixed"] button:has-text("10 AM")');
    const slotVisible = await slot10am.isVisible().catch(() => false);
    if (slotVisible) {
      await slot10am.click();
      await p.waitForTimeout(400);
    }

    // Check trigger now shows selection (popover should be closed)
    const triggerFilled = await p
      .locator('button')
      .filter({ hasText: /·\s*10 AM/ })
      .isVisible()
      .catch(() => false);

    await p.screenshot({ path: `C:/Users/ashka/AppData/Local/Temp/datepicker-${vp.name}.png` });
    console.log(`\n${vp.name} (${vp.width}px):`);
    console.log(`  Trigger renders: ${triggerVisible ? '✅' : '❌'}`);
    console.log(`  Popover opens: ${calendarVisible ? '✅' : '❌'}`);
    console.log(`  Slot selectable: ${slotVisible ? '✅' : '❌'}`);
    console.log(`  Trigger shows selection: ${triggerFilled ? '✅' : '❌'}`);
    console.log(`  📸 Screenshot saved`);

    // Close modal for next iteration
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
  }

  await browser.close();
  console.log('\nDone.');
})();
```

- [ ] **Step 2: Run the test**

```bash
cd "C:/Users/ashka/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill" && node /tmp/playwright-test-datepicker.js
```

Expected output (all ✅ on each viewport):

```
iPhone-14 (390px):
  Trigger renders: ✅
  Popover opens: ✅
  Slot selectable: ✅
  Trigger shows selection: ✅
  📸 Screenshot saved

iPad (768px):
  ...all ✅...

Desktop (1280px):
  ...all ✅...

Done.
```

- [ ] **Step 3: Fix any failures, then push to main**

If all viewports pass:

```bash
git push origin main
```

If a viewport fails: read the screenshot at `C:/Users/ashka/AppData/Local/Temp/datepicker-<name>.png`, identify the layout issue, fix it in `components/date-time-picker.tsx`, and re-run the test.
