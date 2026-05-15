import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabaseAdmin } from '@/lib/supabase-admin';

const { MessagingResponse } = twilio.twiml;

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'support@projectpaw.com';

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
      .select('id, service_name, dog_name, datetime')
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

    await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);

    const apptTime = new Date(booking.datetime as string).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return twimlResponse(
      `Cancelled ✓ Your ${booking.service_name as string} for ${booking.dog_name as string} on ${apptTime} has been cancelled. We hope to see you again soon! — ProjectPaw 🐾`,
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
