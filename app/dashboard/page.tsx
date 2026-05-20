'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, PawPrint, Sparkles, Clock, Bell, Heart, CalendarClock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BookingModal } from '@/components/booking-modal';
import { supabase } from '@/lib/supabase';
import { FALLBACK_SERVICES, type ServiceRow } from '@/lib/service-icons';
import { SPECIES_META, isPetSpecies, type PetSpecies } from '@/lib/species';
import { PAYMENT_META, isPaymentMethod } from '@/lib/payment';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RescheduleDialog } from '@/components/reschedule-dialog';
import { AddToCalendar } from '@/components/add-to-calendar';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { PhoneSheet } from '@/components/phone-sheet';
import { PetDrawer, type PetFormData } from '@/components/pet-drawer';
import { Toast } from '@/components/toast';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  service_id: string;
  service_name: string;
  dog_name: string;
  pet_species: string | null;
  payment_method: string | null;
  datetime: string;
  notes: string | null;
  status: string;
};

function BookingPaymentBadge({ method }: { method: string | null }) {
  if (!isPaymentMethod(method)) return null;
  const meta = PAYMENT_META[method];
  const Icon = meta.Icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-paw/10 bg-paw/5 px-2 py-0.5 font-pawprint text-[10px] font-semibold text-paw/55">
      <Icon className="size-2.5" strokeWidth={2} aria-hidden />
      {meta.shortLabel}
    </span>
  );
}

function BookingPetIcon({ booking, className }: { booking: Booking; className?: string }) {
  const species = isPetSpecies(booking.pet_species) ? booking.pet_species : 'dog';
  const Icon = SPECIES_META[species].Icon;
  return <Icon className={className ?? 'inline size-3.5'} strokeWidth={1.8} aria-hidden />;
}

type Profile = {
  phone?: string | null;
} | null;

type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
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

