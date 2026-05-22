'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { BookingModal } from '@/components/booking-modal';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { getServiceIcon, type ServiceRow } from '@/lib/service-icons';

type ServiceType =
  | 'all'
  | 'grooming'
  | 'walking'
  | 'boarding'
  | 'daycare'
  | 'custom'
  | 'house-sitting';
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name';

const TYPE_FILTERS: { value: ServiceType; label: string }[] = [
  { value: 'all', label: 'All Services' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'daycare', label: 'Drop-in' },
  { value: 'house-sitting', label: 'House Sitting' },
  { value: 'custom', label: 'Custom' },
];

export function ServicesClient({ services }: { services: ServiceRow[] }) {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ServiceType>('all');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

  const filtered = useMemo(() => {
    let list = services.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      return matchesSearch && matchesType;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [services, search, typeFilter, sort]);

  return (
    <>
      {/* FILTERS */}
      <div className="sticky top-[73px] z-30 border-y border-paw/[0.06] bg-[#0f0d09]/85 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/30"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full rounded-xl border border-paw/[0.08] bg-paw/[0.03] py-2.5 pl-11 pr-4',
                'font-pawprint text-sm text-paw placeholder:text-paw/25',
                'outline-none transition-all duration-300',
                'focus:border-doggy/50 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15',
              )}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={cn(
                  'min-h-9 cursor-pointer rounded-full px-4 py-2 font-pawprint text-xs font-semibold transition-all duration-300',
                  typeFilter === value
                    ? 'bg-doggy text-white shadow-md shadow-doggy/30'
                    : 'border border-paw/[0.1] text-paw/65 hover:border-paw/30 hover:text-paw',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={cn(
              'cursor-pointer rounded-xl border border-paw/[0.08] bg-paw/[0.03] px-4 py-2.5',
              'font-pawprint text-sm text-paw/70',
              'outline-none transition-all duration-300 focus:border-doggy/50',
            )}
          >
            <option value="relevance" className="bg-[#0f0d09]">
              Relevance
            </option>
            <option value="price-asc" className="bg-[#0f0d09]">
              Price: Low → High
            </option>
            <option value="price-desc" className="bg-[#0f0d09]">
              Price: High → Low
            </option>
            <option value="name" className="bg-[#0f0d09]">
              Name: A–Z
            </option>
          </select>
        </div>
      </div>

      {/* AUTH NOTICE */}
      {!token && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-doggy/25 bg-gradient-to-r from-doggy/[0.08] via-doggy/[0.04] to-doggy/[0.08] px-6 py-4 font-pawprint text-sm text-doggy">
              <Sparkles className="size-4" />
              <span>
                Please{' '}
                <Link
                  href="/login"
                  className="font-bold underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  log in
                </Link>{' '}
                to book a service.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE GRID */}
      <section className="px-6 py-12 pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-pawprint text-sm text-paw/50">
              <strong className="text-paw">{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'service' : 'services'} available
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-paw/[0.06] bg-paw/[0.02] py-24 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-paw/10 bg-paw/[0.04]">
                <Search className="size-7 text-paw/30" strokeWidth={1.5} />
              </div>
              <p className="font-elegant text-xl font-bold text-paw/60">No services match</p>
              <p className="font-pawprint text-sm text-paw/40">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((service, i) => {
                const Icon = getServiceIcon(service.icon_key);
                return (
                  <div
                    key={service.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.025] transition-all duration-500 hover:border-paw/25 hover:bg-paw/[0.05] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {service.popular && (
                      <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#F9D923] px-2.5 py-1 font-pawprint text-[10px] font-bold uppercase tracking-wider text-[#0f0d09] shadow-lg shadow-[#F9D923]/30">
                        <TrendingUp className="size-2.5" />
                        Popular
                      </div>
                    )}

                    <div
                      className={cn(
                        'relative flex items-center gap-3 overflow-hidden bg-gradient-to-r p-5 transition-all duration-500 group-hover:p-6',
                        service.gradient,
                      )}
                    >
                      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl transition-opacity duration-500 group-hover:opacity-70" />
                      <div className="relative flex size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                        <Icon className="size-5 text-white" strokeWidth={2} />
                      </div>
                      <div className="relative">
                        <h3 className="font-elegant text-lg font-bold text-white">
                          {service.name}
                        </h3>
                        <span className="font-pawprint text-xs capitalize text-white/75">
                          {service.type}
                        </span>
                      </div>
                      <div className="relative ml-auto flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 font-pawprint text-xs text-white/85 backdrop-blur-sm">
                        <Clock className="size-3" />
                        {service.duration}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-5 p-6">
                      <p className="flex-1 font-pawprint text-sm leading-[1.7] text-paw/60">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between border-t border-paw/[0.06] pt-5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-elegant text-3xl font-black text-[#F9D923]">
                            ${service.price}
                          </span>
                          <span className="font-pawprint text-xs text-paw/35">/session</span>
                        </div>
                        {token ? (
                          <button
                            onClick={() => setSelectedService(service)}
                            className="group/btn relative cursor-pointer overflow-hidden rounded-xl bg-doggy px-5 py-2.5 font-pawprint text-xs font-bold text-white shadow-md shadow-doggy/25 transition-all duration-300 hover:shadow-doggy/45"
                          >
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                            <span className="relative">Book Now</span>
                          </button>
                        ) : (
                          <Link href="/login">
                            <button className="cursor-pointer rounded-xl border border-paw/15 px-5 py-2.5 font-pawprint text-xs font-semibold text-paw/55 transition-all duration-300 hover:border-paw/35 hover:text-paw">
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

      {selectedService && (
        <BookingModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </>
  );
}
