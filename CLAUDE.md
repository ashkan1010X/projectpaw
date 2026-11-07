# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context

ProjectPaw is the booking website for Sara Parchami's dog services business in Toronto (an existing registered business; this app is its digital layer). Customers browse services, create an account, add their pets, and book, pay for, reschedule, or cancel appointments. Sara manages services from an admin panel and gets email + SMS notifications for every booking and cancellation.

Live at https://projectpaw.vercel.app — every push to `main` auto-deploys on Vercel.

## Technical Stack

- Framework: Next.js 16.2.6 with App Router (read `node_modules/next/dist/docs/` before writing Next.js code — see AGENTS.md)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4 + shadcn/ui
- Database, auth & storage: Supabase (project `ncxaphqjduzjybptbict`)
- Payments: Stripe · Email: Nodemailer over Gmail SMTP · SMS: Twilio
- Package manager: npm

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build — run before every push (Vercel runs strict checks dev mode skips)
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
node node_modules/@playwright/test/cli.js test --project=desktop   # Playwright suite (npx is blocked by PowerShell policy here)
```

Tests: Playwright specs live in `tests/` (each spec sets its own viewport; pin one project to avoid running twice). Vitest + React Testing Library is not installed yet — use it for unit tests when added, per AGENTS.md.

## Architecture

### Auth

Supabase email/password auth through API routes in `app/api/auth/` (login, register, refresh, forgot-password). `contexts/auth-context.tsx` (`AuthProvider`, wraps the app in `app/layout.tsx`) keeps the access + refresh tokens in `localStorage`, refreshes them 5 minutes before expiry, and syncs logout/refresh across tabs. Every authenticated request goes through `fetchWithAuth()` from `useAuth()` — it adds the Bearer header, retries once after a refresh on 401, and redirects to `/login` if that fails. API routes verify the token server-side. There is no `middleware.ts`: protected pages guard themselves on the client. Admin access is checked by `lib/admin-auth.ts` against the `ADMIN_EMAIL` env var.

Security already in place: rate limiting on login, register, forgot-password, and reschedule (`lib/rate-limit.ts`, `auth_rate_limits` table), HaveIBeenPwned password checks (`lib/hibp.ts`), HTML escaping of user input in emails (`lib/escape-html.ts`), constant-time forgot-password responses via `after()`.

### Booking Flow

`app/services/page.tsx` is a server component that loads services from the Supabase `services` table (falls back to `FALLBACK_SERVICES` in `lib/service-icons.ts`) and renders `components/services-client.tsx` (search, filter, sort). There are 6 services.

`components/booking-modal.tsx` collects the pet, date/time (`components/date-time-picker.tsx`: 24/7, 30-minute slots, taken slots greyed out via `/api/bookings/availability`) and payment method — cash, e-transfer, or card (`lib/payment.ts`). Card bookings create a PaymentIntent (`/api/bookings/payment-intent`), confirm it with Stripe, then finalize through `/api/bookings/email`; `/api/stripe/webhook` is the safety net that inserts the booking if the client never finalizes. Double-booking is blocked by a conflict check plus a unique partial index on `bookings(datetime)` for non-cancelled rows. Past datetimes are rejected server-side (`isValidFutureDatetime` in `lib/format-date.ts`).

Customers manage bookings on `/dashboard`: reschedule (`/api/bookings/[id]/reschedule`), cancel (`/api/bookings/[id]/cancel`, with a refund preview), add to calendar, one-tap rebook.

### Refunds

All refund rules live in `computeRefund()` in `lib/refund-policy.ts` — the single source of truth, shared by both cancel paths. Tiers, in order: full refund within 1 hour of booking (grace) → no refund once the appointment has started → full refund with more than 24 hours' notice → 50% otherwise. If a Stripe refund fails, the booking still cancels with `payment_status = 'refund_pending'`, a row goes into `failed_refunds`, and Sara gets an urgent admin email. FAQ copy, the booking modal, and Terms §5 must match these rules.

### Notifications

Email via `lib/mailer.ts` (shared transporter, branded HTML templates); SMS via `lib/twilio.ts` (no-ops when env vars are unset). Customer and Sara both get email + SMS on booking and on cancellation. Customers can reply X to an SMS to cancel their next booking (`/api/sms/reply`, Twilio webhook). A daily cron (`/api/cron/reminders`, 9 AM UTC in `vercel.json`, protected by `CRON_SECRET`) sends 24-hour SMS reminders. All user-facing dates are formatted in `America/Toronto` (`lib/format-date.ts`).

### Data

Supabase tables: `services`, `bookings`, `profiles`, `pets`, `auth_rate_limits`, `failed_refunds`. Photos (profile and pet) go to the `dog-photos` storage bucket, compressed client-side first (`lib/image-compress.ts`). RLS is on; policies use `(select auth.uid())`. Server-side writes use the service-role client in `lib/supabase-admin.ts`. Use the Supabase MCP for migrations.

Env vars (names only — values live in `.env.local` and the Vercel dashboard; anything added locally must also be added to Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_USER`, `SMTP_PASS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `PROVIDER_SMS_PHONE`, `ADMIN_EMAIL`, `NEXT_PUBLIC_ADMIN_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`.

### Routing

All routes are under `app/`; API routes are under `app/api/`.

- Public: `/`, `/about`, `/gallery`, `/services`, `/privacy`, `/terms`
- Auth: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Signed in: `/dashboard`, `/profile`, `/admin` (admin only)

`loading.tsx` skeletons exist for about, admin, dashboard, gallery, login, profile, services, and signup. No route has `error.tsx` or `not-found.tsx` yet (AGENTS.md requires both).

### Theme & Fonts

The site is dark-only: `app/layout.tsx` sets a fixed dark background (`bg-[#0f0d09]`); there is no theme toggle. All custom tokens live in `app/globals.css` under `@theme inline`:

- Colors: `paw-light` (#FDF6F0), `paw` (#F5CBA7, tan), `paw-dark` (#A67C52), `doggy` (#B2A4FF, purple), `accent` (#F9D923, yellow)
- Fonts: `font-elegant` → Playfair Display, `font-pawprint` → Baloo 2

Shared UI to reuse rather than rebuild: `components/confirm-dialog.tsx` (never `window.confirm`), `components/toast.tsx`, `components/phone-input.tsx`, `components/pet-drawer.tsx`.

### Import Alias

Use `@/` for all absolute imports (maps to project root).

## Project Status

Last verified against the code: 2026-11-07. Full history is in `git log`, design specs in `docs/superpowers/specs/`, and session notes in Claude Code's project memory.

Still in Stripe test mode — not open to real customers yet. Remaining work, in suggested order:

1. Add `error.tsx` and `not-found.tsx`, and the missing `loading.tsx` files (AGENTS.md requirement)
2. Multi-pet dashboard: pet chip strip on `/dashboard` (design approved; the `pets` table, `/api/pets`, and pet picker in the booking modal already exist)
3. Launch: switch Stripe to live keys; move email from Gmail SMTP to Resend (needs a domain); verify Sara's phone in Twilio and upgrade off the trial; test signup → confirm → login on the live site; update README as each item lands
4. No-show handling: a way for Sara to mark a no-show, plus an optional fee (only the Terms text exists today)
5. Deferred: `/help` page (once customer questions justify it), `middleware.ts` auth guards, Vitest setup

## Development Approach

- Always follow the Superpowers methodology
- Always reference AGENTS.md for all coding rules
- Use server components by default
- Mobile first responsive design
- Accessibility first

## Mobile Testing — Non-Negotiable

After every feature that touches UI, run Playwright (`headless: false`) across Galaxy S20 (360px), iPhone SE (375px), iPhone 14 (390px), iPad (768px), and Desktop (1280px). Fix any layout issues before the feature is considered done. Full rules in AGENTS.md under "Mobile-First".

## End of Session

When the user says they are done or are ending the session, always save memory before they leave:

1. Update `project_status.md` in Claude Code's project memory with what was completed and what's still pending
2. Update `feedback.md` there with any new preferences or corrections from this session
3. Update `user_profile.md` there if anything new was learned about the user
4. Update the "Project Status" section of this file if the remaining work changed, and commit it
5. Store the session's work in Ruflo (see AGENTS.md)
6. Confirm to the user that memory has been saved
