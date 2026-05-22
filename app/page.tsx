import Link from 'next/link';
import { ScrollToTopLink } from '@/components/scroll-to-top-link';
import { FaqSection } from '@/components/faq-section';
import {
  Scissors,
  Home as HomeIcon,
  Footprints,
  Sun,
  Sparkles,
  ArrowRight,
  Star,
  Shield,
  Award,
  Heart,
  Search,
  CalendarCheck,
  BellRing,
  type LucideIcon,
} from 'lucide-react';

// Order + icons + gradients mirror the services table in Supabase
// (sort_order). If services are added/removed in the admin panel, update
// this list to keep the landing page in sync with /services.
const SERVICES_PREVIEW: { icon: LucideIcon; label: string; price: number; color: string }[] = [
  { icon: Scissors, label: 'Grooming', price: 30, color: 'from-pink-500 to-rose-500' },
  { icon: Footprints, label: 'Dog Walking', price: 20, color: 'from-emerald-500 to-teal-500' },
  { icon: HomeIcon, label: 'Boarding', price: 50, color: 'from-blue-500 to-indigo-500' },
  { icon: Sun, label: 'Drop-in', price: 35, color: 'from-violet-500 to-purple-500' },
  { icon: Sparkles, label: 'Custom', price: 60, color: 'from-cyan-500 to-sky-500' },
  { icon: HomeIcon, label: 'House Sitting', price: 100, color: 'from-pink-500 to-rose-500' },
];

const STATS = [
  { value: '400+', label: 'Happy Dogs' },
  { value: '6', label: 'Services' },
  { value: '4.9', label: 'Rating', suffix: '★' },
  { value: '4+ yrs', label: 'Experience' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Golden Retriever owner',
    text: 'My golden looks amazing every time. The groomers genuinely care about every detail.',
    stars: 5,
    initials: 'SM',
  },
  {
    name: 'James K.',
    role: 'Labrador owner',
    text: 'Boarding was completely stress-free. Our lab actually seemed sad to leave!',
    stars: 5,
    initials: 'JK',
  },
  {
    name: 'Priya L.',
    role: 'Rescue mom',
    text: 'House sitting saved us on vacation — daily updates, our pup was so happy. Worth every penny.',
    stars: 5,
    initials: 'PL',
  },
];

const TRUST_BADGES = [
  { icon: Shield, label: 'Vetted Pros' },
  { icon: Award, label: 'Certified' },
  { icon: Heart, label: 'Insured' },
];

