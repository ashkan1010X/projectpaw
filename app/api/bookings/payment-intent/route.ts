import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { FALLBACK_SERVICES } from '@/lib/service-icons';
import { isPetSpecies } from '@/lib/species';
import { isValidFutureDatetime } from '@/lib/format-date';

async function resolveServicePriceCents(serviceId: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('services')
    .select('price')
    .eq('id', serviceId)
    .maybeSingle();
  if (data?.price) return Math.round(Number(data.price) * 100);

  const fallback = FALLBACK_SERVICES.find((s) => s.id === serviceId);
  return fallback?.price ? Math.round(fallback.price * 100) : null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const {
    serviceId,
    serviceName,
    dogName,
    petSpecies: rawSpecies,
    datetime,
    notes,
    bookingNonce,
  } = (await req.json()) as {
    serviceId: string;
    serviceName?: string;
    dogName?: string;
    petSpecies?: string;
    datetime: string;
    notes?: string;
    bookingNonce?: string;
  };

  // Never create a charge for a slot in the past. The picker enforces this
  // client-side, but the API must validate independently.
  if (!isValidFutureDatetime(datetime)) {
    return NextResponse.json({ message: 'Please choose a future date and time.' }, { status: 400 });
  }

  // Reject if slot is already taken
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('datetime', datetime)
    .neq('status', 'cancelled')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { message: 'That time slot is already taken. Please choose a different time.' },
      { status: 409 },
    );
  }

  const amountCents = await resolveServicePriceCents(serviceId);
  if (!amountCents) {
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  }

  const petSpecies = isPetSpecies(rawSpecies) ? rawSpecies : 'dog';

  // Idempotency key — collapses double-clicks within the same booking attempt.
  // Each booking modal session generates a fresh nonce, so rebooking the same
  // service+slot (e.g. after canceling) creates a NEW PaymentIntent instead of
  // returning a stale one. Falls back to (user,service,datetime) for legacy
  // clients that don't send a nonce yet.
  const idempotencyKey = bookingNonce
    ? `pi-${user.id}-${bookingNonce}`
    : `pi-${user.id}-${serviceId}-${datetime}`;

  const intent = await stripe.paymentIntents.create(
    {
      amount: amountCents,
      currency: 'cad',
      description: `ProjectPaw — ${serviceName ?? serviceId}`,
      statement_descriptor_suffix: 'BOOKING',
      payment_method_types: ['card'],
      metadata: {
        purpose: 'projectpaw_booking',
        user_id: user.id,
        user_email: user.email,
        service_id: serviceId,
        service_name: serviceName ?? '',
        dog_name: dogName ?? '',
        pet_species: petSpecies,
        datetime,
        notes: (notes ?? '').slice(0, 480),
      },
    },
    { idempotencyKey },
  );

  return NextResponse.json({ clientSecret: intent.client_secret, amountCents });
}
