import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Brute-force protection. Per-email blocks credential-stuffing against one
// known address; per-IP catches spraying across many accounts from one host.
const PER_EMAIL_MAX = 8;
const PER_EMAIL_WINDOW_MIN = 15;
const PER_IP_MAX = 20;
const PER_IP_WINDOW_MIN = 15;

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password required.' }, { status: 400 });
  }

  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit({
      bucket: 'auth_login_email',
      identifier: email.toLowerCase().trim(),
      max: PER_EMAIL_MAX,
      windowMinutes: PER_EMAIL_WINDOW_MIN,
    }),
    checkRateLimit({
      bucket: 'auth_login_ip',
      identifier: getClientIp(req),
      max: PER_IP_MAX,
      windowMinutes: PER_IP_WINDOW_MIN,
    }),
  ]);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
      {
        message: `Too many login attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Limit': String(PER_EMAIL_MAX) },
      },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ message: error?.message ?? 'Login failed.' }, { status: 401 });
  }

  const name =
    (data.user.user_metadata?.name as string | undefined) ??
    data.user.email?.split('@')[0] ??
    'User';

  return NextResponse.json({
    user: { name, email: data.user.email },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
