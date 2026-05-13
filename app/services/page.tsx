import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ServicesClient } from '@/components/services-client';
import { FALLBACK_SERVICES, type ServiceRow } from '@/lib/service-icons';

export default async function ServicesPage() {
  let services: ServiceRow[] = FALLBACK_SERVICES;

  try {
    const { data, error } = await supabase.from('services').select('*').order('sort_order');

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
