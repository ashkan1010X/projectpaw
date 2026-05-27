import { Scissors, Footprints, Home, Sun, Sparkles, type LucideIcon } from 'lucide-react';

import type { PetSpecies } from './species';

export type ServiceRow = {
  id: string;
  name: string;
  type: string;
  price: number;
  icon_key: string;
  gradient: string;
  description: string;
  duration: string;
  popular: boolean;
  sort_order: number;
  allowed_pet_types: PetSpecies[];
};

const SERVICE_ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  footprints: Footprints,
  home: Home,
  sun: Sun,
  sparkles: Sparkles,
};

export function getServiceIcon(iconKey: string): LucideIcon {
  return SERVICE_ICONS[iconKey] ?? Sparkles;
}

// Fallback used when Supabase is unreachable. Mirrors the live `services`
// table — keep in sync when admin edits services so users never see a
// stale catalogue. Last synced 2026-05-22.
export const FALLBACK_SERVICES: ServiceRow[] = [
  {
    id: '1',
    name: 'Grooming',
    type: 'grooming',
    price: 30,
    icon_key: 'scissors',
    gradient: 'from-pink-500 to-rose-500',
    description: 'Full grooming session including bath, trim, and styling by certified groomers.',
    duration: '90 min',
    popular: true,
    sort_order: 1,
    allowed_pet_types: ['dog', 'cat', 'rabbit'],
  },
  {
    id: '2',
    name: 'Dog Walking',
    type: 'walking',
    price: 20,
    icon_key: 'footprints',
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Daily walks to keep your pup healthy and happy with experienced handlers.',
    duration: '60 min',
    popular: false,
    sort_order: 2,
    allowed_pet_types: ['dog'],
  },
  {
    id: '3',
    name: 'Boarding',
    type: 'boarding',
    price: 50,
    icon_key: 'home',
    gradient: 'from-blue-500 to-indigo-500',
    description: 'Safe overnight stays in a comfortable home environment with 24/7 care.',
    duration: 'Per night',
    popular: false,
    sort_order: 3,
    allowed_pet_types: ['dog', 'cat', 'rabbit', 'bird', 'other'],
  },
  {
    id: '4',
    name: 'Drop-in',
    type: 'daycare',
    price: 35,
    icon_key: 'sun',
    gradient: 'from-violet-500 to-purple-500',
    description: 'Short supervised visit — playtime, snacks, potty break, and lots of love.',
    duration: '30-60 minutes',
    popular: false,
    sort_order: 6,
    allowed_pet_types: ['dog', 'cat', 'rabbit', 'bird', 'other'],
  },
  {
    id: '5',
    name: 'Custom Service',
    type: 'custom',
    price: 60,
    icon_key: 'sparkles',
    gradient: 'from-cyan-500 to-sky-500',
    description: "Tailored services designed to meet your dog's unique and specific needs.",
    duration: 'Varies',
    popular: false,
    sort_order: 7,
    allowed_pet_types: ['dog', 'cat', 'rabbit', 'bird', 'other'],
  },
  {
    id: '6',
    name: 'House Sitting',
    type: 'house-sitting',
    price: 100,
    icon_key: 'home',
    gradient: 'from-pink-500 to-rose-500',
    description: 'Pet care in the comfort of your own home.',
    duration: '4-24 hours',
    popular: false,
    sort_order: 8,
    allowed_pet_types: ['dog'],
  },
];
