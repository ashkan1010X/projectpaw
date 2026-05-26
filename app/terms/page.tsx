import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section, Subhead, Strong, type TocEntry } from '@/components/legal-page';

const TOC: TocEntry[] = [
  { id: 'eligibility', title: '1. Eligibility' },
  { id: 'account', title: '2. Your Account' },
  { id: 'services', title: '3. Services Provided' },
  { id: 'booking', title: '4. Booking & Payment' },
  { id: 'cancellation', title: '5. Cancellation & Refunds' },
  { id: 'reschedule', title: '6. Rescheduling' },
  { id: 'owner-responsibilities', title: '7. Owner Responsibilities' },
  { id: 'emergency', title: '8. Emergency Vet Care' },
  { id: 'refusal', title: '9. Right to Refuse Service' },
  { id: 'photos', title: '10. Photography & Updates' },
  { id: 'warranties', title: '11. Disclaimer of Warranties' },
  { id: 'liability', title: '12. Limitation of Liability' },
  { id: 'indemnify', title: '13. Indemnification' },
  { id: 'acceptable-use', title: '14. Acceptable Use' },
  { id: 'ip', title: '15. Intellectual Property' },
  { id: 'termination', title: '16. Termination' },
  { id: 'force-majeure', title: '17. Force Majeure' },
  { id: 'governing-law', title: '18. Governing Law' },
  { id: 'disputes', title: '19. Dispute Resolution' },
  { id: 'severability', title: '20. Severability' },
  { id: 'entire-agreement', title: '21. Entire Agreement' },
  { id: 'changes', title: '22. Changes to Terms' },
  { id: 'contact', title: '23. Contact' },
];