function daysAway(datetime: string, now: Date): string {
  const diff = Math.floor(
    (new Date(datetime).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days away`;
}

function daysSince(datetime: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(datetime).getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatBookingDate(datetime: string): { date: string; time: string } {
  const d = new Date(datetime);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function topServices(
  bookings: Booking[],
): { id: string; name: string; count: number }[] {
  const counts = new Map<string, { id: string; name: string; count: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const existing = counts.get(b.service_id);
    if (existing) existing.count++;
    else counts.set(b.service_id, { id: b.service_id, name: b.service_name, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 2);
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Pet hero skeleton */}
      <div className="mb-8 rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6 sm:p-7">
        <div className="flex items-center gap-5">
          <div className="size-20 animate-pulse rounded-full bg-paw/[0.08] sm:size-24" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-paw/[0.05]" />
            <div className="h-8 w-48 animate-pulse rounded-lg bg-paw/[0.08]" />
            <div className="h-3 w-32 animate-pulse rounded bg-paw/[0.05]" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-4 sm:p-5">
            <div className="mb-2 h-3 w-16 animate-pulse rounded bg-paw/[0.05]" />
            <div className="h-7 w-12 animate-pulse rounded bg-paw/[0.08]" />
          </div>
        ))}
      </div>

      {/* Booking list skeleton */}
      <div className="space-y-3">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-paw/[0.08]" />
        {[0, 1].map((i) => (
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
  const { user, token, initialized, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<ServiceRow[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({});
  const [rebookTarget, setRebookTarget] = useState<RebookTarget | null>(null);
  const [pendingCancelBooking, setPendingCancelBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  // ── Onboarding sheets — open from checklist clicks ──
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [petSheetOpen, setPetSheetOpen] = useState(false);
  const [petSaving, setPetSaving] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const [photoError, setPhotoError] = useState(false);

  // Fetch services once on mount — public read RLS, no auth needed.
  // Falls back to FALLBACK_SERVICES on error (already the initial state).
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('services')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setServices(data as ServiceRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    Promise.all([
      fetchWithAuth('/api/bookings').then((r) => {
        if (!r.ok) throw new Error('Failed to load bookings');
        return r.json() as Promise<{ bookings: Booking[] }>;
      }),
      fetchWithAuth('/api/profile')
        .then((r) => (r.ok ? (r.json() as Promise<{ profile: Profile }>) : { profile: null }))
        .catch(() => ({ profile: null })),
      fetchWithAuth('/api/pets')
        .then((r) => (r.ok ? (r.json() as Promise<{ pets: Pet[] }>) : { pets: [] }))
        .catch(() => ({ pets: [] as Pet[] })),
    ])
      .then(([b, p, petsRes]) => {
        setBookings(b.bookings);
        setProfile(p.profile);
        setPets(petsRes.pets ?? []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [initialized, user, token, router, fetchWithAuth]);

  async function handleCancel(booking: Booking) {
    if (!token) return;
    setCancellingId(booking.id);
    setCancelErrors((prev) => {
      const next = { ...prev };
      delete next[booking.id];
      return next;
    });

    try {
      const res = await fetchWithAuth(`/api/bookings/${booking.id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed to cancel booking');
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)),
      );
      setToast({ message: 'Booking cancelled', variant: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setCancelErrors((prev) => ({ ...prev, [booking.id]: msg }));
      setTimeout(() => {
        setCancelErrors((prev) => {
          const next = { ...prev };
          delete next[booking.id];
          return next;
        });
      }, 5000);
    } finally {
      setCancellingId(null);
    }
  }

  // ── Onboarding save handlers ──
  async function handleSavePhone(phone: string) {
    setPhoneSaving(true);
    setPhoneError(null);
    try {
      const res = await fetchWithAuth('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed to save phone');
      }
      setProfile((prev) => ({ ...(prev ?? {}), phone }));
      setPhoneSheetOpen(false);
      // Subtle haptic on mobile — gives the save action a satisfying physical tick.
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      setToast({ message: 'Phone number saved 📱', variant: 'success' });
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPhoneSaving(false);
    }
  }

  async function handleSavePet(data: PetFormData) {
    setPetSaving(true);
    setPetError(null);
    try {
      const res = await fetchWithAuth('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { pet?: Pet; message?: string };
      if (!res.ok || !json.pet) throw new Error(json.message ?? 'Failed to add pet');
      setPets((prev) => [...prev, json.pet!]);
      setPetSheetOpen(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      setToast({ message: `${json.pet.name} added 🐾`, variant: 'success' });
    } catch (err) {
      setPetError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPetSaving(false);
    }
  }

  async function handleReschedule(bookingId: string, newDatetime: string) {
    const res = await fetchWithAuth(`/api/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datetime: new Date(newDatetime).toISOString() }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(data.message ?? 'Failed to reschedule');
    }
    const isoDatetime = new Date(newDatetime).toISOString();
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, datetime: isoDatetime } : b)),
    );
    const friendlyTime = new Date(newDatetime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setToast({ message: `Rescheduled to ${friendlyTime}`, variant: 'success' });
    setRescheduleBooking(null);
  }

  if (loading) return <DashboardSkeleton />;

  const now = new Date();

  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.datetime) > now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const completed = bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.datetime) <= now)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const cancelled = bookings
    .filter((b) => b.status === 'cancelled')
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const heroBooking = upcoming[0] ?? null;
  const alsoUpcoming = upcoming.slice(1);

  // ── Derived insights ──
  const lastCompleted = completed[0] ?? null;
  const daysSinceLast = lastCompleted ? daysSince(lastCompleted.datetime, now) : null;
  const usual = topServices(bookings);
  const favoriteName = usual[0]?.name ?? null;
  const hasPhone = Boolean(profile?.phone);
  const primaryPet = pets[0] ?? null;
  const primarySpecies: PetSpecies = primaryPet && isPetSpecies(primaryPet.species)
    ? primaryPet.species
    : 'dog';
  const dogName = primaryPet?.name || 'Your Pet';
  const dogPhotoUrl = primaryPet?.photo_url ?? null;
  const dogBreed = primaryPet?.breed ?? null;
  const dogAge = primaryPet?.age ?? null;
  const HeroIcon = SPECIES_META[primarySpecies].Icon;

  // Smart re-engagement: when favorite service hasn't been booked in 28+ days
  // and there's nothing upcoming for it, prompt the user to rebook.
  const favorite = usual[0];
  const hasUpcomingFavorite = favorite
    ? upcoming.some((b) => b.service_id === favorite.id)
    : false;
  const lastFavoriteCompleted = favorite
    ? completed.find((b) => b.service_id === favorite.id)
    : undefined;
  const daysSinceFavorite = lastFavoriteCompleted
    ? daysSince(lastFavoriteCompleted.datetime, now)
    : null;
  const showReengagement =
    favorite && !hasUpcomingFavorite && daysSinceFavorite !== null && daysSinceFavorite >= 28;

  const firstName = (user?.name ?? '').split(' ')[0] || 'there';
  const hasPet = pets.length > 0;
  const hasBooking = bookings.length > 0;
  // Show the onboarding checklist whenever any step is incomplete. When it's
  // showing it owns the primary CTA, so we hide redundant lower-page actions
  // (pet hero placeholder, "book your first appointment" empty state).
  const showOnboarding = !hasPhone || !hasPet || !hasBooking;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      {/* ════════════════════  ONBOARDING CHECKLIST  ════════════════════ */}
      {/* Auto-hides once all four steps are complete */}
      <OnboardingChecklist
        firstName={firstName}
        hasPhone={hasPhone}
        hasPet={hasPet}
        hasBooking={hasBooking}
        onAddPhone={() => {
          setPhoneError(null);
          setPhoneSheetOpen(true);
        }}
        onAddPet={() => {
          setPetError(null);
          setPetSheetOpen(true);
        }}
      />

      {/* Onboarding sheets — sit at the page root so they cover the dashboard */}
      <PhoneSheet
        open={phoneSheetOpen}
        initialPhone={profile?.phone ?? null}
        saving={phoneSaving}
        error={phoneError}
        onClose={() => setPhoneSheetOpen(false)}
        onSave={handleSavePhone}
      />
      <PetDrawer
        open={petSheetOpen}
        mode="add"
        saving={petSaving}
        error={petError}
        onClose={() => setPetSheetOpen(false)}
        onSave={handleSavePet}
      />

      {/* ════════════════════  PET HERO  ════════════════════ */}
      {/* Hidden until the user adds a pet — otherwise we'd show a placeholder
          paw + "Your Pet's Dashboard" which clashes with the checklist's
          "add your first pet" step. */}
      {hasPet && (
      <div className="mb-8 overflow-hidden rounded-2xl border border-doggy/15 bg-gradient-to-br from-doggy/[0.10] via-paw/[0.03] to-transparent p-5 sm:p-7 animate-fade-in">
        <div className="flex items-center gap-4 sm:gap-6">
          {dogPhotoUrl && !photoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dogPhotoUrl}
              alt={dogName}
              onError={() => setPhotoError(true)}
              className="size-16 shrink-0 rounded-full object-cover ring-2 ring-doggy/30 sm:size-24"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-doggy/15 ring-2 ring-doggy/20 sm:size-24" aria-label={SPECIES_META[primarySpecies].label}>
              <HeroIcon className="size-8 text-doggy/70 sm:size-12" strokeWidth={1.5} aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/45 sm:text-xs">
              Hi, {user?.name} 👋
            </p>
            <h1 className="mt-1 break-words font-elegant text-xl font-black leading-tight text-paw sm:text-4xl">
              {dogName}&apos;s Dashboard
            </h1>
            {(dogBreed || dogAge) && (
              <p className="mt-1 font-pawprint text-xs text-paw/55 sm:text-sm">
                {dogBreed}
                {dogBreed && dogAge && ' · '}
                {dogAge}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ════════════════════  INSIGHT STATS  ════════════════════ */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-doggy/20 bg-doggy/[0.05] p-4 sm:p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-doggy/70" />
            <span className="font-pawprint text-[10px] font-bold uppercase tracking-wider text-doggy/65">
              Upcoming
            </span>
          </div>
          <div className="font-elegant text-2xl font-black text-doggy sm:text-3xl">
            {upcoming.length}
          </div>
        </div>
        <div className="rounded-xl border border-paw/10 bg-[#1a1612] p-4 sm:p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Clock className="size-3.5 text-paw/55" />
            <span className="font-pawprint text-[10px] font-bold uppercase tracking-wider text-paw/55">
              Last Service
            </span>
          </div>
          <div className="font-elegant text-base font-bold text-paw sm:text-lg">
            {daysSinceLast === null
              ? 'None yet'
              : daysSinceLast === 0
              ? 'Today'
              : daysSinceLast === 1
              ? '1d ago'
              : `${daysSinceLast}d ago`}
          </div>
        </div>
        <div className="rounded-xl border border-paw/10 bg-[#1a1612] p-4 sm:p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Heart className="size-3.5 text-accent/70" />
            <span className="font-pawprint text-[10px] font-bold uppercase tracking-wider text-accent/70">
              Favorite
            </span>
          </div>
          <div className="truncate font-elegant text-base font-bold text-paw sm:text-lg">
            {favoriteName ?? '—'}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-pawprint text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state — no bookings at all */}
      {/* Skipped when the onboarding checklist is up; the checklist already
          drives the "book your first service" action. Once the user finishes
          onboarding this empty state appears as their normal "no bookings yet"
          card on the dashboard. */}
      {!error && bookings.length === 0 && !showOnboarding && (
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-8 py-16 text-center">
          <p className="mb-2 font-elegant text-xl text-paw/60">
            Let&apos;s book {dogName}&apos;s first appointment
          </p>
          <p className="mb-6 font-pawprint text-sm text-paw/40">
            Pick a service and we&apos;ll handle the rest.
          </p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50"
          >
            Book a Service
          </Link>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="space-y-8">
          {/* ──── Smart re-engagement banner ──── */}
          {showReengagement && favorite && (
            <button
              onClick={() =>
                setRebookTarget({
                  serviceId: favorite.id,
                  serviceName: favorite.name,
                  dogName: dogName !== 'Your Pup' ? dogName : '',
                })
              }
              className="group flex w-full items-center gap-4 rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/[0.08] via-accent/[0.04] to-transparent p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-lg hover:shadow-accent/10"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30">
                <Sparkles className="size-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-accent/80">
                  Time to rebook
                </p>
                <p className="mt-0.5 font-pawprint text-sm text-paw">
                  {dogName}&apos;s last {favorite.name.toLowerCase()} was{' '}
                  <span className="font-bold text-paw">{daysSinceFavorite}</span> days ago — most
                  pups are due around now.
                </p>
              </div>
              <span className="hidden font-pawprint text-xs font-bold text-accent opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                Book →
              </span>
            </button>
          )}

          {/* ──── Hero: next upcoming booking ──── */}
          {heroBooking ? (
            <div>
              <h2 className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-doggy/65">
                Next Appointment
              </h2>
              <div className="space-y-1.5">
                <div className="animate-fade-in rounded-2xl border border-doggy/25 bg-gradient-to-br from-doggy/[0.12] to-doggy/[0.03] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-elegant text-xl font-black leading-tight text-paw">
                        {heroBooking.service_name}
                      </p>
                      <p className="mt-0.5 font-pawprint text-sm text-paw/65">
                        for <BookingPetIcon booking={heroBooking} /> {heroBooking.dog_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <p className="font-pawprint text-xs font-semibold text-paw/55">
                          {formatBookingDate(heroBooking.datetime).date}
                        </p>
                        <span className="text-paw/25">·</span>
                        <p className="font-pawprint text-xs text-paw/45">
                          {formatBookingDate(heroBooking.datetime).time}
                        </p>
                        {heroBooking.payment_method && (
                          <>
                            <span className="text-paw/25">·</span>
                            <BookingPaymentBadge method={heroBooking.payment_method} />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <span className="font-pawprint text-xs font-semibold text-doggy/75 sm:text-right">
                        {daysAway(heroBooking.datetime, now)}
                      </span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AddToCalendar
                      bookingId={heroBooking.id}
                      serviceName={heroBooking.service_name}
                      dogName={heroBooking.dog_name}
                      datetime={heroBooking.datetime}
                    />
                    <button
                      onClick={() => setRescheduleBooking(heroBooking)}
                      aria-label={`Reschedule booking for ${heroBooking.service_name}`}
                      className="flex min-h-9 items-center gap-1.5 rounded-lg border border-paw/15 bg-paw/[0.03] px-3 py-2 font-pawprint text-xs font-semibold text-paw/75 transition-all duration-200 hover:border-paw/30 hover:bg-paw/[0.07] hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
                    >
                      <CalendarClock className="size-3.5" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => setPendingCancelBooking(heroBooking)}
                      disabled={cancellingId === heroBooking.id}
                      aria-label={`Cancel booking for ${heroBooking.service_name}`}
                      className="ml-auto flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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

                  {/* Notes (if any) */}
                  {heroBooking.notes && heroBooking.notes.trim() && (
                    <div className="mt-3 rounded-lg border border-paw/[0.06] bg-paw/[0.02] px-3 py-2">
                      <p className="mb-0.5 font-pawprint text-[10px] font-bold uppercase tracking-[0.14em] text-paw/40">
                        Notes
                      </p>
                      <p className="font-pawprint text-xs italic text-paw/70">
                        &ldquo;{heroBooking.notes}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Reassurance pill */}
                  {hasPhone && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-paw/[0.06] bg-paw/[0.03] px-3 py-2">
                      <Bell className="size-3.5 text-doggy/70" />
                      <span className="font-pawprint text-xs text-paw/60">
                        We&apos;ll text you a reminder the day before. Reply X to cancel.
                      </span>
                    </div>
                  )}
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
            <div className="rounded-2xl border border-paw/[0.08] bg-gradient-to-br from-paw/[0.04] to-transparent px-6 py-10 text-center">
              <p className="mb-1 font-elegant text-2xl text-paw/75">
                You&apos;re all clear 🐾
              </p>
              <p className="mb-6 font-pawprint text-sm text-paw/45">
                Nothing on the schedule — time to treat {dogName}!
              </p>
              <Link
                href="/services"
                className="inline-block rounded-lg bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/40"
              >
                Book a Service →
              </Link>
            </div>
          )}

          {/* ──── Your Usual · 1-Tap Rebook ──── */}
          {usual.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-accent/70">
                <Sparkles className="size-3 text-accent/70" />
                Your Usual · One-Tap Rebook
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {usual.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      setRebookTarget({
                        serviceId: s.id,
                        serviceName: s.name,
                        dogName: dogName !== 'Your Pup' ? dogName : '',
                      })
                    }
                    className="group flex items-center justify-between rounded-xl border border-paw/[0.1] bg-[#1a1612] px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-doggy/45 hover:bg-doggy/[0.06] hover:shadow-lg hover:shadow-doggy/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-pawprint text-sm font-bold text-paw transition-colors group-hover:text-doggy">
                        {s.name}
                      </p>
                      <p className="mt-0.5 font-pawprint text-xs text-paw/45">
                        Booked {s.count}× before
                      </p>
                    </div>
                    <span className="shrink-0 font-pawprint text-xs font-bold text-doggy/0 transition-all duration-200 group-hover:text-doggy">
                      Rebook →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ──── Also upcoming (compact) ──── */}
          {alsoUpcoming.length > 0 && (
            <div>
              <h2 className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/45">
                Also Upcoming
              </h2>
              <div className="space-y-2">
                {alsoUpcoming.map((booking) => (
                  <div key={booking.id} className="space-y-1.5">
                    <div className="flex flex-col gap-3 rounded-xl border border-paw/10 bg-[#1a1612] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      <div className="min-w-0">
                        <p className="font-pawprint text-sm font-semibold text-paw">
                          {booking.service_name}
                          <span className="ml-2 font-normal text-paw/55">
                            — <BookingPetIcon booking={booking} /> {booking.dog_name}
                          </span>
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="font-pawprint text-xs font-medium text-paw/55">
                            {formatBookingDate(booking.datetime).date}
                          </p>
                          <span className="text-paw/30">·</span>
                          <p className="font-pawprint text-xs text-paw/40">
                            {formatBookingDate(booking.datetime).time}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-pawprint text-xs font-semibold text-doggy/65">
                          {daysAway(booking.datetime, now)}
                        </span>
                        <button
                          onClick={() => setRescheduleBooking(booking)}
                          aria-label={`Reschedule booking for ${booking.service_name}`}
                          className="min-h-9 rounded-lg border border-paw/15 px-3 py-2 font-pawprint text-xs font-semibold text-paw/70 transition-all duration-200 hover:border-paw/30 hover:bg-paw/[0.05] hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setPendingCancelBooking(booking)}
                          disabled={cancellingId === booking.id}
                          aria-label={`Cancel booking for ${booking.service_name}`}
                          className="flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* ──── History: Completed ──── */}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/45">
                Completed
              </h2>
              <div className="space-y-2">
                {completed.map((booking) => {
                  const badge = statusBadge(booking, now);
                  return (
                    <div key={booking.id} className="space-y-1.5">
                      <div className="flex flex-col gap-3 rounded-xl border border-paw/[0.08] bg-[#141210] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                        <div className="min-w-0">
                          <p className="font-pawprint text-sm font-semibold text-paw/80">
                            {booking.service_name}
                            <span className="ml-2 font-normal text-paw/55">
                              — <BookingPetIcon booking={booking} /> {booking.dog_name}
                            </span>
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <p className="font-pawprint text-xs font-medium text-paw/55">
                              {formatBookingDate(booking.datetime).date}
                            </p>
                            <span className="text-paw/30">·</span>
                            <p className="font-pawprint text-xs text-paw/40">
                              {formatBookingDate(booking.datetime).time}
                            </p>
                          </div>
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
                            className="min-h-9 rounded-lg border border-doggy/30 px-3 py-2 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10 focus:outline-none focus:ring-2 focus:ring-doggy/40"
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

          {/* ──── History: Cancelled ──── */}
          {cancelled.length > 0 && (
            <div>
              <h2 className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.16em] text-paw/45">
                Cancelled
              </h2>
              <div className="space-y-2">
                {cancelled.map((booking) => {
                  const badge = statusBadge(booking, now);
                  return (
                    <div key={booking.id} className="space-y-1.5">
                      <div className="flex flex-col gap-3 rounded-xl border border-red-500/[0.08] bg-[#141210] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                        <div className="min-w-0">
                          <p className="font-pawprint text-sm font-semibold text-paw/70">
                            {booking.service_name}
                            <span className="ml-2 font-normal text-paw/45">
                              — <BookingPetIcon booking={booking} /> {booking.dog_name}
                            </span>
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <p className="font-pawprint text-xs font-medium text-paw/45">
                              {formatBookingDate(booking.datetime).date}
                            </p>
                            <span className="text-paw/25">·</span>
                            <p className="font-pawprint text-xs text-paw/35">
                              {formatBookingDate(booking.datetime).time}
                            </p>
                          </div>
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
                            className="min-h-9 rounded-lg border border-doggy/30 px-3 py-2 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10 focus:outline-none focus:ring-2 focus:ring-doggy/40"
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

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Reschedule modal */}
      {rescheduleBooking && (
        <RescheduleDialog
          isOpen
          serviceName={rescheduleBooking.service_name}
          dogName={rescheduleBooking.dog_name}
          currentDatetime={rescheduleBooking.datetime}
          onCancel={() => setRescheduleBooking(null)}
          onConfirm={(newDatetime) => handleReschedule(rescheduleBooking.id, newDatetime)}
        />
      )}

      {/* Rebook modal */}
      {rebookTarget && (() => {
        const matched = services.find((s) => s.id === rebookTarget.serviceId);
        return (
          <BookingModal
            service={{
              id: rebookTarget.serviceId,
              name: rebookTarget.serviceName,
              price: matched?.price ?? 0,
              allowed_pet_types: matched?.allowed_pet_types,
            }}
            initialDogName={rebookTarget.dogName}
            onClose={() => setRebookTarget(null)}
          />
        );
      })()}
    </main>
  );
}
