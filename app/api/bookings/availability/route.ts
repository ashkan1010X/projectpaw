import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ takenHours: [] });
  }

  const dt = new Date(date);
  dt.setDate(dt.getDate() + 1);
  const nextDate = dt.toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('datetime')
    .gte('datetime', `${date}T00:00`)
    .lt('datetime', `${nextDate}T00:00`)
    .neq('status', 'cancelled');

  const takenHours = (data ?? []).map((b) =>
    new Date(b.datetime as string).getUTCHours(),
  );

  return NextResponse.json({ takenHours });
}
