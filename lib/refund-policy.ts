// Single source of truth for cancellation refund amounts.
//
// Pure and isomorphic: no I/O, no server-only imports, so the API routes
// (dashboard cancel, SMS-reply cancel) AND the client (the cancel dialog's
// refund preview) all run the exact same logic — they can never disagree.
//
// Policy (Stripe-paid bookings only; callers gate on payment_method/status):
//   1. GRACE  — full refund if cancelled within 1h of booking creation,
//               capped so the window never runs past the appointment itself.
//   2. FULL   — full refund if cancelled more than 24h before the appointment.
//   3. PARTIAL— 50% otherwise.

const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 hour after booking
const FULL_REFUND_NOTICE_MS = 24 * 60 * 60 * 1000; // 24 hours before appointment

export type RefundTier = 'grace' | 'full' | 'partial';

export interface RefundDecision {
  refundedCents: number;
  paymentStatus: 'refunded_full' | 'refunded_partial';
  tier: RefundTier;
  /** "Full refund" | "50% refund" — the headline for "<label> of $X". */
  amountLabel: string;
  /** Short cause clause for "<label> of $X — <reason>." */
  reason: string;
}

export function computeRefund(params: {
  amountCents: number;
  bookingCreatedAt: string | Date;
  appointmentDatetime: string | Date;
  now?: Date;
}): RefundDecision {
  const { amountCents } = params;
  const nowMs = (params.now ?? new Date()).getTime();
  const createdMs = new Date(params.bookingCreatedAt).getTime();
  const appointmentMs = new Date(params.appointmentDatetime).getTime();

  // Grace window ends 1h after booking, but never later than the appointment.
  const graceEndsMs = Math.min(createdMs + GRACE_PERIOD_MS, appointmentMs);

  if (nowMs <= graceEndsMs) {
    return {
      refundedCents: amountCents,
      paymentStatus: 'refunded_full',
      tier: 'grace',
      amountLabel: 'Full refund',
      reason: 'cancelled within an hour of booking',
    };
  }

  if (appointmentMs - nowMs > FULL_REFUND_NOTICE_MS) {
    return {
      refundedCents: amountCents,
      paymentStatus: 'refunded_full',
      tier: 'full',
      amountLabel: 'Full refund',
      reason: 'more than 24 hours notice',
    };
  }

  return {
    refundedCents: Math.round(amountCents / 2),
    paymentStatus: 'refunded_partial',
    tier: 'partial',
    amountLabel: '50% refund',
    reason: 'cancelled within 24 hours of the appointment',
  };
}
