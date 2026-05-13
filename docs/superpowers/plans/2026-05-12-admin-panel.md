# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a protected `/admin` page where the business owner can add, edit, and delete services via a table + side-drawer UI, backed by new API routes.

**Architecture:** Admin identity is determined by comparing the Supabase token's email against `ADMIN_EMAIL` env var. Three new API routes handle mutations (`POST /api/services`, `PATCH /api/services/[id]`, `DELETE /api/services/[id]`), following the exact same auth pattern as `/api/bookings`. The admin page is a single client component with shared state for the table and drawer.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (`supabase` client for auth verification, `supabaseAdmin` for mutations)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `.env.local` | Modify | Add `ADMIN_EMAIL` + `NEXT_PUBLIC_ADMIN_EMAIL` |
| `app/api/services/route.ts` | Create | POST — create a new service |
| `app/api/services/[id]/route.ts` | Create | PATCH — update, DELETE — delete |
| `app/admin/page.tsx` | Create | Auth gate + services table + edit drawer (all in one) |
| `app/admin/loading.tsx` | Create | Skeleton loader |
| `components/nav-bar.tsx` | Modify | Add Admin link (visible to admin only) |

---

## Task 1: Environment Variables

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add env vars to `.env.local`**

Open `.env.local` (project root) and add these two lines. Replace the email with your actual Supabase account email:

```env
ADMIN_EMAIL=ashkan861@gmail.com
NEXT_PUBLIC_ADMIN_EMAIL=ashkan861@gmail.com
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore(env): add ADMIN_EMAIL vars for admin panel auth"
```

> Note: `.env.local` is already in `.gitignore` — this commit will be empty if so. That's fine. Just add the vars to the file directly.

---

## Task 2: API Route — Create Service

**Files:**
- Create: `app/api/services/route.ts`

- [ ] **Step 1: Create the file**

```typescript
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
  if (!name || !duration || !description || !icon_key || !gradient || price == null) {
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
```

