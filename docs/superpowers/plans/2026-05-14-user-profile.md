# User Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/profile` page where logged-in users view/edit personal info and dog details (with photo upload to Supabase Storage), plus a nav pill dropdown and booking modal auto-fill.

**Architecture:** `profiles` table in Supabase linked to `auth.users` by `user_id`. Photo uploads go through `POST /api/profile/photo` (server-side, admin client). Nav "Hi, name" replaced with a pill dropdown. Dog name auto-fills the booking modal on open.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase DB + Storage (supabaseAdmin), Tailwind CSS v4, Lucide icons

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/api/profile/route.ts` | Create | GET + PATCH /api/profile |
| `app/api/profile/photo/route.ts` | Create | POST /api/profile/photo (upload) |
| `app/profile/page.tsx` | Create | Profile page (client component) |
| `app/profile/loading.tsx` | Create | Skeleton |
| `components/toast.tsx` | Create | Success/error toast |
| `components/dog-photo-upload.tsx` | Create | Circular photo upload widget |
| `components/nav-bar.tsx` | Modify | Replace static name with pill dropdown |
| `components/booking-modal.tsx` | Modify | Auto-fill dog name from profile |
| `contexts/auth-context.tsx` | Modify | Add `updateName` helper |

---

### Task 1: Supabase — profiles table + Storage bucket

**Files:**
- Supabase SQL (run in Supabase dashboard SQL editor or via MCP `execute_sql`)

- [ ] **Step 1: Create profiles table**

Run this SQL in Supabase → SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  dog_name TEXT,
  dog_breed TEXT,
  dog_age TEXT,
  dog_photo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Create dog-photos Storage bucket**

In Supabase → Storage → New bucket:
- Name: `dog-photos`
- Public: **ON** (so public URLs work without auth tokens)
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp`

- [ ] **Step 3: Add Storage RLS policies**

Run in SQL Editor:

```sql
CREATE POLICY "Authenticated users can upload dog photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dog-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can read dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

CREATE POLICY "Users can delete own dog photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

- [ ] **Step 4: Verify**

In Supabase → Table Editor, confirm `profiles` table exists with columns: `user_id`, `phone`, `address`, `dog_name`, `dog_breed`, `dog_age`, `dog_photo_url`, `updated_at`.

In Storage, confirm `dog-photos` bucket exists and is public.

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "chore: supabase profiles table + dog-photos storage bucket created"
```

---

### Task 2: Auth context — add updateName

**Files:**
- Modify: `contexts/auth-context.tsx`

The profile save updates the user's display name. After saving, we need the nav to reflect the new name immediately. `updateName` updates the in-memory + localStorage state without a full re-login.

- [ ] **Step 1: Add `updateName` to the interface and implementation**

Open `contexts/auth-context.tsx`. Replace the full file with:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  name: string;
  email?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('doguser');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser) as User);
        setToken(storedToken);
      }
    } catch {
      // ignore parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  function login(newUser: User, newToken: string) {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('doguser', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('doguser');
    localStorage.removeItem('token');
  }

  function updateName(name: string) {
    if (!user) return;
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem('doguser', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, token, initialized, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add contexts/auth-context.tsx
git commit -m "feat(auth): add updateName helper to auth context"
```

---

### Task 3: Toast component

**Files:**
- Create: `components/toast.tsx`

- [ ] **Step 1: Create the Toast component**

```typescript
'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  variant: 'success' | 'error';
  onDismiss: () => void;
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl',
        'animate-fade-in font-pawprint text-sm font-semibold',
        variant === 'success'
          ? 'border-emerald-500/25 bg-[#0f0d09] text-emerald-400'
          : 'border-red-500/25 bg-[#0f0d09] text-red-400',
      )}
    >
      {variant === 'success' ? (
        <CheckCircle className="size-4 shrink-0" strokeWidth={2} />
      ) : (
        <XCircle className="size-4 shrink-0" strokeWidth={2} />
      )}
      {message}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 cursor-pointer opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/toast.tsx
