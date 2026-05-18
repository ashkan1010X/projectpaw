'use client';

import { useEffect, useState } from 'react';
import { X, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PetFormData = {
  name: string;
  breed: string;
  age: string;
  weight: string;
  notes: string;
  photo_url: string | null;
};

const EMPTY_FORM: PetFormData = {
  name: '',
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

export function PetDrawer({ open, initial, saving, error, onClose, onSave, mode }: Props) {
  const [form, setForm] = useState<PetFormData>(EMPTY_FORM);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setNameError(null);
    }
  }, [open, initial]);

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
            {/* Name */}
            <div>
              <label htmlFor="pet-name" className="mb-1.5 block font-pawprint text-xs text-paw/55">
                Name <span className="text-doggy">*</span>
              </label>
              <input
                id="pet-name"
                type="text"
                value={form.name}
                onChange={(e) => { set('name')(e); if (nameError) setNameError(null); }}
                placeholder="e.g. Biscuit"
                autoFocus
                className={cn(inputClass, nameError && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/15')}
                maxLength={60}
              />
              {nameError && (
                <p className="mt-1.5 font-pawprint text-xs text-red-400">{nameError}</p>
              )}
            </div>

            {/* Breed + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pet-breed" className="mb-1.5 block font-pawprint text-xs text-paw/55">Breed</label>
                <input id="pet-breed" type="text" value={form.breed} onChange={set('breed')} placeholder="e.g. Labrador" className={inputClass} maxLength={60} />
              </div>
              <div>
                <label htmlFor="pet-age" className="mb-1.5 block font-pawprint text-xs text-paw/55">Age</label>
                <input id="pet-age" type="text" value={form.age} onChange={set('age')} placeholder="e.g. 3 yrs" className={inputClass} maxLength={20} />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="pet-weight" className="mb-1.5 block font-pawprint text-xs text-paw/55">Weight</label>
              <input id="pet-weight" type="text" value={form.weight} onChange={set('weight')} placeholder="e.g. 25 lbs" className={inputClass} maxLength={20} />
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
            <span className="relative">{saving ? 'Saving…' : mode === 'add' ? 'Add Pet' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
