import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isPetSpecies } from '@/lib/species';
import type { PetRow } from '../route';

const BUCKET = 'dog-photos';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Invalid session', status: 401 as const };
  return { user };
}

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function extractStoragePath(url: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function deleteStoragePhoto(url: string | null) {
  const path = extractStoragePath(url);
  if (!path) return;
  await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path])
    .catch((e) => {
      console.error('Pet photo cleanup error:', e);
    });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as Partial<
    Omit<PetRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>
  >;

  const updates: Record<string, string | null> = {};
  if (body.name !== undefined) {
    const name = sanitize(body.name);
    if (!name) return NextResponse.json({ message: "Pet's name is required." }, { status: 400 });
    if (name.length > 60)
      return NextResponse.json({ message: 'Name is too long (max 60).' }, { status: 400 });
    updates.name = name;
  }
  if (body.species !== undefined) {
    if (!isPetSpecies(body.species)) {
      return NextResponse.json({ message: 'Invalid pet type.' }, { status: 400 });
    }
    updates.species = body.species;
  }
  if (body.breed !== undefined) updates.breed = sanitize(body.breed);
  if (body.age !== undefined) updates.age = sanitize(body.age);
  if (body.weight !== undefined) updates.weight = sanitize(body.weight);
  if (body.notes !== undefined) updates.notes = sanitize(body.notes);
  if (body.photo_url !== undefined) updates.photo_url = sanitize(body.photo_url);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
  }

  // If we're replacing the photo, grab the previous URL so we can clean it up
  let previousPhotoUrl: string | null = null;
  if (updates.photo_url !== undefined) {
    const { data: existing } = await supabaseAdmin
      .from('pets')
      .select('photo_url')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    previousPhotoUrl = (existing as { photo_url?: string | null } | null)?.photo_url ?? null;
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

  // Best-effort cleanup of the old photo file (after the row is updated)
  if (previousPhotoUrl && previousPhotoUrl !== updates.photo_url) {
    void deleteStoragePhoto(previousPhotoUrl);
  }

  return NextResponse.json({ pet: data as PetRow });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;

  // Capture the photo_url first so we can clean it after the row is deleted
  const { data: existing } = await supabaseAdmin
    .from('pets')
    .select('photo_url')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('pets')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('DELETE /api/pets/[id] error:', error);
    return NextResponse.json({ message: 'Failed to delete pet' }, { status: 500 });
  }

  // Best-effort cleanup
  const photoUrl = (existing as { photo_url?: string | null } | null)?.photo_url ?? null;
  if (photoUrl) void deleteStoragePhoto(photoUrl);

  return NextResponse.json({ success: true });
}
