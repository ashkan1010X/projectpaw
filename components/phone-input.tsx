'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  parsePhoneNumber,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountryOption {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
}

function toFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

// Build full list once at module level
const displayNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const ALL_COUNTRIES: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: displayNames?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
    flag: toFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Pinned to the top of the list
const PINNED: CountryCode[] = ['CA', 'US', 'GB', 'AU', 'IN', 'AE', 'FR', 'DE', 'MX', 'BR'];

const COUNTRIES: CountryOption[] = [
  ...PINNED.map((c) => ALL_COUNTRIES.find((x) => x.code === c)!).filter(Boolean),
  { code: 'DIVIDER' as CountryCode, name: '─────────────', dial: '', flag: '' },
  ...ALL_COUNTRIES.filter((c) => !PINNED.includes(c.code)),
];

function parseExisting(raw: string): { country: CountryOption; local: string } {
  const fallback = COUNTRIES[0]; // CA
  if (!raw) return { country: fallback, local: '' };

  try {
    const parsed = parsePhoneNumber(raw);
    if (parsed?.country) {
      const match = COUNTRIES.find((c) => c.code === parsed.country);
      return { country: match ?? fallback, local: parsed.nationalNumber };
    }
  } catch {}

  // Free-text fallback — treat whole value as local CA number
  return { country: fallback, local: raw };
}

interface PhoneInputProps {
  value: string; // E.164 or empty
  onChange: (e164: string) => void;
  className?: string;
  id?: string;
}

export function PhoneInput({ value, onChange, className, id }: PhoneInputProps) {
  const initial = useMemo(() => parseExisting(value), [value]);
  const [country, setCountry] = useState<CountryOption>(initial.country);
  const [local, setLocal] = useState(initial.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function emit(dialCode: string, localDigits: string) {
    const digits = localDigits.replace(/\D/g, '');
    onChange(digits ? `${dialCode}${digits}` : '');
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;

    // Handle paste of a full international number
    const looksGlobal = raw.startsWith('+') || raw.startsWith('00');
    if (looksGlobal) {
      try {
        const normalized = raw.startsWith('00') ? raw.replace(/^00/, '+') : raw;
        const parsed = parsePhoneNumber(normalized);
        if (parsed?.country) {
          const match = COUNTRIES.find((c) => c.code === parsed.country);
          if (match) {
            setCountry(match);
            setLocal(parsed.nationalNumber);
            onChange(parsed.number);
            return;
          }
        }
      } catch {}
    }

    // Normal local-number typing
    const cleaned = raw.replace(/[^\d\s\-().]/g, '');
    setLocal(cleaned);
    emit(country.dial, cleaned);
  }

  function handleCountrySelect(c: CountryOption) {
    if (c.code === ('DIVIDER' as CountryCode)) return;
    setCountry(c);
    setOpen(false);
    setSearch('');
    emit(c.dial, local);
  }

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.code === ('DIVIDER' as CountryCode) ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q),
    );
  }, [search]);

  return (
    <div ref={wrapperRef} className={cn('relative flex', className)}>
      {/* Country trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-l-xl border border-r-0 border-paw/[0.18]',
          'bg-paw/[0.04] px-3 py-3 font-pawprint text-sm text-paw',
          'outline-none transition-all duration-300 hover:bg-paw/[0.07]',
          open && 'border-doggy/60 bg-paw/[0.05] ring-2 ring-doggy/15',
        )}
        aria-label="Select country code"
      >
        <span className="font-semibold text-paw/80 text-xs">{country.code}</span>
        <span className="text-paw/45 text-xs">{country.dial}</span>
        <ChevronDown
          className={cn('size-3 text-paw/25 transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {/* Local number input */}
      <input
        id={id}
        type="tel"
        value={local}
        onChange={handleLocalChange}
        placeholder="(416) 555-0100"
        autoComplete="tel-national"
        className={cn(
          'flex-1 rounded-r-xl border border-paw/[0.18] bg-paw/[0.04] px-4 py-3',
          'font-pawprint text-sm text-paw placeholder:text-paw/25',
          'outline-none transition-all duration-300',
          'focus:border-doggy/60 focus:ring-2 focus:ring-doggy/15',
        )}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-paw/[0.12] bg-[#1a1612] shadow-2xl shadow-black/70 animate-fade-in">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b border-paw/[0.07] px-3 py-2.5">
            <Search className="size-3.5 shrink-0 text-paw/30" strokeWidth={2} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country…"
              className="flex-1 bg-transparent font-pawprint text-sm text-paw placeholder:text-paw/25 outline-none"
            />
          </div>

          {/* Country list */}
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="py-5 text-center font-pawprint text-xs text-paw/30">No results</p>
            ) : (
              filtered.map((c, i) =>
                c.code === ('DIVIDER' as CountryCode) ? (
                  <div key={`divider-${i}`} className="my-1 border-t border-paw/[0.06]" />
                ) : (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-100',
                      c.code === country.code
                        ? 'bg-doggy/[0.12] text-paw'
                        : 'text-paw/60 hover:bg-paw/[0.06] hover:text-paw',
                    )}
                  >
                    <span className="w-6 text-center text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate font-pawprint text-sm">{c.name}</span>
                    <span className="shrink-0 font-pawprint text-xs text-paw/35">{c.dial}</span>
                  </button>
                ),
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
