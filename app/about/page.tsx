import { PawPrint, Heart, Shield, Star } from 'lucide-react';

const VALUES = [
  {
    icon: Heart,
    title: 'Genuine Care',
    desc: 'Every team member is a dog lover first. We treat every animal like our own.',
  },
  {
    icon: Shield,
    title: 'Vetted Professionals',
    desc: 'All providers are certified, background-checked, and continuously rated.',
  },
  {
    icon: Star,
    title: 'Premium Experience',
    desc: 'From booking to aftercare, every touchpoint is designed to delight.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0d09]">

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[500px] rounded-full bg-doggy/8 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border border-paw/10 bg-paw/[0.05]">
            <PawPrint className="size-9 text-doggy" strokeWidth={1.5} />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F9D923]/25 bg-[#F9D923]/8 px-4 py-1.5">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-[#F9D923]">
              Our Story
            </span>
          </div>

          <h1 className="mb-6 font-elegant text-5xl font-black text-paw md:text-6xl">
            About <em className="not-italic text-doggy">ProjectPaw</em>
          </h1>

          <div className="mx-auto mb-6 h-px max-w-xs bg-gradient-to-r from-transparent via-paw/30 to-transparent" />

          <p className="font-pawprint text-lg leading-relaxed text-paw/60 md:text-xl">
            Built on a simple belief: every dog deserves the highest quality care.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="border-t border-paw/8 px-6 py-20">
        <div className="mx-auto max-w-3xl space-y-8">
          {[
            `ProjectPaw was founded on a simple belief: every dog deserves the highest quality care. We built a premium platform that connects dog owners with trusted, professional services — all in one convenient place. From grooming appointments to overnight boarding, we make it effortless to give your furry family member the attention they deserve.`,
            `Our network of certified professionals is carefully vetted to ensure your dog is always in safe hands. Whether you need a quick trim, expert training sessions, or a reliable daycare while you're at work, ProjectPaw's providers bring passion and expertise to every session. We believe the bond between dogs and their owners is sacred — and we're here to strengthen it.`,
            `We are constantly expanding our services and improving the booking experience based on feedback from our community of dog lovers. Our mission is to be the most trusted name in dog care — not just a booking platform, but a partner in your dog's lifelong wellbeing. Join thousands of happy paws and their owners who already call ProjectPaw their go-to for everything their dog needs.`,
          ].map((para, i) => (
            <p key={i} className="font-pawprint text-lg leading-[1.9] text-paw/65">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="border-t border-paw/8 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="font-pawprint text-xs font-bold uppercase tracking-widest text-doggy">
              What Drives Us
            </span>
            <h2 className="mt-3 font-elegant text-4xl font-black text-paw">
              Our Values
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-4 rounded-2xl border border-paw/8 bg-paw/[0.03] p-8"
              >
                <div className="flex size-12 items-center justify-center rounded-xl border border-doggy/20 bg-doggy/10">
                  <Icon className="size-5 text-doggy" strokeWidth={1.5} />
                </div>
                <h3 className="font-elegant text-xl font-bold text-paw">{title}</h3>
                <p className="font-pawprint text-sm leading-relaxed text-paw/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-doggy/15 bg-gradient-to-br from-doggy/10 to-paw/5 px-12 py-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 size-[300px] rounded-full bg-doggy/10 blur-[60px]" />
          <div className="relative z-10">
            <div className="mb-6 font-elegant text-6xl text-doggy/30">&ldquo;</div>
            <p className="font-elegant text-2xl font-bold italic text-paw md:text-3xl">
              Because every wag deserves a reason.
            </p>
            <div className="mt-6 font-pawprint text-sm text-paw/40">— The ProjectPaw Team</div>
          </div>
        </div>
      </section>
    </div>
  );
}
