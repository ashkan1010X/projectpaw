import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';
import { isPetSpecies, SPECIES_META, type PetSpecies } from '@/lib/species';
import { PAYMENT_META } from '@/lib/payment';
import { escapeHtml } from '@/lib/escape-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ message: 'Missing signature' }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  // Only act on confirmed card payments
  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const meta = intent.metadata ?? {};
  if (meta.purpose !== 'projectpaw_booking') {
    // Not one of our booking payments — ignore
    return NextResponse.json({ received: true });
  }

  // Idempotency — if the client already finalized this booking, skip
  const { data: alreadyBooked } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle();

  if (alreadyBooked) {
    return NextResponse.json({ received: true, skipped: 'already_exists' });
  }

  const datetime = meta.datetime;
  const serviceId = meta.service_id;
  const serviceName = meta.service_name || serviceId;
  const dogName = meta.dog_name || 'Pet';
  const petSpecies: PetSpecies = isPetSpecies(meta.pet_species) ? meta.pet_species : 'dog';
  const userId = meta.user_id;
  const userEmail = meta.user_email;
  const notes = meta.notes || null;

  if (!datetime || !serviceId || !userId || !userEmail) {
    console.error('Webhook: missing required metadata on intent', intent.id);
    return NextResponse.json({ received: true, skipped: 'missing_metadata' });
  }

  // Slot conflict at webhook time → refund and exit
  const { data: slotTaken } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('datetime', datetime)
    .neq('status', 'cancelled')
    .limit(1);

  if (slotTaken && slotTaken.length > 0) {
    try {
      await stripe.refunds.create({ payment_intent: intent.id });
      console.warn('Webhook: refunded conflicting payment', intent.id);
    } catch (e) {
      console.error('Webhook: CRITICAL refund failure for', intent.id, e);
    }
    return NextResponse.json({ received: true, action: 'refunded_conflict' });
  }

  // Insert booking — unique constraint on stripe_payment_intent_id prevents dupes
  const { error: insertError } = await supabaseAdmin.from('bookings').insert({
    user_id: userId,
    service_id: serviceId,
    service_name: serviceName,
    dog_name: dogName,
    pet_species: petSpecies,
    datetime,
    notes,
    payment_method: 'stripe',
    stripe_payment_intent_id: intent.id,
    amount_cents: intent.amount,
    payment_status: 'paid',
  });

  if (insertError) {
    // 23505 = unique_violation → client beat us to it, fine
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json({ received: true, skipped: 'race_with_client' });
    }
    console.error('Webhook: booking insert failed', insertError);
    return NextResponse.json({ received: true, error: 'insert_failed' });
  }

  // Send confirmation emails — best effort, don't block on failure
  const formattedDate = new Date(datetime).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const speciesLabel = SPECIES_META[petSpecies].label;
  const payMeta = PAYMENT_META.stripe;

  const dogNameSafe = escapeHtml(dogName);
  const serviceNameSafe = escapeHtml(serviceName);
  const customerHtml = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #A67C52); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white;">🐾 Booking Confirmed!</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw — Payment received</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; margin: 0 0 24px;">Hi! Your booking for <strong>${dogNameSafe}</strong> is confirmed and your card has been charged.</p>
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
          <tr><td style="padding: 12px 0; color: rgba(245,203,167,0.55);">Service</td><td style="padding: 12px 0; font-weight: bold;">${serviceNameSafe}</td></tr>
          <tr><td style="padding: 12px 0; color: rgba(245,203,167,0.55);">Pet</td><td style="padding: 12px 0; font-weight: bold;">${dogNameSafe} (${speciesLabel})</td></tr>
          <tr><td style="padding: 12px 0; color: rgba(245,203,167,0.55);">When</td><td style="padding: 12px 0; font-weight: bold;">${formattedDate}</td></tr>
          <tr><td style="padding: 12px 0; color: rgba(245,203,167,0.55);">Paid</td><td style="padding: 12px 0; font-weight: bold;">$${(intent.amount / 100).toFixed(2)} CAD</td></tr>
        </table>
      </div>
    </div>`;

  // Fetch customer phone for SMS confirmation
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('phone')
    .eq('user_id', userId)
    .maybeSingle();
  const customerPhone = profile?.phone as string | null | undefined;

  await Promise.allSettled([
    transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Booking Confirmed — ${serviceName} for ${dogName}`,
      html: customerHtml,
    }),
    ADMIN_EMAIL
      ? transporter.sendMail({
          from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
          to: ADMIN_EMAIL,
          replyTo: userEmail,
          subject: `[Webhook recovery] New Booking: ${serviceName} for ${dogName} — ${formattedDate} · Paid $${(intent.amount / 100).toFixed(2)}`,
          html: customerHtml,
        })
      : Promise.resolve(),
    customerPhone
      ? sendSms(
          customerPhone,
          `Booking confirmed! ${serviceName} for ${dogName} on ${formattedDate}. $${(intent.amount / 100).toFixed(2)} CAD charged. Reply X to cancel or HELP for support. — ProjectPaw 🐾`,
        ).catch(() => {})
      : Promise.resolve(),
    process.env.PROVIDER_SMS_PHONE
      ? sendSms(
          process.env.PROVIDER_SMS_PHONE,
          `New paid booking: ${serviceName} for ${dogName} (${speciesLabel}) on ${formattedDate}. Pay: ${payMeta.shortLabel}. — ProjectPaw 🐾`,
        ).catch(() => {})
      : Promise.resolve(),
  ]);

  return NextResponse.json({ received: true, action: 'booking_created' });
}