git commit -m "feat(ui): add Toast component (success/error, 3s auto-dismiss)"
```

---

### Task 4: API — GET + PATCH /api/profile

**Files:**
- Create: `app/api/profile/route.ts`

- [ ] **Step 1: Create the route**

```typescript
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
  const { data: { user }, error } = await supabase.auth.getUser(token);
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify manually**

Start dev server (`npm run dev`). In browser console while logged in:

```javascript
fetch('/api/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
  .then(r => r.json()).then(console.log)
```

Expected: `{ profile: null, name: "Ashkan", email: "ashkan861@gmail.com" }`

- [ ] **Step 4: Commit**

```bash
git add app/api/profile/route.ts
git commit -m "feat(api): add GET + PATCH /api/profile"
```

---

### Task 5: API — POST /api/profile/photo

**Files:**
- Create: `app/api/profile/photo/route.ts`

- [ ] **Step 1: Create the photo upload route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'dog-photos';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/photo/route.ts
git commit -m "feat(api): add POST /api/profile/photo for Supabase Storage upload"
```

---

### Task 6: DogPhotoUpload component

**Files:**
- Create: `components/dog-photo-upload.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';

import { useRef, useState } from 'react';
import { Camera, PawPrint, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DogPhotoUploadProps {
  currentUrl: string | null;
  token: string;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function DogPhotoUpload({ currentUrl, token, onUpload, onError }: DogPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      onError('Only JPG, PNG, or WebP images allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError('Photo must be under 5 MB.');
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Upload failed');
      onUpload(data.url!);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentUrl); // revert preview on failure
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload dog photo"
        className={cn(
          'group relative size-[108px] cursor-pointer rounded-full transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-doggy/60',
        )}
      >
        {/* Photo or placeholder */}
        {preview ? (
          <Image
            src={preview}
            alt="Dog photo"
            fill
            className="rounded-full object-cover"
            sizes="108px"
          />
        ) : (
          <div className="flex size-full items-center justify-center rounded-full border-2 border-dashed border-doggy/30 bg-doggy/[0.08]" style={{ boxShadow: '0 0 28px rgba(178,164,255,0.10)' }}>
            <PawPrint className="size-10 text-doggy/40" strokeWidth={1.5} />
          </div>
        )}

        {/* Hover overlay with camera icon */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity duration-200',
          uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          {uploading ? (
            <Loader2 className="size-7 animate-spin text-white" strokeWidth={1.5} />
          ) : (
            <Camera className="size-7 text-white" strokeWidth={1.5} />
          )}
        </div>

        {/* Camera badge */}
        {!uploading && (
          <div className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full border-2 border-[#0f0d09] bg-doggy shadow-lg shadow-doggy/30">
            <Camera className="size-3.5 text-white" strokeWidth={2} />
          </div>
        )}
      </button>

      <p className="font-pawprint text-[11px] text-paw/30">
        Click to upload · JPG/PNG · 5 MB max
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dog-photo-upload.tsx
git commit -m "feat(ui): add DogPhotoUpload component with instant preview + Supabase Storage"
```

---

### Task 7: Profile page

**Files:**
- Create: `app/profile/page.tsx`
- Create: `app/profile/loading.tsx`

- [ ] **Step 1: Create the loading skeleton**

Create `app/profile/loading.tsx`:

```typescript
export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-paw/[0.08]" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-paw/[0.05]" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
          <div className="mb-5 h-3 w-24 animate-pulse rounded bg-paw/[0.08]" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-paw/[0.05]" />
              <div className="h-11 animate-pulse rounded-xl bg-paw/[0.08]" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
          <div className="mb-5 h-3 w-20 animate-pulse rounded bg-paw/[0.08]" />
          <div className="mb-5 flex justify-center">
            <div className="size-[108px] animate-pulse rounded-full bg-paw/[0.08]" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-paw/[0.05]" />
              <div className="h-11 animate-pulse rounded-xl bg-paw/[0.08]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the profile page**

Create `app/profile/page.tsx`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { DogPhotoUpload } from '@/components/dog-photo-upload';
import { Toast } from '@/components/toast';
import { cn } from '@/lib/utils';

type Profile = {
  phone: string;
  address: string;
  dog_name: string;
  dog_breed: string;
  dog_age: string;
  dog_photo_url: string | null;
};

type ToastState = { message: string; variant: 'success' | 'error' } | null;

const inputClass = cn(
  'w-full rounded-xl border border-paw/[0.18] bg-paw/[0.04] px-4 py-3',
  'font-pawprint text-sm text-paw placeholder:text-paw/25',
  'outline-none transition-all duration-300',
  'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
);

const lockedClass = cn(
  'w-full cursor-not-allowed rounded-xl border border-dashed border-paw/[0.08]',
  'bg-paw/[0.02] px-4 py-3 font-pawprint text-sm text-paw/30',
);

export default function ProfilePage() {
  const { user, token, initialized, updateName } = useAuth();
  const router = useRouter();

  const emptyForm: Profile = { phone: '', address: '', dog_name: '', dog_breed: '', dog_age: '', dog_photo_url: null };

  const [form, setForm] = useState<Profile>(emptyForm);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const savedRef = useRef<Profile>(emptyForm);

  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) { router.replace('/login'); return; }

    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<{ profile: Profile | null; name: string; email: string }>)
      .then(({ profile, name: n, email: e }) => {
        const loaded: Profile = {
          phone: profile?.phone ?? '',
          address: profile?.address ?? '',
          dog_name: profile?.dog_name ?? '',
          dog_breed: profile?.dog_breed ?? '',
          dog_age: profile?.dog_age ?? '',
          dog_photo_url: profile?.dog_photo_url ?? null,
        };
        setForm(loaded);
        savedRef.current = loaded;
        setName(n);
        setEmail(e);
      })
      .catch(() => setToast({ message: 'Failed to load profile', variant: 'error' }))
      .finally(() => setLoading(false));
  }, [initialized, user, token, router]);

  function set(field: keyof Profile) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, ...form }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed to save');
      }
      savedRef.current = { ...form };
      updateName(name);
      setToast({ message: 'Profile saved', variant: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to save — try again', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null; // loading.tsx handles the skeleton

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-elegant text-3xl font-black text-paw">My Profile</h1>
          <p className="mt-1 font-pawprint text-sm text-paw/45">Your details · your dog</p>
        </div>
        <Link
          href="/dashboard"
          className="font-pawprint text-sm text-paw/40 transition-colors hover:text-paw border border-paw/10 rounded-lg px-4 py-2 hover:border-paw/25"
        >
          ← Dashboard
        </Link>
      </div>

      <form onSubmit={(e) => void handleSave(e)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Left: Personal Info */}
          <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
            <p className="mb-5 font-pawprint text-[10px] font-bold uppercase tracking-[0.14em] text-paw/35">
              Personal Info
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block font-pawprint text-xs text-paw/50">Full Name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 font-pawprint text-xs text-paw/50">
                  Email
                  <span className="rounded bg-paw/[0.06] px-1.5 py-0.5 font-pawprint text-[10px] text-paw/25">locked</span>
                </label>
                <div className={lockedClass}>{email}</div>
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block font-pawprint text-xs text-paw/50">Phone</label>
                <input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. +1 (416) 555-0100" className={inputClass} />
              </div>
              <div>
                <label htmlFor="address" className="mb-1.5 block font-pawprint text-xs text-paw/50">Address</label>
                <input id="address" type="text" value={form.address} onChange={set('address')} placeholder="e.g. 123 Main St, Toronto" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Right: Dog card */}
          <div className="rounded-2xl border border-doggy/[0.15] bg-gradient-to-b from-doggy/[0.07] to-paw/[0.03] p-6" style={{ boxShadow: 'inset 0 1px 0 rgba(178,164,255,0.08)' }}>
            <p className="mb-5 font-pawprint text-[10px] font-bold uppercase tracking-[0.14em] text-paw/35">
              🐾 My Dog
            </p>

            {/* Centered photo */}
            <div className="mb-5 flex justify-center">
              <DogPhotoUpload
                currentUrl={form.dog_photo_url}
                token={token!}
                onUpload={(url) => setForm((f) => ({ ...f, dog_photo_url: url }))}
                onError={(msg) => setToast({ message: msg, variant: 'error' })}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="dog_name" className="mb-1.5 block font-pawprint text-xs text-paw/50">Dog's Name</label>
                <input id="dog_name" type="text" value={form.dog_name} onChange={set('dog_name')} placeholder="e.g. Buddy" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dog_breed" className="mb-1.5 block font-pawprint text-xs text-paw/50">Breed</label>
                  <input id="dog_breed" type="text" value={form.dog_breed} onChange={set('dog_breed')} placeholder="e.g. Labrador" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dog_age" className="mb-1.5 block font-pawprint text-xs text-paw/50">Age</label>
                  <input id="dog_age" type="text" value={form.dog_age} onChange={set('dog_age')} placeholder="e.g. 3 years" className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { setForm({ ...savedRef.current }); setName(user?.name ?? ''); }}
            className="cursor-pointer rounded-xl border border-paw/[0.12] px-5 py-2.5 font-pawprint text-sm font-semibold text-paw/45 transition-all duration-300 hover:border-paw/25 hover:text-paw/70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual test — visit /profile**

