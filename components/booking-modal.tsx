'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Calendar,
  Dog,
  FileText,
  Check,
  Plus,
  ArrowLeft,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { DateTimePicker } from '@/components/date-time-picker';
import { SPECIES_META, isPetSpecies, PET_SPECIES, type PetSpecies } from '@/lib/species';
import { PAYMENT_METHODS, PAYMENT_META, type PaymentMethod } from '@/lib/payment';
import { stripePromise } from '@/lib/stripe-client';

interface Service {
  id: string;
  name: string;
  price: number;
  allowed_pet_types?: PetSpecies[];
}

interface BookingModalProps {
  service: Service;
  onClose: () => void;
  initialDogName?: string;
}

type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
};

function FieldWrapper({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor?: string;
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

type StripeCardSectionProps = {
  amount: number;
  serviceId: string;
  serviceName: string;
  dogName: string;
  petSpecies: PetSpecies;
  datetime: string;
  notes: string;
  bookingNonce: string;
  onBack: () => void;
  onSuccess: () => void;
  onSlotConflict: () => void;
  fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response>;
};

function StripeCardSection({
  amount,
  serviceId,
  serviceName,
  dogName,
  petSpecies,
  datetime,
  notes,
  bookingNonce,
  onBack,
  onSuccess,
  onSlotConflict,
  fetchWithAuth,
}: StripeCardSectionProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [stage, setStage] = useState<'idle' | 'authorizing' | 'charging' | 'finalizing'>('idle');

  async function handlePay() {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    setStage('authorizing');

    try {
      // 1. Create PaymentIntent server-side (server verifies price & slot, full metadata for webhook recovery)
      // Convert datetime to UTC ISO so storage is unambiguous regardless of server/browser TZ.
      const datetimeIso = new Date(datetime).toISOString();
      const intentRes = await fetchWithAuth('/api/bookings/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          serviceName,
          dogName,
          petSpecies,
          datetime: datetimeIso,
          notes,
          bookingNonce,
        }),
      });

      if (intentRes.status === 409) {
        onSlotConflict();
        return;
      }
      if (!intentRes.ok) {
        const d = (await intentRes.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? 'Payment setup failed. Please try again.');
      }
      const { clientSecret } = (await intentRes.json()) as { clientSecret: string };

      // 2. Confirm card payment in-page (no redirect)
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card form not ready.');

      setStage('charging');
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (stripeErr) throw new Error(stripeErr.message ?? 'Payment declined.');
      if (paymentIntent?.status !== 'succeeded')
        throw new Error('Payment not completed. Please try again.');

      // 3. Finalize booking (email route verifies intent server-side; webhook is the safety net)
      setStage('finalizing');
      const bookRes = await fetchWithAuth('/api/bookings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          serviceName,
          dogName,
          petSpecies,
          datetime: datetimeIso,
          notes: notes || undefined,
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
        }),
      });

      if (bookRes.status === 409) {
        // Slot taken after payment — server auto-refunds, inform user
        const d = (await bookRes.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? 'Slot was just taken — your payment has been refunded.');
      }
      if (!bookRes.ok) {
        const d = (await bookRes.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? 'Booking failed after payment. Contact support.');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setStage('idle');
    }
  }

  const buttonLabel =
    stage === 'authorizing'
      ? 'Preparing payment…'
      : stage === 'charging'
        ? 'Charging card…'
        : stage === 'finalizing'
          ? 'Confirming booking…'
          : `Pay $${amount} Now →`;

  return (
    <div className="flex flex-col gap-4">
      {/* Card input */}
      <div className="rounded-xl border border-paw/[0.12] bg-paw/[0.03] px-4 py-3.5 transition-all duration-200 focus-within:border-doggy/50 focus-within:ring-2 focus-within:ring-doggy/15">
        <CardElement
          onChange={(e) => {
            setCardComplete(e.complete);
            if (e.error) setError(e.error.message);
            else if (error) setError(null);
          }}
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: '#F5CBA7',
                fontFamily: '"Baloo 2", sans-serif',
                fontSize: '14px',
                '::placeholder': { color: 'rgba(245,203,167,0.35)' },
              },
              invalid: { color: '#ef4444', iconColor: '#ef4444' },
            },
          }}
        />
      </div>

      {/* Powered by Stripe badge */}
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-paw/30" strokeWidth={1.5} />
        <span className="font-pawprint text-[11px] text-paw/35">
          Secured by Stripe · 256-bit TLS encryption
        </span>
      </div>

      {/* Cancellation policy */}
      <div className="flex items-start gap-2.5 rounded-xl border border-doggy/15 bg-doggy/[0.05] px-4 py-3">
        <span className="mt-0.5 text-sm leading-none" aria-hidden>
          📋
        </span>
        <p className="font-pawprint text-[11px] leading-relaxed text-paw/60">
          <strong className="text-paw/80">Cancellation policy:</strong> Full refund if cancelled
          within an hour of booking or more than 24 hours before your appointment. 50% refund within
          24 hours. No refund once the appointment start time has passed.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in">
          <p className="font-pawprint text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-paw/[0.1] px-4 py-3.5 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.04] hover:text-paw disabled:opacity-50"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !stripe || !elements || !cardComplete}
          className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}

