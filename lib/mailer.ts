import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
 * Two layers of durability:
 *  1. A row in `failed_refunds` (queryable dead-letter log, survives a missed email).
 *  2. An email to the admin with a one-click deep link to the PaymentIntent in
 *     the Stripe dashboard, plus everything needed to refund by hand.
 *
 * Both layers are best-effort and independently wrapped — neither can throw or
 * mask the original refund failure in the calling route.
 */
export async function alertAdminRefundFailed(params: {
  paymentIntentId: string;
  amountCents: number | null;
  userId?: string | null;
  customerEmail?: string | null;
  datetime?: string | null;
  source: string;
  reason: string;
}): Promise<void> {
  const { paymentIntentId, amountCents, userId, customerEmail, datetime, source, reason } = params;

  // Layer 1 — durable record. Unique PI means a retried failure won't duplicate.
  try {
    await supabaseAdmin.from('failed_refunds').upsert(
      {
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: amountCents,
        user_id: userId ?? null,
        customer_email: customerEmail ?? null,
        booking_datetime: datetime ?? null,
        source,
        reason,
      },
      { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: true },
    );
  } catch (err) {
    console.error('[alertAdminRefundFailed] failed_refunds insert failed for', paymentIntentId, err);
  }

  // Layer 2 — admin email.
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
  if (!adminEmail) {
    console.error('[alertAdminRefundFailed] NEXT_PUBLIC_ADMIN_EMAIL not set — cannot email', params);
    return;
  }


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
