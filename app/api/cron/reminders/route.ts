import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSms } from '@/lib/twilio';

// Runs daily at 9 AM UTC via Vercel Cron (see vercel.json).
// Targets bookings happening 16–32 hours from now, so every appointment
// in the next-day window gets exactly one reminder regardless of booking time.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 16 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 32 * 60 * 60 * 1000);

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, datetime, dog_name, service_name, user_id')
    .eq('status', 'upcoming')
    .eq('reminder_sent', false)
    .gte('datetime', windowStart.toISOString())
    .lte('datetime', windowEnd.toISOString());

  if (error) {
    console.error('Reminder cron fetch error:', error);
    return NextResponse.json({ message: 'DB error' }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Fetch profiles for all unique user_ids in one query
  const userIds = [...new Set(bookings.map((b) => b.user_id as string))];
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, phone')
    .in('user_id', userIds);

  const phoneMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    if ((p as { phone?: string | null }).phone) {
      phoneMap.set(p.user_id as string, (p as { phone: string }).phone);
    }
  }

  let sent = 0;
  for (const booking of bookings) {
    const phone = phoneMap.get(booking.user_id as string);
    const apptTime = new Date(booking.datetime as string).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (phone) {
      try {
        await sendSms(
          phone,
          `Reminder: ${booking.service_name} for ${booking.dog_name} is tomorrow at ${apptTime}. Reply CANCEL to cancel, HELP for support, or STOP to opt out. — ProjectPaw 🐾`,
        );
        sent++;
      } catch (e) {
        console.error(`SMS reminder failed for booking ${booking.id}:`, e);
      }
    }

    // Mark as sent regardless — avoids retry spam if SMS fails
    await supabaseAdmin
      .from('bookings')
      .update({ reminder_sent: true })
      .eq('id', booking.id);
  }

  return NextResponse.json({ sent, total: bookings.length });
}
