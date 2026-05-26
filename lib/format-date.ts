// Server-side date formatting for emails + SMS.
//
// Why this exists: Node on Vercel runs in UTC, so `new Date(x).toLocaleString()`
// without an explicit timeZone formats in UTC — which is wrong for customer-
// facing notifications. The dashboard (client-side) automatically uses the
// browser's local time, but server output needs to opt in.
//
// All bookings are physically delivered in Toronto, so we format in Toronto
// time consistently for every customer/provider notification.

export const BUSINESS_TIMEZONE = 'America/Toronto';

/**
 * Full long-form date for emails: "Thursday, May 22, 2026, 11:00 AM"
 */
export function formatBookingDateLong(datetime: string | Date): string {
  const d = typeof datetime === 'string' ? new Date(datetime) : datetime;
  if (isNaN(d.getTime())) return String(datetime);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  });
}

/**
 * True only when `datetime` parses to a valid instant strictly in the future.
 *
 * Every server-side booking write must gate on this. The DateTimePicker already
 * restricts users to future slots, but the API must never trust the client — a
 * crafted request (or a payment that completes long after the picker selection)
 * could otherwise book a past slot.
 *
 * Also rejects unparseable input on purpose: `new Date('garbage').getTime()` is
 * NaN, and every NaN comparison is `false`, so a naive `new Date(x) <= new Date()`
 * guard would silently let malformed datetimes through.
 */
export function isValidFutureDatetime(datetime: string | null | undefined): boolean {
  if (!datetime) return false;
  const ms = new Date(datetime).getTime();
  return Number.isFinite(ms) && ms > Date.now();
}

/**
 * Compact form for SMS: "Thu, May 22, 11:00 AM"
 */
export function formatBookingDateShort(datetime: string | Date): string {
  const d = typeof datetime === 'string' ? new Date(datetime) : datetime;
  if (isNaN(d.getTime())) return String(datetime);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  });
}
