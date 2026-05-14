'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BookingModal } from '@/components/booking-modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
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

function statusBadge(booking: Booking, now: Date) {
  if (booking.status === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-red-500/15 text-red-400' };
  }
  const isUpcoming = new Date(booking.datetime) > now;
  return isUpcoming
    ? { label: 'Upcoming', className: 'bg-doggy/20 text-doggy' }
    : { label: 'Completed', className: 'bg-paw/10 text-paw/50' };
}

function daysAway(datetime: string): string {
  const diff = Math.ceil(
    (new Date(datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days away`;
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="h-9 w-52 animate-pulse rounded-lg bg-paw/[0.08]" />
        <div className="mt-2 h-4 w-36 animate-pulse rounded bg-paw/[0.05]" />
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:p-6">
          <div className="mx-auto h-8 w-10 animate-pulse rounded bg-paw/[0.08]" />
          <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-paw/[0.05]" />
        </div>
        <div className="hidden rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:block sm:p-6">
          <div className="mx-auto h-6 w-28 animate-pulse rounded bg-paw/[0.08]" />
          <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-paw/[0.05]" />
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:p-6">
          <div className="mx-auto h-6 w-16 animate-pulse rounded bg-paw/[0.08]" />
          <div className="mx-auto mt-2 h-3 w-14 animate-pulse rounded bg-paw/[0.05]" />
        </div>
      </div>

      {/* Booking list */}
      <div className="space-y-3">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-paw/[0.08]" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
          >
            <div className="min-w-0">
              <div className="h-4 w-44 animate-pulse rounded bg-paw/[0.08]" />
              <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-paw/[0.05]" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-7 w-16 animate-pulse rounded-lg bg-paw/[0.08]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-paw/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
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
  const [pendingCancelBooking, setPendingCancelBooking] = useState<Booking | null>(null);

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

  if (loading) return <DashboardSkeleton />;

  const now = new Date();

  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.datetime) > now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const past = bookings
    .filter((b) => b.status === 'cancelled' || new Date(b.datetime) <= now)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const heroBooking = upcoming[0] ?? null;
  const alsoUpcoming = upcoming.slice(1);
  const nextUpLabel = heroBooking?.service_name ?? '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-elegant text-3xl font-black text-paw">Hi, {user?.name} 👋</h1>
        <p className="mt-1 font-pawprint text-sm text-paw/50">Your booking history</p>
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:p-6">
          <div className="font-elegant text-3xl font-black text-accent">{bookings.length}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Total Bookings</div>
        </div>
        <div className="hidden rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:block sm:p-6">
          <div className="truncate font-elegant text-xl font-black text-doggy">{nextUpLabel}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Next Up</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:p-6">
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

      {/* Empty state — no bookings at all */}
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

      {bookings.length > 0 && (
        <div className="space-y-8">

          {/* ── Hero: next upcoming booking ── */}
          {heroBooking ? (
            <div>
              <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-doggy/60">
                Next Appointment
              </p>
              <div className="space-y-1.5">
                <div className="rounded-2xl border border-doggy/[0.2] bg-gradient-to-br from-doggy/[0.1] to-doggy/[0.03] p-5 animate-fade-in">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-elegant text-xl font-black text-paw leading-tight">
                        {heroBooking.service_name}
                      </p>
                      <p className="mt-0.5 font-pawprint text-sm text-paw/55">
                        {heroBooking.dog_name}
                      </p>
                      <p className="mt-1.5 font-pawprint text-xs text-paw/40">
                        {new Date(heroBooking.datetime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-pawprint text-xs font-semibold text-doggy/70">
                        {daysAway(heroBooking.datetime)}
                      </span>
                      <button
                        onClick={() => setPendingCancelBooking(heroBooking)}
                        disabled={cancellingId === heroBooking.id}
                        aria-label={`Cancel booking for ${heroBooking.service_name}`}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === heroBooking.id ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Cancelling…
                          </>
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {cancelErrors[heroBooking.id] && (
                  <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                    {cancelErrors[heroBooking.id]}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Empty upcoming state — has past bookings but nothing upcoming */
            <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-6 py-8 text-center">
              <p className="mb-1 font-elegant text-lg text-paw/50">No upcoming bookings</p>
              <p className="mb-4 font-pawprint text-sm text-paw/30">Ready to book again?</p>
              <Link
                href="/services"
                className="inline-block rounded-lg border border-doggy/30 px-5 py-2 font-pawprint text-sm font-semibold text-doggy transition-all duration-300 hover:border-doggy/60 hover:bg-doggy/10"
              >
                Book Again →
              </Link>
            </div>
          )}

          {/* ── Also upcoming (compact) ── */}
          {alsoUpcoming.length > 0 && (
            <div>
              <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/35">
                Also Upcoming
              </p>
              <div className="space-y-2">
                {alsoUpcoming.map((booking) => (
                  <div key={booking.id} className="space-y-1.5">
                    <div className="flex flex-col gap-3 rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      <div className="min-w-0">
                        <p className="font-pawprint text-sm font-semibold text-paw">
                          {booking.service_name}
                          <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                        </p>
                        <p className="mt-0.5 font-pawprint text-xs text-paw/40">
                          {new Date(booking.datetime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-pawprint text-xs font-semibold text-doggy/60">
                          {daysAway(booking.datetime)}
                        </span>
                        <button
                          onClick={() => setPendingCancelBooking(booking)}
                          disabled={cancellingId === booking.id}
                          aria-label={`Cancel booking for ${booking.service_name}`}
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
                      </div>
                    </div>
                    {cancelErrors[booking.id] && (
                      <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                        {cancelErrors[booking.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── History (past + cancelled) ── */}
          {past.length > 0 && (
            <div>
              <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/25">
                History
              </p>
              <div className="space-y-2">
                {past.map((booking) => {
                  const badge = statusBadge(booking, now);
                  return (
                    <div key={booking.id} className="space-y-1.5">
                      <div className="flex flex-col gap-3 rounded-xl border border-paw/[0.05] bg-[#141210] px-5 py-4 opacity-60 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                        <div className="min-w-0">
                          <p className="font-pawprint text-sm font-semibold text-paw">
                            {booking.service_name}
                            <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                          </p>
                          <p className="mt-0.5 font-pawprint text-xs text-paw/40">
                            {new Date(booking.datetime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() =>
                              setRebookTarget({
                                serviceId: booking.service_id,
                                serviceName: booking.service_name,
                                dogName: booking.dog_name,
                              })
                            }
                            aria-label={`Rebook ${booking.service_name} for ${booking.dog_name}`}
                            className="rounded-lg border border-doggy/30 px-3 py-1 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10"
                          >
                            Rebook
                          </button>
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
                        <p role="alert" className="px-2 font-pawprint text-xs text-red-400">
                          {cancelErrors[booking.id]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Cancel confirmation */}
      {pendingCancelBooking && (
        <ConfirmDialog
          isOpen
          title="Cancel Booking"
          message={`Cancel ${pendingCancelBooking.service_name} for ${pendingCancelBooking.dog_name}? This cannot be undone.`}
          confirmLabel="Yes, Cancel"
          cancelLabel="Keep it"
          destructive
          onConfirm={() => {
            void handleCancel(pendingCancelBooking);
            setPendingCancelBooking(null);
          }}
          onCancel={() => setPendingCancelBooking(null)}
        />
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
