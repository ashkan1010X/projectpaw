import Image from 'next/image';
import Link from 'next/link';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

const DOG_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900',
    alt: 'Happy dog outdoors enjoying a sunny day',
    label: 'Sunny Days',
    service: 'Dog Walking',
    span: 'md:col-span-2 md:row-span-2',
    height: 'h-80 md:h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=900',
    alt: 'Cute dog portrait with expressive eyes',
    label: 'Fresh Trim',
    service: 'Grooming',
    span: '',
    height: 'h-64',
  },
  {
    src: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=900',
    alt: 'Playful dog running in a field',
    label: 'Playtime',
    service: 'Daycare',
    span: '',
    height: 'h-64',
  },
  {
    src: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900',
    alt: 'Dog exploring nature on a trail',
    label: 'Adventure',
    service: 'Walking',
    span: 'md:col-span-2',
    height: 'h-64',
  },
  {
    src: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=900',
    alt: 'Dog resting comfortably',
    label: 'Cozy Stay',
    service: 'Boarding',
    span: '',
    height: 'h-64',
  },
  {
    src: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=900',
    alt: 'Adorable puppy portrait',
    label: 'New Friend',
    service: 'Drop-in',
    span: '',
    height: 'h-64',
  },
];

export default function GalleryPage() {
  return (
    <div className="relative min-h-screen">
      {/* HEADER */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[500px] rounded-full bg-doggy/[0.1] blur-[100px]" />
        <div className="pointer-events-none absolute right-[5%] top-[40%] size-[200px] rounded-full bg-[#F9D923]/[0.05] blur-[70px] animate-float" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/30 bg-[#F9D923]/[0.08] px-4 py-1.5 animate-fade-down">
            <Camera className="size-3 text-[#F9D923]" />
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-[#F9D923]">
              Gallery
            </span>
          </div>
          <h1 className="mb-5 text-balance font-elegant text-5xl font-black tracking-tight text-paw md:text-7xl animate-fade-up delay-100">
            Our Happy <em className="not-italic animate-shimmer">Paws</em>
          </h1>
          <p className="font-pawprint text-lg text-paw/55 animate-fade-up delay-200">
            A glimpse into the joy we bring to dogs and their families every day.
          </p>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="border-t border-paw/[0.06] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid auto-rows-[16rem] grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {DOG_IMAGES.map(({ src, alt, label, service, span, height }, idx) => (
              <div
                key={idx}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.03] transition-all duration-500 hover:border-paw/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 animate-fade-up ${span} ${height}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  unoptimized
                  className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                {/* Bottom gradient overlay (always visible, subtle) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f0d09] via-[#0f0d09]/60 to-transparent" />

                {/* Hover full overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0d09]/90 via-[#0f0d09]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Service pill (top-left, slides in on hover) */}
                <div className="absolute left-4 top-4 -translate-y-3 rounded-full border border-doggy/40 bg-[#0f0d09]/70 px-3 py-1 font-pawprint text-[10px] font-bold uppercase tracking-widest text-doggy opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {service}
                </div>

                {/* Caption (bottom) */}
                <div className="absolute inset-x-5 bottom-5">
                  <p className="font-elegant text-2xl font-black leading-tight tracking-tight text-paw drop-shadow-lg">
                    {label}
                  </p>
                  <p className="mt-1 font-pawprint text-xs text-paw/60 opacity-90 transition-opacity duration-300 group-hover:text-paw/80">
                    {alt}
                  </p>
                </div>

                {/* Hover icon */}
                <div className="absolute right-5 top-5 flex size-9 translate-y-3 items-center justify-center rounded-full border border-paw/20 bg-[#0f0d09]/60 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowRight className="size-4 -rotate-45 text-paw" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-doggy/20 bg-gradient-to-br from-doggy/[0.12] via-paw/[0.02] to-[#F9D923]/[0.05] px-8 py-14 text-center md:px-12">
          <div className="pointer-events-none absolute left-1/2 top-0 size-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-doggy/[0.15] blur-[80px]" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-paw/15 bg-paw/[0.04] px-3 py-1 backdrop-blur-sm">
              <Sparkles className="size-3 text-[#F9D923]" />
              <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/70">
                Join Them
              </span>
            </div>
            <h2 className="text-balance font-elegant text-3xl font-black tracking-tight text-paw md:text-4xl">
              Want your dog featured here?
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/55">
              Book a service and share your story. We&apos;d love to celebrate your pup.
            </p>
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 rounded-xl bg-doggy px-8 py-4 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 hover:-translate-y-0.5"
            >
              Book a Service
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