const HOW_IT_WORKS: { icon: LucideIcon; step: string; title: string; description: string; accent: string }[] = [
  {
    icon: Search,
    step: '01',
    title: 'Choose a service',
    description:
      'Browse six trusted services — grooming, boarding, walking, drop-ins, custom, and house sitting. Transparent prices, no surprises.',
    accent: 'from-doggy to-[#9C8FE8]',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Pick your time',
    description:
      'See real-time availability and book in under a minute. Pay by card now, cash, or e-transfer on arrival.',
    accent: 'from-paw-dark to-paw',
  },
  {
    icon: BellRing,
    step: '03',
    title: 'Relax — we’ll text you',
    description:
      'Instant SMS confirmation, a friendly reminder 24h before, and one tap to cancel or reschedule.',
    accent: 'from-[#F9D923] to-[#e8a83a]',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* HERO */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full bg-doggy/[0.12] blur-[140px]" />
          <div className="absolute left-[15%] top-[20%] size-[260px] rounded-full bg-[#F9D923]/[0.06] blur-[100px] animate-float" />
          <div className="absolute right-[10%] bottom-[20%] size-[320px] rounded-full bg-paw/[0.08] blur-[100px] animate-float-delayed" />
        </div>

        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#F5CBA7 1px, transparent 1px), linear-gradient(90deg, #F5CBA7 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(circle at 50% 40%, black 30%, transparent 75%)',
          }}
        />

        {/* Floating paw decorations */}
        <div className="pointer-events-none absolute left-[8%] top-[18%] hidden opacity-30 md:block animate-float">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B2A4FF"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="4" r="2" />
            <circle cx="18" cy="8" r="2" />
            <circle cx="20" cy="16" r="2" />
            <circle cx="7" cy="9" r="2" />
            <path d="M9 18a5 5 0 1 0 6 0c-1 0-2-2-3-2s-2 2-3 2Z" />
          </svg>
        </div>
        <div className="pointer-events-none absolute right-[12%] top-[28%] hidden opacity-20 md:block animate-float-delayed">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F5CBA7"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="4" r="2" />
            <circle cx="18" cy="8" r="2" />
            <circle cx="20" cy="16" r="2" />
            <circle cx="7" cy="9" r="2" />
            <path d="M9 18a5 5 0 1 0 6 0c-1 0-2-2-3-2s-2 2-3 2Z" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-7">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9D923]/30 bg-[#F9D923]/[0.08] px-4 py-1.5 animate-fade-down">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#F9D923] opacity-60" />
              <span className="relative size-1.5 rounded-full bg-[#F9D923]" />
            </span>
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.18em] text-[#F9D923]">
              Premium Dog Care
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-balance max-w-4xl font-elegant text-[3.25rem] font-black leading-[1.04] tracking-[-0.02em] text-paw md:text-7xl lg:text-[5.5rem] animate-fade-up delay-100">
            Your Dog Deserves{' '}
            <em className="not-italic animate-shimmer font-elegant">the&nbsp;Best</em>
            <br className="hidden md:block" /> Care
          </h1>

          {/* Subtext */}
          <p className="max-w-xl font-pawprint text-lg leading-[1.7] text-paw/55 md:text-xl animate-fade-up delay-200">
            Grooming, walking, boarding, drop-ins and house sitting — all in one trusted place.
            Give your furry friend the life they deserve.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-3 sm:flex-row animate-fade-up delay-300">
            <Link
              href="/services"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-doggy px-9 py-4 font-pawprint text-base font-bold text-white shadow-xl shadow-doggy/35 transition-all duration-300 hover:shadow-doggy/55 hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Explore Services</span>
              <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-paw/20 px-9 py-4 font-pawprint text-base font-semibold text-paw/80 backdrop-blur-sm transition-all duration-300 hover:border-paw/40 hover:bg-paw/[0.04] hover:text-paw hover:-translate-y-0.5"
            >
              Sign Up Free
              <span className="text-doggy transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 animate-fade-up delay-400">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#F9D923] text-[#F9D923]" />
                ))}
              </div>
              <span className="font-pawprint text-xs text-paw/50">
                <strong className="text-paw/80">4.9</strong> from 400+ families
              </span>
            </div>
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-doggy" strokeWidth={2} />
                <span className="font-pawprint text-xs text-paw/50">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in delay-700">
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-paw/15 p-1">
            <div className="h-2 w-0.5 animate-bounce rounded-full bg-paw/40" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-paw/[0.06] bg-paw/[0.015]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4">
          {STATS.map(({ value, label, suffix }, i) => (
            <div
              key={label}
              className={`group flex flex-col items-center gap-1 px-8 py-10 text-center transition-all duration-300 hover:bg-paw/[0.025] ${
                i !== 0 ? 'md:border-l border-paw/[0.06]' : ''
              } ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i % 2 === 1 ? 'border-l md:border-l border-paw/[0.06]' : ''}`}
            >
              <span className="font-elegant text-4xl font-black tracking-tight text-paw transition-colors duration-300 group-hover:text-doggy md:text-5xl">
                {value}
                {suffix && <span className="text-[#F9D923]">{suffix}</span>}
              </span>
              <span className="font-pawprint text-xs font-semibold uppercase tracking-[0.18em] text-paw/40">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="relative px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col items-center gap-3 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
              What We Offer
            </span>
            <h2 className="font-elegant text-4xl font-black tracking-tight text-paw md:text-6xl">
              Everything Your Pup Needs
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/45">
              Six trusted services, one place to book them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {SERVICES_PREVIEW.map(({ icon: Icon, label, price, color }, i) => (
              <Link
                key={label}
                href="/services"
                className="group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.025] p-6 text-center transition-all duration-500 hover:border-paw/25 hover:bg-paw/[0.05] hover:-translate-y-1.5"
              >
                {/* Hover glow */}
                <div
                  className={`pointer-events-none absolute -top-12 left-1/2 size-24 -translate-x-1/2 rounded-full bg-gradient-to-br ${color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50`}
                />

                <div
                  className={`relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="size-6 text-white" strokeWidth={2} />
                </div>
                <span className="relative font-elegant text-base font-bold text-paw">{label}</span>
                <span className="relative font-pawprint text-sm font-bold text-[#F9D923]">
                  ${price}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-2.5 font-pawprint text-sm font-semibold text-doggy transition-all duration-300 hover:gap-3 hover:bg-doggy/[0.06] focus:outline-none focus:ring-2 focus:ring-doggy/40"
            >
              View all services
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative border-t border-paw/[0.06] px-6 py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-doggy/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col items-center gap-3 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
              How It Works
            </span>
            <h2 className="font-elegant text-4xl font-black tracking-tight text-paw md:text-6xl">
              Booked in Under a Minute
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/45">
              Three simple steps from sign-up to a happy, well-cared-for pup.
            </p>
          </div>

          <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
            {/* Connector line — desktop only, sits behind the cards */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-[12%] right-[12%] top-[88px] hidden h-px md:block"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(178,164,255,0.35) 20%, rgba(245,203,167,0.35) 50%, rgba(249,217,35,0.35) 80%, transparent 100%)',
              }}
            />

            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description, accent }) => (
              <div
                key={step}
                className="group relative flex flex-col items-center gap-5 text-center"
              >
                {/* Icon disc */}
                <div className="relative">
                  <div
                    className={`pointer-events-none absolute inset-0 -m-3 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-50`}
                  />
                  <div
                    className={`relative flex size-[88px] items-center justify-center rounded-full border border-paw/15 bg-gradient-to-br ${accent} shadow-xl shadow-doggy/20 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3`}
                  >
                    <Icon className="size-9 text-white" strokeWidth={1.75} />
                  </div>
                  {/* Step number chip */}
                  <span className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border border-paw/20 bg-[#0f0d09] font-pawprint text-[11px] font-bold text-paw shadow-md">
                    {step}
                  </span>
                </div>

                <h3 className="font-elegant text-2xl font-black tracking-tight text-paw">
                  {title}
                </h3>
                <p className="max-w-xs font-pawprint text-sm leading-[1.7] text-paw/55">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 rounded-xl bg-doggy/10 px-6 py-3 font-pawprint text-sm font-bold text-doggy ring-1 ring-doggy/25 transition-all duration-300 hover:bg-doggy/15 hover:ring-doggy/40"
            >
              Start your first booking
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative border-t border-paw/[0.06] px-6 py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[500px] rounded-full bg-doggy/[0.05] blur-[100px]" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col items-center gap-3 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
              Happy Owners
            </span>
            <h2 className="font-elegant text-4xl font-black tracking-tight text-paw md:text-6xl">
              Loved by Dog Families
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, stars, initials }) => (
              <div
                key={name}
                className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.025] p-8 transition-all duration-500 hover:border-paw/20 hover:bg-paw/[0.04] hover:-translate-y-1"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-doggy/[0.06] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="size-4 fill-[#F9D923] text-[#F9D923]" />
                    ))}
                  </div>
                  <span className="font-elegant text-4xl leading-none text-doggy/30">&ldquo;</span>
                </div>

                <p className="relative font-pawprint text-base leading-[1.7] text-paw/75">{text}</p>

                <div className="relative flex items-center gap-3 border-t border-paw/[0.06] pt-5">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-doggy to-paw-dark font-pawprint text-xs font-bold text-white shadow-md">
                    {initials}
                  </div>
                  <div>
                    <p className="font-elegant text-sm font-bold text-paw">{name}</p>
                    <p className="font-pawprint text-xs text-paw/40">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CTA BANNER */}
      <section className="px-6 pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-doggy/25 bg-gradient-to-br from-doggy/[0.15] via-paw/[0.03] to-[#F9D923]/[0.06] px-8 py-16 text-center md:px-16 md:py-20">
          {/* Glows */}
          <div className="pointer-events-none absolute left-1/4 top-0 size-[400px] -translate-y-1/2 rounded-full bg-doggy/[0.18] blur-[100px]" />
          <div className="pointer-events-none absolute right-1/4 bottom-0 size-[300px] translate-y-1/2 rounded-full bg-[#F9D923]/[0.08] blur-[80px]" />

          {/* Pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #F5CBA7 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-paw/15 bg-paw/[0.04] px-3 py-1 backdrop-blur-sm">
              <Sparkles className="size-3 text-[#F9D923]" />
              <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-paw/70">
                Limited Time
              </span>
            </div>

            <h2 className="text-balance max-w-2xl font-elegant text-5xl font-black tracking-tight text-paw md:text-6xl">
              Ready to <em className="not-italic text-doggy">spoil</em> your pup?
            </h2>
            <p className="max-w-md font-pawprint text-base text-paw/55 md:text-lg">
              Create your free account and book your first service in under 2 minutes.
            </p>
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-doggy px-9 py-4 font-pawprint text-base font-bold text-white shadow-2xl shadow-doggy/40 transition-all duration-300 hover:shadow-doggy/60 hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Get Started Free</span>
              <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-paw/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <ScrollToTopLink
            href="/"
            aria-label="ProjectPaw home"
            className="-mx-2 inline-flex min-h-9 items-center gap-2 rounded-md px-2 py-2 font-elegant text-base font-black text-paw/70 transition-colors hover:text-paw focus:outline-none focus:ring-2 focus:ring-doggy/30"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B2A4FF"
              strokeWidth="2"
            >
              <circle cx="11" cy="4" r="2" />
              <circle cx="18" cy="8" r="2" />
              <circle cx="20" cy="16" r="2" />
              <circle cx="7" cy="9" r="2" />
              <path d="M9 18a5 5 0 1 0 6 0c-1 0-2-2-3-2s-2 2-3 2Z" />
            </svg>
            ProjectPaw
          </ScrollToTopLink>
          <p className="font-pawprint text-xs text-paw/30">
            © 2026 ProjectPaw · Crafted with care for dogs everywhere
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Gallery', href: '/gallery' },
              { label: 'Services', href: '/services' },
              { label: 'FAQ', href: '/#faq' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map(({ label, href }) => (
              <ScrollToTopLink
                key={label}
                href={href}
                className="inline-flex min-h-9 items-center rounded-md px-3 py-2 font-pawprint text-xs text-paw/55 transition-colors hover:text-doggy focus:outline-none focus:ring-2 focus:ring-doggy/30"
              >
                {label}
              </ScrollToTopLink>
            ))}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@projectpaw.ca'}`}
              className="inline-flex min-h-9 items-center rounded-md px-3 py-2 font-pawprint text-xs text-paw/55 transition-colors hover:text-doggy focus:outline-none focus:ring-2 focus:ring-doggy/30"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
