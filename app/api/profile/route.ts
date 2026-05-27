import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

type ProfileBody = {
  phone?: string;
  address?: string;
  dog_name?: string;
  dog_breed?: string;
  dog_age?: string;
  dog_photo_url?: string;
};

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('phone, address, dog_name, dog_breed, dog_age, dog_photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Failed to load profile' }, { status: 500 });
  }

  return NextResponse.json({
    profile: profile ?? null,
    name: (user.user_metadata?.name as string | undefined) ?? '',
    email: user.email ?? '',
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as ProfileBody & { name?: string };
  const { name, ...profileFields } = body;

  const { error: upsertError } = await supabaseAdmin
    .from('profiles')
    .upsert({ user_id: user.id, ...profileFields, updated_at: new Date().toISOString() });

  if (upsertError) {
    console.error('Profile upsert error:', upsertError);
    return NextResponse.json({ message: 'Failed to save profile' }, { status: 500 });
  }

  if (name !== undefined) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const userClient = (await import('@supabase/supabase-js')).createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await userClient.auth.setSession({ access_token: token, refresh_token: '' });
      await userClient.auth.updateUser({ data: { name } }).catch((e: unknown) => {
        console.error('Name update error:', e);
      });
    }
  }

  return NextResponse.json({ success: true });
}
