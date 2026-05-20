'use client';

import { useEffect, useState } from 'react';
import { X, Phone, Loader2 } from 'lucide-react';
import { PhoneInput } from '@/components/phone-input';

// Bottom sheet on mobile, centered modal on desktop — same shell as PetDrawer
// so the onboarding flow feels consistent. Used by the onboarding checklist
// to capture a customer's SMS number without making them leave the dashboard.

type Props = {
  open: boolean;
  initialPhone?: string | null;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (phone: string) => void;
};

export function PhoneSheet({ open, initialPhone, saving, error, onClose, onSave }: Props) {
  const [phone, setPhone] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state every time the sheet opens
  useEffect(() => {
    if (open) {
      setPhone(initialPhone ?? '');
      setValidationError(null);
    }
  }, [open, initialPhone]);

  // Esc key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      setValidationError('Phone number is required');
      return;
    }
    // Basic E.164 sanity — PhoneInput normalises, but guard against empty cc.
    if (!trimmed.startsWith('+') || trimmed.length < 8) {
      setValidationError('Enter a valid phone number with country code');
      return;
    }
    setValidationError(null);
    onSave(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md motion-safe:animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-sheet-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-paw/15 bg-[#0f0d09] shadow-2xl motion-safe:animate-scale-in sm:rounded-3xl">
        {/* Drag handle (mobile visual cue) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span aria-hidden className="h-1 w-10 rounded-full bg-paw/15" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-paw/[0.08] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-doggy/25 bg-doggy/[0.12]">
              <Phone className="size-4 text-doggy" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/35">
                Step 2 of 4
              </p>
              <h2
                id="phone-sheet-title"
                className="font-elegant text-lg font-black text-paw"
              >
                Add your phone
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-xl border border-paw/[0.1] bg-paw/[0.03] p-2 text-paw/50 transition-all duration-300 hover:rotate-90 hover:border-paw/25 hover:text-paw"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <p className="font-pawprint text-sm text-paw/55">
            We use this to text you booking confirmations and a friendly reminder 24 hours before
            your appointment. Reply <strong className="text-paw/80">X</strong> any time to cancel.
          </p>

          <div>
            <label className="mb-2 block font-pawprint text-[11px] font-bold uppercase tracking-wider text-paw/55">
              Phone number
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
            {(validationError || error) && (
              <p className="mt-2 font-pawprint text-xs text-red-400">
                {validationError ?? error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-paw/15 bg-paw/[0.03] px-4 py-3 font-pawprint text-sm font-bold text-paw/70 transition-colors duration-200 hover:border-paw/25 hover:bg-paw/[0.06] hover:text-paw"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-doggy px-4 py-3 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/35 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save phone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
