import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Booking = {
  id: string;
  service_id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
  created_at: string;
  amount_cents: number | null;
  payment_method: string | null;
  payment_status: string | null;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, service_id, service_name, dog_name, datetime, notes, status, created_at, amount_cents, payment_method, payment_status',
    )
    .eq('user_id', user.id)
    .order('datetime', { ascending: false });

  if (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings.' }, { status: 500 });
  }

  return NextResponse.json({ bookings: (data ?? []) as Booking[] });
}
