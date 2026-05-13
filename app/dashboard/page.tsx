'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BookingModal } from '@/components/booking-modal';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  service_id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
};

type RebookTarget = {
  serviceId: string;
  serviceName: string;
  dogName: string;
};

function statusBadge(booking: Booking) {
  if (booking.status === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-red-500/15 text-red-400' };
  }
  const isUpcoming = new Date(booking.datetime) > new Date();
  return isUpcoming
    ? { label: 'Upcoming', className: 'bg-doggy/20 text-doggy' }
    : { label: 'Completed', className: 'bg-paw/10 text-paw/50' };
}

export default function DashboardPage() {
  const { user, token, initialized } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({});
  const [rebookTarget, setRebookTarget] = useState<RebookTarget | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load bookings');
        return res.json() as Promise<{ bookings: Booking[] }>;
      })
      .then(({ bookings }) => setBookings(bookings))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [initialized, user, token, router]);

  async function handleCancel(booking: Booking) {
    if (!token) return;
    setCancellingId(booking.id);
    setCancelErrors((prev) => {
      const next = { ...prev };
      delete next[booking.id];
      return next;
    });

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed to cancel booking');
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)),
      );
    } catch (err) {
      setCancelErrors((prev) => ({
        ...prev,
        [booking.id]: err instanceof Error ? err.message : 'Something went wrong',
      }));
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return null;

  const lastService = bookings[0]?.service_name ?? '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-elegant text-3xl font-black text-paw">Hi, {user?.name} 👋</h1>
        <p className="mt-1 font-pawprint text-sm text-paw/50">Your booking history</p>
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-3xl font-black text-accent">{bookings.length}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Total Bookings</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-doggy">{lastService}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Last Service</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-emerald-400">Active</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Status</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-pawprint text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && bookings.length === 0 && (
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-8 py-16 text-center">
          <p className="mb-2 font-elegant text-xl text-paw/60">No bookings yet</p>
          <p className="mb-6 font-pawprint text-sm text-paw/40">
            Book your first service and it will appear here.
          </p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50"
          >
            Book Your First Service
          </Link>
        </div>
      )}

      {/* Booking list */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="mb-4 font-elegant text-lg font-bold text-paw/70">Recent Bookings</h2>
          {bookings.map((booking) => {
            const badge = statusBadge(booking);
            const isUpcoming =
              booking.status !== 'cancelled' && new Date(booking.datetime) > new Date();
            const isPastOrCancelled =
              booking.status === 'cancelled' || new Date(booking.datetime) <= new Date();
            const formatted = new Date(booking.datetime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={booking.id} className="space-y-1.5">
                <div className="flex items-center justify-between rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4">
                  <div>
                    <p className="font-pawprint text-sm font-semibold text-paw">
                      {booking.service_name}
                      <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                    </p>
                    <p className="mt-0.5 font-pawprint text-xs text-paw/40">{formatted}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPastOrCancelled && (
                      <button
                        onClick={() =>
                          setRebookTarget({
                            serviceId: booking.service_id,
                            serviceName: booking.service_name,
                            dogName: booking.dog_name,
                          })
                        }
                        className="rounded-lg border border-doggy/30 px-3 py-1 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10"
                      >
                        Rebook
                      </button>
                    )}
                    {isUpcoming && (
                      <button
                        onClick={() => handleCancel(booking)}
                        disabled={cancellingId === booking.id}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Cancelling…
                          </>
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 font-pawprint text-xs font-semibold',
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
                {cancelErrors[booking.id] && (
                  <p className="px-2 font-pawprint text-xs text-red-400">
                    {cancelErrors[booking.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rebook modal */}
      {rebookTarget && (
        <BookingModal
          service={{
            id: rebookTarget.serviceId,
            name: rebookTarget.serviceName,
            price: 0,
          }}
          initialDogName={rebookTarget.dogName}
          onClose={() => setRebookTarget(null)}
        />
      )}
    </main>
  );
}
