import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Explicitly pick allowed fields — prevents unintended column overwrites
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.price !== undefined) patch.price = body.price;
  if (body.duration !== undefined) patch.duration = body.duration;
  if (body.description !== undefined) patch.description = body.description;
  if (body.icon_key !== undefined) patch.icon_key = body.icon_key;
  if (body.gradient !== undefined) patch.gradient = body.gradient;
  if (body.popular !== undefined) patch.popular = body.popular;

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }
    console.error('Service update error:', error);
    return NextResponse.json({ message: 'Failed to update service' }, { status: 500 });
  }

  return NextResponse.json({ service: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin.from('services').delete().eq('id', id).select('id');

  if (error) {
    console.error('Service delete error:', error);
    return NextResponse.json({ message: 'Failed to delete service' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
