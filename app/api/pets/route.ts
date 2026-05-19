import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isPetSpecies, type PetSpecies } from '@/lib/species';

export type PetRow = {
  id: string;
  user_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

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

export async function GET(req: NextRequest) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('pets')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/pets error:', error);
    return NextResponse.json({ message: 'Failed to load pets' }, { status: 500 });
  }

  return NextResponse.json({ pets: (data ?? []) as PetRow[] });
}

export async function POST(req: NextRequest) {
  const auth = await getUser(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    species?: string;
    breed?: string;
    age?: string;
    weight?: string;
    notes?: string;
    photo_url?: string;
  };

  const name = sanitize(body.name);
  if (!name) return NextResponse.json({ message: "Pet's name is required." }, { status: 400 });
  if (name.length > 60) return NextResponse.json({ message: 'Name is too long (max 60).' }, { status: 400 });

  const species: PetSpecies = isPetSpecies(body.species) ? body.species : 'dog';

  // Cap pets per user (defensive — prevents abuse)
  const { count } = await supabaseAdmin
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ message: 'You can save up to 10 pets.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('pets')
    .insert({
      user_id: auth.user.id,
      name,
      species,
      breed: sanitize(body.breed),
      age: sanitize(body.age),
      weight: sanitize(body.weight),
      notes: sanitize(body.notes),
      photo_url: sanitize(body.photo_url),
      sort_order: count ?? 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('POST /api/pets error:', error);
    return NextResponse.json({ message: 'Failed to add pet' }, { status: 500 });
  }

  return NextResponse.json({ pet: data as PetRow }, { status: 201 });
}
