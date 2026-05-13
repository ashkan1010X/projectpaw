# Dashboard + Bookings Table — Design Spec

**Date:** 2026-05-12  
**Status:** Approved  
**Feature:** Bookings DB table in Supabase + `/dashboard` page for logged-in users

---

## 1. Data Architecture

**Supabase bookings table:**

```sql
create table bookings (
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

**Server-side access:**  
Use a Supabase service role client (`lib/supabase-admin.ts`) for all server-side DB writes. The service role key bypasses RLS and is safe for use only in server-side API routes (never exposed to the client).

**Booking insert:**  
`POST /api/bookings/email` already handles email sending. Update it to also insert a row into the `bookings` table using the service role client after the email sends successfully.

**Booking read:**  
New `GET /api/bookings` endpoint. Verifies Bearer token, fetches all bookings for the authenticated user ordered by `datetime DESC`.

---

## 2. Dashboard Page Layout

**Route:** `/dashboard`  
**Component type:** Client component (needs auth context + fetch)  
**Auth guard:** If user is not logged in, redirect to `/login` immediately.

**Layout — Stats + List (Option A):**

- **Stats row** (3 cards across):
  - Total Bookings (count)
  - Last Service (most recent service name, or "—")
  - Status (always "Active" if user exists)

- **Booking history list** below stats:
  - Each row: Service name | Dog name | Date & time | Status badge (Upcoming / Completed)
  - Ordered by datetime descending (most recent first)
  - Status logic: if datetime is in the future → "Upcoming"; if in the past → "Completed"

- **Empty state (no bookings yet):**
  - Friendly message: "No bookings yet"
  - CTA button: "Book Your First Service" → navigates to `/services`

**Loading state:**  
`app/dashboard/loading.tsx` — skeleton UI matching the stats + list layout.

---

## 3. Error Handling

- If the fetch to `/api/bookings` fails → show inline error message, not a crash
- If the user token is missing or invalid → redirect to `/login`
- If email send fails in `/api/bookings/email` → DB insert still attempted; email failure does not block booking creation

---

## 4. Nav Update

**`components/nav-bar.tsx`:**  
Add a "Dashboard" link that appears only when the user is logged in (alongside the existing "Hi, [name]" greeting). No change to post-login redirects — login and signup continue to redirect to `/services`.

---

## Out of Scope

- Address/phone fields on user profile (deferred, user acknowledged)
- Admin view of all bookings
- Booking cancellation
- Pagination of booking history
