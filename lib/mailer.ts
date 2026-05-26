import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const FROM_ADDRESS = `"ProjectPaw 🐾" <${process.env.SMTP_USER}>`;

/**
 * Last line of defence when an automated Stripe refund fails (slot conflict or
 * past-slot at webhook time). Without this, a charged-but-unbooked customer only
 * ever surfaces in server logs — nobody reads those, so the money sits stuck.
 *
 * This emails the admin a one-click recovery: a deep link straight to the
 * PaymentIntent in the Stripe dashboard, plus everything needed to refund by
 * hand. It never throws — alerting is best-effort and must not mask the original
 * failure in the calling route.
 *
 * Follow-up (tracked in memory): persist these to a `failed_refunds` dead-letter
 * table so they're queryable, not just an email that can be missed.
 */
export async function alertAdminRefundFailed(params: {
  paymentIntentId: string;
  amountCents: number | null;
  customerEmail?: string | null;
  datetime?: string | null;
  reason: string;
}): Promise<void> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
  if (!adminEmail) {
    console.error(
      '[alertAdminRefundFailed] NEXT_PUBLIC_ADMIN_EMAIL not set — cannot alert',
      params,
    );
    return;
  }

  const { paymentIntentId, amountCents, customerEmail, datetime, reason } = params;
  const amount = amountCents != null ? `$${(amountCents / 100).toFixed(2)} CAD` : 'unknown amount';
  const stripeUrl = `https://dashboard.stripe.com/payments/${paymentIntentId}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; color: #fff;">🚨 Refund failed — manual action required</h1>
      </div>
      <div style="padding: 28px 32px;">
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">An automated Stripe refund did not go through. A customer has been charged but does not have a booking. Please refund them manually.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: rgba(245,203,167,0.55); width: 42%;">Amount</td><td style="padding: 8px 0; font-weight: bold;">${amount}</td></tr>
          <tr><td style="padding: 8px 0; color: rgba(245,203,167,0.55);">Customer</td><td style="padding: 8px 0; font-weight: bold;">${customerEmail ?? 'unknown'}</td></tr>
          <tr><td style="padding: 8px 0; color: rgba(245,203,167,0.55);">Slot</td><td style="padding: 8px 0; font-weight: bold;">${datetime ?? 'unknown'}</td></tr>
          <tr><td style="padding: 8px 0; color: rgba(245,203,167,0.55);">Reason</td><td style="padding: 8px 0;">${reason}</td></tr>
          <tr><td style="padding: 8px 0; color: rgba(245,203,167,0.55);">PaymentIntent</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${paymentIntentId}</td></tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${stripeUrl}" style="display: inline-block; background: #635bff; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px;">Open in Stripe → refund manually</a>
        </div>
      </div>
    </div>`;

  try {
    await mailer.sendMail({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `🚨 URGENT: Stripe refund failed — manual action required (${amount})`,
      html,
      text: `Refund failed. Charge: ${amount}. Customer: ${customerEmail ?? 'unknown'}. Slot: ${datetime ?? 'unknown'}. Reason: ${reason}. Refund manually: ${stripeUrl}`,
      headers: { 'X-Entity-Ref-ID': `refund-failed-${paymentIntentId}` },
    });
  } catch (err) {
    console.error('[alertAdminRefundFailed] alert email itself failed for', paymentIntentId, err);
  }
}