- [ ] **Step 2: Verify the file builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors on the new file. (Full build may have other unrelated warnings — that's fine.)

- [ ] **Step 3: Commit**

```bash
git add app/api/services/route.ts
git commit -m "feat(api): add POST /api/services for admin service creation"
```

---

## Task 3: API Route — Update and Delete Service

**Files:**
- Create: `app/api/services/[id]/route.ts`

- [ ] **Step 1: Create the directory and file**

```typescript
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
```

- [ ] **Step 2: Verify no build errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add "app/api/services/[id]/route.ts"
git commit -m "feat(api): add PATCH and DELETE /api/services/[id] for admin"
```

---

## Task 4: Admin Page — Auth Gate, Table, and Drawer

**Files:**
- Create: `app/admin/page.tsx`

This is a single `'use client'` component. It contains: auth gate logic, services table, and the edit/add drawer with form.

- [ ] **Step 1: Create `app/admin/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import type { ServiceRow } from '@/lib/service-icons';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

const GRADIENT_PRESETS = [
  { label: 'Pink', value: 'from-pink-500 to-rose-500' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-500' },
  { label: 'Blue', value: 'from-blue-500 to-indigo-500' },
  { label: 'Amber', value: 'from-amber-500 to-yellow-500' },
  { label: 'Red', value: 'from-red-500 to-orange-500' },
  { label: 'Violet', value: 'from-violet-500 to-purple-500' },
  { label: 'Cyan', value: 'from-cyan-500 to-sky-500' },
];

const ICON_OPTIONS = [
  { key: 'scissors', emoji: '✂️' },
  { key: 'footprints', emoji: '🐾' },
  { key: 'home', emoji: '🏠' },
  { key: 'graduation-cap', emoji: '🎓' },
  { key: 'stethoscope', emoji: '🩺' },
  { key: 'sun', emoji: '☀️' },
  { key: 'sparkles', emoji: '✨' },
];

type FormData = {
  name: string;
  price: string;
  duration: string;
  description: string;
  icon_key: string;
  gradient: string;
  popular: boolean;
};

const EMPTY_FORM: FormData = {
  name: '',
  price: '',
  duration: '',
  description: '',
  icon_key: 'sparkles',
  gradient: 'from-pink-500 to-rose-500',
  popular: false,
};

function serviceToForm(s: ServiceRow): FormData {
  return {
    name: s.name,
    price: String(s.price),
    duration: s.duration,
    description: s.description,
    icon_key: s.icon_key,
    gradient: s.gradient,
    popular: s.popular,
  };
}

export default function AdminPage() {
  const { user, token, initialized } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = adding new
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) { router.replace('/login'); return; }
    if (user.email !== ADMIN_EMAIL) { router.replace('/'); return; }
  }, [initialized, user, token, router]);

  // Load services
  useEffect(() => {
    if (!initialized || !user || user.email !== ADMIN_EMAIL) return;
    supabase
      .from('services')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setServices(data as ServiceRow[]);
      })
      .finally(() => setLoading(false));
  }, [initialized, user]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  function openEdit(service: ServiceRow) {
    setEditingId(service.id);
    setForm(serviceToForm(service));
    setDrawerError(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerError(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.duration.trim() || !form.description.trim() || !form.price) {
      setDrawerError('Name, price, duration, and description are required.');
      return;
    }
    setSaving(true);
    setDrawerError(null);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      duration: form.duration.trim(),
      description: form.description.trim(),
      icon_key: form.icon_key,
      gradient: form.gradient,
      popular: form.popular,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/services/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json() as { message: string }).message);
        const { service } = await res.json() as { service: ServiceRow };
        setServices((prev) => prev.map((s) => (s.id === editingId ? service : s)));
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json() as { message: string }).message);
        const { service } = await res.json() as { service: ServiceRow };
        setServices((prev) => [...prev, service]);
      }
      closeDrawer();
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) closeDrawer();
    } else {
      alert('Failed to delete service.');
    }
  }

  if (loading) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-elegant text-3xl font-black text-paw">Services</h1>
          <p className="mt-1 font-pawprint text-sm text-paw/50">
            {services.length} service{services.length !== 1 ? 's' : ''} · manage your offerings
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-doggy px-4 py-2 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-doggy/40"
        >
          + Add New
        </button>
      </div>

      <div className="flex gap-0 rounded-xl border border-paw/[0.08] overflow-hidden bg-[#1a1612]">
        {/* Table */}
        <div className={cn('flex-1 overflow-x-auto', drawerOpen && 'hidden md:block')}>
          {/* Table header */}
          <div className="grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 border-b border-paw/[0.08] px-5 py-3 font-pawprint text-[0.68rem] font-semibold uppercase tracking-wider text-paw/40">
            <span>Service</span>
            <span>Price</span>
            <span>Duration</span>
            <span>Pop.</span>
            <span>Actions</span>
          </div>
          {services.length === 0 && (
            <p className="px-5 py-8 font-pawprint text-sm text-paw/40">No services yet.</p>
          )}
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                'grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 border-b border-paw/[0.05] px-5 py-3.5 font-pawprint text-sm text-paw/80 transition-colors last:border-0',
                editingId === service.id && 'border-l-2 border-l-doggy bg-doggy/5',
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-paw">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs',
                    service.gradient,
                  )}
                >
                  {ICON_OPTIONS.find((i) => i.key === service.icon_key)?.emoji ?? '✨'}
                </span>
                {service.name}
              </span>
              <span className="text-accent">${service.price}</span>
              <span className="text-paw/50">{service.duration}</span>
              <span className={service.popular ? 'text-emerald-400' : 'text-paw/20'}>
                {service.popular ? '✓' : '—'}
              </span>
              <span className="flex items-center gap-3">
                <button
                  onClick={() => openEdit(service)}
                  className="font-semibold text-doggy hover:text-doggy/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="font-semibold text-red-400 hover:text-red-300"
                >
                  Del
                </button>
              </span>
            </div>
          ))}
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div className="w-full md:w-80 shrink-0 border-l border-paw/[0.08] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-elegant text-lg font-black text-paw">
                {editingId ? 'Edit Service' : 'New Service'}
              </h2>
              <button onClick={closeDrawer} className="font-pawprint text-paw/40 hover:text-paw/80">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-paw/10 bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy"
                  placeholder="e.g. Grooming"
                />
              </div>

              {/* Price + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-paw/10 bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                    Duration *
                  </label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full rounded-lg border border-paw/10 bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy"
                    placeholder="90 min"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-paw/10 bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy resize-none"
                  placeholder="Describe the service..."
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="mb-2 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setForm((f) => ({ ...f, icon_key: opt.key }))}
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-lg transition-all',
                        form.icon_key === opt.key
                          ? 'border-doggy bg-doggy/10'
                          : 'border-paw/10 bg-white/5 hover:border-paw/20',
                      )}
                      title={opt.key}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient picker */}
              <div>
                <label className="mb-2 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                  Color Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setForm((f) => ({ ...f, gradient: preset.value }))}
                      className={cn(
                        'size-8 rounded-lg bg-gradient-to-br transition-all',
                        preset.value,
                        form.gradient === preset.value
                          ? 'ring-2 ring-doggy ring-offset-1 ring-offset-[#1a1612]'
                          : 'opacity-70 hover:opacity-100',
                      )}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Popular toggle */}
              <div className="flex items-center justify-between border-t border-paw/[0.07] pt-3">
                <span className="font-pawprint text-sm text-paw/70">Mark as Popular</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, popular: !f.popular }))}
                  className={cn(
                    'relative h-6 w-10 rounded-full transition-colors duration-200',
                    form.popular ? 'bg-doggy' : 'bg-paw/20',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
                      form.popular ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>

              {/* Error */}
              {drawerError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-pawprint text-xs text-red-400">
                  {drawerError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-doggy py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Service'}
                </button>
                <button
                  onClick={closeDrawer}
                  className="rounded-lg border border-paw/10 bg-white/5 px-4 font-pawprint text-sm text-paw/50 hover:text-paw/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run build 2>&1 | tail -30
```

Expected: no errors in `app/admin/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): add admin page with services table and edit drawer"
```

---

## Task 5: Admin Loading Skeleton

**Files:**
- Create: `app/admin/loading.tsx`

- [ ] **Step 1: Create the file**

```typescript
export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-paw/10" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-paw/5" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded-lg bg-paw/10" />
      </div>
      <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612]">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 border-b border-paw/[0.05] px-5 py-3.5 last:border-0"
          >
            <div className="flex items-center gap-2">
              <div className="size-7 animate-pulse rounded-lg bg-paw/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-paw/10" />
            </div>
            <div className="h-4 w-10 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-14 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-6 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-16 animate-pulse rounded bg-paw/10" />
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/loading.tsx
git commit -m "feat(admin): add loading skeleton for admin page"
```

---

## Task 6: Admin Link in Navbar

**Files:**
- Modify: `components/nav-bar.tsx`

- [ ] **Step 1: Add `Settings` to the lucide-react import and add `ADMIN_EMAIL` constant**

At the top of `components/nav-bar.tsx`, find the lucide import line and add `Settings`:

```typescript
import { PawPrint, Home, Info, Images, Scissors, LayoutDashboard, Settings } from 'lucide-react';
```

After the `NAV_LINKS` constant, add:

```typescript
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
```

- [ ] **Step 2: Add the desktop Admin link**

Find the desktop Dashboard `<Link>` (around line 82 — `href="/dashboard"` with `hidden ... md:flex` classes). Add the Admin link directly after the closing `</Link>` tag of Dashboard, before the Logout `<button>`:

```tsx
{user && user.email === ADMIN_EMAIL && (
  <Link
    href="/admin"
    className={cn(
      'hidden items-center gap-1.5 rounded-lg border border-paw/15 px-4 py-2 font-pawprint text-xs font-semibold transition-all duration-300 hover:border-paw/35 hover:bg-paw/[0.04] md:flex',
      pathname === '/admin' ? 'border-doggy/40 text-doggy' : 'text-paw/70 hover:text-paw',
    )}
  >
    <Settings size={13} />
    Admin
  </Link>
)}
```

- [ ] **Step 3: Add the mobile Admin link**

Find the mobile `{user && (<ul className="mt-1">...)}` block (around line 187). It contains the Dashboard `<li>`. Add the Admin `<li>` directly after the Dashboard `<li>`, inside the same `<ul>`:

```tsx
{user && user.email === ADMIN_EMAIL && (
  <li>
    <Link
      href="/admin"
      onClick={() => setIsOpen(false)}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 font-pawprint text-lg font-semibold transition-colors duration-200',
        pathname === '/admin'
          ? 'border-l-2 border-doggy bg-doggy/10 text-paw'
          : 'border-l-2 border-transparent text-paw/60 hover:bg-paw/[0.04] hover:text-paw',
      )}
    >
      <Settings
        size={18}
        className={cn(pathname === '/admin' ? 'text-doggy' : 'text-paw/40')}
      />
      Admin
    </Link>
  </li>
)}
```

- [ ] **Step 5: Verify the build is clean**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/nav-bar.tsx
git commit -m "feat(nav): add Admin link for admin user in desktop and mobile nav"
```

