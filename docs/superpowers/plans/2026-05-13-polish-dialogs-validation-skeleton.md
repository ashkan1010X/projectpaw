# Polish: Confirm Dialogs, Inline Validation, Dashboard Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-native `window.confirm`/`window.alert` with a branded confirmation modal, add per-field inline validation to the admin drawer and booking modal, and replace the dashboard's blank loading state with a skeleton screen.

**Architecture:** A single reusable `ConfirmDialog` component handles all confirmation flows (admin delete, dashboard cancel). Inline validation uses per-field error state (`Record<field, string | undefined>`) validated on blur and cleared on change. The dashboard skeleton mirrors the page's actual DOM structure so the layout doesn't shift on load.

**Tech Stack:** Next.js 15 App Router, TypeScript strict mode, Tailwind CSS v4, React state only — no new dependencies.

---

## File Structure

| File                            | Action     | Purpose                                                      |
| ------------------------------- | ---------- | ------------------------------------------------------------ |
| `components/confirm-dialog.tsx` | **Create** | Branded reusable confirmation modal                          |
| `app/admin/page.tsx`            | **Modify** | Use ConfirmDialog for delete; per-field validation in drawer |
| `app/dashboard/page.tsx`        | **Modify** | Loading skeleton; use ConfirmDialog for cancel booking       |
| `components/booking-modal.tsx`  | **Modify** | Per-field validation for dogName and datetime                |

---

### Task 1: ConfirmDialog component

**Files:**

- Create: `components/confirm-dialog.tsx`