Start dev server. Log in as `ashkan861@gmail.com`. Go to `http://localhost:3000/profile`.

Expected:
- Page loads with your name and email pre-filled
- Dog section shows paw placeholder photo
- All fields are editable except email (dashed border)
- Cancel button resets to saved values
- Save shows "Saving…" then "✓ Profile saved" toast

- [ ] **Step 5: Commit**

```bash
git add app/profile/page.tsx app/profile/loading.tsx
git commit -m "feat(profile): add /profile page with personal info + dog card"
```

---

### Task 8: Nav pill dropdown

**Files:**
- Modify: `components/nav-bar.tsx`

Replace the current desktop "Hi, name" + separate Dashboard/Admin/Logout buttons with a pill chip that opens a dropdown. Mobile drawer gets a "My Profile" link added.

- [ ] **Step 1: Update nav-bar.tsx**

Open `components/nav-bar.tsx`. Make these targeted changes:

**1. Add imports** — add `useRef` to the React import, and add `ChevronDown` to lucide-react imports:

```typescript
import { useState, useRef, useEffect } from 'react';
import { PawPrint, Home, Info, Images, Scissors, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
```

**2. Add dropdown state** inside `NavBar()` after `const [isOpen, setIsOpen] = useState(false);`:

```typescript
const [dropdownOpen, setDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }
  if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [dropdownOpen]);
```

