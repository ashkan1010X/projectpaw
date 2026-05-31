# ProjectPaw

A booking platform for a Toronto-based dog care provider. Pet owners can browse services, create an account, and book grooming, walks, boarding, drop-ins, and house sitting. The provider gets SMS notifications on new bookings, and customers get email confirmations plus SMS reminders before their appointment.

This is a real production app built for an actual business, not a demo.

---

## What it does

**For pet owners:**

- Browse 6 services with live pricing pulled from the database
- Search the FAQ live and create an account with email confirmation
- Add one or more pets with photos
- Book any service with 24/7 time slot availability (overnight services need off-hours slots), with double-booked slots blocked at the database level
- Pay by card (Stripe), cash, or Interac e-Transfer
- Get an email confirmation and SMS reminder before the appointment
- Cancel or reschedule from the dashboard — or just reply **X** to the confirmation text
- See the exact refund up front before cancelling (full within an hour of booking or 24h+ out, 50% inside 24h, none once the appointment has started)

**For the provider:**

- Gets an email and SMS when a booking is made or cancelled
- Customers can cancel by replying to the booking SMS thread
- Daily cron job at 9 AM sends reminders for upcoming appointments
- Failed Stripe refunds are captured in a dead-letter table and flagged by email for manual recovery

---

## Tech stack

- **Next.js 15** with App Router and TypeScript (strict mode)
- **Supabase** for the database, auth, and file storage
- **Tailwind CSS v4** with a custom design system (tan/purple/yellow palette, Playfair Display + Baloo 2 fonts)
- **Stripe** for payment processing and webhook handling
- **Twilio** for SMS notifications and two-way SMS threads
- **Nodemailer** (Gmail SMTP) for transactional email
- **Vercel** for deployment and cron jobs

---

## Local setup

```bash
git clone https://github.com/ashkan1010X/projectpaw.git
cd projectpaw
npm install
```

Copy `.env.local.example` to `.env.local` and fill in all values (see below), then:

```bash
npm run dev
```

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Gmail SMTP)
SMTP_USER=
SMTP_PASS=
FROM_ADDRESS=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
PROVIDER_SMS_PHONE=        # the provider's phone number for new booking alerts

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=       # e.g. https://projectpaw.vercel.app
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=

# Admin
ADMIN_EMAIL=
NEXT_PUBLIC_ADMIN_EMAIL=

# Cron (Vercel cron job auth)
CRON_SECRET=
```

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build (run this before pushing)
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Project structure

```
app/
  (routes)/          # all pages: home, services, dashboard, profile, login, etc.
  api/               # route handlers: bookings, auth, pets, profile, stripe, sms, cron
components/          # shared UI components
lib/                 # supabase client, stripe, twilio, mailer, image compression
contexts/            # auth context (JWT stored in localStorage)
```

Auth is client-side only. The token is stored in `localStorage` under the key `token` and sent as a `Bearer` header on every API request. Server routes verify it with `supabase.auth.getUser(token)`.

Photos (profile + pets) go through a client-side compression step before upload: images are resized to 1920px max and re-encoded as JPEG at 85% quality. HEIC files from iPhones are supported. This keeps uploads under the 10 MB server limit regardless of what the user picks from their photo library.

---

## Security

- **Rate limiting** on login, signup, password reset, cancel, and reschedule (sliding-window, per-email + per-IP buckets backed by a Supabase table)
- **Breached-password blocking** via a DIY HaveIBeenPwned k-anonymity check — the password never leaves the device, and known-leaked passwords are rejected at signup and reset
- **Account-enumeration defence** — forgot-password runs in constant time regardless of whether the email exists
- All user-supplied values are HTML-escaped in transactional emails, and the cron endpoint fails closed when its secret is unset

---

## Notes

- No test runner is set up yet. When adding tests, use Vitest + React Testing Library.
- Email is currently on Gmail SMTP. Migrating to Resend is planned once the production domain is set up.
- The Twilio account is on a trial plan, which caps outbound SMS to ~9/day. Upgrading removes that limit.
