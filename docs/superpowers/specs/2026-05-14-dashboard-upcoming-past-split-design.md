# Dashboard Upcoming/Past Split Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the dashboard booking list to surface the next appointment as a hero card, with remaining upcoming bookings compact below it, and past/cancelled history dimmed at the bottom.

**Architecture:** Pure UI change to `app/dashboard/page.tsx` — no API or schema changes required. The existing `GET /api/bookings` response already contains all needed data (`datetime`, `status`, `service_name`, `dog_name`, `service_id`). Data is split client-side using the existing `now` comparison.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, existing ProjectPaw tokens (`doggy`, `paw`, `accent`, `font-elegant`, `font-pawprint`)

---

## Layout Sections

### 1. Stats Row (updated)
Three stat cards remain. The middle card changes from "Last Service" to **"Next Up"** — shows the service name of the hero booking (the soonest upcoming confirmed booking), or `—` if none.

### 2. Hero Card (next upcoming booking)
- Soonest upcoming booking (non-cancelled, datetime > now) gets a featured card
- Purple-tinted background: `bg-gradient-to-br from-doggy/[0.12] to-doggy/[0.04]` with `border-doggy/[0.2]`
- Shows: service name (large, `font-elegant`), dog name, formatted date/time, and a countdown label ("3 days away" / "Tomorrow" / "Today")
- Cancel button inside the card (same style as current)
- `animate-fade-in` on mount

### 3. Also Upcoming (compact list)
- All remaining upcoming bookings (confirmed, datetime > now, excluding the hero)
- Smaller cards, same border style as current booking rows
- Cancel button present on each
- Label: `ALSO UPCOMING` in small uppercase tracking text
- If only one upcoming booking exists, this section is hidden (hero card only)

### 4. Past & Cancelled (history section)
- All bookings where `status === 'cancelled'` OR `datetime <= now`
- Cards rendered at `opacity-60`, darker background (`bg-[#141210]`), no Cancel button
- Rebook button on each
- Cancelled bookings show red badge; completed show muted tan badge
- Section label: `HISTORY` in small uppercase tracking text
- If no past bookings, section is hidden entirely

### 5. Empty State (no bookings at all)
- Unchanged from current: friendly message + "Book Your First Service" CTA → `/services`

### 6. Empty Upcoming State (has past but no upcoming)
- New state: "No upcoming bookings" message inside a subtle card above the history section
- CTA: "Book Again →" linking to `/services`

---

## Data Logic

```typescript
const now = new Date();
const upcoming = bookings.filter(
  (b) => b.status !== 'cancelled' && new Date(b.datetime) > now
).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

const past = bookings.filter(
  (b) => b.status === 'cancelled' || new Date(b.datetime) <= now
).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()); // newest first

const heroBooking = upcoming[0] ?? null;
const alsoUpcoming = upcoming.slice(1);
```

## Countdown Helper

```typescript
function daysAway(datetime: string): string {
  const diff = Math.ceil(
    (new Date(datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days away`;
}
```

---

## Files Changed

- **Modify:** `app/dashboard/page.tsx` — split booking list into hero + compact upcoming + history sections, update stats row middle card, add empty-upcoming state
- **No other files changed**

---

## Testing

After implementation, run Playwright across Galaxy S20 (360px), iPhone 14 (390px), iPad (768px), Desktop (1280px) and verify:
- Hero card renders correctly with countdown
- Cancel works from hero card and also-upcoming rows
- Rebook works from history rows
- Empty state shows when no bookings
- Empty-upcoming state shows when only past bookings exist
- Stats "Next Up" shows correct service name
