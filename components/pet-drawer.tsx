'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, PawPrint, Camera, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { compressImage } from '@/lib/image-compress';
import { PET_SPECIES, SPECIES_META, type PetSpecies } from '@/lib/species';

export type PetFormData = {
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  weight: string;
  notes: string;
  photo_url: string | null;
};

const EMPTY_FORM: PetFormData = {
  name: '',
  species: 'dog',
  breed: '',
  age: '',
  weight: '',
  notes: '',
  photo_url: null,
};

type Props = {
  open: boolean;
  initial?: PetFormData | null;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (data: PetFormData) => void;
  mode: 'add' | 'edit';
};

const inputClass = cn(
  'w-full rounded-xl border border-paw/[0.12] bg-paw/[0.04] px-4 py-3',
  'font-pawprint text-sm text-paw placeholder:text-paw/25',
  'outline-none transition-all duration-300',
  'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
);

// Pre-compression limit — the compressImage helper will resize anything
// over ~800 KB to a 1920px-wide JPEG before upload, so users can pick
// straight from their phone's photo library without "too big" errors.
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function PetDrawer({ open, initial, saving, error, onClose, onSave, mode }: Props) {
  const { fetchWithAuth } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PetFormData>(initial ?? EMPTY_FORM);
  const [nameError, setNameError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset form when the drawer transitions from closed to open.
  // React docs pattern — avoids cascading renders from setState-in-effect.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setNameError(null);
      setPhotoError(null);
    }
  }

  async function handleFile(file: File) {
    setPhotoError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Only JPG, PNG, or WebP allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError('Photo must be under 25 MB.');
      return;
    }
    setPhotoUploading(true);
    try {
      // Resize + recompress on the client. A 12MP iPhone photo (~8 MB)
      // typically lands around 400-800 KB after this with no visible loss.
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await fetchWithAuth('/api/pets/photo', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok || !data.url) throw new Error(data.message ?? 'Upload failed');
      setForm((f) => ({ ...f, photo_url: data.url! }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPhotoUploading(false);
    }
  }

  function removePhoto() {
    setForm((f) => ({ ...f, photo_url: null }));
    setPhotoError(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function set<K extends keyof PetFormData>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError("Pet's name is required.");
      return;
    }
    if (form.name.trim().length > 60) {
      setNameError('Name is too long (max 60).');
      return;
    }
    setNameError(null);
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border border-paw/15 bg-[#0f0d09] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-paw/[0.08] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-doggy/[0.12] border border-doggy/25">
              <PawPrint className="size-4 text-doggy" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/35">
                {mode === 'add' ? 'Add a pet' : 'Edit pet'}
              </p>
              <h2 className="font-elegant text-lg font-black text-paw">
                {mode === 'add' ? 'New Pet' : form.name || 'Pet'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-xl border border-paw/[0.1] bg-paw/[0.03] p-2 text-paw/50 transition-all duration-300 hover:rotate-90 hover:border-paw/25 hover:text-paw"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[calc(90vh-180px)] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {/* Photo */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
                aria-label={form.photo_url ? 'Change pet photo' : 'Upload pet photo'}
                className="group relative size-24 cursor-pointer rounded-full transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-doggy/60"
              >
                {form.photo_url ? (
                  <Image
                    src={form.photo_url}
                    alt="Pet photo"
                    fill
                    className="rounded-full object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full border-2 border-dashed border-doggy/30 bg-doggy/[0.08]">
                    <PawPrint className="size-9 text-doggy/40" strokeWidth={1.5} />
                  </div>
                )}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity duration-200',
                    photoUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  {photoUploading ? (
                    <Loader2 className="size-6 animate-spin text-white" strokeWidth={1.5} />
                  ) : (
                    <Camera className="size-6 text-white" strokeWidth={1.5} />
                  )}
                </div>
                {!photoUploading && (
                  <div className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-[#0f0d09] bg-doggy shadow-lg shadow-doggy/30">
                    <Camera className="size-3.5 text-white" strokeWidth={2} />
                  </div>
                )}
              </button>
              {form.photo_url ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={photoUploading}
                  className="flex items-center gap-1 font-pawprint text-[11px] text-paw/40 transition-colors hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 className="size-3" strokeWidth={1.8} />
                  Remove photo
                </button>
              ) : (
                <p className="font-pawprint text-[11px] text-paw/30">
                  Optional · JPG/PNG · 5 MB max
                </p>
              )}
              {photoError && <p className="font-pawprint text-[11px] text-red-400">{photoError}</p>}
              <input
                ref={fileRef}
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

            {/* Pet Type */}
            <div>
              <label className="mb-1.5 block font-pawprint text-xs text-paw/55">
                Pet Type <span className="text-doggy">*</span>
              </label>
              <div role="radiogroup" aria-label="Pet type" className="flex flex-wrap gap-1.5">
                {PET_SPECIES.map((s) => {
                  const meta = SPECIES_META[s];
                  const Icon = meta.Icon;
                  const active = form.species === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={meta.label}
                      onClick={() => setForm((f) => ({ ...f, species: s }))}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-pawprint text-xs font-semibold transition-all duration-200',
                        active
                          ? 'border-doggy/60 bg-doggy/[0.15] text-paw shadow-sm shadow-doggy/15'
                          : 'border-paw/[0.12] bg-paw/[0.03] text-paw/55 hover:border-doggy/30 hover:text-paw/85',
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="pet-name" className="mb-1.5 block font-pawprint text-xs text-paw/55">
                Name <span className="text-doggy">*</span>
              </label>
              <input
                id="pet-name"
                type="text"
                value={form.name}
                onChange={(e) => {
                  set('name')(e);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Biscuit"
                autoFocus
                className={cn(
                  inputClass,
                  nameError && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/15',
                )}
                maxLength={60}
              />
              {nameError && (
                <p className="mt-1.5 font-pawprint text-xs text-red-400">{nameError}</p>
              )}
            </div>

            {/* Breed + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pet-breed"
                  className="mb-1.5 block font-pawprint text-xs text-paw/55"
                >
                  Breed
                </label>
                <input
                  id="pet-breed"
                  type="text"
                  value={form.breed}
                  onChange={set('breed')}
                  placeholder={SPECIES_META[form.species].breedPlaceholder}
                  className={inputClass}
                  maxLength={60}
                />
              </div>
              <div>
                <label htmlFor="pet-age" className="mb-1.5 block font-pawprint text-xs text-paw/55">
                  Age
                </label>
                <input
                  id="pet-age"
                  type="text"
                  value={form.age}
                  onChange={set('age')}
                  placeholder="e.g. 3 yrs"
                  className={inputClass}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label
                htmlFor="pet-weight"
                className="mb-1.5 block font-pawprint text-xs text-paw/55"
              >
                Weight
              </label>
              <input
                id="pet-weight"
                type="text"
                value={form.weight}
                onChange={set('weight')}
                placeholder="e.g. 25 lbs"
                className={inputClass}
                maxLength={20}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="pet-notes" className="mb-1.5 block font-pawprint text-xs text-paw/55">
                Notes <span className="text-paw/30 text-[10px]">(allergies, behavior, etc.)</span>
              </label>
              <textarea
                id="pet-notes"
                value={form.notes}
                onChange={set('notes')}
                placeholder="Afraid of loud noises, allergic to chicken…"
                rows={3}
                className={cn(inputClass, 'resize-none')}
                maxLength={500}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3 py-2 animate-fade-in">
                <p className="font-pawprint text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-paw/[0.06] bg-paw/[0.02] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 cursor-pointer rounded-xl border border-paw/[0.12] py-3 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:text-paw disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl bg-doggy py-3 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">
              {saving ? 'Saving…' : mode === 'add' ? 'Add Pet' : 'Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
