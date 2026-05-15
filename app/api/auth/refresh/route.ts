import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { refreshToken } = (await req.json()) as { refreshToken: string };

  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token provided.' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return NextResponse.json({ message: 'Session expired. Please log in again.' }, { status: 401 });
  }

  return NextResponse.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
