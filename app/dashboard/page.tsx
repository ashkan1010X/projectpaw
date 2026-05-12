'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
};

function statusBadge(datetime: string) {
  const isUpcoming = new Date(datetime) > new Date();
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

  if (loading) return null; // loading.tsx handles this

  const lastService = bookings[0]?.service_name ?? '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-elegant text-3xl font-black text-paw">
          Hi, {user?.name} 👋
        </h1>
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
            const badge = statusBadge(booking.datetime);
            const formatted = new Date(booking.datetime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4"
              >
                <div>
                  <p className="font-pawprint text-sm font-semibold text-paw">
                    {booking.service_name}
                    <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                  </p>
                  <p className="mt-0.5 font-pawprint text-xs text-paw/40">{formatted}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-pawprint text-xs font-semibold',
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
