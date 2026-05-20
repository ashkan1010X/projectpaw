import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/escape-html';

// Cancel rate limit — authenticated user can legitimately cancel a few bookings,
// but >10/hr suggests abuse (mail-bombing admin via cancel/rebook loops).
const PER_USER_MAX = 10;
const PER_USER_WINDOW_MIN = 60;
const PER_IP_MAX = 30;
const PER_IP_WINDOW_MIN = 60;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectpaw.vercel.app';

function buildProviderCancelHtml(
  customerName: string,
  customerEmail: string,
  dogName: string,
  serviceName: string,
  formattedDate: string,
  cancelledVia: string,
) {
  const customerNameSafe = escapeHtml(customerName);
  const customerEmailSafe = escapeHtml(customerEmail);
  const dogNameSafe = escapeHtml(dogName);
  const serviceNameSafe = escapeHtml(serviceName);
  const cancelledViaSafe = escapeHtml(cancelledVia);
  return `
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
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Cancelled Via</td>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${cancelledViaSafe}</td>
          </tr>
        </table>
        <div style="margin-top: 28px; text-align: center;">
          <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #c97b2a, #e8a83a); color: white; font-family: sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.02em;">Manage Bookings →</a>
        </div>
        <p style="margin: 24px 0 0; font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.35); text-align: center;">Reply to this email to contact the customer directly.</p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  // Rate limit by user_id (authenticated) AND IP (defense in depth)
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit({
      bucket: 'booking_cancel_user',
      identifier: user.id,
      max: PER_USER_MAX,
      windowMinutes: PER_USER_WINDOW_MIN,
    }),
    checkRateLimit({
      bucket: 'booking_cancel_ip',
      identifier: getClientIp(req),
      max: PER_IP_MAX,
      windowMinutes: PER_IP_WINDOW_MIN,
    }),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
      { message: `Too many cancellations. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Limit': String(PER_USER_MAX) },
      },
    );
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, service_name, dog_name, datetime, status, payment_method, stripe_payment_intent_id, amount_cents, payment_status')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ message: 'Already cancelled' }, { status: 400 });
  }

  // Stripe refund logic — applied before DB update so email can include refund info
  let refundedCents = 0;
  let newPaymentStatus: string | null = booking.payment_status as string | null;
  let refundNote: string | null = null;

  if (
    booking.payment_method === 'stripe' &&
    booking.stripe_payment_intent_id &&
    booking.payment_status === 'paid' &&
    booking.amount_cents
  ) {
    const hoursUntilService = (new Date(booking.datetime).getTime() - Date.now()) / 3_600_000;
    const amountCents = booking.amount_cents as number;

    if (hoursUntilService > 24) {
      // Full refund — more than 24 hours notice
      refundedCents = amountCents;
      newPaymentStatus = 'refunded_full';
      refundNote = `Full refund of $${(amountCents / 100).toFixed(2)} CAD issued — more than 24 hours notice.`;
    } else {
      // 50% refund — within 24 hours
      refundedCents = Math.round(amountCents / 2);
      newPaymentStatus = 'refunded_partial';
      refundNote = `50% refund of $${(refundedCents / 100).toFixed(2)} CAD issued — cancelled within 24 hours.`;
    }

    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id as string,
        amount: refundedCents,
      });
    } catch (err) {
      console.error('Stripe refund error:', err);
      return NextResponse.json({ message: 'Refund failed — booking not cancelled. Please contact support.' }, { status: 500 });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'cancelled',
      ...(newPaymentStatus !== booking.payment_status ? {
        payment_status: newPaymentStatus,
        refunded_cents: refundedCents,
        refunded_at: new Date().toISOString(),
      } : {}),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Cancel update error:', updateError);
    return NextResponse.json({ message: 'Failed to cancel booking' }, { status: 500 });
  }

  const parsedDate = new Date(booking.datetime);
  const formattedDate = isNaN(parsedDate.getTime())
    ? booking.datetime
    : parsedDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const customerName = (user.user_metadata?.name as string | undefined) ?? user.email;
  const dogNameSafe = escapeHtml(booking.dog_name as string);
  const serviceNameSafe = escapeHtml(booking.service_name as string);
  // refundNote is server-generated, no escape needed

  const customerHtml = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">Booking Cancelled</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">
          Your booking for <strong>${dogNameSafe}</strong> has been cancelled.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceNameSafe}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Pet</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${dogNameSafe}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; ${refundNote ? 'border-bottom: 1px solid rgba(245,203,167,0.1);' : ''} font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; ${refundNote ? 'border-bottom: 1px solid rgba(245,203,167,0.1);' : ''} font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
        </table>
        ${refundNote ? `
        <div style="margin-top: 20px; padding: 16px 18px; border-radius: 12px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);">
          <p style="margin: 0 0 4px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(16,185,129,0.7);">Refund</p>
          <p style="margin: 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${refundNote}</p>
          <p style="margin: 6px 0 0; font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.55);">Refunds typically appear in 5–10 business days.</p>
        </div>` : ''}
        <p style="margin: 32px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">
          Want to rebook? Visit your dashboard anytime.
        </p>
      </div>
    </div>
  `;

  const providerHtml = buildProviderCancelHtml(
    customerName,
    user.email,
    booking.dog_name as string,
    booking.service_name as string,
    formattedDate,
    'Dashboard',
  );

  await Promise.allSettled([
    transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Cancelled — ${booking.service_name} for ${booking.dog_name}`,
      html: customerHtml,
    }),
    ADMIN_EMAIL
      ? transporter.sendMail({
          from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
          to: ADMIN_EMAIL,
          replyTo: user.email,
          subject: `Booking Cancelled: ${booking.service_name} for ${booking.dog_name} — ${formattedDate}`,
          html: providerHtml,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
