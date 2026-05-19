import { Dog, Cat, Rabbit, Bird, Sparkles, type LucideIcon } from 'lucide-react';

export const PET_SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'other'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export function isPetSpecies(v: unknown): v is PetSpecies {
  return typeof v === 'string' && (PET_SPECIES as readonly string[]).includes(v);
}

export const SPECIES_META: Record<PetSpecies, {
  label: string;
  /** emoji ONLY for email/SMS (casual channels). Use Icon for UI. */
  emoji: string;
  Icon: LucideIcon;
  /** breed placeholder hint */
  breedPlaceholder: string;
}> = {
  dog:    { label: 'Dog',    emoji: '🐶', Icon: Dog,      breedPlaceholder: 'e.g. Labrador' },
  cat:    { label: 'Cat',    emoji: '🐱', Icon: Cat,      breedPlaceholder: 'e.g. Tabby, Siamese' },
  rabbit: { label: 'Rabbit', emoji: '🐰', Icon: Rabbit,   breedPlaceholder: 'e.g. Holland Lop' },
  bird:   { label: 'Bird',   emoji: '🐦', Icon: Bird,     breedPlaceholder: 'e.g. Cockatiel, Parrot' },
  other:  { label: 'Other',  emoji: '✦',  Icon: Sparkles, breedPlaceholder: 'Describe your pet' },
};

export function speciesLabel(s: string | null | undefined): string {
  return isPetSpecies(s) ? SPECIES_META[s].label : 'Pet';
}

export function speciesEmoji(s: string | null | undefined): string {
  return isPetSpecies(s) ? SPECIES_META[s].emoji : '🐾';
}