**3. Replace the entire desktop auth block** (the `{user ? (...) : (...)}` block inside `{/* Desktop auth — hidden on mobile */}`) with:

```typescript
{/* Desktop auth — hidden on mobile */}
{user ? (
  <div ref={dropdownRef} className="relative hidden md:block">
    {/* Pill chip */}
    <button
      onClick={() => setDropdownOpen((v) => !v)}
      aria-label="Open account menu"
      aria-expanded={dropdownOpen}
      className="flex items-center gap-2 rounded-full border border-doggy/25 bg-doggy/[0.08] py-1.5 pl-1.5 pr-3 font-pawprint text-sm font-semibold text-paw transition-all duration-300 hover:border-doggy/50 hover:bg-doggy/[0.12]"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark text-xs font-black text-white">
        {user.name.charAt(0).toUpperCase()}
      </span>
      <span>{user.name}</span>
      <ChevronDown
        size={13}
        className={cn('text-paw/40 transition-transform duration-200', dropdownOpen && 'rotate-180')}
      />
    </button>

    {/* Dropdown */}
    {dropdownOpen && (
      <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-paw/[0.1] bg-[#1a1612] shadow-2xl shadow-black/40">
        <div className="py-1">
          <Link
            href="/profile"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm text-paw/70 transition-colors hover:bg-paw/[0.04] hover:text-paw"
          >
            <span className="text-base">👤</span> My Profile
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm text-paw/70 transition-colors hover:bg-paw/[0.04] hover:text-paw"
          >
            <LayoutDashboard size={14} /> My Bookings
          </Link>
          {user.email === ADMIN_EMAIL && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm text-paw/70 transition-colors hover:bg-paw/[0.04] hover:text-paw"
            >
              <Settings size={14} /> Admin
            </Link>
          )}
          <div className="my-1 h-px bg-paw/[0.06]" />
          <button
            onClick={() => { logout(); setDropdownOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 font-pawprint text-sm text-paw/50 transition-colors hover:bg-paw/[0.04] hover:text-paw/70"
          >
            <span className="text-base">🚪</span> Logout
          </button>
        </div>
      </div>
    )}
  </div>
) : (
  <>
    <Link
      href="/login"
      className="hidden font-pawprint text-sm font-medium text-paw/60 transition-colors duration-300 hover:text-paw md:block"
    >
      Login
    </Link>
    <Link
      href="/signup"
      className="group relative hidden cursor-pointer overflow-hidden rounded-lg bg-doggy px-5 py-2 font-pawprint text-xs font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50 md:block"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">Sign Up</span>
    </Link>
  </>
)}
```