**Context:** The app uses a dark design system. Colors: `paw` (#F5CBA7 tan), `doggy` (#B2A4FF purple), `accent` (#F9D923 yellow), background `#1a1612`. Fonts: `font-elegant` (Playfair Display), `font-pawprint` (Baloo 2). All Tailwind, no plain CSS. This component must handle Escape key, backdrop click to cancel, and aria roles for accessibility. It is used in two places: admin delete service (destructive = true) and dashboard cancel booking (destructive = true).

- [ ] **Step 1: Create `components/confirm-dialog.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-paw/[0.12] bg-[#1a1612] p-6 shadow-2xl">
        <h2 id="confirm-title" className="font-elegant text-xl font-black text-paw">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 font-pawprint text-sm text-paw/55">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-paw/[0.12] bg-white/[0.03] py-2.5 font-pawprint text-sm font-semibold text-paw/60 transition-all duration-200 hover:border-paw/25 hover:text-paw/80"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 rounded-xl py-2.5 font-pawprint text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5',
              destructive
                ? 'bg-red-500 shadow-red-500/25 hover:bg-red-400 hover:shadow-red-500/40'
                : 'bg-doggy shadow-doggy/25 hover:shadow-doggy/40',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/confirm-dialog.tsx
git commit -m "feat(ui): add reusable ConfirmDialog component"
```

---

### Task 2: Admin — replace window.confirm/alert with ConfirmDialog

**Files:**

- Modify: `app/admin/page.tsx`

**Context:** The admin page currently calls `window.confirm('Delete this service? ...')` and `window.alert('Failed to delete service.')` / `window.alert('Network error...')` inside `handleDelete`. We replace these with a `ConfirmDialog` + in-component error state. The deletion flow becomes: click Del → open dialog → user confirms → call API → on failure, set `deleteError` string shown as a toast-style banner.

- [ ] **Step 1: Add confirm dialog state and deleteError state to AdminPage**

In `app/admin/page.tsx`, add these state declarations after the existing state declarations (after `const [tableError, setTableError] = useState<string | null>(null);`):

```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
const [deleteError, setDeleteError] = useState<string | null>(null);
```

- [ ] **Step 2: Import ConfirmDialog**

Add to the imports at the top of `app/admin/page.tsx`:

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';
```

- [ ] **Step 3: Rewrite handleDelete**

Replace the existing `handleDelete` function:

```tsx
async function handleDelete(id: string) {
  setPendingDeleteId(id);
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  setPendingDeleteId(null);
  setDeleteError(null);
  try {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) closeDrawer();
    } else {
      setDeleteError('Failed to delete service. Please try again.');
    }
  } catch {
    setDeleteError('Network error. Please try again.');
  }
}
```

- [ ] **Step 4: Add ConfirmDialog and deleteError banner to the JSX**

Inside the `return (...)` of `AdminPage`, just before the closing `</main>` tag, add:

```tsx
{
  /* Delete error banner */
}
{
  deleteError && (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-red-500/25 bg-[#1a1612] px-5 py-3 shadow-2xl">
      <p className="font-pawprint text-sm text-red-400">{deleteError}</p>
      <button
        onClick={() => setDeleteError(null)}
        className="ml-3 font-pawprint text-xs text-red-400/60 hover:text-red-400"
      >
        Dismiss
      </button>
    </div>
  );
}

{
  /* Delete confirmation dialog */
}
<ConfirmDialog
  isOpen={pendingDeleteId !== null}
  title="Delete Service"
  message={`Are you sure you want to delete "${services.find((s) => s.id === pendingDeleteId)?.name ?? ''}"? This cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Keep it"
  destructive
  onConfirm={confirmDelete}
  onCancel={() => setPendingDeleteId(null)}
/>;
```

- [ ] **Step 5: Verify no window.confirm or window.alert remain**

```bash
grep -n "window\." app/admin/page.tsx
```

Expected: no output (zero matches).

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "fix(admin): replace window.confirm/alert with branded ConfirmDialog"
```

---

### Task 3: Admin — per-field inline validation in drawer

**Files:**

- Modify: `app/admin/page.tsx`

**Context:** The admin drawer currently collects name, price, duration, description and shows a single `drawerError` string at the bottom on submit. We add `DrawerErrors` state — one optional string per field — validated on blur and cleared as the user types. The existing `drawerError` state stays for API-level errors (distinct from field-level validation errors).

- [ ] **Step 1: Add DrawerErrors type and state**

After the existing type declarations at the top of the file (near `type FormData`), add:

```tsx
type DrawerErrors = {
  name?: string;
  price?: string;
  duration?: string;
  description?: string;
};
```

Add state inside `AdminPage`, after `const [drawerError, setDrawerError] = useState<string | null>(null);`:

```tsx
const [fieldErrors, setFieldErrors] = useState<DrawerErrors>({});
```

- [ ] **Step 2: Add validateField helper inside AdminPage**

Add this function inside `AdminPage` (before `handleSave`):

```tsx
function validateField(field: keyof DrawerErrors, value: string): string | undefined {
  if (field === 'name' && !value.trim()) return 'Name is required.';
  if (field === 'price') {
    if (!value) return 'Price is required.';
    if (isNaN(Number(value)) || Number(value) < 0) return 'Enter a valid price.';
  }
  if (field === 'duration' && !value.trim()) return 'Duration is required.';
  if (field === 'description' && !value.trim()) return 'Description is required.';
  return undefined;
}
```

- [ ] **Step 3: Add onBlur handlers and clear-on-change pattern**

For each field in the form, add `onBlur` and update `onChange` to also clear the field error. Here are the complete input elements to replace:

**Name input** (replace existing `<input value={form.name} ...>`):

```tsx
<input
  value={form.name}
  onChange={(e) => {
    setForm((f) => ({ ...f, name: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, name: undefined }));
  }}
  onBlur={(e) => {
    const err = validateField('name', e.target.value);
    setFieldErrors((fe) => ({ ...fe, name: err }));
  }}
  className={cn(
    'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
    fieldErrors.name ? 'border-red-500/60' : 'border-paw/10',
  )}
  placeholder="e.g. Grooming"
/>;
{
  fieldErrors.name && <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.name}</p>;
}
```

**Price input** (replace existing `<input type="number" ...>`):

```tsx
<input
  type="number"
  min={0}
  value={form.price}
  onChange={(e) => {
    setForm((f) => ({ ...f, price: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, price: undefined }));
  }}
  onBlur={(e) => {
    const err = validateField('price', e.target.value);
    setFieldErrors((fe) => ({ ...fe, price: err }));
  }}
  className={cn(
    'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
    fieldErrors.price ? 'border-red-500/60' : 'border-paw/10',
  )}
  placeholder="30"
/>;
{
  fieldErrors.price && (
    <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.price}</p>
  );
}
```

**Duration input** (replace existing `<input value={form.duration} ...>`):

```tsx
<input
  value={form.duration}
  onChange={(e) => {
    setForm((f) => ({ ...f, duration: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, duration: undefined }));
  }}
  onBlur={(e) => {
    const err = validateField('duration', e.target.value);
    setFieldErrors((fe) => ({ ...fe, duration: err }));
  }}
  className={cn(
    'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy',
    fieldErrors.duration ? 'border-red-500/60' : 'border-paw/10',
  )}
  placeholder="90 min"
/>;
{
  fieldErrors.duration && (
    <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.duration}</p>
  );
}
```

**Description textarea** (replace existing `<textarea value={form.description} ...>`):

```tsx
<textarea
  value={form.description}
  onChange={(e) => {
    setForm((f) => ({ ...f, description: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, description: undefined }));
  }}
  onBlur={(e) => {
    const err = validateField('description', e.target.value);
    setFieldErrors((fe) => ({ ...fe, description: err }));
  }}
  rows={3}
  className={cn(
    'w-full rounded-lg border bg-white/5 px-3 py-2 font-pawprint text-sm text-paw outline-none focus:border-doggy resize-none',
    fieldErrors.description ? 'border-red-500/60' : 'border-paw/10',
  )}
  placeholder="Describe the service..."
