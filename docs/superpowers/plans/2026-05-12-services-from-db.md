# Services from DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `SERVICES` array in `app/services/page.tsx` with a live Supabase DB fetch, while silently falling back to hardcoded data if the fetch fails.

**Architecture:** `app/services/page.tsx` becomes an async server component that fetches from the `services` table and passes rows to a new `components/services-client.tsx` client component. The client component handles all interactive state (search, filter, sort, booking modal). Icons are resolved from a string key via `lib/service-icons.ts` so DB rows don't need to carry React component references.

**Tech Stack:** Next.js 15 App Router, Supabase (`@/lib/supabase`), TypeScript, Lucide React, Tailwind CSS v4

---

## File Map

| File                             | Action     | Responsibility                                                         |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `lib/service-icons.ts`           | **Create** | Maps `icon_key` string → LucideIcon + exports `FALLBACK_SERVICES`      |
| `components/services-client.tsx` | **Create** | All interactive UI: search, filter, sort, booking modal                |
| `app/services/page.tsx`          | **Modify** | Convert to async server component, fetch from Supabase, pass to client |

---

## Task 1: Create the Supabase `services` table

**Files:** None (SQL run in Supabase dashboard)

- [ ] **Step 1: Open Supabase SQL Editor**

  Go to supabase.com → your project → **SQL Editor** → click **New query**.

- [ ] **Step 2: Run the table creation + RLS SQL**

  Paste and run this entire block:

  ```sql
  create table services (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type text not null,
    price integer not null,
    icon_key text not null,
    gradient text not null,
    description text not null,
    duration text not null,
    popular boolean default false,
    sort_order integer not null default 0
  );

  alter table services enable row level security;

  create policy "Public read access" on services
    for select using (true);
  ```

  Expected: "Success. No rows returned."

- [ ] **Step 3: Seed the 7 services**

  Run this in a second SQL query:

  ```sql
  insert into services (name, type, price, icon_key, gradient, description, duration, popular, sort_order) values
    ('Grooming',       'grooming', 30, 'scissors',       'from-pink-500 to-rose-500',     'Full grooming session including bath, trim, and styling by certified groomers.',         '90 min',   true,  1),
    ('Dog Walking',    'walking',  20, 'footprints',     'from-emerald-500 to-teal-500',  'Daily walks to keep your pup healthy and happy with experienced handlers.',              '60 min',   false, 2),
    ('Boarding',       'boarding', 50, 'home',           'from-blue-500 to-indigo-500',   'Safe overnight stays in a comfortable home environment with 24/7 care.',                 'Per night', false, 3),
    ('Training',       'training', 45, 'graduation-cap', 'from-amber-500 to-yellow-500',  'Professional obedience and behavior training with certified trainers.',                  '60 min',   false, 4),
    ('Vet Visit',      'vet',      80, 'stethoscope',    'from-red-500 to-orange-500',    'Routine checkups and health assessments with licensed veterinarians.',                   '45 min',   false, 5),
    ('Daycare',        'daycare',  35, 'sun',            'from-violet-500 to-purple-500', 'Full-day supervised play and socialization in a safe group environment.',                 'Full day', false, 6),
    ('Custom Service', 'custom',   60, 'sparkles',       'from-cyan-500 to-sky-500',      'Tailored services designed to meet your dog''s unique and specific needs.',             'Varies',   false, 7);
  ```

  Expected: "Success. 7 rows affected."

- [ ] **Step 4: Verify in Table Editor**

  Go to **Table Editor** → click `services` → confirm 7 rows are visible.

---

## Task 2: Create `lib/service-icons.ts`

**Files:**

- Create: `lib/service-icons.ts`

