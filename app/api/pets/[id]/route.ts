import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { PetRow } from '../route';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Invalid session', status: 401 as const };
  return { user };
}

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as Partial<Omit<PetRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>>;

  const updates: Record<string, string | null> = {};
  if (body.name !== undefined) {
    const name = sanitize(body.name);
    if (!name) return NextResponse.json({ message: "Pet's name is required." }, { status: 400 });
    if (name.length > 60) return NextResponse.json({ message: 'Name is too long (max 60).' }, { status: 400 });
    updates.name = name;
  }
  if (body.breed !== undefined) updates.breed = sanitize(body.breed);
  if (body.age !== undefined) updates.age = sanitize(body.age);
  if (body.weight !== undefined) updates.weight = sanitize(body.weight);
  if (body.notes !== undefined) updates.notes = sanitize(body.notes);
  if (body.photo_url !== undefined) updates.photo_url = sanitize(body.photo_url);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('pets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('PATCH /api/pets/[id] error:', error);
    return NextResponse.json({ message: 'Pet not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ pet: data as PetRow });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('pets')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('DELETE /api/pets/[id] error:', error);
    return NextResponse.json({ message: 'Failed to delete pet' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