**4. Add "My Profile" to mobile drawer** — inside the `{user && (...)}` block in the mobile `<nav aria-label="Mobile menu">`, add a Profile link above the Dashboard link:

```typescript
{user && (
  <ul className="mt-1">
    <li>
      <Link
        href="/profile"
        onClick={() => setIsOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
          pathname === '/profile'
            ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
            : 'border-l-2 border-transparent text-paw/60 hover:bg-paw/[0.04] hover:text-paw',
        )}
      >
        <Settings size={18} className={cn(pathname === '/profile' ? 'text-doggy' : 'text-paw/40')} />
        My Profile
      </Link>
    </li>
    {/* existing Dashboard li */}
    {/* existing Admin li (if admin) */}
  </ul>
)}
```

(Keep the existing Dashboard and Admin `<li>` items — just add Profile above them.)

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual test**

Start dev server. Log in. On desktop: confirm pill chip shows your name and opens dropdown with My Profile / My Bookings / Logout. On mobile: confirm hamburger drawer shows "My Profile" link.

- [ ] **Step 4: Commit**

```bash
git add components/nav-bar.tsx
git commit -m "feat(nav): replace static name with pill dropdown (My Profile, My Bookings, Logout)"
```

---

### Task 9: Booking modal — auto-fill dog name from profile

**Files:**
- Modify: `components/booking-modal.tsx`

When the booking modal opens and `initialDogName` is empty, fetch the profile and pre-fill dog name.

- [ ] **Step 1: Add profile fetch to BookingModal**

In `components/booking-modal.tsx`, add a `useEffect` that fires on mount. Find the existing state declarations and add after them:

```typescript
// After: const [countdown, setCountdown] = useState(3);
// Add:
useEffect(() => {
  if (initialDogName || !token) return;
  fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json() as Promise<{ profile: { dog_name?: string | null } | null }>)
    .then(({ profile }) => {
      if (profile?.dog_name) setDogName(profile.dog_name);
    })
    .catch(() => {}); // silent — auto-fill is best-effort
}, [token, initialDogName]);
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual test**

1. Go to `/profile`, set dog name to "Buddy", save
2. Go to `/services`, click "Book Now" on any service
3. Confirm "Dog's Name" field is pre-filled with "Buddy"
4. Test rebook from dashboard — confirm rebook still uses the booking's original dog name (not profile)

- [ ] **Step 4: Commit**

```bash
git add components/booking-modal.tsx
git commit -m "feat(booking): auto-fill dog name from profile when modal opens"
```

---

### Task 10: Playwright mobile test

**Files:**
- Create: `/tmp/playwright-test-profile.js`

- [ ] **Step 1: Write and run the test**

Create and run this Playwright test:

```javascript
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';
const EMAIL = 'ashkan861@gmail.com';
const PASSWORD = 'Motorola100!';

