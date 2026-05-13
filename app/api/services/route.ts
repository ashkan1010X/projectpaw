import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as {
    name: string;
    price: number;
    duration: string;
    description: string;
    icon_key: string;
    gradient: string;
    popular: boolean;
  };

  const { name, price, duration, description, icon_key, gradient, popular } = body;
  if (!name || !duration || !description || !icon_key || !gradient || price == null || popular == null) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // Derive sort_order: max existing + 1
  const { data: maxRow } = await supabaseAdmin
    .from('services')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = ((maxRow?.sort_order as number | null) ?? 0) + 1;
  const type = name.toLowerCase().replace(/\s+/g, '-');

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({ name, type, price, duration, description, icon_key, gradient, popular, sort_order })
    .select()
    .single();

  if (error) {
    console.error('Service create error:', error);
    return NextResponse.json({ message: 'Failed to create service' }, { status: 500 });
  }

  return NextResponse.json({ service: data }, { status: 201 });
}
