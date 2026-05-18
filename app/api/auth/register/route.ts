import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isPasswordPwned } from '@/lib/hibp';

export async function POST(req: NextRequest) {
  const { name, email, password } = (await req.json()) as {
    name: string;
    email: string;
    password: string;
  };

  // HIBP check — block passwords known to have appeared in past data breaches.
  // Server-side enforcement (client also checks, but never trust the client).
  if (password && typeof password === 'string') {
    const pwn = await isPasswordPwned(password);
    if (pwn.pwned) {
      return NextResponse.json(
        {
          message: `This password has appeared in ${pwn.breachCount.toLocaleString()} known data breaches. Please choose a different password.`,
        },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { message: error?.message ?? 'Registration failed.' },
      { status: 400 },
    );
  }

  if (!data.session) {
    return NextResponse.json(
      {
        message:
          'Account created! Please check your email to confirm your address before signing in.',
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    user: { name, email: data.user.email },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