/>;
{
  fieldErrors.description && (
    <p className="mt-1 font-pawprint text-xs text-red-400">{fieldErrors.description}</p>
  );
}
```

- [ ] **Step 4: Update handleSave to validate all fields first**

Replace the top of `handleSave` (the early-return guard):

```tsx
async function handleSave() {
  const errors: DrawerErrors = {
    name: validateField('name', form.name),
    price: validateField('price', form.price),
    duration: validateField('duration', form.duration),
    description: validateField('description', form.description),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  if (hasErrors) {
    setFieldErrors(errors);
    return;
  }
  // remove the old single-string guard — field errors replace it
  setSaving(true);
  setDrawerError(null);
  // ... rest of handleSave unchanged ...
```

Also clear fieldErrors when drawer closes. In `closeDrawer`:

```tsx
function closeDrawer() {
  setDrawerOpen(false);
  setDrawerError(null);
  setFieldErrors({});
}
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): inline per-field validation in service drawer"
```

---

### Task 4: Dashboard — loading skeleton

**Files:**

- Modify: `app/dashboard/page.tsx`

**Context:** Currently `app/dashboard/page.tsx` returns `null` when `loading === true`. This causes a blank white flash. Replace with a skeleton that mirrors the page's actual structure: a header section, a stats row (3 boxes), and a list of booking rows. Use `animate-pulse` for the shimmer effect. The skeleton must match the real layout precisely to avoid layout shift.

- [ ] **Step 1: Add DashboardSkeleton component inside dashboard/page.tsx**

Add this function before `export default function DashboardPage()`:

```tsx
function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-paw/[0.08]" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-paw/[0.05]" />
      </div>

      {/* Stats row skeleton */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5 text-center sm:p-6',
              i === 1 && 'hidden sm:block',
            )}
          >
            <div className="mx-auto h-8 w-12 animate-pulse rounded bg-paw/[0.08]" />
            <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-paw/[0.05]" />
          </div>
        ))}
      </div>

      {/* Booking list skeleton */}
      <div className="space-y-3">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-paw/[0.08]" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-paw/[0.08] bg-[#1a1612] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
          >
            <div className="min-w-0">
              <div className="h-4 w-40 animate-pulse rounded bg-paw/[0.08]" />
              <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-paw/[0.05]" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-7 w-16 animate-pulse rounded-lg bg-paw/[0.08]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-paw/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace `if (loading) return null`**

Find:

```tsx
if (loading) return null;
```

Replace with:

```tsx
if (loading) return <DashboardSkeleton />;
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): loading skeleton replaces blank null state"
```

---

### Task 5: Dashboard — ConfirmDialog for cancel booking

**Files:**

- Modify: `app/dashboard/page.tsx`

**Context:** Currently clicking "Cancel" on a booking immediately fires the cancel API with no confirmation step. This is a destructive action that should require confirmation. We use the `ConfirmDialog` we built in Task 1. The pattern: clicking Cancel sets `pendingCancelBooking: Booking | null`, the dialog renders with the booking's service name and dog name in the message, confirming calls `handleCancel`.

- [ ] **Step 1: Import ConfirmDialog**