export const metadata: Metadata = {
  title: 'Terms of Service — ProjectPaw',
  description:
    'The terms that govern your use of ProjectPaw — booking, payment, cancellation, liability, and pet-owner responsibilities.',
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@projectpaw.ca';
const CONTACT_PHONE_E164 = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '';
function fmtPhone(e164: string): string {
  const d = e164.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return e164;
}
const CONTACT_PHONE = CONTACT_PHONE_E164 ? fmtPhone(CONTACT_PHONE_E164) : '';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="22 May 2026"
      toc={TOC}
      intro={
        'These Terms of Service ("Terms") govern your access to and use of ProjectPaw, operated by Sara Parchami ("we," "us," or "Sara") from Toronto, Ontario, Canada. By creating an account or booking a service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.'
      }
    >
      <Section id="eligibility" title="1. Eligibility">
        <p>
          You must be at least 18 years old and have the legal capacity to enter into a binding
          contract to use ProjectPaw. By using the Service, you represent and warrant that you meet
          these requirements.
        </p>
      </Section>

      <Section id="account" title="2. Your Account">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You
          agree:
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>To provide accurate, current information when you sign up</li>
          <li>To keep your password secure and not share it with anyone</li>
          <li>To notify us immediately if you suspect unauthorized account access</li>
          <li>That you are responsible for all activity that occurs under your account</li>
        </ul>
        <p>We may suspend or terminate your account if you violate these Terms.</p>
      </Section>

      <Section id="services" title="3. Services Provided">
        <p>
          ProjectPaw offers six dog care services in the Toronto area, all delivered personally by
          Sara:
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>Grooming — $30, 90 minutes</li>
          <li>Dog Walking — $20, 60 minutes</li>
          <li>Boarding — $50 per night</li>
          <li>Drop-in — $35, 30 to 60 minutes</li>
          <li>Custom Service — $60, duration varies</li>
          <li>In-Home Pet Sitting — $100, 4 to 24 hours</li>
        </ul>
        <p>
          Service availability is shown in real time on the booking page. Prices are in Canadian
          dollars (CAD) and may change from time to time; the price shown at checkout is final for
          that booking.
        </p>
      </Section>

      <Section id="booking" title="4. Booking and Payment">
        <Subhead>Booking</Subhead>
        <p>
          You may book any open 30-minute time slot, around the clock, in Toronto local time. A
          booking is confirmed once you receive both an email and an SMS confirmation.
        </p>
        <p>
          Some services (notably overnight boarding and in-home pet sitting) extend beyond the start
          slot; the booking time you select is the agreed start time, and the service duration
          follows the schedule for that service.
        </p>

        <Subhead>Payment options</Subhead>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Credit or debit card</Strong> — charged at checkout via Stripe
          </li>
          <li>
            <Strong>Cash</Strong> — paid in person on arrival
          </li>
          <li>
            <Strong>Interac e-Transfer</Strong> — paid before or at the time of service
          </li>
        </ul>
        <p>
          You agree to settle cash and e-Transfer bookings on or before the scheduled service time.
        </p>
      </Section>

      <Section id="cancellation" title="5. Cancellation and Refunds">
        <p>
          You may cancel any booking from your dashboard or by replying X to your confirmation SMS.
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Cash / e-Transfer bookings</Strong> — no charge, no refund needed.
          </li>
          <li>
            <Strong>Card bookings cancelled within 1 hour of booking</Strong> — full refund (100%),
            regardless of how close the appointment is.
          </li>
          <li>
            <Strong>Card bookings cancelled more than 24 hours before service</Strong> — full refund
            (100%).
          </li>
          <li>
            <Strong>Card bookings cancelled within 24 hours of service</Strong> — partial refund
            (50%).
          </li>
          <li>
            <Strong>No-shows or cancellations after the service start time</Strong> — no refund.
          </li>
        </ul>
        <p>
          Card refunds are processed automatically through Stripe and typically arrive within 5 to
          10 business days.
        </p>
        <p>
          <Strong>Exceptional circumstances:</Strong> If a genuine emergency (medical emergency,
          severe weather, family emergency) prevents you from cancelling on time, contact Sara
          directly. We will work with you in good faith but reserve the right to make the final
          determination.
        </p>
      </Section>

      <Section id="reschedule" title="6. Rescheduling">
        <p>
          Rescheduling is always free and has no cutoff. Open your dashboard, tap Reschedule on the
          booking, and pick any open slot.
        </p>
      </Section>

      <Section id="owner-responsibilities" title="7. Your Responsibilities as a Pet Owner">
        <p>By booking a service, you represent and confirm that:</p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Your pet is healthy</Strong> — free from contagious illness, active parasites,
            or medical emergencies. If your pet has a condition we should know about, you must
            disclose it at booking.
          </li>
          <li>
            <Strong>Vaccinations are current</Strong> — including rabies and other vaccinations
            appropriate to the service. We may request proof.
          </li>
          <li>
            <Strong>Your pet is not known to be aggressive</Strong> — has no history of biting,
            attacking, or causing injury to people or other animals. Any behavioural issues must be
            disclosed at booking.
          </li>
          <li>
            <Strong>You have legal authority</Strong> — to authorize care for the pet (you are the
            owner or have the owner&apos;s written permission).
          </li>
          <li>
            <Strong>Your information is accurate</Strong> — your contact details, your pet&apos;s
            name, age, medical conditions, and other booking information are truthful and current.
          </li>
          <li>
            <Strong>Allergies and special needs are disclosed</Strong> — including food allergies,
            medication schedules, and any specific care instructions.
          </li>
        </ul>
        <p>
          You agree to provide adequate food, medication, and supplies for boarding, drop-in, and
          house-sitting services unless otherwise arranged in advance.
        </p>
      </Section>

      <Section id="emergency" title="8. Emergency Veterinary Care">
        <p>If your pet requires emergency veterinary care while in our care:</p>
        <ol className="space-y-2 pl-5 [list-style:decimal] marker:text-doggy/60">
          <li>We will attempt to contact you immediately at the phone number on file.</li>
          <li>
            If you cannot be reached and the situation is urgent, we will take your pet to the
            nearest available veterinarian.
          </li>
          <li>
            <Strong>You are responsible for all veterinary costs</Strong>, regardless of cause,
            except where directly caused by our gross negligence.
          </li>
          <li>
            You authorize us to make reasonable emergency-care decisions on your behalf if you
            cannot be reached in time.
          </li>
        </ol>
      </Section>

      <Section id="refusal" title="9. Right to Refuse or End Service">
        <p>
          We reserve the right to refuse or end a service at our sole discretion if, in our
          reasonable judgment:
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>A pet is aggressive or poses a safety risk to Sara, other pets, or people</li>
          <li>A pet has an undisclosed illness that endangers other animals</li>
          <li>Information provided about the pet was inaccurate or incomplete</li>
          <li>The pet&apos;s environment (for in-home services) is unsafe</li>
          <li>Payment cannot be completed</li>
          <li>A customer is abusive, threatening, or harassing toward Sara</li>
        </ul>
        <p>
          If we end a service early for any of the above reasons, no refund is due. If we refuse a
          service before it begins, you will receive a full refund.
        </p>
      </Section>

      <Section id="photos" title="10. Photography and Updates">
        <p>
          During services, we may take photos or short videos of your pet for our records and to
          send you updates. We will not publish identifiable images of your pet on social media or
          marketing materials without your explicit written consent. If you&apos;d like Sara to be
          able to share your pet&apos;s photos on ProjectPaw&apos;s social channels, you can opt in
          by telling her directly.
        </p>
      </Section>

      <Section id="warranties" title="11. Disclaimer of Warranties">
        <p className="text-paw/55">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE FULLEST
          EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED,
          INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          We do our best to ensure the Service operates reliably, but we do not warrant
          uninterrupted access, error-free operation, or that the Service will meet your specific
          requirements.
        </p>
      </Section>

      <Section id="liability" title="12. Limitation of Liability">
        <p className="text-paw/55">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL PROJECTPAW OR SARA
          PARCHAMI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR
          USE OF THE SERVICE.
        </p>
        <p>
          Our total liability for any direct damages arising from a single booking shall not exceed
          the amount you paid for that booking.
        </p>
        <p>
          Nothing in this section limits liability for damages that cannot be limited by law,
          including liability for gross negligence or intentional misconduct.
        </p>
      </Section>

      <Section id="indemnify" title="13. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless ProjectPaw and Sara Parchami from any
          claims, damages, losses, liabilities, costs, and expenses (including reasonable legal
          fees) arising out of or related to:
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>Your breach of these Terms</li>
          <li>Inaccurate or incomplete information you provided about your pet</li>
          <li>
            Acts or omissions of your pet, including damage to property and injury to people or
            other animals
          </li>
          <li>Your violation of any law or any third party&apos;s rights</li>
        </ul>
      </Section>

      <Section id="acceptable-use" title="14. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>Use the Service for any unlawful purpose</li>
          <li>Harass, threaten, or abuse Sara or other users</li>
          <li>Attempt to gain unauthorized access to other accounts or systems</li>
          <li>Reverse-engineer, scrape, or interfere with the Service</li>
          <li>Make bookings you do not intend to honour</li>
        </ul>
      </Section>

      <Section id="ip" title="15. Intellectual Property">
        <p>
          All content on ProjectPaw — including the name, logo, text, graphics, and software — is
          the property of Sara Parchami or licensed to her. You may not copy, modify, distribute, or
          create derivative works without written permission.
        </p>
        <p>
          Photos of your pet that you upload remain your property. By uploading, you grant us a
          limited, revocable licence to display them within your account and to use them as
          described in Section 10.
        </p>
      </Section>

      <Section id="termination" title="16. Termination">
        <p>
          You may delete your account at any time from your profile page. We may terminate your
          access if you violate these Terms, fail to make payment, or for any other lawful reason.
          Termination does not relieve you of any payment obligations incurred before termination.
        </p>
      </Section>

      <Section id="force-majeure" title="17. Service Interruptions and Force Majeure">
        <p>
          Occasionally Sara may need to cancel or reschedule a confirmed booking due to
          circumstances outside her reasonable control, including but not limited to:
        </p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>Severe weather (snowstorms, ice storms, extreme heat warnings)</li>
          <li>Illness or family emergency affecting Sara</li>
          <li>Power outages, internet outages, or building access issues</li>
          <li>Government-mandated public health restrictions or municipal orders</li>
          <li>Acts of God, war, riot, strike, or other events beyond reasonable control</li>
        </ul>
        <p>
          If we need to cancel for any of these reasons, we will notify you as soon as possible and
          offer either a full refund (regardless of how close to the appointment) or a complimentary
          reschedule of your choosing.{' '}
          <Strong>
            Neither party shall be liable for damages caused by force-majeure events beyond their
            reasonable control.
          </Strong>{' '}
          Our obligation in such cases is limited to the refund or reschedule described above.
        </p>
      </Section>

      <Section id="governing-law" title="18. Governing Law">
        <p>
          These Terms are governed by the laws of the Province of Ontario and the federal laws of
          Canada applicable therein, without regard to conflict-of-law principles.
        </p>
      </Section>

      <Section id="disputes" title="19. Dispute Resolution">
        <p>
          We prefer to resolve disputes informally.{' '}
          <Strong>
            Before filing any legal claim, you agree to first contact us at {CONTACT_EMAIL} and
            attempt to resolve the issue in good faith for at least 30 days.
          </Strong>{' '}
          If we cannot resolve a dispute informally, any legal proceeding shall be brought
          exclusively in the courts of Ontario, Canada.
        </p>
      </Section>

      <Section id="severability" title="20. Severability">
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions will
          continue in full effect.
        </p>
      </Section>

      <Section id="entire-agreement" title="21. Entire Agreement">
        <p>
          These Terms, together with our{' '}
          <Link
            href="/privacy"
            className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
          >
            Privacy Policy
          </Link>
          , constitute the entire agreement between you and ProjectPaw regarding your use of the
          Service.
        </p>
      </Section>

      <Section id="changes" title="22. Changes to These Terms">
        <p>
          We may update these Terms from time to time. We will notify you of material changes by
          email at least 30 days before they take effect. Your continued use of the Service after
          changes take effect constitutes acceptance of the updated Terms.
        </p>
      </Section>

      <Section id="contact" title="23. Contact">
        <p>Questions about these Terms? Reach Sara directly:</p>
        <div className="rounded-2xl border border-paw/[0.1] bg-paw/[0.02] p-5">
          <p className="font-semibold text-paw/90">Sara Parchami — Owner, ProjectPaw</p>
          <p className="mt-1">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          {CONTACT_PHONE && (
            <p className="mt-1">
              <a
                href={`tel:${CONTACT_PHONE_E164}`}
                className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
              >
                {CONTACT_PHONE}
              </a>
            </p>
          )}
          <p className="mt-1 text-paw/55">Toronto, Ontario, Canada</p>
        </div>
      </Section>
    </LegalPage>
  );
}
