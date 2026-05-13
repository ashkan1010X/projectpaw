# Cancel + Rebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cancel and Rebook actions to the dashboard booking list, with a cancellation confirmation email.

**Architecture:** A new `POST /api/bookings/[id]/cancel` route handles the DB update and cancellation email in one call. The dashboard UI gets Cancel/Rebook buttons per row, with optimistic local state updates. `BookingModal` gains an `initialDogName` prop so Rebook can pre-fill it.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (supabaseAdmin), Nodemailer, Tailwind CSS v4

---

## File Map

| File                                    | Action                                                    |
| --------------------------------------- | --------------------------------------------------------- |
| `app/api/bookings/[id]/cancel/route.ts` | Create — cancel endpoint                                  |
| `components/booking-modal.tsx`          | Modify — add `initialDogName` prop                        |
| `app/dashboard/page.tsx`                | Modify — badge logic, Cancel/Rebook buttons, modal wiring |

---

### Task 1: Create the cancel API route

**Files:**

- Create: `app/api/bookings/[id]/cancel/route.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, service_name, dog_name, datetime, status')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ message: 'Already cancelled' }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (updateError) {
    console.error('Cancel update error:', updateError);
    return NextResponse.json({ message: 'Failed to cancel booking' }, { status: 500 });
  }

  const formattedDate = new Date(booking.datetime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">Booking Cancelled</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">
          Your booking for <strong>${booking.dog_name}</strong> has been cancelled.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${booking.service_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Dog</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${booking.dog_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
        </table>
        <p style="margin: 32px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">
          Want to rebook? Visit your dashboard anytime.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Cancelled — ${booking.service_name} for ${booking.dog_name}`,
      html,
    });
  } catch (err) {
    console.error('Cancellation email error:', err);
    // Non-blocking — DB already updated, just log
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run lint and format**

```bash
npm run lint
npm run format
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/bookings/[id]/cancel/route.ts
git commit -m "feat(api): add POST /api/bookings/[id]/cancel endpoint"
```

---

### Task 2: Add `initialDogName` prop to BookingModal

**Files:**

- Modify: `components/booking-modal.tsx`

- [ ] **Step 1: Update the `BookingModalProps` interface**

In `components/booking-modal.tsx`, change:

```typescript
interface BookingModalProps {
  service: Service;
  onClose: () => void;
}
```

to:

```typescript
interface BookingModalProps {
  service: Service;
  onClose: () => void;
  initialDogName?: string;
}
```

- [ ] **Step 2: Wire `initialDogName` into the `dogName` state**

Change the function signature line:

```typescript
export function BookingModal({ service, onClose }: BookingModalProps) {
```

to:

```typescript
export function BookingModal({ service, onClose, initialDogName }: BookingModalProps) {
```

Change the `dogName` state initializer:

```typescript
const [dogName, setDogName] = useState('');
```

to:

```typescript
const [dogName, setDogName] = useState(initialDogName ?? '');
```

- [ ] **Step 3: Run lint and format**

```bash
npm run lint
npm run format
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/booking-modal.tsx
git commit -m "feat(booking-modal): accept initialDogName prop for rebook flow"
```

---

### Task 3: Update dashboard — badge logic, Cancel/Rebook buttons, modal wiring

**Files:**

- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Replace the entire file with the updated version**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BookingModal } from '@/components/booking-modal';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  service_id: string;
  service_name: string;
  dog_name: string;
  datetime: string;
  notes: string | null;
  status: string;
};

type RebookTarget = {
  serviceId: string;
  serviceName: string;
  dogName: string;
};

function statusBadge(booking: Booking) {
  if (booking.status === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-red-500/15 text-red-400' };
  }
  const isUpcoming = new Date(booking.datetime) > new Date();
  return isUpcoming
    ? { label: 'Upcoming', className: 'bg-doggy/20 text-doggy' }
    : { label: 'Completed', className: 'bg-paw/10 text-paw/50' };
}

