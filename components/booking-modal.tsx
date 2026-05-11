'use client';

import { useState } from 'react';
import { X, Calendar, Dog, FileText, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BookingModalProps {
  service: Service;
  onClose: () => void;
}

function FieldWrapper({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 font-pawprint text-xs font-semibold uppercase tracking-wider text-paw/50">
        <Icon className="size-3.5" strokeWidth={1.5} />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = cn(
  'w-full rounded-xl border border-paw/10 bg-paw/[0.04] px-4 py-3',
  'font-pawprint text-sm text-paw placeholder:text-paw/25',
  'outline-none transition-all duration-200',
  'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
);

export function BookingModal({ service, onClose }: BookingModalProps) {
  const { token } = useAuth();
  const [dogName, setDogName] = useState('');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDatetime = new Date().toISOString().slice(0, 16);

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="rounded-2xl border border-paw/10 bg-[#0f0d09] p-8 text-center shadow-2xl">
          <p className="font-pawprint text-sm text-paw/60">Please log in to book a service.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          dogName,
          datetime,
          notes,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Booking failed. Please try again.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-paw/10 bg-[#0f0d09] shadow-2xl">
        {/* Header */}
        <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-doggy/80 to-paw-dark/80 px-6 py-5">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-doggy to-paw-dark opacity-60" />
          <div className="relative">
            <h2 className="font-elegant text-xl font-black text-white">Book {service.name}</h2>
            <p className="font-pawprint text-sm text-white/70">${service.price} per session</p>
          </div>
          <button
            onClick={onClose}
            className="relative cursor-pointer rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <span className="text-3xl">🐾</span>
              </div>
              <div>
                <p className="font-elegant text-xl font-bold text-paw">Booking Confirmed!</p>
                <p className="mt-1 font-pawprint text-sm text-paw/50">Check your email for details.</p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-xl bg-doggy px-8 py-3 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all hover:bg-doggy/90"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldWrapper label="Dog's Name" htmlFor="dogName" icon={Dog}>
                <input
                  id="dogName"
                  type="text"
                  required
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  placeholder="e.g. Buddy"
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
                <input
                  id="datetime"
                  type="datetime-local"
                  required
                  min={minDatetime}
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </FieldWrapper>

              <FieldWrapper label="Notes (optional)" htmlFor="notes" icon={FileText}>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or information..."
                  className={cn(inputClass, 'resize-none')}
                />
              </FieldWrapper>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="font-pawprint text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl border border-paw/10 py-3 font-pawprint text-sm font-semibold text-paw/50 transition-all hover:border-paw/20 hover:text-paw disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl bg-doggy py-3 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all hover:bg-doggy/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
