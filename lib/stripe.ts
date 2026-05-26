import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

/**
 * True when a failed `refunds.create` actually means "this charge was already
 * fully refunded" — not a real failure. The webhook and the client-finalize
 * path can both detect the same conflict and both attempt to refund the same
 * PaymentIntent; whichever loses the race gets this error. Treat it as success,
 * NOT as a stuck charge — otherwise the admin gets paged for a refund that went
 * through, and real alerts get tuned out.
 */
export function isAlreadyRefundedError(err: unknown): boolean {
  return (err as { code?: string })?.code === 'charge_already_refunded';
}
