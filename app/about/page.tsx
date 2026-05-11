import { PawPrint, Heart, Shield, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

const VALUES = [
  {
    icon: Heart,
    title: 'Genuine Care',
    desc: 'Every team member is a dog lover first. We treat every animal like our own — because to us, they are.',
    gradient: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-300',
  },
  {
    icon: Shield,
    title: 'Vetted Professionals',
    desc: 'All providers are certified, background-checked, and continuously rated by our community of dog parents.',
    gradient: 'from-doggy/20 to-blue-500/10',
    iconColor: 'text-doggy',
  },
  {
    icon: Star,
    title: 'Premium Experience',
    desc: 'From booking to aftercare, every touchpoint is designed to delight you and your dog.',
    gradient: 'from-[#F9D923]/20 to-amber-500/10',
    iconColor: 'text-[#F9D923]',
  },
];

const MILESTONES = [
  { year: '2021', label: 'Founded', detail: 'Started with 3 dogs and one big dream.' },
  { year: '2023', label: 'Network expansion', detail: 'Grew to 50+ certified professionals.' },
  { year: '2024', label: '2,000 happy paws', detail: 'Served over 2,000 families across the city.' },
  { year: '2026', label: 'Premium platform', detail: 'Launched the new ProjectPaw experience.' },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[600px] rounded-full bg-doggy/[0.1] blur-[120px]" />
        <div className="pointer-events-none absolute right-[15%] top-[40%] size-[250px] rounded-full bg-[#F9D923]/[0.06] blur-[80px] animate-float" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mx-auto mb-10 flex size-24 items-center justify-center rounded-3xl border border-paw/15 bg-paw/[0.04] backdrop-blur-sm animate-scale-in">
            <div className="absolute size-16 rounded-2xl bg-doggy/15 blur-2xl" />
            <PawPrint className="relative size-11 text-doggy" strokeWidth={1.5} />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/30 bg-[#F9D923]/[0.08] px-4 py-1.5 animate-fade-down delay-100">
            <Sparkles className="size-3 text-[#F9D923]" />
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-[#F9D923]">
              Our Story
            </span>
          </div>

          <h1 className="mb-7 text-balance font-elegant text-5xl font-black tracking-tight text-paw md:text-7xl animate-fade-up delay-200">
            About <em className="not-italic animate-shimmer">ProjectPaw</em>
          </h1>

          <div className="mx-auto mb-7 h-px max-w-xs bg-gradient-to-r from-transparent via-paw/30 to-transparent animate-fade-in delay-300" />

          <p className="text-balance font-pawprint text-lg leading-[1.7] text-paw/60 md:text-xl animate-fade-up delay-400">
            Built on a simple belief: every dog deserves the highest quality care.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="border-t border-paw/[0.06] px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="mb-4 flex items-center gap-3 font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
            <span className="h-px w-8 bg-doggy" />
            Our Journey
          </div>

          {[
            {
              lead: 'ProjectPaw was founded on a simple belief',
              text: ` — that every dog deserves the highest quality care. We built a premium platform that connects dog owners with trusted, professional services — all in one convenient place. From grooming appointments to overnight boarding, we make it effortless to give your furry family member the attention they deserve.`,
            },
            {
              lead: 'Our network is carefully vetted',
              text: ` to ensure your dog is always in safe hands. Whether you need a quick trim, expert training sessions, or a reliable daycare while you're at work, ProjectPaw's providers bring passion and expertise to every session. We believe the bond between dogs and their owners is sacred — and we're here to strengthen it.`,
            },
            {
              lead: 'We are always evolving',
              text: ` and improving the booking experience based on feedback from our community of dog lovers. Our mission is to be the most trusted name in dog care — not just a booking platform, but a partner in your dog's lifelong wellbeing.`,
            },
          ].map((p, i) => (
            <p key={i} className="font-pawprint text-lg leading-[1.9] text-paw/65">
              <strong className="font-elegant font-bold text-paw">{p.lead}</strong>
              {p.text}
            </p>
          ))}
        </div>
      </section>

      {/* MILESTONES */}
      <section className="border-t border-paw/[0.06] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
              Milestones
            </span>
            <h2 className="mt-3 font-elegant text-4xl font-black tracking-tight text-paw md:text-5xl">
              The Path So Far
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-paw/15 to-transparent md:block" />

            <div className="space-y-12">
              {MILESTONES.map(({ year, label, detail }, i) => (
                <div
                  key={year}
                  className={`flex flex-col items-center gap-3 md:flex-row md:gap-12 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className={`w-full md:w-5/12 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-center`}>
                    <div className="font-elegant text-5xl font-black tracking-tight text-doggy">
                      {year}
                    </div>
                    <p className="mt-1 font-elegant text-xl font-bold text-paw">{label}</p>
                    <p className="mt-2 font-pawprint text-sm text-paw/50">{detail}</p>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex md:size-3 md:shrink-0 md:items-center md:justify-center">
                    <div className="relative size-3 rounded-full bg-doggy shadow-lg shadow-doggy/40">
                      <div className="absolute inset-0 animate-ping rounded-full bg-doggy/40" />
                    </div>
                  </div>

                  <div className="hidden md:block md:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-t border-paw/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-[0.2em] text-doggy">
              What Drives Us
            </span>
            <h2 className="mt-3 font-elegant text-4xl font-black tracking-tight text-paw md:text-5xl">
              Our Values
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc, gradient, iconColor }) => (
              <div
                key={title}
                className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.025] p-8 transition-all duration-500 hover:border-paw/20 hover:bg-paw/[0.045] hover:-translate-y-1"
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />

                <div className="relative flex size-14 items-center justify-center rounded-2xl border border-paw/15 bg-paw/[0.05] backdrop-blur-sm transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className={`size-6 ${iconColor}`} strokeWidth={1.5} />
                </div>
                <div className="relative">
                  <h3 className="mb-2 font-elegant text-2xl font-bold text-paw">{title}</h3>
                  <p className="font-pawprint text-sm leading-[1.7] text-paw/55">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="px-6 pb-28">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-doggy/20 bg-gradient-to-br from-doggy/[0.12] via-paw/[0.02] to-[#F9D923]/[0.06] px-8 py-20 text-center md:px-16">
          <div className="pointer-events-none absolute left-1/2 top-0 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-doggy/[0.15] blur-[100px]" />
          <div className="pointer-events-none absolute right-1/4 bottom-0 size-[300px] translate-y-1/2 rounded-full bg-[#F9D923]/[0.08] blur-[80px]" />

          <div className="relative z-10">
            <div className="mb-8 inline-block font-elegant text-8xl leading-none text-doggy/25">
              &ldquo;
            </div>
            <p className="text-balance font-elegant text-3xl font-bold italic text-paw md:text-4xl">
              Because every wag deserves a reason.
            </p>
            <div className="mt-8 inline-flex items-center gap-3">
              <div className="h-px w-12 bg-paw/30" />
              <span className="font-pawprint text-xs font-semibold uppercase tracking-[0.2em] text-paw/50">
                The ProjectPaw Team
              </span>
              <div className="h-px w-12 bg-paw/30" />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 rounded-xl bg-doggy px-8 py-4 font-pawprint text-sm font-bold text-white shadow-xl shadow-doggy/30 transition-all duration-300 hover:shadow-doggy/50 hover:-translate-y-0.5"
          >
            Explore Our Services
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
