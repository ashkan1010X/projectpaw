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
                <label htmlFor="dog_name" className="mb-1.5 block font-pawprint text-xs text-paw/50">Dog&apos;s Name</label>
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
