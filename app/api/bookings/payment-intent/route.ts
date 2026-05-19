import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { FALLBACK_SERVICES } from '@/lib/service-icons';

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

  const { serviceId, serviceName, datetime } = (await req.json()) as {
    serviceId: string;
    serviceName?: string;
    datetime: string;
  };

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

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'cad',
    description: `ProjectPaw — ${serviceName ?? serviceId}`,
    metadata: {
      user_id: user.id,
      user_email: user.email,
      service_id: serviceId,
      datetime,
    },
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: intent.client_secret, amountCents });
}
