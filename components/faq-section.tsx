'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export type FaqItem = { q: string; a: string };

export const FAQS: FaqItem[] = [
  {
    q: 'What services do you offer and how much do they cost?',
    a: 'We offer 7 premium services in Toronto: Grooming ($30, 90 min), Dog Walking ($20, 60 min), Boarding ($50/night), Training ($45, 60 min), Vet Visit ($80, 45 min), Daycare ($35, full day), and Custom Service ($60). All prices are in CAD. Browse the full catalogue on our Services page.',
  },
  {
    q: 'Which pets do you take care of?',
    a: "Every service welcomes dogs. Grooming and Training also accept cats and rabbits. Boarding, Vet Visits, Daycare and Custom Service are open to dogs, cats, rabbits, birds, and other small pets. You'll see exactly which pets are eligible right inside each service card.",
  },
  {
    q: 'How does the booking flow work?',
    a: "It takes under a minute. Pick a service, choose a date and time between 8:00 AM and 7:30 PM, then check out with card, cash, or e-transfer. You'll get an instant email and SMS confirmation, plus a friendly reminder 24 hours before your appointment.",
  },
  {
    q: 'What payment methods do you accept?',
    a: "Three options: secure credit/debit card payment online via Stripe (you're charged immediately), cash on arrival, or Interac e-Transfer. Cash and e-transfer bookings are confirmed instantly — you settle up when you show up.",
  },
  {
    q: "What's your cancellation and refund policy?",
    a: 'Cancel any booking free of charge from your dashboard or by replying X to your confirmation SMS. If you paid by cash or e-transfer, there is nothing to refund. If you paid online by card, refunds are: 100% if cancelled more than 24 hours before your appointment, 50% if cancelled within 24 hours. Refunds are processed automatically and reach your card in 5–10 business days.',
  },
  {
    q: 'Can I reschedule instead of cancelling?',
    a: 'Yes — rescheduling is always free, no matter the notice. Open your dashboard, tap Reschedule on the booking, and pick any open slot. We re-send your confirmation and reset the 24-hour reminder.',
  },
  {
    q: 'Will I get reminders, and can I opt out of texts?',
    a: 'Yes. We send one instant confirmation SMS when you book and one reminder SMS 24 hours before your appointment. To stop all texts at any time, reply STOP to any message — you can still reply START to resume.',
  },
  {
    q: 'Is my information secure?',
    a: 'Yes. Payments are processed by Stripe (PCI-DSS Level 1, the highest payment security standard) — we never see or store your card number. Your account is protected with industry-standard encryption, breached-password detection, and rate-limited login. Photos and personal details stay private to you and our team.',
  },
];

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export function FaqSection() {
  // Multi-open accordion (industry standard — Stripe, Linear, GitHub all allow multi-open
  // so users can compare two answers side by side without re-clicking)
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <section id="faq" className="relative px-6 py-24 md:py-32" aria-labelledby="faq-heading">
      {/* JSON-LD for Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 size-[500px] rounded-full bg-doggy/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Eyebrow */}
        <div className="mb-5 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-doggy/25 bg-doggy/[0.08] px-3 py-1">
            <HelpCircle className="size-3 text-doggy" strokeWidth={2.5} />
            <span className="font-pawprint text-[10px] font-bold uppercase tracking-[0.18em] text-doggy">
              Got Questions?
            </span>
          </div>
        </div>

        {/* Heading */}
        <h2
          id="faq-heading"
          className="text-balance text-center font-elegant text-4xl font-black tracking-tight text-paw md:text-5xl lg:text-6xl"
        >
          Frequently asked <em className="not-italic text-doggy">questions</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center font-pawprint text-sm text-paw/55 md:text-base">
          Everything you need to know before you book. Still stuck?{' '}
          <a
            href="mailto:hello@projectpaw.ca"
            className="text-doggy underline decoration-doggy/40 underline-offset-4 transition-colors hover:decoration-doggy"
          >
            Email us
          </a>
          .
        </p>

        {/* Accordion */}
        <div className="mt-12 divide-y divide-paw/[0.08] overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.015] backdrop-blur-sm">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open.has(i);
            return (
              <div key={q} className="group">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-trigger-${i}`}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-200 hover:bg-paw/[0.02] focus:outline-none focus-visible:bg-paw/[0.03] md:px-8 md:py-6"
                >
                  <span
                    className={`font-pawprint text-base font-semibold transition-colors duration-200 md:text-lg ${
                      isOpen ? 'text-paw' : 'text-paw/80 group-hover:text-paw'
                    }`}
                  >
                    {q}
                  </span>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? 'border-doggy/40 bg-doggy/15 text-doggy'
                        : 'border-paw/15 bg-paw/[0.04] text-paw/50 group-hover:border-paw/30 group-hover:text-paw/80'
                    }`}
                  >
                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2.5}
                    />
                  </span>
                </button>

                {/* Answer panel — grid-rows trick gives smooth height animation
                   without measuring the DOM */}
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 font-pawprint text-sm leading-[1.75] text-paw/65 md:px-8 md:pb-7 md:text-[15px]">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="font-pawprint text-sm text-paw/45">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 rounded-xl border border-paw/15 bg-paw/[0.03] px-6 py-3 font-pawprint text-sm font-semibold text-paw/80 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.06] hover:text-paw"
          >
            Browse all services
            <span className="text-doggy transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
