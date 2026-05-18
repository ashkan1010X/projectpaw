'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus, PawPrint } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { PhoneInput } from '@/components/phone-input';
import { Toast } from '@/components/toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PetDrawer, type PetFormData } from '@/components/pet-drawer';
import { cn } from '@/lib/utils';

type Profile = {
  phone: string;
  address: string;
};

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  photo_url: string | null;
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
  const { user, token, initialized, updateName, fetchWithAuth } = useAuth();
  const router = useRouter();

  const emptyForm: Profile = { phone: '', address: '' };

  const [form, setForm] = useState<Profile>(emptyForm);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const savedRef = useRef<Profile>(emptyForm);

  // Pet drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [drawerInitial, setDrawerInitial] = useState<PetFormData | null>(null);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Delete confirmation state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) { router.replace('/login'); return; }

    Promise.all([
      fetchWithAuth('/api/profile').then((r) => r.json() as Promise<{ profile: { phone?: string; address?: string } | null; name: string; email: string }>),
      fetchWithAuth('/api/pets').then((r) => r.json() as Promise<{ pets: Pet[] }>),
    ])
      .then(([profileRes, petsRes]) => {
        const loaded: Profile = {
          phone: profileRes.profile?.phone ?? '',
          address: profileRes.profile?.address ?? '',
        };
        setForm(loaded);
        savedRef.current = loaded;
        setName(profileRes.name || user?.name || '');
        setEmail(profileRes.email || user?.email || '');
        setPets(petsRes.pets ?? []);
      })
      .catch(() => setToast({ message: 'Failed to load profile', variant: 'error' }))
      .finally(() => setLoading(false));
  }, [initialized, user, token, router, fetchWithAuth]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: form.phone, address: form.address }),
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

  function openAddPet() {
    setDrawerMode('add');
    setDrawerInitial(null);
    setEditingPetId(null);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  function openEditPet(pet: Pet) {
    setDrawerMode('edit');
    setDrawerInitial({
      name: pet.name,
      breed: pet.breed ?? '',
      age: pet.age ?? '',
      weight: pet.weight ?? '',
      notes: pet.notes ?? '',
      photo_url: pet.photo_url,
    });
    setEditingPetId(pet.id);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  async function handlePetSave(data: PetFormData) {
    setDrawerSaving(true);
    setDrawerError(null);
    try {
      if (drawerMode === 'add') {
        const res = await fetchWithAuth('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = (await res.json().catch(() => ({}))) as { pet?: Pet; message?: string };
        if (!res.ok || !json.pet) throw new Error(json.message ?? 'Failed to add pet');
        setPets((prev) => [...prev, json.pet!]);
        setToast({ message: `${json.pet.name} added`, variant: 'success' });
      } else if (editingPetId) {
        const res = await fetchWithAuth(`/api/pets/${editingPetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = (await res.json().catch(() => ({}))) as { pet?: Pet; message?: string };
        if (!res.ok || !json.pet) throw new Error(json.message ?? 'Failed to update pet');
        setPets((prev) => prev.map((p) => (p.id === editingPetId ? json.pet! : p)));
        setToast({ message: 'Pet updated', variant: 'success' });
      }
      setDrawerOpen(false);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDrawerSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const petToDelete = pets.find((p) => p.id === id);
    setPendingDeleteId(null);
    try {
      const res = await fetchWithAuth(`/api/pets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setPets((prev) => prev.filter((p) => p.id !== id));
      setToast({ message: `${petToDelete?.name ?? 'Pet'} removed`, variant: 'success' });
    } catch {
      setToast({ message: 'Failed to delete pet', variant: 'error' });
    }
  }

  if (loading) return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-elegant text-3xl font-black text-paw">My Profile</h1>
          <p className="mt-1 font-pawprint text-sm text-paw/45">Your details · your pets</p>
        </div>
        <Link
          href="/dashboard"
          className="font-pawprint text-sm text-paw/40 transition-colors hover:text-paw border border-paw/10 rounded-lg px-4 py-2 hover:border-paw/25"
        >
          ← Dashboard
        </Link>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        {/* Personal Info */}
        <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
          <p className="mb-5 font-pawprint text-[10px] font-bold uppercase tracking-[0.14em] text-paw/35">
            Personal Info
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label htmlFor="phone" className="mb-1.5 block font-pawprint text-xs text-paw/50">
                Phone
                <span className="ml-2 font-pawprint text-[10px] text-paw/30">for SMS reminders</span>
              </label>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(e164) => setForm((f) => ({ ...f, phone: e164 }))}
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-1.5 block font-pawprint text-xs text-paw/50">Address</label>
              <input id="address" type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. 123 Main St, Toronto" className={inputClass} />
            </div>
          </div>

          {/* Save row inside personal info */}
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
        </div>
      </form>

      {/* Your Pets section */}
      <section className="mt-6 rounded-2xl border border-doggy/[0.15] bg-gradient-to-b from-doggy/[0.07] to-paw/[0.03] p-6" style={{ boxShadow: 'inset 0 1px 0 rgba(178,164,255,0.08)' }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.14em] text-paw/35">
              🐾 Your Pets
            </p>
            <p className="mt-1 font-pawprint text-xs text-paw/45">
              {pets.length === 0
                ? "Add your first pet to start booking"
                : `${pets.length} pet${pets.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
          {pets.length > 0 && pets.length < 10 && (
            <button
              onClick={openAddPet}
              className="group flex items-center gap-1.5 rounded-xl border border-doggy/30 bg-doggy/[0.08] px-3.5 py-2 font-pawprint text-xs font-bold text-doggy transition-all duration-300 hover:border-doggy/50 hover:bg-doggy/[0.15]"
            >
              <Plus className="size-3.5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
              Add Pet
            </button>
          )}
        </div>

        {/* Empty state */}
        {pets.length === 0 && (
          <button
            onClick={openAddPet}
            className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-paw/15 bg-paw/[0.02] px-6 py-12 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.04]"
          >
            <div className="flex size-14 items-center justify-center rounded-full border border-doggy/30 bg-doggy/[0.1] transition-transform duration-300 group-hover:scale-110">
              <PawPrint className="size-6 text-doggy" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-elegant text-lg font-black text-paw">Add your first pet</p>
              <p className="mt-1 font-pawprint text-xs text-paw/50">
                You&apos;ll be able to pick them quickly when booking services.
              </p>
            </div>
            <span className="mt-1 flex items-center gap-1.5 rounded-xl bg-doggy px-4 py-2 font-pawprint text-xs font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 group-hover:shadow-doggy/50">
              <Plus className="size-3.5" strokeWidth={2.5} />
              Add Pet
            </span>
          </button>
        )}

        {/* Pet grid */}
        {pets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="group relative flex items-center gap-3 rounded-xl border border-paw/[0.1] bg-paw/[0.03] px-4 py-3 transition-all duration-300 hover:border-doggy/30 hover:bg-paw/[0.05]"
              >
                <div className="shrink-0">
                  {pet.photo_url ? (
                    <Image
                      src={pet.photo_url}
                      alt={pet.name}
                      width={52}
                      height={52}
                      className="size-13 rounded-full object-cover ring-2 ring-doggy/20"
                      style={{ width: 52, height: 52 }}
                    />
                  ) : (
                    <div className="flex size-13 items-center justify-center rounded-full border border-doggy/25 bg-doggy/[0.1]" style={{ width: 52, height: 52 }}>
                      <PawPrint className="size-6 text-doggy/55" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-elegant text-base font-black text-paw">{pet.name}</p>
                  <p className="truncate font-pawprint text-xs text-paw/50">
                    {[pet.breed, pet.age, pet.weight].filter(Boolean).join(' · ') || 'No details yet'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditPet(pet)}
                    aria-label={`Edit ${pet.name}`}
                    className="rounded-lg p-2 text-paw/40 transition-colors hover:bg-paw/[0.08] hover:text-doggy"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(pet.id)}
                    aria-label={`Delete ${pet.name}`}
                    className="rounded-lg p-2 text-paw/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add tile (only shown when there's space for more) */}
            {pets.length < 10 && (
              <button
                type="button"
                onClick={openAddPet}
                className="group flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-paw/15 px-4 py-4 font-pawprint text-sm font-semibold text-paw/45 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.04] hover:text-doggy"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2} />
                Add another pet
              </button>
            )}
          </div>
        )}
      </section>

      {/* Pet add/edit drawer */}
      <PetDrawer
        open={drawerOpen}
        mode={drawerMode}
        initial={drawerInitial}
        saving={drawerSaving}
        error={drawerError}
        onClose={() => setDrawerOpen(false)}
        onSave={handlePetSave}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Remove pet?"
        message={`Remove ${pets.find((p) => p.id === pendingDeleteId)?.name ?? 'this pet'} from your profile? Existing bookings keep their pet name — this only affects future bookings.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

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
