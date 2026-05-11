import Image from 'next/image';

const DOG_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    alt: 'Happy dog outdoors enjoying a sunny day',
    label: 'Happy Paws',
    service: 'Dog Walking',
  },
  {
    src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
    alt: 'Cute dog portrait with expressive eyes',
    label: 'After Grooming',
    service: 'Grooming',
  },
  {
    src: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800',
    alt: 'Playful dog running in a field',
    label: 'Playtime',
    service: 'Daycare',
  },
  {
    src: 'https://images.unsplash.com/photo-1534361960057-19f4434a5fbc?w=800',
    alt: 'Dog exploring nature on a trail',
    label: 'Trail Adventure',
    service: 'Dog Walking',
  },
  {
    src: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800',
    alt: 'Dog resting comfortably',
    label: 'Cozy Stay',
    service: 'Boarding',
  },
  {
    src: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800',
    alt: 'Adorable puppy portrait',
    label: 'New Friend',
    service: 'Training',
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#0f0d09]">

      {/* HEADER */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[400px] rounded-full bg-doggy/8 blur-[80px]" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/25 bg-[#F9D923]/8 px-4 py-1.5">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-[#F9D923]">
              Gallery
            </span>
          </div>
          <h1 className="mb-4 font-elegant text-5xl font-black text-paw md:text-6xl">
            Our Happy <em className="not-italic text-doggy">Paws</em>
          </h1>
          <p className="font-pawprint text-lg text-paw/55">
            A glimpse into the joy we bring to dogs and their families every day.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="border-t border-paw/8 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DOG_IMAGES.map(({ src, alt, label, service }, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-paw/8 bg-paw/[0.03] transition-all duration-300 hover:border-paw/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 cursor-pointer"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d09]/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Service badge */}
                  <div className="absolute left-4 top-4 translate-y-2 rounded-full border border-doggy/30 bg-[#0f0d09]/70 px-3 py-1 font-pawprint text-xs font-semibold text-doggy opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {service}
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-elegant text-base font-bold text-paw">{label}</p>
                  <p className="font-pawprint text-xs text-paw/40">{alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="mx-auto max-w-xl">
          <p className="mb-6 font-pawprint text-base text-paw/50">
            Want to see your dog featured here? Book a service and share your story.
          </p>
          <a
            href="/services"
            className="inline-flex items-center gap-2 rounded-xl bg-doggy px-8 py-4 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-200 hover:bg-doggy/90 hover:-translate-y-0.5"
          >
            Book a Service
          </a>
        </div>
      </section>
    </div>
  );
}
