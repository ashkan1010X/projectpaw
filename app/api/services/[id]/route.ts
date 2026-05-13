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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as Partial<{
    name: string;
    price: number;
    duration: string;
    description: string;
    icon_key: string;
    gradient: string;
    popular: boolean;
  }>;

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Service update error:', error);
    return NextResponse.json({ message: 'Failed to update service' }, { status: 500 });
  }

  return NextResponse.json({ service: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Service delete error:', error);
    return NextResponse.json({ message: 'Failed to delete service' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