export function BookingModal({ service, onClose, initialDogName }: BookingModalProps) {
  type BookingErrors = { dogName?: string; datetime?: string };
  type Step = 'details' | 'review';

  const { token, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [dogName, setDogName] = useState(initialDogName ?? '');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BookingErrors>({});
  const [countdown, setCountdown] = useState(3);
  // Unique nonce per modal session — used as Stripe idempotency key so
  // rebooking the same service+slot creates a new PaymentIntent rather than
  // returning a stale one from a prior cancelled booking.
  const [bookingNonce] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  const allowed = useMemo<PetSpecies[]>(
    () =>
      service.allowed_pet_types && service.allowed_pet_types.length > 0
        ? service.allowed_pet_types
        : [...PET_SPECIES],
    [service.allowed_pet_types],
  );

  const compatiblePets = useMemo(
    () => pets.filter((p) => allowed.includes(isPetSpecies(p.species) ? p.species : 'dog')),
    [pets, allowed],
  );

  useEffect(() => {
    if (!token) return;
    fetchWithAuth('/api/pets')
      .then((r) => r.json() as Promise<{ pets: Pet[] }>)
      .then(({ pets }) => {
        const list = pets ?? [];
        setPets(list);
        const firstCompat = list.find((p) =>
          allowed.includes(isPetSpecies(p.species) ? p.species : 'dog'),
        );
        if (firstCompat && !initialDogName) {
          setSelectedPetId(firstCompat.id);
          setDogName(firstCompat.name);
        }
      })
      .catch(() => {})
      .finally(() => setPetsLoaded(true));
  }, [token, initialDogName, fetchWithAuth, allowed]);

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
        <div className="rounded-2xl border border-paw/15 bg-[#0f0d09] p-8 text-center shadow-2xl animate-scale-in">
          <p className="font-pawprint text-sm text-paw/60">Please log in to book a service.</p>
        </div>
      </div>
    );
  }

  function selectPet(pet: Pet) {
    setSelectedPetId(pet.id);
    setDogName(pet.name);
    setFieldErrors((fe) => ({ ...fe, dogName: undefined }));
  }

  function validateBookingField(field: keyof BookingErrors, value: string): string | undefined {
    if (field === 'dogName' && !value.trim()) return 'Please pick a pet for this booking.';
    if (field === 'datetime') {
      if (!value) return 'Please select a date and time.';
      if (new Date(value) <= new Date()) return 'Please choose a future date and time.';
    }
    return undefined;
  }

  async function fetchTakenSlots(dateStr: string): Promise<{ hour: number; minute: number }[]> {
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

  function handleContinue() {
    const errors: BookingErrors = {
      dogName: validateBookingField('dogName', dogName),
      datetime: validateBookingField('datetime', datetime),
    };
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep('review');
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const selected = pets.find((p) => p.id === selectedPetId);
      const petSpecies: PetSpecies = selected
        ? isPetSpecies(selected.species)
          ? selected.species
          : 'dog'
        : 'dog';

      // Convert datetime to UTC ISO so storage is unambiguous regardless of server/browser TZ.
      const datetimeIso = new Date(datetime).toISOString();
      const res = await fetchWithAuth('/api/bookings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          dogName,
          petSpecies,
          datetime: datetimeIso,
          notes,
          paymentMethod,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setFieldErrors((fe) => ({
          ...fe,
          datetime: data.message ?? 'That slot is no longer available. Please pick another time.',
        }));
        setStep('details');
        return;
      }

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

  const hasPets = pets.length > 0;
  const hasCompatible = compatiblePets.length > 0;
  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;
  const allowsAllSpecies = allowed.length === PET_SPECIES.length;
  const reviewSpecies: PetSpecies = selectedPet
    ? isPetSpecies(selectedPet.species)
      ? selectedPet.species
      : 'dog'
    : 'dog';
  const ReviewSpeciesIcon = SPECIES_META[reviewSpecies].Icon;

  const formattedReviewDate = datetime
    ? new Date(datetime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const selectedPetSpecies: PetSpecies = selectedPet
    ? isPetSpecies(selectedPet.species)
      ? selectedPet.species
      : 'dog'
    : 'dog';

  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#B2A4FF',
      colorBackground: '#0f0d09',
      colorText: '#F5CBA7',
      borderRadius: '12px',
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-paw/15 bg-[#0f0d09] shadow-2xl animate-scale-in">
        <div className="pointer-events-none absolute -top-32 left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-doggy/[0.15] blur-[80px]" />

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-paw/[0.06] bg-gradient-to-r from-doggy/95 via-doggy to-paw-dark px-6 py-5">
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
              {success
                ? 'Confirmed'
                : step === 'details'
                  ? 'Step 1 of 2 · Details'
                  : 'Step 2 of 2 · Review'}
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

        {/* Step dots (hidden on success) */}
        {!success && (
          <div className="flex shrink-0 justify-center gap-1.5 border-b border-paw/[0.04] bg-paw/[0.02] py-2.5">
            <span
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === 'details' ? 'w-8 bg-doggy' : 'w-1.5 bg-paw/20',
              )}
            />
            <span
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === 'review' ? 'w-8 bg-doggy' : 'w-1.5 bg-paw/20',
              )}
            />
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto p-6">
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
                <p className="mt-2 font-pawprint text-xs text-paw/45">
                  {paymentMethod === 'stripe'
                    ? 'Your card has been charged successfully.'
                    : `Payment (${PAYMENT_META[paymentMethod].shortLabel.toLowerCase()}) will be collected at the appointment.`}
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
          ) : step === 'details' ? (
            <div className="flex flex-col gap-5">
              {hasPets && hasCompatible ? (
                <FieldWrapper
                  label={compatiblePets.length === 1 ? 'Booking For' : 'Pick a Pet'}
                  icon={Dog}
                >
                  <div className="flex flex-wrap gap-2">
                    {compatiblePets.map((pet) => {
                      const active = selectedPetId === pet.id;
                      const species = isPetSpecies(pet.species) ? pet.species : 'dog';
                      const meta = SPECIES_META[species];
                      const SpeciesIcon = meta.Icon;
                      return (
                        <button
                          type="button"
                          key={pet.id}
                          onClick={() => selectPet(pet)}
                          className={cn(
                            'group flex items-center gap-2.5 rounded-full border px-3 py-2 transition-all duration-200',
                            active
                              ? 'border-doggy/60 bg-doggy/[0.12] shadow-md shadow-doggy/15'
                              : 'border-paw/[0.12] bg-paw/[0.03] hover:border-doggy/30 hover:bg-doggy/[0.05]',
                          )}
                          aria-pressed={active}
                          aria-label={`${pet.name}, ${meta.label}`}
                        >
                          {pet.photo_url ? (
                            <Image
                              src={pet.photo_url}
                              alt={pet.name}
                              width={28}
                              height={28}
                              className="size-7 rounded-full object-cover"
                              style={{ width: 28, height: 28 }}
                            />
                          ) : (
                            <span
                              className={cn(
                                'flex size-7 items-center justify-center rounded-full border',
                                active
                                  ? 'border-doggy/40 bg-doggy/[0.18]'
                                  : 'border-paw/15 bg-paw/[0.05]',
                              )}
                              aria-hidden
                            >
                              <SpeciesIcon
                                className={cn('size-3.5', active ? 'text-doggy' : 'text-paw/55')}
                                strokeWidth={1.8}
                              />
                            </span>
                          )}
                          <span
                            className={cn(
                              'font-pawprint text-sm font-semibold transition-colors',
                              active ? 'text-paw' : 'text-paw/65 group-hover:text-paw/90',
                            )}
                          >
                            {pet.name}
                          </span>
                          {active && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-doggy">
                              <Check className="size-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <Link
                      href="/profile"
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-paw/15 px-3 py-2 font-pawprint text-xs font-semibold text-paw/40 transition-colors hover:border-doggy/40 hover:text-doggy"
                    >
                      <Plus className="size-3.5" strokeWidth={2} />
                      Add pet
                    </Link>
                  </div>

                  {selectedPet && (selectedPet.breed || selectedPet.age) && (
                    <p className="mt-1 font-pawprint text-xs text-paw/40 animate-fade-in">
                      {[
                        SPECIES_META[
                          isPetSpecies(selectedPet.species) ? selectedPet.species : 'dog'
                        ].label,
                        selectedPet.breed,
                        selectedPet.age,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}

                  {!allowsAllSpecies && pets.length > compatiblePets.length && (
                    <p className="mt-1 font-pawprint text-[11px] text-paw/40">
                      Hiding {pets.length - compatiblePets.length} pet
                      {pets.length - compatiblePets.length === 1 ? '' : 's'} — this service only
                      accepts {allowed.map((a) => SPECIES_META[a].label).join(', ')}.
                    </p>
                  )}

                  {fieldErrors.dogName && (
                    <p className="font-pawprint text-xs text-red-400">{fieldErrors.dogName}</p>
                  )}
                </FieldWrapper>
              ) : hasPets && !hasCompatible && petsLoaded ? (
                <FieldWrapper label="Pet Required" icon={Dog}>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                    <p className="font-pawprint text-sm font-semibold text-amber-300">
                      None of your pets can book this service.
                    </p>
                    <p className="mt-1 font-pawprint text-xs text-amber-200/70">
                      <strong>{service.name}</strong> only accepts{' '}
                      {allowed.map((a) => SPECIES_META[a].label).join(', ')}.
                    </p>
                    <Link
                      href="/profile"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 font-pawprint text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/30"
                    >
                      <Plus className="size-3.5" strokeWidth={2} />
                      Add a compatible pet
                    </Link>
                  </div>
                </FieldWrapper>
              ) : petsLoaded ? (
                <FieldWrapper label="Pet's Name" htmlFor="dogName" icon={Dog}>
                  <input
                    id="dogName"
                    type="text"
                    value={dogName}
                    onChange={(e) => {
                      setDogName(e.target.value);
                      setFieldErrors((fe) => ({ ...fe, dogName: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = e.target.value.trim()
                        ? undefined
                        : "Your pet's name is required.";
                      setFieldErrors((fe) => ({ ...fe, dogName: err }));
                    }}
                    placeholder="e.g. Buddy"
                    className={cn(
                      inputClass,
                      fieldErrors.dogName &&
                        'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
                    )}
                  />
                  <p className="font-pawprint text-[11px] text-paw/40">
                    💡{' '}
                    <Link
                      href="/profile"
                      className="text-doggy/80 hover:text-doggy underline underline-offset-2"
                    >
                      Save your pets to your profile
                    </Link>{' '}
                    to skip this next time.
                  </p>
                  {fieldErrors.dogName && (
                    <p className="font-pawprint text-xs text-red-400">{fieldErrors.dogName}</p>
                  )}
                </FieldWrapper>
              ) : (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-3 w-24 rounded bg-paw/10" />
                  <div className="flex gap-2">
                    <div className="h-10 w-24 rounded-full bg-paw/[0.06]" />
                    <div className="h-10 w-24 rounded-full bg-paw/[0.06]" />
                  </div>
                </div>
              )}

              <FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
                <DateTimePicker
                  value={datetime}
                  onChange={(v) => {
                    setDatetime(v);
                    setFieldErrors((fe) => ({ ...fe, datetime: undefined }));
                  }}
                  error={!!fieldErrors.datetime}
                  fetchTakenSlots={fetchTakenSlots}
                />
                {fieldErrors.datetime && (
                  <p className="font-pawprint text-xs text-red-400">{fieldErrors.datetime}</p>
                )}
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
                  className="flex-1 cursor-pointer rounded-xl border border-paw/[0.1] py-3.5 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.04] hover:text-paw"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={hasPets && !hasCompatible}
                  className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">Continue →</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2 — REVIEW & PAYMENT */
            <div className="flex flex-col gap-5 animate-fade-in">
              {/* Order summary card */}
              <div className="rounded-2xl border border-paw/[0.1] bg-gradient-to-br from-paw/[0.05] to-doggy/[0.04] p-5">
                <p className="mb-3 font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/40">
                  Your Booking
                </p>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-elegant text-xl font-black leading-tight text-paw">
                      {service.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 font-pawprint text-sm text-paw/65">
                      <ReviewSpeciesIcon className="size-3.5 text-doggy/80" strokeWidth={1.8} />
                      <span className="font-semibold">{dogName}</span>
                      <span className="text-paw/35">·</span>
                      <span>{SPECIES_META[reviewSpecies].label}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-elegant text-2xl font-black leading-none text-doggy">
                      ${service.price}
                    </p>
                    <p className="mt-0.5 font-pawprint text-[10px] uppercase tracking-wider text-paw/35">
                      Total
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-paw/[0.08] bg-[#0f0d09]/40 px-3 py-2.5">
                  <Calendar className="size-3.5 text-doggy/70" strokeWidth={1.8} />
                  <span className="font-pawprint text-sm font-semibold text-paw">
                    {formattedReviewDate}
                  </span>
                </div>

                {notes && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-paw/[0.08] bg-[#0f0d09]/40 px-3 py-2.5">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-paw/45" strokeWidth={1.8} />
                    <span className="font-pawprint text-xs text-paw/65">{notes}</span>
                  </div>
                )}
              </div>

              {/* Payment method picker */}
              <div className="flex flex-col gap-2.5">
                <p className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/55">
                  How would you like to pay?
                </p>
                <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const meta = PAYMENT_META[m];
                    const Icon = meta.Icon;
                    const active = paymentMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={meta.label}
                        onClick={() => setPaymentMethod(m)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                          active
                            ? 'border-doggy/60 bg-doggy/[0.10] shadow-sm shadow-doggy/15'
                            : 'border-paw/[0.1] bg-paw/[0.03] hover:border-doggy/30 hover:bg-doggy/[0.04]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-lg border',
                            active
                              ? 'border-doggy/40 bg-doggy/[0.18] text-doggy'
                              : 'border-paw/15 bg-paw/[0.05] text-paw/55',
                          )}
                        >
                          <Icon className="size-4" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block font-pawprint text-sm font-bold',
                              active ? 'text-paw' : 'text-paw/80',
                            )}
                          >
                            {meta.label}
                          </span>
                          <span className="block font-pawprint text-[11px] text-paw/45">
                            {meta.hint}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                            active ? 'border-doggy bg-doggy' : 'border-paw/20',
                          )}
                        >
                          {active && <Check className="size-3 text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stripe card form — mounted only when stripe selected */}
              {paymentMethod === 'stripe' ? (
                <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
                  <StripeCardSection
                    amount={service.price}
                    serviceId={service.id}
                    serviceName={service.name}
                    dogName={dogName}
                    petSpecies={selectedPetSpecies}
                    datetime={datetime}
                    notes={notes}
                    bookingNonce={bookingNonce}
                    onBack={() => setStep('details')}
                    onSuccess={() => setSuccess(true)}
                    onSlotConflict={() => {
                      setFieldErrors((fe) => ({
                        ...fe,
                        datetime: 'That slot is no longer available. Please pick another time.',
                      }));
                      setStep('details');
                    }}
                    fetchWithAuth={fetchWithAuth}
                  />
                </Elements>
              ) : (
                <>
                  {/* No-payment callout for cash/etransfer */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                    <span className="mt-0.5 text-base leading-none" aria-hidden>
                      💡
                    </span>
                    <p className="font-pawprint text-xs leading-relaxed text-amber-200/85">
                      <strong className="font-bold text-amber-200">No payment needed now.</strong>{' '}
                      Your provider will collect payment at the time of service.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 animate-fade-in">
                      <p className="font-pawprint text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={loading}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-paw/[0.1] px-4 py-3.5 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.04] hover:text-paw disabled:opacity-50"
                    >
                      <ArrowLeft className="size-4" strokeWidth={2} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={loading}
                      className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl bg-doggy py-3.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative">{loading ? 'Booking…' : 'Confirm Booking'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
