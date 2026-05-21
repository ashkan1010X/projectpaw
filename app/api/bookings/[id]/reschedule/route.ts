import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { formatBookingDateLong } from '@/lib/format-date';

// Reschedule rate limit — legit users rarely reschedule >10/hr; abuse pattern is
// loop-reschedule to mail-bomb customer or admin with notifications.
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

function buildCustomerHtml(
  dogName: string,
  serviceName: string,
  oldDate: string,
  newDate: string,
) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #8b7df0); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">📅 Booking Rescheduled</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">
          Your <strong>${serviceName}</strong> for <strong>${dogName}</strong> has been moved.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">From</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: rgba(245,203,167,0.6); text-decoration: line-through;">${oldDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">To</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 16px; color: #B2A4FF; font-weight: bold;">${newDate}</td>
          </tr>
        </table>
        <p style="margin: 32px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">
          We&apos;ll text you a reminder the day before your new appointment.
        </p>
      </div>
    </div>
  `;
}

function buildProviderHtml(
  customerName: string,
  customerEmail: string,
  dogName: string,
  serviceName: string,
  oldDate: string,
  newDate: string,
) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #8b7df0); padding: 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 100px; padding: 4px 14px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: white; margin-bottom: 12px;">Staff Notification</div>
        <h1 style="margin: 0; font-size: 26px; color: white; letter-spacing: -0.5px;">📅 Booking Rescheduled</h1>
      </div>
      <div style="padding: 32px;">
        <div style="background: rgba(245,203,167,0.05); border: 1px solid rgba(245,203,167,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,203,167,0.4);">Customer</p>
          <p style="margin: 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #F5CBA7;">${customerName}</p>
          <a href="mailto:${customerEmail}" style="font-family: sans-serif; font-size: 13px; color: #B2A4FF; text-decoration: none;">${customerEmail}</a>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Dog</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${dogName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Previous</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: rgba(245,203,167,0.6); text-decoration: line-through;">${oldDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">New Time</td>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 16px; color: #B2A4FF; font-weight: bold;">${newDate}</td>
          </tr>
        </table>
        <div style="margin-top: 28px; text-align: center;">
          <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #c97b2a, #e8a83a); color: white; font-family: sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.02em;">Manage Bookings →</a>
        </div>
      </div>
    </div>
  `;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  // Rate limit by user_id (authenticated) AND IP (defense in depth)
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit({
      bucket: 'booking_reschedule_user',
      identifier: user.id,
      max: PER_USER_MAX,
      windowMinutes: PER_USER_WINDOW_MIN,
    }),
    checkRateLimit({
      bucket: 'booking_reschedule_ip',
      identifier: getClientIp(req),
      max: PER_IP_MAX,
      windowMinutes: PER_IP_WINDOW_MIN,
    }),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
      { message: `Too many reschedule attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Limit': String(PER_USER_MAX) },
      },
    );
  }

  const { datetime } = (await req.json()) as { datetime: string };
  if (!datetime) {
    return NextResponse.json({ message: 'Datetime required' }, { status: 400 });
  }
  if (new Date(datetime) <= new Date()) {
    return NextResponse.json({ message: 'Please choose a future date and time.' }, { status: 400 });
  }

  // Fetch existing booking
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, service_name, dog_name, datetime, status')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
  }
  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (booking.status === 'cancelled') {
    return NextResponse.json({ message: 'Cannot reschedule a cancelled booking' }, { status: 400 });
  }

  // Conflict check — exclude this booking from the search
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('datetime', datetime)
    .neq('status', 'cancelled')
    .neq('id', id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { message: 'That time slot is already taken. Please choose a different time.' },
      { status: 409 },
    );
  }

  const oldDatetime = booking.datetime as string;

  // Update — reset reminder_sent so the cron will text again before the new time
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ datetime, reminder_sent: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    if ((updateError as { code?: string }).code === '23505') {
      return NextResponse.json(
        { message: 'That time slot was just taken. Please choose a different time.' },
        { status: 409 },
      );
    }
    console.error('Reschedule update error:', updateError);
    return NextResponse.json({ message: 'Failed to reschedule. Please try again.' }, { status: 500 });
  }

  const oldFormatted = formatBookingDateLong(oldDatetime);
  const newFormatted = formatBookingDateLong(datetime);
  const customerName = (user.user_metadata?.name as string | undefined) ?? user.email;

  // Fetch phone for SMS
  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('phone')
    .eq('user_id', user.id)
    .maybeSingle();
  const userPhone = (profileRow as { phone?: string | null } | null)?.phone ?? null;

  const customerHtml = buildCustomerHtml(
    booking.dog_name as string,
    booking.service_name as string,
    oldFormatted,
    newFormatted,
  );
  const providerHtml = buildProviderHtml(
    customerName,
    user.email,
    booking.dog_name as string,
    booking.service_name as string,
    oldFormatted,
    newFormatted,
  );

  const smsPromise = userPhone
    ? sendSms(
        userPhone,
        `Rescheduled ✓ Your ${booking.service_name as string} for ${booking.dog_name as string} is now ${newFormatted}. Reply X to cancel. — ProjectPaw 🐾`,
      ).catch((e: unknown) => console.error('Reschedule SMS error:', e))
    : Promise.resolve();

  await Promise.allSettled([
    transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Rescheduled — ${booking.service_name} for ${booking.dog_name}`,
      html: customerHtml,
    }),
    ADMIN_EMAIL
      ? transporter.sendMail({
          from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
          to: ADMIN_EMAIL,
          replyTo: user.email,
          subject: `Booking Rescheduled: ${booking.service_name} for ${booking.dog_name} — ${newFormatted}`,
          html: providerHtml,
        })
      : Promise.resolve(),
    smsPromise,
  ]);

  return NextResponse.json({ success: true, datetime });
}
