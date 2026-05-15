import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { name, email, password } = (await req.json()) as {
    name: string;
    email: string;
    password: string;
  };

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
