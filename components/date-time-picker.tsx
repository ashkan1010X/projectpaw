'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_SLOTS = [
  { label: '9:00 AM',  hour: 9  },
  { label: '10:00 AM', hour: 10 },
  { label: '11:00 AM', hour: 11 },
  { label: '12:00 PM', hour: 12 },
  { label: '1:00 PM',  hour: 13 },
  { label: '2:00 PM',  hour: 14 },
  { label: '3:00 PM',  hour: 15 },
  { label: '4:00 PM',  hour: 16 },
  { label: '5:00 PM',  hour: 17 },
  { label: '6:00 PM',  hour: 18 },
];

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  minDate?: Date;
}

function toIsoLocal(date: Date, hour: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:00`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, min: Date): boolean {
  const ac = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const mc = new Date(min.getFullYear(), min.getMonth(), min.getDate());
  return ac < mc;
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingNulls: null[] = Array(first.getDay()).fill(null);
  const days: Date[] = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1),
  );
  return [...leadingNulls, ...days];
}

export function DateTimePicker({
  value,
  onChange,
  error,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [nowAtOpen, setNowAtOpen] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 520 });

  const now = nowAtOpen;
  const min = minDate ?? nowAtOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  const openPopover = useCallback(() => {
    setNowAtOpen(new Date());
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 360;

    let top: number;
    if (spaceBelow >= estimatedHeight + 16) {
      top = rect.bottom + 6;
    } else if (spaceAbove >= estimatedHeight + 16) {
      top = rect.top - estimatedHeight - 6;
    } else {
      top = rect.bottom + 6;
    }

    const maxHeight = Math.min(520, window.innerHeight - top - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 280));
    setPopoverPos({ top, left, width: rect.width, maxHeight });
    setOpen(true);
    if (!selectedDate) setStep('date');
  }, [selectedDate]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(date: Date) {
    if (isBeforeDay(date, min)) return;
    setSelectedDate(date);
    setSelectedHour(null);
    setSelectedLabel('');
    setStep('time');
  }

  function handleSlotClick(hour: number, label: string) {
    if (!selectedDate) return;
    setSelectedHour(hour);
    setSelectedLabel(label);
    onChange(toIsoLocal(selectedDate, hour));
    setOpen(false);
  }

  function handleBack() {
    setStep('date');
    setSelectedHour(null);
    setSelectedLabel('');
  }

  const triggerText = (() => {
    if (!selectedDate || selectedHour === null) return null;
    const wd = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    const mo = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    return `${wd}, ${mo} ${selectedDate.getDate()} · ${selectedLabel}`;
  })();

  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  const calendarStep = (
    <div className="p-4">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-paw/[0.1] bg-paw/[0.04] p-1.5 text-paw/50 transition-colors duration-150 hover:bg-paw/[0.08] hover:text-paw"
        >
          <ChevronLeft className="size-3.5" strokeWidth={2} />
        </button>
        <span className="font-pawprint text-[11px] font-semibold text-paw/75">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-paw/[0.1] bg-paw/[0.04] p-1.5 text-paw/50 transition-colors duration-150 hover:bg-paw/[0.08] hover:text-paw"
        >
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="font-pawprint text-[9px] font-semibold uppercase tracking-[0.1em] text-paw/25"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar day grid */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const disabled = isBeforeDay(date, min);
          const selected = selectedDate ? sameDay(date, selectedDate) : false;
          const todayDate = sameDay(date, now);
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(date)}
              className={cn(
                'mx-auto flex size-7 items-center justify-center rounded-full font-pawprint text-[11px] transition-all duration-150',
                selected
                  ? 'bg-doggy font-semibold text-white'
                  : disabled
                    ? 'cursor-not-allowed text-paw/[0.18]'
                    : todayDate
                      ? 'cursor-pointer text-paw ring-1 ring-accent/40 hover:bg-paw/[0.08]'
                      : 'cursor-pointer text-paw/65 hover:bg-paw/[0.08] hover:text-paw',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center font-pawprint text-[9px] text-paw/30">
        Tap a date to pick a time
      </p>
    </div>
  );

  const timeStep = (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Back header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-paw/[0.07] px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-paw/[0.1] bg-paw/[0.04] text-paw/50 transition-colors duration-150 hover:bg-paw/[0.08] hover:text-paw"
          aria-label="Back to calendar"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <p className="font-pawprint text-[9px] font-semibold uppercase tracking-[0.13em] text-paw/30">
            Date selected
          </p>
          <p className="truncate font-pawprint text-sm font-semibold text-paw">
            {formattedSelectedDate}
          </p>
        </div>
        <Clock className="ml-auto size-4 shrink-0 text-doggy/40" strokeWidth={1.5} />
      </div>

      {/* Scrollable time list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-1 font-pawprint text-[9px] font-semibold uppercase tracking-[0.13em] text-paw/30">
          Select a time
        </p>
        <div className="space-y-1.5">
          {TIME_SLOTS.map(({ label, hour }) => {
            const slotDisabled =
              !selectedDate ||
              (sameDay(selectedDate, min) && hour <= min.getHours());
            const active = selectedHour === hour;
            return (
              <button
                key={hour}
                type="button"
                disabled={slotDisabled}
                onClick={() => handleSlotClick(hour, label)}
                className={cn(
                  'w-full rounded-xl px-4 py-2.5 text-left font-pawprint text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-doggy text-white shadow-sm shadow-doggy/30'
                    : slotDisabled
                      ? 'cursor-not-allowed text-paw/[0.18]'
                      : 'cursor-pointer border border-paw/[0.1] text-paw/70 hover:border-doggy/40 hover:bg-doggy/[0.07] hover:text-paw',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const popoverContent = (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: popoverPos.top,
        left: popoverPos.left,
        minWidth: Math.max(popoverPos.width, 272),
        maxHeight: popoverPos.maxHeight,
        zIndex: 9999,
      }}
      className="w-[272px] flex flex-col overflow-hidden rounded-2xl border border-paw/[0.12] bg-[#1a1612] shadow-2xl shadow-black/70 animate-fade-in"
    >
      {step === 'date' ? calendarStep : timeStep}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (open) { setOpen(false); } else { openPopover(); } }}
        className={cn(
          'w-full rounded-xl border bg-paw/[0.03] px-4 py-3',
          'flex items-center justify-between gap-3',
          'font-pawprint text-sm outline-none transition-all duration-300',
          'focus:ring-2 focus:ring-doggy/15',
          open
            ? 'border-doggy/60 bg-paw/[0.05] ring-2 ring-doggy/15'
            : error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10'
              : 'border-paw/[0.1] hover:border-paw/25',
        )}
      >
        {triggerText ? (
          <span className="text-paw">{triggerText}</span>
        ) : (
          <span className="text-paw/25">Select date &amp; time</span>
        )}
        <CalendarIcon className="size-4 shrink-0 text-doggy/50" strokeWidth={1.5} />
      </button>

      {mounted && open && createPortal(popoverContent, document.body)}
    </div>
  );
}
