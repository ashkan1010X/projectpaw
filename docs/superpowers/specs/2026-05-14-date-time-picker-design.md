# Date & Time Picker Upgrade — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the native `datetime-local` input in the booking modal with a polished shadcn Calendar + Popover + fixed hourly time slot grid that matches ProjectPaw's dark theme.

**Architecture:** Add a self-contained `DateTimePicker` component that wraps shadcn `Calendar` and `Popover`. The booking modal swaps its `datetime-local` input for this component. The output value format stays identical (`"YYYY-MM-DDTHH:MM"` local ISO string) so no API or validation logic changes.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, react-day-picker v9 (installed via shadcn CLI), @radix-ui/react-popover (installed via shadcn CLI), date-fns (installed via shadcn CLI)

---

## Files

| Action               | Path                              |
| -------------------- | --------------------------------- |
| Add (via shadcn CLI) | `components/ui/calendar.tsx`      |
| Add (via shadcn CLI) | `components/ui/popover.tsx`       |
| Create               | `components/date-time-picker.tsx` |
| Modify               | `components/booking-modal.tsx`    |

---

## Component: `DateTimePicker`

**File:** `components/date-time-picker.tsx`

**Props:**

```typescript
interface DateTimePickerProps {
  value: string; // ISO "2026-05-21T10:00" or ""
  onChange: (value: string) => void;
  error?: boolean; // true = red border on trigger
  minDate?: Date; // disabled before this (default: new Date())
}
```

**Internal state:**

```typescript
const [open, setOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
const [selectedHour, setSelectedHour] = useState<number | null>(null);
```

**Time slots:** Fixed array of 10 hourly options, 9 AM through 6 PM:

```typescript
const TIME_SLOTS = [
  { label: '9 AM', hour: 9 },
  { label: '10 AM', hour: 10 },
  { label: '11 AM', hour: 11 },
  { label: '12 PM', hour: 12 },
  { label: '1 PM', hour: 13 },
  { label: '2 PM', hour: 14 },
  { label: '3 PM', hour: 15 },
  { label: '4 PM', hour: 16 },
  { label: '5 PM', hour: 17 },
  { label: '6 PM', hour: 18 },
];
```

**Combining date + time:** When both `selectedDate` and `selectedHour` are set, combine and emit:

```typescript
const combined = new Date(selectedDate);
combined.setHours(selectedHour, 0, 0, 0);
const iso = `${combined.getFullYear()}-${String(combined.getMonth() + 1).padStart(2, '0')}-${String(combined.getDate()).padStart(2, '0')}T${String(selectedHour).padStart(2, '0')}:00`;
onChange(iso);
setOpen(false); // auto-close popover
```

**Slot disabling:** When `selectedDate` is today, disable slots where `slot.hour <= currentHour`. Use `isSameDay` imported from `date-fns` (available as a transitive shadcn dependency):

```typescript
import { isSameDay } from 'date-fns';
// ...
const isToday = selectedDate && isSameDay(selectedDate, new Date());
const currentHour = new Date().getHours();
const slotDisabled = (hour: number) => !!isToday && hour <= currentHour;
```

**Trigger button display:**

- Empty: `"Select date & time"` in `text-paw/25`
- Filled: `"Wed, May 21 · 10 AM"` — weekday+date in `text-paw`, slot label in `text-doggy`

**Trigger border:** `border-paw/[0.1]` normally, `border-doggy/60` when open, `border-red-500/50` when `error` prop is true.

---

## Calendar Styling

Override react-day-picker CSS variables to match dark ProjectPaw theme inside `components/ui/calendar.tsx`:

- Background: `bg-[#1a1612]`
- Day cell hover: `hover:bg-paw/[0.06]` rounded-full
- Selected day: `bg-doggy text-white` rounded-full
- Today indicator: ring `ring-1 ring-accent/40` (yellow)
- Disabled days: `text-paw/[0.18] cursor-not-allowed`
- Navigation arrows: `text-paw/50 hover:text-paw`

---

## Popover Structure

```
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <button ...trigger styles...>
      {display string or placeholder}
    </button>
  </PopoverTrigger>
  <PopoverContent ...styles...>
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      disabled={{ before: minDate }}
    />
    <hr ... />
    <p>Select Time</p>
    <div class="time slot grid 5 cols">
      {TIME_SLOTS.map(slot => <button ...>)}
    </div>
  </PopoverContent>
</Popover>
```

**PopoverContent styles:** `bg-[#1a1612] border border-paw/[0.12] rounded-2xl shadow-2xl p-4 w-[280px]`  
**z-index:** Radix Popover uses a portal so it renders above the booking modal automatically — no manual z-index needed.

---

## Booking Modal Changes

**File:** `components/booking-modal.tsx`

Replace the entire `<FieldWrapper label="Date & Time" ...>` block (currently lines 304–327) with:

```tsx
<FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
  <DateTimePicker
    value={datetime}
    onChange={(v) => {
      setDatetime(v);
      setFieldErrors((fe) => ({ ...fe, datetime: undefined }));
    }}
    error={!!fieldErrors.datetime}
  />
  {fieldErrors.datetime && (
    <p className="font-pawprint text-xs text-red-400">{fieldErrors.datetime}</p>
  )}
</FieldWrapper>
```

Remove the `minDatetime` const (no longer needed). The `DateTimePicker` handles its own min date internally defaulting to `new Date()`.

The `onBlur` validation is removed from the datetime field — validation fires on form submit (unchanged) and on slot selection via `onChange`.

---

## Validation (unchanged)

`validateBookingField('datetime', value)` in `booking-modal.tsx` stays identical:

- Empty string → `"Please select a date and time."`
- Date in the past → `"Please choose a future date and time."`

---

## Testing

After implementation, run Playwright across Galaxy S20 (360px), iPhone 14 (390px), iPad (768px), Desktop (1280px):

- Trigger button renders, matches inputClass styling
- Clicking trigger opens popover
- Clicking a day in the calendar highlights it
- Clicking a time slot highlights it, closes popover, and fills trigger text
- Selecting today: past time slots are greyed and unclickable
- Submit without selecting: red border + error message appears
- Submit with selection: booking proceeds normally (same API call)
- No horizontal overflow on any viewport
