'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Dog, FileText, Check, PawPrint, Plus, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { DateTimePicker } from '@/components/date-time-picker';
import { SPECIES_META, isPetSpecies, PET_SPECIES, type PetSpecies } from '@/lib/species';

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

export function BookingModal({ service, onClose, initialDogName }: BookingModalProps) {
  type BookingErrors = { dogName?: string; datetime?: string };

  const { token, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [dogName, setDogName] = useState(initialDogName ?? '');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BookingErrors>({});
  const [countdown, setCountdown] = useState(3);

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

  const allowed = useMemo<PetSpecies[]>(
    () => (service.allowed_pet_types && service.allowed_pet_types.length > 0
      ? service.allowed_pet_types
      : [...PET_SPECIES]),
    [service.allowed_pet_types],
  );

  const compatiblePets = useMemo(
    () => pets.filter((p) => allowed.includes(isPetSpecies(p.species) ? p.species : 'dog')),
    [pets, allowed],
  );

  // Fetch pets when modal opens
  useEffect(() => {
    if (!token) return;
    fetchWithAuth('/api/pets')
      .then((r) => r.json() as Promise<{ pets: Pet[] }>)
      .then(({ pets }) => {
        const list = pets ?? [];
        setPets(list);
        // Auto-select first COMPATIBLE pet so users hit "Confirm" faster
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
    if (field === 'dogName' && !value.trim()) return "Please pick a pet for this booking.";
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: BookingErrors = {
      dogName: validateBookingField('dogName', dogName),
      datetime: validateBookingField('datetime', datetime),
    };
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const selected = pets.find((p) => p.id === selectedPetId);
      const petSpecies: PetSpecies = selected
        ? (isPetSpecies(selected.species) ? selected.species : 'dog')
        : 'dog';

      const res = await fetchWithAuth('/api/bookings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, serviceName: service.name, dogName, petSpecies, datetime, notes }),
      });

      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setFieldErrors((fe) => ({ ...fe, datetime: data.message ?? 'That slot is no longer available. Please pick another time.' }));
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-paw/15 bg-[#0f0d09] shadow-2xl animate-scale-in">
        {/* Ambient glow */}
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

              {/* Pet picker (or fallback) */}
              {hasPets && hasCompatible ? (
                <FieldWrapper label={compatiblePets.length === 1 ? 'Booking For' : "Pick a Pet"} icon={Dog}>
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
                            <span className={cn(
                              'flex size-7 items-center justify-center rounded-full border',
                              active ? 'border-doggy/40 bg-doggy/[0.18]' : 'border-paw/15 bg-paw/[0.05]',
                            )} aria-hidden>
                              <SpeciesIcon className={cn('size-3.5', active ? 'text-doggy' : 'text-paw/55')} strokeWidth={1.8} />
                            </span>
                          )}
                          <span className={cn(
                            'font-pawprint text-sm font-semibold transition-colors',
                            active ? 'text-paw' : 'text-paw/65 group-hover:text-paw/90',
                          )}>
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

                  {/* Selected pet detail strip */}
                  {selectedPet && (selectedPet.breed || selectedPet.age) && (
                    <p className="mt-1 font-pawprint text-xs text-paw/40 animate-fade-in">
                      {[SPECIES_META[isPetSpecies(selectedPet.species) ? selectedPet.species : 'dog'].label, selectedPet.breed, selectedPet.age].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {!allowsAllSpecies && pets.length > compatiblePets.length && (
                    <p className="mt-1 font-pawprint text-[11px] text-paw/40">
                      Hiding {pets.length - compatiblePets.length} pet{pets.length - compatiblePets.length === 1 ? '' : 's'} — this service only accepts {allowed.map((a) => SPECIES_META[a].label).join(', ')}.
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
                      <strong>{service.name}</strong> only accepts {allowed.map((a) => SPECIES_META[a].label).join(', ')}.
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
                      const err = e.target.value.trim() ? undefined : "Your dog's name is required.";
                      setFieldErrors((fe) => ({ ...fe, dogName: err }));
                    }}
                    placeholder="e.g. Buddy"
                    className={cn(
                      inputClass,
                      fieldErrors.dogName && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
                    )}
                  />
                  <p className="font-pawprint text-[11px] text-paw/40">
                    💡 <Link href="/profile" className="text-doggy/80 hover:text-doggy underline underline-offset-2">Save your pets to your profile</Link> to skip this next time.
                  </p>
                  {fieldErrors.dogName && (
                    <p className="font-pawprint text-xs text-red-400">{fieldErrors.dogName}</p>
                  )}
                </FieldWrapper>
              ) : (
                /* Skeleton while pets load */
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
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl border border-paw/[0.1] py-3.5 font-pawprint text-sm font-semibold text-paw/55 transition-all duration-300 hover:border-paw/25 hover:bg-paw/[0.04] hover:text-paw disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (hasPets && !hasCompatible)}
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
