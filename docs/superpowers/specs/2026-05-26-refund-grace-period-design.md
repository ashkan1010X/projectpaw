# Refund Grace Period — Design

**Date:** 2026-05-26
**Status:** Approved (design), pending implementation
**Author:** brainstormed with Sara/owner

## Problem

ProjectPaw allows 24/7, same-day booking. The current refund policy gives a full
refund only when a booking is cancelled **more than 24 hours before the
appointment**, otherwise 50%. Because same-day bookings are by definition less
than 24 hours away, a customer who books a slot and cancels **minutes later** is
immediately hit with the 50% penalty. That is unfair and will generate "I just
booked it!" complaints.

## Goal

Add a **1-hour grace period**: a full refund if the booking is cancelled within
1 hour of when it was *created*, regardless of how close the appointment is.
Everything else about the policy stays the same.

This is the smallest change that fixes the unfair case, and matches the
post-booking grace window used by airlines, hotels, and Rover.

## Policy (final)

For Stripe-paid bookings, refund is decided in this order:

1. **Grace — full refund** if cancelled within **1 hour of booking creation**,
   capped so the window never extends past the appointment time itself.
2. **Full refund** if cancelled **more than 24 hours before** the appointment.
3. **50% refund** otherwise (within 24 hours of the appointment).

Cash / e-transfer bookings take no online payment, so there is nothing to refund
(unchanged).

### The cap (the subtle 10/10 detail)

The grace window is `min(created_at + 1 hour, appointment_datetime)`. If someone
books a slot only 20 minutes out, the grace cannot run for a full hour — it ends
when the service starts. Without this cap, a 20-minute-out booking would be fully
refundable up to 40 minutes *after* the service was supposed to happen.

Note: tiers 1 and 2 both yield a 100% refund; the grace tier exists so the
customer message can correctly say *why* ("cancelled within an hour of booking"
vs "more than 24 hours notice").

## Architecture

### New: `lib/refund-policy.ts` (single source of truth)

Today the >24h / 50% logic is **duplicated** inline in two routes
(`bookings/[id]/cancel` and `sms/reply`). They already risk drifting apart.
Adding a third tier to both copies would make that worse. Extract one pure
function both paths call:

```ts
export type RefundTier = 'grace' | 'full' | 'partial';

export interface RefundDecision {
  refundedCents: number;
  paymentStatus: 'refunded_full' | 'refunded_partial';
  tier: RefundTier;
  reason: string;              // human sentence for emails/SMS
}

export function computeRefund(params: {
  amountCents: number;
  bookingCreatedAt: string | Date;
  appointmentDatetime: string | Date;
  now?: Date;                  // injectable for tests; defaults to new Date()
}): RefundDecision;
```

Pure, deterministic, no I/O — directly unit-testable (the genuine verification,
same approach as `isValidFutureDatetime`).

Only meaningful for Stripe-paid bookings; callers still gate on
`payment_method === 'stripe' && payment_status === 'paid' && amount_cents`
before applying the decision, exactly as today.

### Callers

Both cancel paths change identically:

1. **`app/api/bookings/[id]/cancel/route.ts`** — add `created_at` to the booking
   SELECT; replace the inline >24h/50% block with `computeRefund(...)`; map the
   result to the Stripe refund + DB update + email/SMS copy. Preserve the existing
   refund-failure handling (`manualRefundPending`, `alertAdminRefundFailed`,
   keep `payment_status` unchanged on failure).
2. **`app/api/sms/reply/route.ts`** — same: add `created_at` to the booking
   SELECT; replace the inline block with `computeRefund(...)`.

`grace` and `full` both map to a 100% Stripe refund and
`payment_status = 'refunded_full'` (the DB constraint only allows
`refunded_full` / `refunded_partial`, so the grace tier reuses `refunded_full`
at the DB level — the distinction lives only in the customer-facing copy).

### Policy text (must stay in sync with behaviour)

- **`components/faq-section.tsx`** — the cancellation/refund FAQ answer: add a
  sentence describing the 1-hour grace window.
- **`app/terms/page.tsx`** §5 "Cancellation and Refunds" (line ~138) — add the
  grace clause above the >24h / 50% bullets.
- **`components/booking-modal.tsx`** (line ~251) — the inline refund blurb shown
  during booking also states "...more than 24 hours... 50% within 24 hours";
  add the grace sentence so it matches.

**Aside (NOT in scope):** Terms §5 already says "no-shows / cancellations after
the service start time — no refund," but the code currently applies 50% even
after the start time (negative hours-until still falls into the <24h branch).
That is a pre-existing text-vs-behaviour drift, unrelated to the grace period.
Flag to owner separately; do not fix here.

## Data flow

cancel request → fetch booking (now incl. `created_at`) → `computeRefund()` →
(if Stripe paid) `stripe.refunds.create(amount=refundedCents)` → DB update
(status=cancelled + payment fields) → email + SMS using `decision.reason`.

## Error handling

Unchanged from today. If the Stripe refund throws, keep `payment_status` as-is,
set the manual-refund-pending path, and fire `alertAdminRefundFailed`. The
`computeRefund` function never throws (pure arithmetic on validated inputs).

## Testing

- **Unit (the real verification):** a Node assertion script for `computeRefund`
  covering: cancelled 5 min after booking for a far-future appt → grace/full;
  cancelled 2 min after booking for a 20-min-out appt → grace/full (cap holds);
  cancelled 2 hours after booking, appt >24h away → full; cancelled 2 hours
  after booking, appt 3h away → partial (50%); exact boundary at +1 hour.
- **Build:** `npm run build` green.
- **Live math check:** confirm refunded_cents in the DB matches the tier for a
  test booking (Stripe test mode).

## Out of scope (deliberately)

- No-show fee — a bigger policy decision, revisit with real customers.
- Multi-step refund ladder (e.g. 100/50/0 by hours-out) — same.
- Changing the 24-hour threshold or the 50% amount.

## Files touched

- `lib/refund-policy.ts` (new)
- `app/api/bookings/[id]/cancel/route.ts`
- `app/api/sms/reply/route.ts`
- `components/faq-section.tsx`
- `app/terms/page.tsx`
- `components/booking-modal.tsx`
