'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Footprints,
  Home,
  GraduationCap,
  Stethoscope,
  Sun,
  Sparkles,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { BookingModal } from '@/components/booking-modal';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

type ServiceType = 'grooming' | 'walking' | 'boarding' | 'training' | 'vet' | 'daycare' | 'custom';

interface Service {
  id: string;
  name: string;
  type: ServiceType;
  price: number;
  icon: LucideIcon;
  gradient: string;
  description: string;
  duration: string;
}

const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Grooming',
    type: 'grooming',
    price: 30,
    icon: Scissors,
    gradient: 'from-pink-500 to-rose-500',
    description: 'Full grooming session including bath, trim, and styling by certified groomers.',
    duration: '90 min',
  },
  {
    id: '2',
    name: 'Dog Walking',
    type: 'walking',
    price: 20,
    icon: Footprints,
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Daily walks to keep your pup healthy and happy with experienced handlers.',
    duration: '60 min',
  },
  {
    id: '3',
    name: 'Boarding',
    type: 'boarding',
    price: 50,
    icon: Home,
    gradient: 'from-blue-500 to-indigo-500',
    description: 'Safe overnight stays in a comfortable home environment with 24/7 care.',
    duration: 'Per night',
  },
  {
    id: '4',
    name: 'Training',
    type: 'training',
    price: 45,
    icon: GraduationCap,
    gradient: 'from-amber-500 to-yellow-500',
    description: 'Professional obedience and behavior training sessions with certified trainers.',
    duration: '60 min',
  },
  {
    id: '5',
    name: 'Vet Visit',
    type: 'vet',
    price: 80,
    icon: Stethoscope,
    gradient: 'from-red-500 to-orange-500',
    description: 'Routine checkups and health assessments with licensed veterinarians.',
    duration: '45 min',
  },
  {
    id: '6',
    name: 'Daycare',
    type: 'daycare',
    price: 35,
    icon: Sun,
    gradient: 'from-violet-500 to-purple-500',
    description: 'Full-day supervised play and socialization in a safe group environment.',
    duration: 'Full day',
  },
  {
    id: '7',
    name: 'Custom Service',
    type: 'custom',
    price: 60,
    icon: Sparkles,
    gradient: 'from-cyan-500 to-sky-500',
    description: "Tailored services designed to meet your dog's unique and specific needs.",
    duration: 'Varies',
  },
];

const TYPE_FILTERS: { value: 'all' | ServiceType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'training', label: 'Training' },
  { value: 'vet', label: 'Vet' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'custom', label: 'Custom' },
];

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name';

export default function ServicesPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ServiceType>('all');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filtered = useMemo(() => {
    let list = SERVICES.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      return matchesSearch && matchesType;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [search, typeFilter, sort]);

  return (
    <div className="min-h-screen bg-[#0f0d09]">

      {/* HEADER */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[400px] rounded-full bg-doggy/8 blur-[80px]" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/25 bg-[#F9D923]/8 px-4 py-1.5">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-[#F9D923]">
              Book a Service
            </span>
          </div>
          <h1 className="mb-4 font-elegant text-5xl font-black text-paw md:text-6xl">
            Our <em className="not-italic text-doggy">Services</em>
          </h1>
          <p className="font-pawprint text-lg text-paw/55">
            Find the perfect care for your furry companion.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="border-y border-paw/8 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-paw/30" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full rounded-xl border border-paw/10 bg-paw/[0.04] py-2.5 pl-11 pr-4',
                'font-pawprint text-sm text-paw placeholder:text-paw/25',
                'outline-none transition-all duration-200 focus:border-doggy/50 focus:ring-2 focus:ring-doggy/10',
              )}
            />
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-1.5 font-pawprint text-xs font-semibold transition-all duration-200',
                  typeFilter === value
                    ? 'bg-doggy text-white shadow-md shadow-doggy/25'
                    : 'border border-paw/10 text-paw/50 hover:border-paw/25 hover:text-paw',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={cn(
              'cursor-pointer rounded-xl border border-paw/10 bg-[#0f0d09] px-4 py-2.5',
              'font-pawprint text-sm text-paw/60',
              'outline-none transition-all duration-200 focus:border-doggy/50',
            )}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      {/* AUTH NOTICE */}
      {!token && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-doggy/20 bg-doggy/8 px-6 py-4 text-center font-pawprint text-sm text-doggy">
              Please{' '}
              <Link href="/login" className="font-bold underline underline-offset-4 transition-opacity hover:opacity-80">
                log in
              </Link>{' '}
              to book a service.
            </div>
          </div>
        </div>
      )}

      {/* SERVICE GRID */}
      <section className="px-6 py-10 pb-24">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <span className="font-pawprint text-4xl text-paw/20">🔍</span>
              <p className="font-pawprint text-base text-paw/40">No services match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-paw/8 bg-paw/[0.03] transition-all duration-300 hover:border-paw/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
                  >
                    {/* Card gradient header */}
                    <div className={cn('flex items-center gap-3 bg-gradient-to-r p-5', service.gradient)}>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <Icon className="size-5 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="font-elegant text-base font-bold text-white">{service.name}</h3>
                        <span className="font-pawprint text-xs capitalize text-white/70">{service.type}</span>
                      </div>
                      <div className="ml-auto rounded-full bg-black/20 px-2.5 py-1 font-pawprint text-xs text-white/80">
                        {service.duration}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <p className="flex-1 font-pawprint text-sm leading-relaxed text-paw/55">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-elegant text-2xl font-black text-[#F9D923]">${service.price}</span>
                          <span className="ml-1 font-pawprint text-xs text-paw/35">/ session</span>
                        </div>
                        {token ? (
                          <button
                            onClick={() => setSelectedService(service)}
                            className="cursor-pointer rounded-xl bg-doggy px-4 py-2 font-pawprint text-xs font-bold text-white shadow-md shadow-doggy/20 transition-all duration-200 hover:bg-doggy/90 hover:shadow-doggy/35"
                          >
                            Book Now
                          </button>
                        ) : (
                          <Link href="/login">
                            <button className="cursor-pointer rounded-xl border border-paw/15 px-4 py-2 font-pawprint text-xs font-semibold text-paw/50 transition-all duration-200 hover:border-paw/30 hover:text-paw">
                              Book Now
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Booking modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
