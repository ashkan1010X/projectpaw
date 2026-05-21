'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { DateTimePicker } from './date-time-picker';

interface RescheduleDialogProps {
  isOpen: boolean;
  serviceName: string;
  dogName: string;
  currentDatetime: string;
  onCancel: () => void;
  onConfirm: (newDatetime: string) => Promise<void>;
}

async function fetchTakenSlots(
  dateStr: string,
): Promise<{ hour: number; minute: number }[]> {
  try {
    const res = await fetch(`/api/bookings/availability?date=${dateStr}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { takenDatetimes: string[] };
    return (data.takenDatetimes ?? []).map((dt) => {
      const d = new Date(dt);
      return { hour: d.getHours(), minute: d.getMinutes() };
    });
  } catch {
    return [];
  }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function RescheduleDialog({
  isOpen,
  serviceName,
  dogName,
  currentDatetime,
  onCancel,
  onConfirm,
}: RescheduleDialogProps) {
  const [newDatetime, setNewDatetime] = useState(toLocalInput(currentDatetime));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset state when the dialog transitions from closed to open.
  // React docs pattern — avoids cascading renders from setState-in-effect.
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNewDatetime(toLocalInput(currentDatetime));
      setError(null);
      setSubmitting(false);
    }
  }

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel, submitting]);

  if (!isOpen) return null;

  const isUnchanged =
    new Date(newDatetime).getTime() === new Date(currentDatetime).getTime();

  async function handleConfirm() {
    if (!newDatetime) {
      setError('Please pick a new date and time.');
      return;
    }
    if (new Date(newDatetime) <= new Date()) {
      setError('Please choose a future date and time.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(newDatetime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule.');
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border-x border-t border-paw/10 bg-[#1a1612] p-6 shadow-2xl sm:rounded-2xl sm:border">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="reschedule-title" className="font-elegant text-xl font-black text-paw">
              Reschedule Booking
            </h2>
            <p className="mt-1 font-pawprint text-xs text-paw/50">
              {serviceName} for {dogName}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg p-1 text-paw/40 transition-colors hover:bg-paw/[0.06] hover:text-paw/70 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/55">
            New Date &amp; Time
          </label>
          <DateTimePicker
            value={newDatetime}
            onChange={(v) => {
              setNewDatetime(v);
              setError(null);
            }}
            error={Boolean(error)}
            fetchTakenSlots={fetchTakenSlots}
          />
        </div>

        {error && (
          <p role="alert" className="mb-3 font-pawprint text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-paw/10 px-4 py-2.5 font-pawprint text-sm font-semibold text-paw/70 transition-all duration-200 hover:border-paw/25 hover:bg-paw/[0.04] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || isUnchanged}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-doggy px-4 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-doggy/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Rescheduling…
              </>
            ) : (
              'Confirm Reschedule'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
