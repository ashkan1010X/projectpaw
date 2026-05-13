'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Dog, FileText, Check, type LucideIcon } from 'lucide-react';
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
  initialDogName?: string;
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
    <div className="group flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/55"
      >
        <Icon
          className="size-3.5 text-paw/40 transition-colors duration-300 group-focus-within:text-doggy"
          strokeWidth={1.5}
        />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = cn(
  'w-full rounded-xl border border-paw/[0.1] bg-paw/[0.03] px-4 py-3',
  'font-pawprint text-sm text-paw placeholder:text-paw/25',
  'outline-none transition-all duration-300',
  'focus:border-doggy/60 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15',
);

export function BookingModal({ service, onClose, initialDogName }: BookingModalProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [dogName, setDogName] = useState(initialDogName ?? '');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const minDatetime = new Date().toISOString().slice(0, 16);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Auto-redirect to dashboard after booking confirmed
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      onClose();
      router.push('/dashboard');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, onClose, router]);

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
        <div className="rounded-2xl border border-paw/15 bg-[#0f0d09] p-8 text-center shadow-2xl animate-scale-in">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-paw/15 bg-[#0f0d09] shadow-2xl animate-scale-in">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-doggy/[0.15] blur-[80px]" />

        {/* Header */}
        <div className="relative flex items-center justify-between overflow-hidden border-b border-paw/[0.06] bg-gradient-to-r from-doggy/95 via-doggy to-paw-dark px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-white/15 blur-2xl" />

          <div className="relative">
            <div className="mb-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 font-pawprint text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              Booking
            </div>
            <h2 className="font-elegant text-2xl font-black leading-none text-white">
              {service.name}
            </h2>
            <p className="mt-1 font-pawprint text-sm text-white/75">
              <span className="font-elegant text-base font-black text-[#F9D923]">
                ${service.price}
              </span>{' '}
              per session
            </p>
          </div>
          <button
            onClick={onClose}
            className="group relative cursor-pointer rounded-xl border border-white/15 bg-white/[0.08] p-2 text-white/75 transition-all duration-300 hover:rotate-90 hover:border-white/30 hover:bg-white/15 hover:text-white"
            aria-label="Close modal"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="relative p-6">
          {success ? (
            <div className="flex flex-col items-center gap-5 py-6 text-center animate-fade-up">
              <div className="relative flex size-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.1]">
                <div className="absolute size-12 rounded-full bg-emerald-500/20 blur-2xl" />
                <Check className="relative size-9 text-emerald-400" strokeWidth={2} />
              </div>
              <div>
                <p className="font-elegant text-2xl font-black text-paw">Booking Confirmed!</p>
                <p className="mt-1 font-pawprint text-sm text-paw/55">
                  Confirmation details sent to your email.
                </p>
                <p className="mt-3 font-pawprint text-xs text-paw/35">
                  Taking you to your bookings in {countdown}s…
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    router.push('/dashboard');
                  }}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-xl bg-doggy px-6 py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">View My Bookings →</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full cursor-pointer rounded-xl border border-paw/[0.1] py-3 font-pawprint text-xs font-medium text-paw/40 transition-all duration-300 hover:border-paw/25 hover:text-paw/60"
                >
                  Back to Services
                </button>
              </div>
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
                <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in">
                  <p className="font-pawprint text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl border border-paw/[0.1] py-3.5 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.04] hover:text-paw disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">{loading ? 'Booking...' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
