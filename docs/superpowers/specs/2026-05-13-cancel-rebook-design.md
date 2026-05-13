# Cancel + Rebook — Design Spec

**Date:** 2026-05-13  
**Status:** Approved

---

## Overview

Add Cancel and Rebook actions to the dashboard booking list. Cancel marks a booking as cancelled in the DB and sends a cancellation confirmation email to the user. Rebook opens the existing booking modal pre-filled with the same service and dog name.

---

## API

### `POST /api/bookings/[id]/cancel`

- Requires `Authorization: Bearer <token>` header
- Verifies the token via `supabase.auth.getUser(token)`
- Fetches the booking from `bookings` table; confirms `user_id` matches the authenticated user
- Returns `400` if booking is already cancelled
- Returns `403` if booking belongs to a different user
- Returns `404` if booking not found
- Sets `status = 'cancelled'` via `supabaseAdmin`
- Sends cancellation email via Nodemailer (same transporter as booking confirmation)
- Email failure is non-blocking — DB update is the source of truth; log email errors but still return success
- Returns `{ success: true }`

---

## Email

Same dark-styled HTML template as booking confirmation. Subject: `Booking Cancelled — {serviceName} for {dogName}`. Body shows service, dog, date/time. Header says "Booking Cancelled" in red/muted tone instead of the confirmation green/purple.

---

## Dashboard UI

### Status badge logic (`statusBadge`)

Updated to three cases (checked in order):

1. `status === 'cancelled'` → red "Cancelled" badge
2. `new Date(datetime) > new Date()` → purple "Upcoming" badge
3. fallback → muted "Completed" badge

### Booking row buttons

**Cancel button** — shown when: `status !== 'cancelled'` AND `new Date(datetime) > new Date()`

- Calls `POST /api/bookings/[id]/cancel` with auth token
- On success: updates local booking state to `status: 'cancelled'` (optimistic update)
- On failure: shows inline error message under the row
- Shows a loading spinner while in-flight; button disabled during request
- Styled: small ghost/outline button, red text

**Rebook button** — shown when: `new Date(datetime) <= new Date()` OR `status === 'cancelled'`

- Opens `BookingModal` pre-filled with `service_id`, `service_name`, and `dog_name` from the booking
- Does not require any API call by itself — modal handles booking creation as normal

### BookingModal props update

`BookingModal` needs to accept optional `initialDogName` prop so Rebook can pre-fill the dog name field. Service is passed via existing `serviceId` + `serviceName` props.

---

## Files Changed

| File                                    | Change                                       |
| --------------------------------------- | -------------------------------------------- |
| `app/api/bookings/[id]/cancel/route.ts` | New — cancel endpoint                        |
| `app/dashboard/page.tsx`                | Updated — Cancel/Rebook buttons, badge logic |
| `components/booking-modal.tsx`          | Updated — accept `initialDogName` prop       |

---

## Out of Scope

- Admin-side cancellation
- Cancellation reason / notes
- Rescheduling (change datetime on existing booking)
