'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Phone, Search, X } from 'lucide-react';

export type FaqItem = { q: string; a: string };

// Pulled from env so it swaps cleanly when projectpaw.ca lands —
// no source-code edit needed, just change Vercel env vars.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@projectpaw.ca';
const CONTACT_PHONE_E164 = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '';

// Display-format a North-American E.164 number: +16134000496 -> (613) 400-0496
function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

const CONTACT_PHONE_DISPLAY = CONTACT_PHONE_E164 ? formatPhoneDisplay(CONTACT_PHONE_E164) : '';

export const FAQS: FaqItem[] = [
  {
    q: 'What is ProjectPaw?',
    a: "ProjectPaw is a Toronto-based dog services platform run by Sara, an experienced pet care provider with 4+ years caring for dogs in the community. It's a place to book grooming, walking, boarding, drop-ins, custom services, and in-home pet sitting — all in one minute, all with one trusted person. No marketplace, no surprises, no random strangers — just Sara, your dog, and a friendly text confirmation.",
  },
  {
    q: 'Who will be taking care of my dog?',
    a: "Sara leads every booking personally, with a small trusted team that helps her deliver care across select services. She oversees every appointment, handles all scheduling herself, and is your main point of contact from first message to pickup. With 400+ happy dogs and 4+ years of experience, your dog will always know who's in charge. Available 7 days a week.",
  },
  {
    q: 'Can I book at short notice?',
    a: "Yes — as long as a slot is open. The booking calendar shows live availability for today, tomorrow, and weeks out, so you can grab the next free time. If you don't see what you need or you're in a pinch, just text or call Sara directly — she often has flexibility that isn't in the system.",
  },
  {
    q: 'What services do you offer and how much do they cost?',
    a: 'Six services in Toronto, prices in CAD: Grooming ($30, 90 min), Dog Walking ($20, 60 min), Boarding ($50/night), Drop-in ($35, 30–60 min), Custom Service ($60), and House Sitting ($100, 4–24 hours). Full details on the Services page.',
  },
  {
    q: 'Which pets do you take care of?',
    a: 'Every service welcomes dogs. Grooming also takes cats and rabbits. Boarding, Drop-ins, and Custom Service are open to dogs, cats, rabbits, birds, and other small pets. Dog Walking and House Sitting are dog-only. Each service card shows which pets are eligible.',
  },
  {
    q: 'How do I book an appointment?',
    a: "Pick a service, pick any open 30-minute slot (we book around the clock so early-morning drop-offs and late-night pickups are no problem), and choose how you want to pay. The whole thing takes about a minute. You'll get a text and email confirmation right away, plus a reminder text the day before.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Three options: credit or debit card online (handled by Stripe — the same processor Shopify and Lyft use), cash on arrival, or Interac e-Transfer. Card bookings are charged at checkout. Cash and e-Transfer bookings just need to be settled when you show up.',
  },
  {
    q: "What's your cancellation and refund policy?",
    a: "Cancel any booking free from your dashboard, or just reply X to your confirmation text — no questions asked, no late fees. If you paid by cash or e-Transfer, there's nothing to refund. If you paid by card: full refund if you cancel within an hour of booking or more than 24 hours before your appointment, 50% if it's less than 24 hours out, and no refund once the appointment start time has passed. Refunds land back on your card automatically within 5–10 business days. Life happens — if you need things sorted out faster, or your situation doesn't quite fit the policy, reach out to Sara directly. She's available 7 days a week and will work with you to find a fair solution.",
  },
  {
    q: 'Can I reschedule instead of cancelling?',
    a: "Yes, anytime, and it's always free — no late fees, no 24-hour cutoff. Open your dashboard, tap Reschedule on the booking, and pick a new slot. We'll send a fresh confirmation and reset the day-before reminder.",
  },
  {
    q: 'Do you send text reminders? Can I opt out?',
    a: 'Yes — one confirmation text the moment you book, and one reminder 24 hours before your appointment. To turn texts off entirely, reply STOP to any message. Text START to turn them back on.',
  },
  {
    q: 'Is my information secure?',
    a: "Yes. Your card details never touch our servers — Stripe handles every payment (same processor as Shopify and Lyft). Your account uses encrypted storage, and we block new passwords that have appeared in known data breaches so leaked credentials can't be reused. Photos are shown inside your account and to Sara; the storage bucket can't be listed or browsed by outsiders. Full details in our Privacy Policy.",
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

// LocalBusiness schema gives Google a proper "knowledge panel" entry
// with email/phone — same trick Yelp/Google Maps listings use.
const BUSINESS_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'ProjectPaw',
  description:
    'Dog grooming, walking, boarding, drop-ins, custom services, and in-home pet sitting in Toronto.',
  email: CONTACT_EMAIL,
  ...(CONTACT_PHONE_E164 ? { telephone: CONTACT_PHONE_E164 } : {}),
  areaServed: 'Toronto, Ontario, Canada',
  priceRange: '$20 – $100 CAD',
};

export function FaqSection() {
  // Multi-open accordion (industry standard — Stripe, Linear, GitHub all allow multi-open
  // so users can compare two answers side by side without re-clicking)
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [query, setQuery] = useState('');

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Normalised search term. We match against both the question and the answer
  // body so "refund" surfaces the cancellation answer even though the word only
  // lives in the answer text.
  const term = query.trim().toLowerCase();
  const matches = (item: FaqItem) =>
    !term || item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term);
  const visibleCount = term ? FAQS.filter(matches).length : FAQS.length;

  return (
    <section id="faq" className="relative px-6 py-24 md:py-32" aria-labelledby="faq-heading">
      {/* JSON-LD for Google rich snippets + knowledge panel */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_JSONLD) }}
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
          Everything you need to know before you book. Still have a question?{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-doggy underline decoration-doggy/40 underline-offset-4 transition-colors hover:decoration-doggy"
          >
            Email Sara
          </a>
          {CONTACT_PHONE_DISPLAY && (
            <>
              {' '}
              or call{' '}
              <a
                href={`tel:${CONTACT_PHONE_E164}`}
                className="whitespace-nowrap text-doggy underline decoration-doggy/40 underline-offset-4 transition-colors hover:decoration-doggy"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
            </>
          )}
          .
        </p>

        {/* Search — filters the accordion live. Premium FAQ pattern (Stripe/Notion):
           lets users jump straight to an answer without scanning every question. */}
        <div className="mt-12">
          <label htmlFor="faq-search" className="sr-only">
            Search frequently asked questions
          </label>
          <div className="group relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paw/40 transition-colors group-focus-within:text-doggy"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              autoComplete="off"
              className="w-full rounded-2xl border border-paw/[0.12] bg-paw/[0.03] py-4 pl-11 pr-11 font-pawprint text-sm text-paw placeholder:text-paw/40 outline-none transition-all duration-200 focus:border-doggy/40 focus:bg-paw/[0.05] focus:ring-2 focus:ring-doggy/15 md:text-base [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-paw/45 transition-colors hover:bg-paw/[0.06] hover:text-paw/80"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
          {/* Screen-reader-only result count — announces the filter working */}
          <p aria-live="polite" className="sr-only">
            {term
              ? `${visibleCount} ${visibleCount === 1 ? 'question' : 'questions'} match your search`
              : ''}
          </p>
        </div>

        {/* Accordion */}
        <div className="mt-6 divide-y divide-paw/[0.08] overflow-hidden rounded-2xl border border-paw/[0.08] bg-paw/[0.015] backdrop-blur-sm">
          {FAQS.map(({ q, a }, i) => {
            // Map over the FULL list and skip non-matches so `i` stays the
            // canonical index — open-state, panel ids and toggles never desync
            // as the query changes.
            if (!matches({ q, a })) return null;
            // When a query is active, auto-expand every match so the answer is
            // visible without an extra click; otherwise honour the manual set.
            const isOpen = term ? true : open.has(i);
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

          {/* Empty state — no question matched the search */}
          {term && visibleCount === 0 && (
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-paw/15 bg-paw/[0.04]">
                <Search className="size-5 text-paw/40" strokeWidth={2} />
              </div>
              <div>
                <p className="font-pawprint text-base font-semibold text-paw/80">
                  No questions match &ldquo;{query.trim()}&rdquo;
                </p>
                <p className="mt-1 font-pawprint text-sm text-paw/45">
                  Try a different word, or ask Sara directly — she usually replies same day.
                </p>
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-paw/15 bg-paw/[0.03] px-5 py-2.5 font-pawprint text-sm font-semibold text-paw/80 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.06] hover:text-paw"
              >
                <Mail
                  className="size-4 text-doggy/70 transition-colors group-hover:text-doggy"
                  strokeWidth={2}
                />
                Email Sara
              </a>
            </div>
          )}
        </div>

        {/* Bottom CTA — direct contact when FAQ didn't answer.
           Email + phone side-by-side so users can pick their channel. */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="font-pawprint text-sm text-paw/45">
            Didn&apos;t see your question? Reach out — Sara usually replies same day.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-paw/15 bg-paw/[0.03] px-6 py-3 font-pawprint text-sm font-semibold text-paw/80 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.06] hover:text-paw"
            >
              <Mail
                className="size-4 text-doggy/70 transition-colors group-hover:text-doggy"
                strokeWidth={2}
              />
              {CONTACT_EMAIL}
            </a>
            {CONTACT_PHONE_DISPLAY && (
              <a
                href={`tel:${CONTACT_PHONE_E164}`}
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-paw/15 bg-paw/[0.03] px-6 py-3 font-pawprint text-sm font-semibold text-paw/80 transition-all duration-300 hover:border-doggy/40 hover:bg-doggy/[0.06] hover:text-paw"
              >
                <Phone
                  className="size-4 text-doggy/70 transition-colors group-hover:text-doggy"
                  strokeWidth={2}
                />
                {CONTACT_PHONE_DISPLAY}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
