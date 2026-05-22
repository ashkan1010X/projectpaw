import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section, Subhead, Strong } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy — ProjectPaw',
  description:
    'How ProjectPaw collects, uses, and protects your personal information. PIPEDA + GDPR compliant.',
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

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="22 May 2026"
      intro={
        'This Privacy Policy explains how ProjectPaw, operated by Sara Parchami in Toronto, Ontario, collects, uses, and protects your personal information. It is written in plain language and complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) of Canada, and incorporates principles from the General Data Protection Regulation (GDPR) for visitors from the European Union.'
      }
    >
      <Section id="information" title="1. Information We Collect">
        <Subhead>Information you give us directly</Subhead>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Account information</Strong> — your name, email address, and password.
            Passwords are stored only as one-way cryptographic hashes managed by Supabase Auth; we
            never see, log, or store them in plain text.
          </li>
          <li>
            <Strong>Profile information</Strong> — phone number (for SMS), optional home address,
            and information about your pet: name, species, age, breed, photo, and notes.
          </li>
          <li>
            <Strong>Booking information</Strong> — service selected, date and time, and any
            special instructions you include with a booking.
          </li>
          <li>
            <Strong>Payment information</Strong> — credit and debit card details are handled
            entirely by Stripe. We never see, store, or process your card number. The only thing we
            keep on our side is an internal payment intent ID that links the booking to the Stripe
            transaction record. Stripe retains the rest under their own security controls.
          </li>
          <li>
            <Strong>Communications</Strong> — emails, SMS messages, and other messages you send us
            (so we can respond and keep a record).
          </li>
        </ul>

        <Subhead>Information we collect automatically</Subhead>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Technical data</Strong> — your IP address, browser type, and operating system,
            used only for security, rate-limiting, and fraud prevention.
          </li>
          <li>
            <Strong>Browser local storage</Strong> — authentication tokens so you stay signed in.
            We do not use third-party cookies, advertising trackers, or analytics pixels.
          </li>
          <li>
            <Strong>Booking activity</Strong> — your booking history, cancellation events, and
            reschedule activity (so you can see them in your dashboard and so we can serve you).
          </li>
        </ul>

        <Subhead>What we do NOT collect</Subhead>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>We do not use Google Analytics, Meta Pixel, or any cross-site tracking.</li>
          <li>We do not sell, rent, or trade your data — ever.</li>
          <li>We do not collect biometric data or device fingerprints.</li>
        </ul>
      </Section>

      <Section id="how-we-use" title="2. How We Use Your Information">
        <p>We use your personal information only to:</p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>Provide the booking service you request</li>
          <li>Send booking confirmations, reminders, and cancellation notices via SMS and email</li>
          <li>Process payments and issue refunds</li>
          <li>Detect and prevent abuse (rate-limited login, signup, cancel, and reschedule)</li>
          <li>Comply with our legal obligations (tax records, lawful requests)</li>
          <li>Improve the Service based on aggregated, de-identified usage patterns</li>
        </ul>
        <p>We will never use your data for marketing without your explicit, opt-in consent.</p>
      </Section>

      <Section id="sharing" title="3. Service Providers We Share Data With">
        <p>
          We use a small set of carefully selected service providers. Each one only receives the
          data it needs to perform a specific function, and each is bound by a data-processing
          agreement.
        </p>
        <div className="overflow-x-auto rounded-xl border border-paw/[0.08]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-paw/[0.03] font-pawprint text-[11px] font-semibold uppercase tracking-[0.1em] text-paw/55">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">What they receive</th>
                <th className="px-4 py-3">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paw/[0.06]">
              <tr>
                <td className="px-4 py-3 font-semibold text-paw/85">Supabase</td>
                <td className="px-4 py-3 text-paw/65">Account, profile, booking data</td>
                <td className="px-4 py-3 text-paw/65">Database, authentication, photo storage</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-paw/85">Stripe</td>
                <td className="px-4 py-3 text-paw/65">Payment info, email, booking total</td>
                <td className="px-4 py-3 text-paw/65">Card payment processing (PCI-DSS Level 1)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-paw/85">Twilio</td>
                <td className="px-4 py-3 text-paw/65">Phone number + message content</td>
                <td className="px-4 py-3 text-paw/65">SMS confirmations and reminders</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-paw/85">Vercel</td>
                <td className="px-4 py-3 text-paw/65">IP, web traffic logs</td>
                <td className="px-4 py-3 text-paw/65">Website hosting and edge delivery</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-paw/85">Nodemailer / Gmail SMTP</td>
                <td className="px-4 py-3 text-paw/65">Email address, name, booking summary</td>
                <td className="px-4 py-3 text-paw/65">Transactional email delivery</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not share your information with any other third parties for any purpose unless
          required by law or a valid court order.
        </p>
      </Section>

      <Section id="transfers" title="4. International Data Transfers">
        <p>
          Some of our service providers store data outside Canada, primarily in the United States.
          When this happens, we ensure equivalent protection through Standard Contractual Clauses
          and provider-level safeguards (Stripe, Supabase, and Twilio all maintain SOC 2 Type II
          certifications). By using ProjectPaw, you consent to this transfer.
        </p>
      </Section>

      <Section id="retention" title="5. How Long We Keep Your Data">
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Account and profile data</Strong> — for as long as your account is active.
          </li>
          <li>
            <Strong>Booking and payment records</Strong> — 7 years, as required by the Canada
            Revenue Agency for tax purposes.
          </li>
          <li>
            <Strong>Communication logs</Strong> — 1 year.
          </li>
          <li>
            <Strong>Inactive accounts</Strong> — you may close your account at any time. We do
            not currently auto-delete inactive accounts; if you would like your account removed
            without logging in, email Sara and we&apos;ll process it within 30 days.
          </li>
        </ul>
        <p>You may request immediate deletion of your account at any time (see Section 7).</p>
      </Section>

      <Section id="security" title="6. How We Protect Your Data">
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>All connections are encrypted with HTTPS / TLS 1.3.</li>
          <li>
            Passwords are stored only as one-way bcrypt hashes. We block new passwords that appear
            in known data breaches via the Have I Been Pwned API.
          </li>
          <li>
            Card payments are handled by Stripe, a PCI-DSS Level 1 provider — your card number
            never touches our servers.
          </li>
          <li>
            Database access is restricted by Supabase row-level security policies. Each user can
            only read their own data.
          </li>
          <li>
            Login, signup, cancellation, and reschedule routes are rate-limited to prevent abuse.
          </li>
          <li>
            Pet and profile photos are stored on Supabase Storage and served through a public CDN
            for fast loading. The bucket does not allow listing or enumeration, so the only way to
            access a photo is to have its specific URL. Don&apos;t treat photos as private/secret;
            we recommend uploading only images you&apos;re comfortable being shareable.
          </li>
        </ul>
        <p>
          In the unlikely event of a data breach affecting your account, we will notify you within
          72 hours, as required by PIPEDA breach-notification rules.
        </p>
      </Section>

      <Section id="rights" title="7. Your Rights">
        <p>Under PIPEDA (and GDPR for EU residents), you have the right to:</p>
        <ul className="space-y-2 pl-5 [list-style:disc] marker:text-doggy/60">
          <li>
            <Strong>Access</Strong> — request a copy of all personal information we hold about you
          </li>
          <li>
            <Strong>Correct</Strong> — fix any inaccuracies (most fields are editable directly from
            your profile page)
          </li>
          <li>
            <Strong>Delete</Strong> — request permanent deletion of your account and all associated
            data
          </li>
          <li>
            <Strong>Withdraw consent</Strong> — opt out of SMS (reply STOP) or close your account
            at any time
          </li>
          <li>
            <Strong>Restrict processing</Strong> — limit how we handle your data while we resolve a
            dispute
          </li>
          <li>
            <Strong>Port your data</Strong> — receive a machine-readable export of your account
          </li>
          <li>
            <Strong>Complain</Strong> — file a complaint with the Office of the Privacy
            Commissioner of Canada (priv.gc.ca) or your local data protection authority
          </li>
        </ul>
        <p>
          To exercise any of these rights, email Sara at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
          >
            {CONTACT_EMAIL}
          </a>
          . We respond within 30 days, as required by law.
        </p>
      </Section>

      <Section id="sms" title="8. SMS Communications">
        <p>
          By providing your phone number, you consent to receive transactional SMS from ProjectPaw,
          including booking confirmations, 24-hour reminders, and cancellation notices.{' '}
          <Strong>You can opt out at any time by replying STOP to any message.</Strong> Reply START
          to resume. Standard message and data rates may apply from your mobile carrier. ProjectPaw
          does not send marketing SMS.
        </p>
      </Section>

      <Section id="cookies" title="9. Cookies and Local Storage">
        <p>
          We use browser local storage (not third-party cookies) only to keep you signed in and
          remember your session. We do not use cookies for tracking, advertising, or analytics.
        </p>
      </Section>

      <Section id="children" title="10. Children's Privacy">
        <p>
          ProjectPaw is intended for users 18 years of age or older. We do not knowingly collect
          personal information from anyone under 18. If you believe a minor has provided us
          information, contact us and we will delete it immediately.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to This Policy">
        <p>
          If we update this policy in a way that materially affects your rights, we will notify
          you by email at least 30 days before the changes take effect. The &quot;Last updated&quot;
          date at the top reflects the most recent version.
        </p>
      </Section>

      <Section id="contact" title="12. Contact">
        <p>Questions or concerns about your privacy? Reach Sara directly:</p>
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
        <p>
          You may also contact the Office of the Privacy Commissioner of Canada at{' '}
          <a
            href="https://www.priv.gc.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
          >
            priv.gc.ca
          </a>{' '}
          or by phone at 1-800-282-1376.
        </p>
        <p className="pt-2 text-paw/45">
          See also our{' '}
          <Link
            href="/terms"
            className="text-doggy underline decoration-doggy/40 underline-offset-4 hover:decoration-doggy"
          >
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
