'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarPlus } from 'lucide-react';

interface AddToCalendarProps {
  bookingId: string;
  serviceName: string;
  dogName: string;
  datetime: string;
  durationMinutes?: number;
}

function fmtIcsDate(d: Date): string {
  // YYYYMMDDTHHmmssZ format (UTC)
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function buildGoogleUrl(title: string, details: string, start: Date, end: Date): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmtIcsDate(start)}/${fmtIcsDate(end)}`,
    details,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function buildIcsBlob(uid: string, title: string, details: string, start: Date, end: Date): Blob {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProjectPaw//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid}@projectpaw.com`,
    `DTSTAMP:${fmtIcsDate(new Date())}`,
    `DTSTART:${fmtIcsDate(start)}`,
    `DTEND:${fmtIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([ics], { type: 'text/calendar;charset=utf-8' });
}

export function AddToCalendar({
  bookingId,
  serviceName,
  dogName,
  datetime,
  durationMinutes = 60,
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const start = new Date(datetime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const title = `${serviceName} for ${dogName}`;
  const details = `ProjectPaw booking — ${serviceName} appointment for ${dogName}.`;

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  function handleAppleOutlook() {
    const blob = buildIcsBlob(bookingId, title, details, start, end);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serviceName.replace(/\s+/g, '-').toLowerCase()}-${start.toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Add to calendar"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-9 items-center gap-1.5 rounded-lg border border-doggy/25 bg-doggy/[0.05] px-3 py-2 font-pawprint text-xs font-semibold text-doggy/85 transition-all duration-200 hover:border-doggy/50 hover:bg-doggy/10 focus:outline-none focus:ring-2 focus:ring-doggy/40"
      >
        <CalendarPlus className="size-3.5" />
        Add to Calendar
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-paw/15 bg-[#1a1612] shadow-2xl ring-1 ring-black/20"
        >
          <a
            href={buildGoogleUrl(title, details, start, end)}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 font-pawprint text-sm text-paw transition-colors hover:bg-doggy/10 hover:text-doggy"
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            onClick={handleAppleOutlook}
            className="block w-full px-4 py-3 text-left font-pawprint text-sm text-paw transition-colors hover:bg-doggy/10 hover:text-doggy"
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
