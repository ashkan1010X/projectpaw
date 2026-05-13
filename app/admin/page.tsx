'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import type { ServiceRow } from '@/lib/service-icons';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';

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

type DrawerErrors = {
  name?: string;
  price?: string;
  duration?: string;
  description?: string;
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
  const [fieldErrors, setFieldErrors] = useState<DrawerErrors>({});
  const [tableError, setTableError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) {
      router.replace('/login');
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      router.replace('/');
      return;
    }
  }, [initialized, user, token, router]);

  // Load services
  useEffect(() => {
    if (!initialized || !user || user.email !== ADMIN_EMAIL) return;
    void (async () => {
      try {
        const { data, error } = await supabase.from('services').select('*').order('sort_order');
        if (error) {
          setTableError('Failed to load services. Please refresh the page.');
        } else if (data) {
          setServices(data as ServiceRow[]);
        }
      } finally {
        setLoading(false);
      }
    })();
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
    setFieldErrors({});
  }

  function validateField(field: keyof DrawerErrors, value: string): string | undefined {
    if (field === 'name' && !value.trim()) return 'Name is required.';
    if (field === 'price') {
      if (!value) return 'Price is required.';
      if (isNaN(Number(value)) || Number(value) < 0) return 'Enter a valid price (0 or more).';
    }
    if (field === 'duration' && !value.trim()) return 'Duration is required.';
    if (field === 'description' && !value.trim()) return 'Description is required.';
    return undefined;
  }

  async function handleSave() {
    const errors: DrawerErrors = {
      name: validateField('name', form.name),
      price: validateField('price', form.price),
      duration: validateField('duration', form.duration),
      description: validateField('description', form.description),
    };
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setDrawerError(null);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      duration: form.duration.trim(),
      description: form.description.replace(/\s+/g, ' ').trim(),
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
        if (!res.ok) {
          let message = `Request failed (${res.status})`;
          try {
            message = ((await res.json()) as { message?: string }).message ?? message;
          } catch {
            /* non-JSON */
          }
          throw new Error(message);
        }
        const { service } = (await res.json()) as { service: ServiceRow };
        setServices((prev) => prev.map((s) => (s.id === editingId ? service : s)));
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let message = `Request failed (${res.status})`;
          try {
            message = ((await res.json()) as { message?: string }).message ?? message;
          } catch {
            /* non-JSON */
          }
          throw new Error(message);
        }
        const { service } = (await res.json()) as { service: ServiceRow };
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
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        if (editingId === id) closeDrawer();
      } else {
        setDeleteError('Failed to delete service. Please try again.');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
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
        <div className={cn('flex-1', drawerOpen && 'hidden md:block')}>
          {/* Table header — desktop only */}
          <div className="hidden sm:grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 border-b border-paw/[0.08] px-5 py-3 font-pawprint text-[0.68rem] font-semibold uppercase tracking-wider text-paw/40">
            <span>Service</span>
            <span>Price</span>
            <span>Duration</span>
            <span>Pop.</span>
            <span>Actions</span>
          </div>
          {tableError && (
            <p className="px-5 py-8 font-pawprint text-sm text-red-400">{tableError}</p>
          )}
          {services.length === 0 && (
            <p className="px-5 py-8 font-pawprint text-sm text-paw/40">No services yet.</p>
          )}
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                'border-b border-paw/[0.05] transition-colors last:border-0',
                editingId === service.id && 'border-l-2 border-l-doggy bg-doggy/5',
              )}
            >
              {/* Mobile card layout */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm',
                      service.gradient,
                    )}
                  >
                    {ICON_OPTIONS.find((i) => i.key === service.icon_key)?.emoji ?? '✨'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-pawprint text-sm font-semibold text-paw">
                      {service.name}
                    </p>
                    <p className="font-pawprint text-xs text-paw/50">
                      <span className="text-accent">${service.price}</span>
                      <span className="mx-1 text-paw/20">·</span>
                      {service.duration}
                      {service.popular && (
                        <>
                          <span className="mx-1 text-paw/20">·</span>
                          <span className="text-emerald-400">Popular</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => openEdit(service)}
                    aria-label={`Edit ${service.name}`}
                    className="rounded-md border border-doggy/30 px-3 py-1.5 font-pawprint text-xs font-semibold text-doggy transition-all hover:border-doggy/60 hover:bg-doggy/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    aria-label={`Delete ${service.name}`}
                    className="rounded-md border border-red-500/25 px-3 py-1.5 font-pawprint text-xs font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/10"
                  >
                    Del
                  </button>
                </div>
              </div>

              {/* Desktop row layout */}
              <div className="hidden sm:grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 px-5 py-3.5 font-pawprint text-sm text-paw/80">
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
                    aria-label={`Delete ${service.name}`}
                    className="font-semibold text-red-400 hover:text-red-300"
                  >
                    Del
                  </button>
                </span>
              </div>
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
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setFieldErrors((fe) => ({ ...fe, name: undefined }));
                  }}
                  onBlur={(e) => {
                    const err = validateField('name', e.target.value);
                    setFieldErrors((fe) => ({ ...fe, name: err }));
                  }}
                  className={cn(
                    'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
                    fieldErrors.name ? 'border-red-500/60' : 'border-paw/10',
                  )}
                  placeholder="e.g. Grooming"
                />
                {fieldErrors.name && (
                  <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.name}</p>
                )}
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
                    onChange={(e) => {
                      setForm((f) => ({ ...f, price: e.target.value }));
                      setFieldErrors((fe) => ({ ...fe, price: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('price', e.target.value);
                      setFieldErrors((fe) => ({ ...fe, price: err }));
                    }}
                    className={cn(
                      'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
                      fieldErrors.price ? 'border-red-500/60' : 'border-paw/10',
                    )}
                    placeholder="30"
                  />
                  {fieldErrors.price && (
                    <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                    Duration *
                  </label>
                  <input
                    value={form.duration}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, duration: e.target.value }));
                      setFieldErrors((fe) => ({ ...fe, duration: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('duration', e.target.value);
                      setFieldErrors((fe) => ({ ...fe, duration: err }));
                    }}
                    className={cn(
                      'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
                      fieldErrors.duration ? 'border-red-500/60' : 'border-paw/10',
                    )}
                    placeholder="90 min"
                  />
                  {fieldErrors.duration && (
                    <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.duration}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block font-pawprint text-[0.65rem] font-semibold uppercase tracking-wider text-paw/40">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, description: e.target.value }));
                    setFieldErrors((fe) => ({ ...fe, description: undefined }));
                  }}
                  onBlur={(e) => {
                    const err = validateField('description', e.target.value);
                    setFieldErrors((fe) => ({ ...fe, description: err }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  rows={3}
                  className={cn(
                    'w-full resize-none rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
                    fieldErrors.description ? 'border-red-500/60' : 'border-paw/10',
                  )}
                  placeholder="Describe the service…"
                />
                {fieldErrors.description && (
                  <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.description}</p>
                )}
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
                  aria-label={form.popular ? 'Mark as not popular' : 'Mark as popular'}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors duration-200',
                    form.popular ? 'bg-doggy' : 'bg-paw/20',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-[2px] top-[2px] size-5 rounded-full bg-white shadow transition-transform duration-200',
                      form.popular ? 'translate-x-[1.25rem]' : 'translate-x-0',
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

      {/* Delete error banner */}
      {deleteError && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-red-500/25 bg-[#1a1612] px-5 py-3 shadow-2xl">
          <p className="inline font-pawprint text-sm text-red-400">{deleteError}</p>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="ml-3 font-pawprint text-xs text-red-400/60 hover:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Delete Service"
        message={`Are you sure you want to delete "${services.find((s) => s.id === pendingDeleteId)?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </main>
  );
}
