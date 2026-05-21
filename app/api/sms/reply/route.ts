import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { escapeHtml } from '@/lib/escape-html';
import { formatBookingDateShort } from '@/lib/format-date';

const { MessagingResponse } = twilio.twiml;

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'support@projectpaw.com';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectpaw.vercel.app';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function twimlResponse(message: string): NextResponse {
  const resp = new MessagingResponse();
  resp.message(message);
  return new NextResponse(resp.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value as string;
  }

  // Validate Twilio signature in production to block spoofed requests
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV === 'production' && appUrl && authToken) {
    const signature = req.headers.get('x-twilio-signature') ?? '';
    const url = `${appUrl}/api/sms/reply`;
    const valid = twilio.validateRequest(authToken, signature, url, params);
    if (!valid) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const from = params['From'] ?? ''; // user's E.164 phone number
  const body = (params['Body'] ?? '').trim().toUpperCase();

  // Find the profile matching this phone number
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('phone', from)
    .maybeSingle();

  if (body === 'X') {
    if (!profile) {
      return twimlResponse(
        `We couldn't find an account linked to this number. Need help? Email ${SUPPORT_EMAIL} — ProjectPaw 🐾`,
      );
    }

    // Find their next upcoming booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, service_name, dog_name, datetime, payment_method, stripe_payment_intent_id, amount_cents, payment_status',
      )
      .eq('user_id', profile.user_id)
      .eq('status', 'upcoming')
      .gte('datetime', new Date().toISOString())
      .order('datetime', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!booking) {
      return twimlResponse(
        `You don't have any upcoming bookings to cancel. Questions? Reply HELP — ProjectPaw 🐾`,
      );
    }

    // Stripe refund — same policy as dashboard cancel
    let refundedCents = 0;
    let newPaymentStatus: string | null = booking.payment_status as string | null;
    let refundNote: string | null = null;

    if (
      booking.payment_method === 'stripe' &&
      booking.stripe_payment_intent_id &&
      booking.payment_status === 'paid' &&
      booking.amount_cents
    ) {
      const hoursUntil = (new Date(booking.datetime as string).getTime() - Date.now()) / 3_600_000;
      const amountCents = booking.amount_cents as number;
      refundedCents = hoursUntil > 24 ? amountCents : Math.round(amountCents / 2);
      newPaymentStatus = hoursUntil > 24 ? 'refunded_full' : 'refunded_partial';
      refundNote =
        hoursUntil > 24
          ? `Full refund of $${(refundedCents / 100).toFixed(2)} CAD issued.`
          : `50% refund of $${(refundedCents / 100).toFixed(2)} CAD issued (cancelled within 24h).`;
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id as string,
          amount: refundedCents,
        });
      } catch (e) {
        console.error('SMS cancel: Stripe refund failed', e);
        // Keep payment_status unchanged so DB update succeeds — admin handles refund manually.
        refundedCents = 0;
        newPaymentStatus = booking.payment_status as string;
        refundNote = null;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        ...(refundedCents > 0
          ? {
              payment_status: newPaymentStatus,
              refunded_cents: refundedCents,
              refunded_at: new Date().toISOString(),
            }
          : {}),
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('SMS cancel: DB update failed', updateError);
      return twimlResponse(
        `Sorry, we hit a snag cancelling that. Email ${SUPPORT_EMAIL} and we'll sort it. — ProjectPaw 🐾`,
      );
    }

    const apptTime = formatBookingDateShort(booking.datetime as string);

    // Notify provider — fetch customer email/name from auth.
    // Wrapped in after() so the work actually runs after the TwiML response is sent
    // back to Twilio; in serverless, fire-and-forget promises can be terminated early.
    if (ADMIN_EMAIL) {
      after(
        supabaseAdmin.auth.admin
        .getUserById(profile.user_id)
        .then(({ data }) => {
          const customerEmail = data.user?.email ?? '';
          const customerName =
            (data.user?.user_metadata?.name as string | undefined) ?? customerEmail;
          const customerNameSafe = escapeHtml(customerName);
          const customerEmailSafe = escapeHtml(customerEmail);
          const dogNameSafe = escapeHtml(booking.dog_name as string);
          const serviceNameSafe = escapeHtml(booking.service_name as string);
          const providerHtml = `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 100px; padding: 4px 14px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: white; margin-bottom: 12px;">Staff Notification</div>
              <h1 style="margin: 0; font-size: 26px; color: white; letter-spacing: -0.5px;">❌ Booking Cancelled</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw — Slot is now available</p>
            </div>
            <div style="padding: 32px;">
              <div style="background: rgba(245,203,167,0.05); border: 1px solid rgba(245,203,167,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,203,167,0.4);">Customer</p>
                <p style="margin: 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #F5CBA7;">${customerNameSafe}</p>
                <a href="mailto:${customerEmailSafe}" style="font-family: sans-serif; font-size: 13px; color: #e8a83a; text-decoration: none;">${customerEmailSafe}</a>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceNameSafe}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Dog's Name</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${dogNameSafe}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${apptTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Cancelled Via</td>
                  <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7;">SMS (replied X)</td>
                </tr>
              </table>
              <div style="margin-top: 28px; text-align: center;">
                <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #c97b2a, #e8a83a); color: white; font-family: sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.02em;">Manage Bookings →</a>
              </div>
            </div>
          </div>
        `;
          return transporter.sendMail({
            from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
            to: ADMIN_EMAIL,
            replyTo: customerEmail,
            subject: `Booking Cancelled: ${booking.service_name as string} for ${booking.dog_name as string} — ${apptTime}`,
            html: providerHtml,
          });
        })
        .catch((e: unknown) => console.error('Provider cancellation email error (SMS):', e)),
      );
    }

    const refundLine = refundNote ? ` ${refundNote} Allow 5–10 business days.` : '';
    return twimlResponse(
      `Cancelled ✓ Your ${booking.service_name as string} for ${booking.dog_name as string} on ${apptTime} has been cancelled.${refundLine} We hope to see you again soon! — ProjectPaw 🐾`,
    );
  }

  if (body === 'HELP') {
    return twimlResponse(
      `ProjectPaw Support:\n• Reply CANCEL to cancel your next booking\n• Reply STOP to unsubscribe from texts\n• Questions? Email ${SUPPORT_EMAIL}`,
    );
  }

  // Any other message — gentle prompt
  return twimlResponse(
    `Hi! Reply X to cancel your next appointment, or STOP to unsubscribe. — ProjectPaw 🐾`,
  );
}
