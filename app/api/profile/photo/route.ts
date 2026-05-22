import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'dog-photos';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — clients auto-compress before upload
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function storagePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ message: 'Invalid session' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: 'Only JPG, PNG, or WebP allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: 'File must be under 5 MB' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Delete old photo if exists
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('dog_photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.dog_photo_url) {
    const oldPath = storagePath(existing.dog_photo_url);
    if (oldPath) {
      await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
    }
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