export default function DashboardPage() {
  const { user, token, initialized } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({});
  const [rebookTarget, setRebookTarget] = useState<RebookTarget | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load bookings');
        return res.json() as Promise<{ bookings: Booking[] }>;
      })
      .then(({ bookings }) => setBookings(bookings))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [initialized, user, token, router]);

  async function handleCancel(booking: Booking) {
    if (!token) return;
    setCancellingId(booking.id);
    setCancelErrors((prev) => {
      const next = { ...prev };
      delete next[booking.id];
      return next;
    });

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed to cancel booking');
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)),
      );
    } catch (err) {
      setCancelErrors((prev) => ({
        ...prev,
        [booking.id]: err instanceof Error ? err.message : 'Something went wrong',
      }));
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return null;

  const lastService = bookings[0]?.service_name ?? '—';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-elegant text-3xl font-black text-paw">
          Hi, {user?.name} 👋
        </h1>
        <p className="mt-1 font-pawprint text-sm text-paw/50">Your booking history</p>
      </div>

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-3xl font-black text-accent">{bookings.length}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Total Bookings</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-doggy">{lastService}</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Last Service</div>
        </div>
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6 text-center">
          <div className="font-elegant text-xl font-black text-emerald-400">Active</div>
          <div className="mt-1 font-pawprint text-xs text-paw/40">Status</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-pawprint text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && bookings.length === 0 && (
        <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612] px-8 py-16 text-center">
          <p className="mb-2 font-elegant text-xl text-paw/60">No bookings yet</p>
          <p className="mb-6 font-pawprint text-sm text-paw/40">
            Book your first service and it will appear here.
          </p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-doggy px-6 py-2.5 font-pawprint text-sm font-bold text-white shadow-lg shadow-doggy/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-doggy/50"
          >
            Book Your First Service
          </Link>
        </div>
      )}

      {/* Booking list */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="mb-4 font-elegant text-lg font-bold text-paw/70">Recent Bookings</h2>
          {bookings.map((booking) => {
            const badge = statusBadge(booking);
            const isUpcoming =
              booking.status !== 'cancelled' && new Date(booking.datetime) > new Date();
            const isPastOrCancelled =
              booking.status === 'cancelled' || new Date(booking.datetime) <= new Date();
            const formatted = new Date(booking.datetime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={booking.id} className="space-y-1.5">
                <div className="flex items-center justify-between rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4">
                  <div>
                    <p className="font-pawprint text-sm font-semibold text-paw">
                      {booking.service_name}
                      <span className="ml-2 text-paw/40">— {booking.dog_name}</span>
                    </p>
                    <p className="mt-0.5 font-pawprint text-xs text-paw/40">{formatted}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPastOrCancelled && (
                      <button
                        onClick={() =>
                          setRebookTarget({
                            serviceId: booking.service_id,
                            serviceName: booking.service_name,
                            dogName: booking.dog_name,
                          })
                        }
                        className="rounded-lg border border-doggy/30 px-3 py-1 font-pawprint text-xs font-semibold text-doggy transition-all duration-200 hover:border-doggy/60 hover:bg-doggy/10"
                      >
                        Rebook
                      </button>
                    )}
                    {isUpcoming && (
                      <button
                        onClick={() => handleCancel(booking)}
                        disabled={cancellingId === booking.id}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1 font-pawprint text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Cancelling…
                          </>
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 font-pawprint text-xs font-semibold',
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
                {cancelErrors[booking.id] && (
                  <p className="px-2 font-pawprint text-xs text-red-400">
                    {cancelErrors[booking.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rebook modal */}
      {rebookTarget && (
        <BookingModal
          service={{
            id: rebookTarget.serviceId,
            name: rebookTarget.serviceName,
            price: 0,
          }}
          initialDogName={rebookTarget.dogName}
          onClose={() => setRebookTarget(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Run lint and format**

```bash
npm run lint
npm run format
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): add cancel and rebook actions to booking list"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Log in and navigate to `/dashboard`**

Verify: existing upcoming bookings show a red "Cancel" button. Past/cancelled bookings show a purple "Rebook" button.

- [ ] **Step 3: Cancel an upcoming booking**

Click Cancel. Verify:

- Button shows spinner + "Cancelling…" while in-flight
- Badge changes to red "Cancelled"
- Cancel button disappears, Rebook button appears
- Cancellation email arrives in inbox

- [ ] **Step 4: Rebook a cancelled booking**

Click Rebook. Verify:

- Booking modal opens
- Dog name field is pre-filled with the correct dog name
- Service name in modal header matches the original booking
- Can complete a new booking successfully

- [ ] **Step 5: Final commit if any fixes were needed, then push**

```bash
git push origin main
```