Add to imports in `app/dashboard/page.tsx`:

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';
```

- [ ] **Step 2: Add pendingCancelBooking state**

Add after the existing state declarations:

```tsx
const [pendingCancelBooking, setPendingCancelBooking] = useState<Booking | null>(null);
```

- [ ] **Step 3: Update the Cancel button onClick**

Find the Cancel button in the booking list (currently `onClick={() => handleCancel(booking)}`). Replace:

```tsx
onClick={() => setPendingCancelBooking(booking)}
```

- [ ] **Step 4: Add ConfirmDialog to the JSX**

Inside the `return (...)`, just before the `{/* Rebook modal */}` block, add:

```tsx
{
  /* Cancel confirmation */
}
{
  pendingCancelBooking && (
    <ConfirmDialog
      isOpen
      title="Cancel Booking"
      message={`Cancel ${pendingCancelBooking.service_name} for ${pendingCancelBooking.dog_name}? This cannot be undone.`}
      confirmLabel="Yes, Cancel"
      cancelLabel="Keep it"
      destructive
      onConfirm={() => {
        void handleCancel(pendingCancelBooking);
        setPendingCancelBooking(null);
      }}
      onCancel={() => setPendingCancelBooking(null)}
    />
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): confirm dialog before cancelling a booking"
```

---

### Task 6: Booking modal — per-field inline validation

**Files:**

- Modify: `components/booking-modal.tsx`

**Context:** The booking modal already uses HTML5 `required` on inputs, but browser-native validation looks inconsistent across platforms. We replace it with controlled validation: `dogName` must be non-empty, `datetime` must be non-empty and in the future. Show per-field errors below the field; the field border turns red. Remove `required` from the inputs (we control it ourselves). The global `error` state stays for API-level failures.

- [ ] **Step 1: Add BookingErrors type and state**

Add type and state inside `BookingModal`:

```tsx
type BookingErrors = { dogName?: string; datetime?: string };
const [fieldErrors, setFieldErrors] = useState<BookingErrors>({});
```

- [ ] **Step 2: Add validateBookingField helper inside BookingModal**

```tsx
function validateBookingField(field: keyof BookingErrors, value: string): string | undefined {
  if (field === 'dogName' && !value.trim()) return "Your dog's name is required.";
  if (field === 'datetime') {
    if (!value) return 'Please select a date and time.';
    if (new Date(value) <= new Date()) return 'Please choose a future date and time.';
  }
  return undefined;
}
```

- [ ] **Step 3: Update dogName input**

Replace the existing dogName `<input>`:

```tsx
<FieldWrapper label="Dog's Name" htmlFor="dogName" icon={Dog}>
  <input
    id="dogName"
    type="text"
    value={dogName}
    onChange={(e) => {
      setDogName(e.target.value);
      setFieldErrors((fe) => ({ ...fe, dogName: undefined }));
    }}
    onBlur={(e) => {
      const err = validateBookingField('dogName', e.target.value);
      setFieldErrors((fe) => ({ ...fe, dogName: err }));
    }}
    placeholder="e.g. Buddy"
    className={cn(
      inputClass,
      fieldErrors.dogName && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
    )}
  />
  {fieldErrors.dogName && (
    <p className="font-pawprint text-xs text-red-400">{fieldErrors.dogName}</p>
  )}
</FieldWrapper>
```

- [ ] **Step 4: Update datetime input**

Replace the existing datetime `<input>`:

```tsx
<FieldWrapper label="Date & Time" htmlFor="datetime" icon={Calendar}>
  <input
    id="datetime"
    type="datetime-local"
    min={minDatetime}
    value={datetime}
    onChange={(e) => {
      setDatetime(e.target.value);
      setFieldErrors((fe) => ({ ...fe, datetime: undefined }));
    }}
    onBlur={(e) => {
      const err = validateBookingField('datetime', e.target.value);
      setFieldErrors((fe) => ({ ...fe, datetime: err }));
    }}
    className={cn(
      inputClass,
      fieldErrors.datetime && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
    )}
    style={{ colorScheme: 'dark' }}
  />
  {fieldErrors.datetime && (
    <p className="font-pawprint text-xs text-red-400">{fieldErrors.datetime}</p>
  )}
</FieldWrapper>
```

- [ ] **Step 5: Update handleSubmit to validate before calling API**

At the top of `handleSubmit`, before `setLoading(true)`, add:

```tsx
const errors: BookingErrors = {
  dogName: validateBookingField('dogName', dogName),
  datetime: validateBookingField('datetime', datetime),
};
const hasErrors = Object.values(errors).some(Boolean);
if (hasErrors) {
  setFieldErrors(errors);
  return;
}
```

- [ ] **Step 6: Commit**

```bash
git add components/booking-modal.tsx
git commit -m "feat(booking): inline per-field validation for dog name and datetime"
```

---

### Task 7: Playwright mobile verification pass

**Files:** None modified

**Context:** After all 6 tasks above, run the full Playwright audit across all 5 viewports to verify: (1) ConfirmDialog renders correctly on mobile, (2) field error messages don't cause layout overflow, (3) skeleton renders correctly before data loads, (4) booking modal validation errors render within the modal bounds on small screens.

- [ ] **Step 1: Run mobile audit for admin (Galaxy S20, iPhone 14, Desktop)**

```js
// /tmp/playwright-polish-audit.js — test ConfirmDialog + validation on admin
// 1. Open edit drawer for Dog Walking → blur name field empty → check red border
// 2. Click Del on a service → check ConfirmDialog appears (not window.confirm)
// 3. Click "Keep it" → dialog closes
// Screenshots: /tmp/polish-admin-{Galaxy-S20,iPhone-14,Desktop}.png
```

- [ ] **Step 2: Run mobile audit for dashboard (Galaxy S20, iPhone 14)**

```js
// Click Cancel on upcoming booking → check ConfirmDialog appears
// Screenshots: /tmp/polish-dashboard-{Galaxy-S20,iPhone-14}.png
```

- [ ] **Step 3: Run mobile audit for booking modal (iPhone SE, Desktop)**

```js
// Click Book Now → submit empty form → check per-field errors render
// Screenshots: /tmp/polish-booking-{iPhone-SE,Desktop}.png
```

- [ ] **Step 4: Fix any layout issues found, then commit final fixes**

```bash
git add -p
git commit -m "fix(polish): mobile layout fixes from Playwright audit"
```
