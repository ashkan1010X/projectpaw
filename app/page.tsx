import Link from 'next/link';
import {
  Scissors,
  Home,
  GraduationCap,
  Footprints,
  Stethoscope,
  Sun,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';

const SERVICES_PREVIEW = [
  { icon: Scissors, label: 'Grooming', price: 30, color: 'from-pink-500 to-rose-500' },
  { icon: Home, label: 'Boarding', price: 50, color: 'from-blue-500 to-indigo-500' },
  { icon: GraduationCap, label: 'Training', price: 45, color: 'from-amber-500 to-yellow-500' },
  { icon: Footprints, label: 'Walking', price: 20, color: 'from-emerald-500 to-teal-500' },
  { icon: Stethoscope, label: 'Vet Visit', price: 80, color: 'from-red-500 to-orange-500' },
  { icon: Sun, label: 'Daycare', price: 35, color: 'from-violet-500 to-purple-500' },
  { icon: Sparkles, label: 'Custom', price: 60, color: 'from-cyan-500 to-sky-500' },
];

const STATS = [
  { value: '2,400+', label: 'Happy Dogs' },
  { value: '7', label: 'Services' },
  { value: '4.9★', label: 'Avg Rating' },
  { value: '5 yrs', label: 'Experience' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', text: 'My golden retriever looks amazing every time. The groomers are exceptional.', stars: 5 },
  { name: 'James K.', text: 'Boarding was stress-free. Our lab actually seemed sad to leave!', stars: 5 },
  { name: 'Priya L.', text: 'Training transformed our rescue dog. Worth every penny.', stars: 5 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f0d09]">

      {/* HERO */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-doggy/10 blur-[120px]" />
          <div className="absolute left-1/4 bottom-1/4 size-[300px] rounded-full bg-paw/5 blur-[80px]" />
        </div>

        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#F5CBA7 1px, transparent 1px), linear-gradient(90deg, #F5CBA7 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9D923]/30 bg-[#F9D923]/8 px-4 py-1.5">
            <span className="size-1.5 rounded-full bg-[#F9D923]" />
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-[#F9D923]">
              Premium Dog Care
            </span>
          </div>

          <h1 className="max-w-3xl font-elegant text-5xl font-black leading-[1.06] tracking-tight text-paw md:text-6xl lg:text-7xl">
            Your Dog Deserves{' '}
            <em className="font-elegant not-italic text-doggy">the Best</em>{' '}
            Care
          </h1>

          <p className="max-w-lg font-pawprint text-lg leading-relaxed text-paw/55 md:text-xl">
            Premium grooming, boarding, training and more — all in one trusted
            place. Give your furry friend the life they deserve.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-doggy px-8 py-4 font-pawprint text-base font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-200 hover:bg-doggy/90 hover:shadow-doggy/50 hover:-translate-y-0.5"
            >
              Explore Services
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-paw/20 px-8 py-4 font-pawprint text-base font-semibold text-paw/80 transition-all duration-200 hover:border-paw/40 hover:text-paw hover:-translate-y-0.5"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="border-y border-paw/8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-paw/8 md:grid-cols-4 md:divide-y-0">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-8 py-8 text-center">
              <span className="font-elegant text-3xl font-black text-paw">{value}</span>
              <span className="font-pawprint text-xs font-medium uppercase tracking-wider text-paw/40">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES PREVIEW */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col items-center gap-3 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-doggy">
              What We Offer
            </span>
            <h2 className="font-elegant text-4xl font-black text-paw md:text-5xl">
              Everything Your Pup Needs
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/50">
              Seven premium services, one trusted platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {SERVICES_PREVIEW.map(({ icon: Icon, label, price, color }) => (
              <Link
                key={label}
                href="/services"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-paw/8 bg-paw/[0.03] p-5 text-center transition-all duration-200 hover:border-paw/20 hover:bg-paw/[0.06] hover:-translate-y-1 cursor-pointer"
              >
                <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon className="size-5 text-white" strokeWidth={2} />
                </div>
                <span className="font-elegant text-sm font-bold text-paw">{label}</span>
                <span className="font-pawprint text-xs text-[#F9D923] font-semibold">${price}</span>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 font-pawprint text-sm font-semibold text-doggy transition-colors hover:text-doggy/80"
            >
              View all services
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-paw/8 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col items-center gap-3 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-doggy">
              Happy Owners
            </span>
            <h2 className="font-elegant text-4xl font-black text-paw md:text-5xl">
              Loved by Dog Families
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, text, stars }) => (
              <div
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-paw/8 bg-paw/[0.03] p-7"
              >
                <div className="flex gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="size-4 fill-[#F9D923] text-[#F9D923]" />
                  ))}
                </div>
                <p className="font-pawprint text-sm leading-relaxed text-paw/70">&ldquo;{text}&rdquo;</p>
                <span className="font-elegant text-sm font-bold text-paw/50">— {name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-doggy/20 bg-gradient-to-br from-doggy/10 to-paw/5 p-12 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[400px] rounded-full bg-doggy/10 blur-[80px]" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="font-elegant text-4xl font-black text-paw md:text-5xl">
              Ready to Book?
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/55">
              Create your free account and book your first service in under 2
              minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-doggy px-8 py-4 font-pawprint text-base font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-200 hover:bg-doggy/90 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-paw/8 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-elegant text-base font-black text-paw/60">
            🐾 ProjectPaw
          </span>
          <p className="font-pawprint text-xs text-paw/30">
            © 2026 ProjectPaw · Premium Dog Services
          </p>
          <div className="flex gap-6">
            {['Home', 'About', 'Gallery', 'Services'].map((l) => (
              <Link
                key={l}
                href={`/${l === 'Home' ? '' : l.toLowerCase()}`}
                className="font-pawprint text-xs text-paw/40 transition-colors hover:text-paw/70"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
