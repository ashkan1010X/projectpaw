import { Banknote, Smartphone, CreditCard, type LucideIcon } from 'lucide-react';

export const PAYMENT_METHODS = ['cash', 'etransfer', 'stripe'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return typeof v === 'string' && (PAYMENT_METHODS as readonly string[]).includes(v);
}

export const PAYMENT_META: Record<PaymentMethod, {
  label: string;
  shortLabel: string;
  emoji: string;
  Icon: LucideIcon;
  hint: string;
  emailLine: string;
}> = {
  cash: {
    label: 'Cash',
    shortLabel: 'Cash',
    emoji: '💵',
    Icon: Banknote,
    hint: 'Pay in cash when service begins',
    emailLine: 'Cash — please have exact change ready if possible',
  },
  etransfer: {
    label: 'E-Transfer',
    shortLabel: 'E-Transfer',
    emoji: '📱',
    Icon: Smartphone,
    hint: 'Send Interac e-transfer at appointment',
    emailLine: 'E-Transfer — provider will share details at appointment',
  },
  stripe: {
    label: 'Pay Online Now',
    shortLabel: 'Online',
    emoji: '💳',
    Icon: CreditCard,
    hint: 'Secure card payment — charged immediately',
    emailLine: 'Online card payment — charged at time of booking',
  },
};
