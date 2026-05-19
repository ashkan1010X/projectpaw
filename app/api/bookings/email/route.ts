import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { sendSms } from '@/lib/twilio';
import { isPetSpecies, SPECIES_META, type PetSpecies } from '@/lib/species';
import { isPaymentMethod, PAYMENT_META, type PaymentMethod } from '@/lib/payment';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectpaw.vercel.app';

function buildCustomerHtml(dogName: string, serviceName: string, formattedDate: string, petSpecies: PetSpecies, paymentMethod: PaymentMethod, notes?: string) {
  const meta = SPECIES_META[petSpecies];
  const pay = PAYMENT_META[paymentMethod];
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #A67C52); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">🐾 Booking Confirmed!</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">Hi there! Your booking for <strong>${dogName}</strong> is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Pet</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${dogName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Pet Type</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${meta.emoji} ${meta.label}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
          ${notes ? `<tr><td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Notes</td><td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${notes}</td></tr>` : ''}
        </table>
        <div style="margin-top: 24px; padding: 16px 18px; border-radius: 12px; background: rgba(178,164,255,0.08); border: 1px solid rgba(178,164,255,0.18);">
          <p style="margin: 0 0 4px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(178,164,255,0.7);">Payment</p>
          <p style="margin: 0; font-family: sans-serif; font-size: 15px; font-weight: 700; color: #F5CBA7;">${pay.emoji} ${pay.label}</p>
          <p style="margin: 4px 0 0; font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.6);">Payment is collected at the time of service. No payment is required now.</p>
        </div>
        <p style="margin: 24px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">Questions? Reply to this email anytime.</p>
      </div>
    </div>
  `;
}

function buildProviderHtml(
  customerName: string,
  customerEmail: string,
  dogName: string,
  serviceName: string,
  formattedDate: string,
  petSpecies: PetSpecies,
  paymentMethod: PaymentMethod,
  notes?: string,
  address?: string,
) {
  const meta = SPECIES_META[petSpecies];
  const pay = PAYMENT_META[paymentMethod];
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c97b2a, #e8a83a); padding: 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 100px; padding: 4px 14px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: white; margin-bottom: 12px;">Staff Notification</div>
        <h1 style="margin: 0; font-size: 26px; color: white; letter-spacing: -0.5px;">📋 New Booking Received</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw — Action may be required</p>
      </div>
      <div style="padding: 32px;">
        <div style="background: rgba(245,203,167,0.05); border: 1px solid rgba(245,203,167,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,203,167,0.4);">Customer</p>
          <p style="margin: 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #F5CBA7;">${customerName}</p>
          <a href="mailto:${customerEmail}" style="font-family: sans-serif; font-size: 13px; color: #e8a83a; text-decoration: none;">${customerEmail}</a>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Pet</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${dogName}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0; border-bottom: 2px solid rgba(178,164,255,0.25); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Pet Type</td>
            <td style="padding: 14px 0; border-bottom: 2px solid rgba(178,164,255,0.25); font-family: sans-serif; font-size: 16px; color: #B2A4FF; font-weight: 800; letter-spacing: 0.02em;">${meta.emoji} ${meta.label}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
          ${address ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Address</td><td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${address}</td></tr>` : ''}
          <tr>
            <td style="padding: 14px 0; border-bottom: 2px solid rgba(249,217,35,0.25); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Payment</td>
            <td style="padding: 14px 0; border-bottom: 2px solid rgba(249,217,35,0.25); font-family: sans-serif; font-size: 16px; color: #F9D923; font-weight: 800; letter-spacing: 0.02em;">${pay.emoji} ${pay.label}</td>
          </tr>
          ${notes ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Notes</td><td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7;">${notes}</td></tr>` : ''}
        </table>
        <p style="margin: 16px 0 0; font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.5); padding-left: 8px; border-left: 3px solid rgba(249,217,35,0.4);">${pay.emailLine}</p>
        <div style="margin-top: 28px; text-align: center;">
          <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #c97b2a, #e8a83a); color: white; font-family: sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.02em;">Manage Bookings →</a>
        </div>
        <p style="margin: 24px 0 0; font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.35); text-align: center;">Reply to this email to contact the customer directly.</p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
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

  const { serviceId, serviceName, dogName, petSpecies: rawSpecies, datetime, notes, paymentMethod: rawPayment, stripePaymentIntentId } = (await req.json()) as {
    serviceId: string;
    serviceName: string;
    dogName: string;
    petSpecies?: string;
    datetime: string;
    notes?: string;
    paymentMethod?: string;
    stripePaymentIntentId?: string;
  };

  const petSpecies: PetSpecies = isPetSpecies(rawSpecies) ? rawSpecies : 'dog';
  const speciesLabel = SPECIES_META[petSpecies].label;
  const paymentMethod: PaymentMethod = isPaymentMethod(rawPayment) ? rawPayment : 'cash';
  const paymentMeta = PAYMENT_META[paymentMethod];

  // Verify Stripe PaymentIntent before doing anything
  let verifiedAmountCents: number | null = null;
  if (paymentMethod === 'stripe') {
    if (!stripePaymentIntentId) {
      return NextResponse.json({ message: 'Missing payment intent' }, { status: 400 });
    }
    const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    if (intent.status !== 'succeeded') {
      return NextResponse.json({ message: 'Payment not completed' }, { status: 402 });
    }
    verifiedAmountCents = intent.amount;
  }

  const customerName = (user.user_metadata?.name as string | undefined) ?? user.email;

  // Conflict guard — fast reject before any emails go out
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('datetime', datetime)
    .neq('status', 'cancelled')
    .limit(1);

  if (existing && existing.length > 0) {
    // Slot taken — if the user already paid, immediately refund them
    if (paymentMethod === 'stripe' && stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: stripePaymentIntentId }).catch(console.error);
    }
    return NextResponse.json(
      { message: paymentMethod === 'stripe'
          ? 'That slot was just taken — your payment has been refunded automatically.'
          : 'That time slot is already taken. Please choose a different time.' },
      { status: 409 },
    );
  }

  // Insert first — emails only go out after a successful write
  const { error: insertError } = await supabaseAdmin.from('bookings').insert({
    user_id: user.id,
    service_id: serviceId,
    service_name: serviceName,
    dog_name: dogName,
    pet_species: petSpecies,
    datetime,
    notes: notes ?? null,
    payment_method: paymentMethod,
    ...(paymentMethod === 'stripe' && stripePaymentIntentId ? {
      stripe_payment_intent_id: stripePaymentIntentId,
      amount_cents: verifiedAmountCents,
      payment_status: 'paid',
    } : {}),
  });

  if (insertError) {
    // 23505 = unique_violation — race condition, another booking just won this slot
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json(
        { message: 'That time slot was just taken. Please choose a different time.' },
        { status: 409 },
      );
    }
    console.error('Booking insert error:', insertError);
    return NextResponse.json({ message: 'Failed to save booking. Please try again.' }, { status: 500 });
  }

  const formattedDate = new Date(datetime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Fetch phone for SMS (best-effort)
  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('phone, address')
    .eq('user_id', user.id)
    .maybeSingle();
  const userPhone = (profileRow as { phone?: string | null; address?: string | null } | null)?.phone ?? null;
  const userAddress = (profileRow as { phone?: string | null; address?: string | null } | null)?.address ?? null;

  const customerHtml = buildCustomerHtml(dogName, serviceName, formattedDate, petSpecies, paymentMethod, notes);
  const providerHtml = buildProviderHtml(customerName, user.email, dogName, serviceName, formattedDate, petSpecies, paymentMethod, notes, userAddress ?? undefined);

  const confirmationSms = userPhone
    ? sendSms(
        userPhone,
        `Confirmed! Your ${serviceName} for ${dogName} is booked for ${formattedDate}. Reply X to cancel. STOP to opt out. — ProjectPaw 🐾`,
      ).catch((e: unknown) => console.error('Confirmation SMS error:', e))
    : Promise.resolve();

  // Provider SMS (separate channel) — includes species so Sara knows what to prep
  const providerPhone = process.env.PROVIDER_SMS_PHONE;
  const providerSms = providerPhone
    ? sendSms(
        providerPhone,
        `New booking: ${serviceName} for ${dogName} (${speciesLabel}) on ${formattedDate}. Pay: ${paymentMeta.shortLabel}. — ProjectPaw 🐾`,
      ).catch((e: unknown) => console.error('Provider SMS error:', e))
    : Promise.resolve();

  const [customerResult, providerResult] = await Promise.allSettled([
    transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Confirmed — ${serviceName} for ${dogName}`,
      html: customerHtml,
    }),
    ADMIN_EMAIL
      ? transporter.sendMail({
          from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
          to: ADMIN_EMAIL,
          replyTo: user.email,
          subject: `New Booking: ${serviceName} for ${dogName} (${speciesLabel}) — ${formattedDate} · Pay: ${paymentMeta.shortLabel}`,
          html: providerHtml,
        })
      : Promise.resolve(),
    confirmationSms,
    providerSms,
  ]);

  if (customerResult.status === 'rejected') {
    console.error('Customer email error:', customerResult.reason);
    return NextResponse.json({ message: 'Booking saved but confirmation email failed.' }, { status: 500 });
  }

  if (providerResult.status === 'rejected') {
    console.error('Provider notification error:', providerResult.reason);
  }

  return NextResponse.json({ success: true });
}
