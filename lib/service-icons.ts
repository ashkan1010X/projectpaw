import {
  Scissors,
  Footprints,
  Home,
  GraduationCap,
  Stethoscope,
  Sun,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

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
};

const SERVICE_ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  footprints: Footprints,
  home: Home,
  'graduation-cap': GraduationCap,
  stethoscope: Stethoscope,
  sun: Sun,
  sparkles: Sparkles,
};

export function getServiceIcon(iconKey: string): LucideIcon {
  return SERVICE_ICONS[iconKey] ?? Sparkles;
}

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
  },
  {
    id: '4',
    name: 'Training',
    type: 'training',
    price: 45,
    icon_key: 'graduation-cap',
    gradient: 'from-amber-500 to-yellow-500',
    description: 'Professional obedience and behavior training with certified trainers.',
    duration: '60 min',
    popular: false,
    sort_order: 4,
  },
  {
    id: '5',
    name: 'Vet Visit',
    type: 'vet',
    price: 80,
    icon_key: 'stethoscope',
    gradient: 'from-red-500 to-orange-500',
    description: 'Routine checkups and health assessments with licensed veterinarians.',
    duration: '45 min',
    popular: false,
    sort_order: 5,
  },
  {
    id: '6',
    name: 'Daycare',
    type: 'daycare',
    price: 35,
    icon_key: 'sun',
    gradient: 'from-violet-500 to-purple-500',
    description: 'Full-day supervised play and socialization in a safe group environment.',
    duration: 'Full day',
    popular: false,
    sort_order: 6,
  },
  {
    id: '7',
    name: 'Custom Service',
    type: 'custom',
    price: 60,
    icon_key: 'sparkles',
    gradient: 'from-cyan-500 to-sky-500',
    description: "Tailored services designed to meet your dog's unique and specific needs.",
    duration: 'Varies',
    popular: false,
    sort_order: 7,
  },
];
