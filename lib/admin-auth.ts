import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function verifyAdmin(
  req: NextRequest,
): Promise<{ id: string; email?: string } | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_EMAIL env var is not set');
    return null;
  }
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== adminEmail) return null;
  return user;
}
