import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://projectpaw.vercel.app';

  // Fire-and-acknowledge: Supabase will only send mail for real accounts,
  // but we always return success to avoid leaking which emails are registered.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  return NextResponse.json({
    message: "If an account exists for that email, we've sent a reset link.",
  });
}
