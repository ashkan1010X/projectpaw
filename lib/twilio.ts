import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export function toE164(raw: string): string | null {
  if (raw.startsWith('+')) return raw; // already E.164 from PhoneInput
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) return; // silently skip when not configured
  const e164 = toE164(to);
  if (!e164) return;
  await client.messages.create({ to: e164, from, body });
}