- [ ] **Step 1: Create the file**

  Create `lib/service-icons.ts` with this exact content:

  ```typescript
  import {
    Scissors,
    Footprints,
    Home,
    GraduationCap,
    Stethoscope,
    Sun,
    Sparkles,
    type LucideIcon,
  } from 'lucide-react';

  export type ServiceRow = {
    id: string;
    name: string;
    type: string;
    price: number;
    icon_key: string;
    gradient: string;
    description: string;
    duration: string;
    popular: boolean;
    sort_order: number;
  };

  const SERVICE_ICONS: Record<string, LucideIcon> = {
    scissors: Scissors,
    footprints: Footprints,
    home: Home,
    'graduation-cap': GraduationCap,
    stethoscope: Stethoscope,
    sun: Sun,
    sparkles: Sparkles,
  };

  export function getServiceIcon(iconKey: string): LucideIcon {
    return SERVICE_ICONS[iconKey] ?? Sparkles;
  }

  export const FALLBACK_SERVICES: ServiceRow[] = [
    {
      id: '1',
      name: 'Grooming',
      type: 'grooming',
      price: 30,
      icon_key: 'scissors',
      gradient: 'from-pink-500 to-rose-500',
      description: 'Full grooming session including bath, trim, and styling by certified groomers.',
      duration: '90 min',
      popular: true,
      sort_order: 1,
    },
    {
      id: '2',
      name: 'Dog Walking',
      type: 'walking',
      price: 20,
      icon_key: 'footprints',
      gradient: 'from-emerald-500 to-teal-500',
      description: 'Daily walks to keep your pup healthy and happy with experienced handlers.',
      duration: '60 min',
      popular: false,
      sort_order: 2,
    },
    {
      id: '3',
      name: 'Boarding',
      type: 'boarding',
      price: 50,
      icon_key: 'home',
      gradient: 'from-blue-500 to-indigo-500',
      description: 'Safe overnight stays in a comfortable home environment with 24/7 care.',
      duration: 'Per night',
      popular: false,
      sort_order: 3,
    },
    {
      id: '4',
      name: 'Training',
      type: 'training',
      price: 45,
      icon_key: 'graduation-cap',
      gradient: 'from-amber-500 to-yellow-500',
      description: 'Professional obedience and behavior training with certified trainers.',
      duration: '60 min',
      popular: false,
      sort_order: 4,
    },
    {
      id: '5',
      name: 'Vet Visit',
      type: 'vet',
      price: 80,
      icon_key: 'stethoscope',
      gradient: 'from-red-500 to-orange-500',
      description: 'Routine checkups and health assessments with licensed veterinarians.',
      duration: '45 min',
      popular: false,
      sort_order: 5,
    },
    {
      id: '6',
      name: 'Daycare',
      type: 'daycare',
      price: 35,
      icon_key: 'sun',
      gradient: 'from-violet-500 to-purple-500',
      description: 'Full-day supervised play and socialization in a safe group environment.',
      duration: 'Full day',
      popular: false,
      sort_order: 6,
    },
    {
      id: '7',
      name: 'Custom Service',
      type: 'custom',
      price: 60,
      icon_key: 'sparkles',
      gradient: 'from-cyan-500 to-sky-500',
      description: "Tailored services designed to meet your dog's unique and specific needs.",
      duration: 'Varies',
      popular: false,
      sort_order: 7,
    },
  ];
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `npm run build 2>&1 | head -20`

  Expected: No errors related to `lib/service-icons.ts`.

---

## Task 3: Create `components/services-client.tsx`

**Files:**

- Create: `components/services-client.tsx`
- This file contains ALL interactive logic from the current `app/services/page.tsx` — search, filter, sort, booking modal — but receives `ServiceRow[]` as a prop and resolves icons at render time via `getServiceIcon`.

- [ ] **Step 1: Create the file**

  Create `components/services-client.tsx` with this exact content:

  ```typescript
  'use client';

  import { useState, useMemo } from 'react';
  import Link from 'next/link';
  import { Search, Clock, TrendingUp, Sparkles } from 'lucide-react';
  import { BookingModal } from '@/components/booking-modal';
  import { useAuth } from '@/contexts/auth-context';
  import { cn } from '@/lib/utils';
  import { getServiceIcon, type ServiceRow } from '@/lib/service-icons';

  type ServiceType = 'all' | 'grooming' | 'walking' | 'boarding' | 'training' | 'vet' | 'daycare' | 'custom';
  type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name';

  const TYPE_FILTERS: { value: ServiceType; label: string }[] = [
    { value: 'all', label: 'All Services' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'walking', label: 'Walking' },
    { value: 'boarding', label: 'Boarding' },
    { value: 'training', label: 'Training' },
    { value: 'vet', label: 'Vet' },
    { value: 'daycare', label: 'Daycare' },
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
                    'cursor-pointer rounded-full px-4 py-1.5 font-pawprint text-xs font-semibold transition-all duration-300',
                    typeFilter === value
                      ? 'bg-doggy text-white shadow-md shadow-doggy/30'
                      : 'border border-paw/[0.1] text-paw/50 hover:border-paw/30 hover:text-paw',
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
              <option value="relevance" className="bg-[#0f0d09]">Relevance</option>
              <option value="price-asc" className="bg-[#0f0d09]">Price: Low → High</option>
              <option value="price-desc" className="bg-[#0f0d09]">Price: High → Low</option>
              <option value="name" className="bg-[#0f0d09]">Name: A–Z</option>
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
                <p className="font-pawprint text-sm text-paw/40">Try adjusting your filters or search query.</p>
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
                          <h3 className="font-elegant text-lg font-bold text-white">{service.name}</h3>
                          <span className="font-pawprint text-xs capitalize text-white/75">{service.type}</span>
                        </div>
                        <div className="relative ml-auto flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 font-pawprint text-xs text-white/85 backdrop-blur-sm">
                          <Clock className="size-3" />
                          {service.duration}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-5 p-6">
                        <p className="flex-1 font-pawprint text-sm leading-[1.7] text-paw/60">{service.description}</p>
                        <div className="flex items-center justify-between border-t border-paw/[0.06] pt-5">
                          <div className="flex items-baseline gap-1">
                            <span className="font-elegant text-3xl font-black text-[#F9D923]">${service.price}</span>
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
          <BookingModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        )}
      </>
    );
  }
  ```

- [ ] **Step 2: Check BookingModal accepts `ServiceRow`**

  Open `components/booking-modal.tsx` and check what type its `service` prop expects. If it expects the old `Service` type (which has `icon: LucideIcon`), update the prop type to accept `ServiceRow` from `@/lib/service-icons`. The modal only uses `service.name` and `service.id` — so either type will satisfy those fields.

- [ ] **Step 3: Verify TypeScript compiles**

  Run: `npm run build 2>&1 | head -30`

  Expected: No type errors.

---

## Task 4: Convert `app/services/page.tsx` to a server component

**Files:**

- Modify: `app/services/page.tsx`

- [ ] **Step 1: Replace the entire file**

  Replace `app/services/page.tsx` with:

  ```typescript
  import { Sparkles } from 'lucide-react';
  import { supabase } from '@/lib/supabase';
  import { ServicesClient } from '@/components/services-client';
  import { FALLBACK_SERVICES, type ServiceRow } from '@/lib/service-icons';

  export default async function ServicesPage() {
    let services: ServiceRow[] = FALLBACK_SERVICES;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order');

      if (!error && data && data.length > 0) {
        services = data as ServiceRow[];
      }
    } catch {
      // silent fallback — FALLBACK_SERVICES already set above
    }

    return (
      <div className="relative min-h-screen">
        {/* HEADER */}
        <section className="relative overflow-hidden px-6 pb-16 pt-24 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[500px] rounded-full bg-doggy/[0.1] blur-[100px]" />
          <div className="pointer-events-none absolute right-[10%] top-[60%] size-[200px] rounded-full bg-[#F9D923]/[0.05] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/30 bg-[#F9D923]/[0.08] px-4 py-1.5 animate-fade-down">
              <Sparkles className="size-3 text-[#F9D923]" />
              <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-[#F9D923]">
                Book a Service
              </span>
            </div>
            <h1 className="mb-5 text-balance font-elegant text-5xl font-black tracking-tight text-paw md:text-7xl animate-fade-up delay-100">
              Our <em className="not-italic animate-shimmer">Services</em>
            </h1>
            <p className="font-pawprint text-lg text-paw/55 animate-fade-up delay-200">
              Find the perfect care for your furry companion — all premium, all vetted.
            </p>
          </div>
        </section>

        <ServicesClient services={services} />
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify no `'use client'` at top**

  The file must NOT have `'use client'` — it's a server component now. Confirm the file starts with `import`.

- [ ] **Step 3: Full build check**

  Run: `npm run build`

  Expected: Build completes with no errors. Any type errors here must be fixed before proceeding.

- [ ] **Step 4: Start dev server and verify**

  Run: `npm run dev`

  Open `http://localhost:3000/services` in browser. Confirm:
  - All 7 service cards render
  - Search, filter pills, and sort dropdown work
  - "Book Now" opens the booking modal when logged in

- [ ] **Step 5: Commit**

  ```bash
  git add lib/service-icons.ts components/services-client.tsx app/services/page.tsx
  git commit -m "feat(services): fetch services from Supabase DB with hardcoded fallback"
  ```

---

## Self-Review

**Spec coverage:**

- [x] Section 1 — `services` table + RLS + seed: Task 1
- [x] Section 2 — `lib/service-icons.ts`, server component, client component: Tasks 2, 3, 4
- [x] Section 3 — Silent fallback on fetch error: Task 4 (try/catch in server component)
- [x] All existing UI (filters, sort, booking modal) preserved: Task 3

**Placeholder scan:** None found — all steps have exact code.

**Type consistency:**

- `ServiceRow` defined once in `lib/service-icons.ts`, imported in both `services-client.tsx` and `page.tsx`
- `getServiceIcon` defined in Task 2, used in Task 3
- `FALLBACK_SERVICES` defined in Task 2, used in Task 4
- `ServicesClient` exported named (not default) in Task 3, imported in Task 4