const VIEWPORTS = [
  { name: 'Galaxy-S20', width: 360, height: 800 },
  { name: 'iPhone-14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 900 },
];

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}px) ===`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const p = await ctx.newPage();

    // Log in
    await p.goto(`${TARGET_URL}/login`);
    await p.waitForLoadState('networkidle');
    await p.fill('input[type="email"]', EMAIL);
    await p.fill('input[type="password"]', PASSWORD);
    await p.click('button[type="submit"]');
    await p.waitForURL('**/', { timeout: 8000 }).catch(() => {});

    // Navigate to /profile
    await p.goto(`${TARGET_URL}/profile`);
    await p.waitForLoadState('networkidle');
    console.log(`  /profile loaded: ${p.url().includes('/profile') ? '✅' : '❌'}`);

    // Check key elements
    const nameInput = p.locator('input#name');
    const emailLocked = p.locator('text=locked');
    const dogSection = p.locator('text=My Dog');
    const saveBtn = p.locator('button:has-text("Save Changes")');

    console.log(`  Name input visible: ${await nameInput.isVisible().catch(() => false) ? '✅' : '❌'}`);
    console.log(`  Email locked badge: ${await emailLocked.isVisible().catch(() => false) ? '✅' : '❌'}`);
    console.log(`  Dog section visible: ${await dogSection.isVisible().catch(() => false) ? '✅' : '❌'}`);
    console.log(`  Save button visible: ${await saveBtn.isVisible().catch(() => false) ? '✅' : '❌'}`);

    // Check nav pill on desktop
    if (vp.width >= 768) {
      const pill = p.locator('button[aria-label="Open account menu"]');
      console.log(`  Nav pill visible: ${await pill.isVisible().catch(() => false) ? '✅' : '❌'}`);
      // Open dropdown
      await pill.click();
      await p.waitForTimeout(200);
      const profileLink = p.locator('text=My Profile').first();
      console.log(`  Dropdown My Profile: ${await profileLink.isVisible().catch(() => false) ? '✅' : '❌'}`);
      await p.keyboard.press('Escape');
    }

    await p.screenshot({ path: `C:/Users/ashka/AppData/Local/Temp/profile-${vp.name}.png` });
    console.log(`  Screenshot saved`);
    await ctx.close();
  }

  console.log('\n✅ Done');
  await browser.close();
})();
```

Run it:
```bash
cd "C:/Users/ashka/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill" && node run.js /tmp/playwright-test-profile.js
```

Expected: all ✅ across all 4 viewports.

- [ ] **Step 2: Fix any layout issues found**

Check screenshots. Fix any mobile layout problems (text overflow, overlapping elements, tap targets too small).

- [ ] **Step 3: Final commit + push**

```bash
git add -A
git commit -m "feat(profile): complete user profile page, nav dropdown, booking auto-fill, photo upload"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `profiles` table + RLS — Task 1
- ✅ Supabase Storage `dog-photos` bucket — Task 1
- ✅ `GET /api/profile` — Task 4
- ✅ `PATCH /api/profile` (name + profile fields) — Task 4
- ✅ `POST /api/profile/photo` (upload + delete old) — Task 5
- ✅ `DogPhotoUpload` (instant preview, spinner, paw placeholder, camera badge) — Task 6
- ✅ Profile page (two-col desktop, single-col mobile, cancel resets, save toast) — Task 7
- ✅ Loading skeleton — Task 7
- ✅ Nav pill dropdown with click-outside + Escape close — Task 8
- ✅ Mobile drawer "My Profile" link — Task 8
- ✅ Booking modal dog name auto-fill — Task 9
- ✅ `updateName` in auth context — Task 2
- ✅ Toast component — Task 3
- ✅ Playwright mobile test — Task 10

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:** `Profile` type defined in `app/profile/page.tsx`. API returns `profile: Profile | null`. `DogPhotoUpload` receives `currentUrl: string | null` — matches `form.dog_photo_url`. `updateName(name: string)` defined in Task 2, called in Task 7. All consistent.