---

## Task 7: Smoke Test (Manual)

No test runner is configured. Verify everything works end-to-end in the browser.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test auth gate — non-admin user**

Log in as any non-admin account. Navigate to `http://localhost:3000/admin`. Expected: immediate redirect to `/`.

- [ ] **Step 3: Test auth gate — logged out**

Log out. Navigate to `http://localhost:3000/admin`. Expected: redirect to `/login`.

- [ ] **Step 4: Test auth gate — admin user**

Log in as the admin account (`ashkan861@gmail.com`). Navigate to `http://localhost:3000/admin`. Expected: page loads with the services table showing all 7 services. The "Admin" link appears in the navbar.

- [ ] **Step 5: Test Edit**

Click "Edit" on any service. Expected: drawer opens pre-filled with that service's data. Change the price. Click "Save Changes". Expected: drawer closes, table updates with the new price. Reload the page — confirm the change persisted (it's in the DB).

- [ ] **Step 6: Test Add**

Click "+ Add New". Expected: drawer opens empty. Fill in all required fields (name, price, duration, description), pick an icon and color. Click "Create Service". Expected: drawer closes, new service appears at the bottom of the table. Navigate to `/services` — confirm the new service appears on the public page.

- [ ] **Step 7: Test Delete**

Click "Del" on a service. Expected: browser confirm dialog appears. Click OK. Expected: service removed from table. Navigate to `/services` — confirm it's gone from the public page.

- [ ] **Step 8: Test validation**

Click "+ Add New", leave Name empty, click "Create Service". Expected: inline error message appears in the drawer ("Name, price, duration, and description are required."). No network request is made.

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin panel — CRUD for services with protected API routes"
git push
```
