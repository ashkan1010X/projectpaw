import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email: string; password: string };

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
