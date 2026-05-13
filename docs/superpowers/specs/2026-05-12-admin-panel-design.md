# Admin Panel — Design Spec

**Date:** 2026-05-12
**Status:** Approved

## Overview

A protected `/admin` page where the business owner (single admin) can add, edit, and delete services without touching Supabase directly. The `services` table already exists and is seeded with 7 rows — this feature adds a management UI on top of it.

## Authentication & Authorization

- Admin is identified by email. The admin email is stored in two env vars:
  - `ADMIN_EMAIL` — server-side only, used in API routes
  - `NEXT_PUBLIC_ADMIN_EMAIL` — exposed to the client, used to conditionally show the Admin nav link
- The `/admin` page uses `useAuth()` to get the current user's token and email. On mount:
  - If not initialized → wait
  - If no token → redirect to `/login`
  - If `user.email !== NEXT_PUBLIC_ADMIN_EMAIL` → redirect to `/`
- All mutating API routes verify the token via `supabase.auth.getUser(token)` and compare the resolved email against `process.env.ADMIN_EMAIL`. Mismatch → 403.

## Layout

**Table + Side Drawer.** The page has two regions:

- **Left (main):** A services table listing all services with columns: Name, Price, Duration, Popular, Actions (Edit / Delete).
- **Right (drawer):** A slide-in panel that opens when the admin clicks Edit on a row or clicks "+ Add New". Closing the drawer clears the selection.

On mobile the drawer takes full width (the table is hidden while the drawer is open).

## Edit Form Fields (in drawer)

| Field                  | Input type        | Notes                                                                                                                                   |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Name                   | Text input        | Required                                                                                                                                |
| Price                  | Number input      | In dollars, required                                                                                                                    |
| Duration               | Text input        | Free text: "90 min", "Per night", etc.                                                                                                  |
| Description            | Textarea          | Required                                                                                                                                |
| Icon                   | Button grid       | 7 icon options (scissors, footprints, home, graduation-cap, stethoscope, sun, sparkles) shown as emoji buttons. One selected at a time. |
| Color theme (gradient) | Color swatch grid | 7 preset gradients matching existing services. Stored as Tailwind gradient class string.                                                |
| Popular                | Toggle switch     | Marks service with "Popular" badge on public page                                                                                       |

The `type` field is derived from the name (lowercased, spaces → hyphens) on the server when creating. `sort_order` is set to the current max + 1 on create; not editable.

## API Routes

### `POST /api/services`

Creates a new service. Body: `{ name, price, duration, description, icon_key, gradient, popular }`.

- Derives `type` from name
- Sets `sort_order` to max existing + 1 (queried via `SELECT MAX(sort_order) FROM services` in the same API handler)
- Returns the created service row

### `PATCH /api/services/[id]`

Updates an existing service. Body: any subset of `{ name, price, duration, description, icon_key, gradient, popular }`.

- Returns the updated service row

### `DELETE /api/services/[id]`

Deletes a service. Returns `{ success: true }`.

All three routes:

1. Verify Bearer token via `supabase.auth.getUser(token)`
2. Compare email against `process.env.ADMIN_EMAIL` → 403 if mismatch
3. Use `supabaseAdmin` client for DB mutations (bypasses RLS)

## Data Flow

### Page load

1. Auth check (redirect if not admin)
2. Fetch services from Supabase via the existing public client (same as services page)
3. Render table

### Edit

1. Click "Edit" → `selectedService` state set → drawer opens pre-filled
2. Admin edits → "Save Changes" → `PATCH /api/services/[id]`
3. Success → update service in local state array, close drawer
4. Error → show inline error in drawer (do not close)

### Add

1. Click "+ Add New" → drawer opens with blank fields (no `selectedService`)
2. Fill in → "Save" → `POST /api/services`
3. Success → append new service to local state, close drawer
4. Error → inline error in drawer

### Delete

1. Click "Del" → `window.confirm("Delete this service?")`
2. Confirmed → `DELETE /api/services/[id]`
3. Success → remove from local state
4. Error → inline alert

## Files Changed

### New files

| File                             | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `app/admin/page.tsx`             | Admin page — auth gate + table + drawer (all in one file) |
| `app/admin/loading.tsx`          | Skeleton loader                                           |
| `app/api/services/route.ts`      | POST (create)                                             |
| `app/api/services/[id]/route.ts` | PATCH (update) + DELETE                                   |

### Modified files

| File                     | Change                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| `components/nav-bar.tsx` | Add "Admin" link, visible only when `user.email === NEXT_PUBLIC_ADMIN_EMAIL` |
| `.env.local`             | Add `ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_EMAIL`                              |

## Preset Gradients

Stored as Tailwind class strings. The 7 presets (matching existing services):

```
from-pink-500 to-rose-500
from-emerald-500 to-teal-500
from-blue-500 to-indigo-500
from-amber-500 to-yellow-500
from-red-500 to-orange-500
from-violet-500 to-purple-500
from-cyan-500 to-sky-500
```

## Out of Scope (deferred)

- Reordering services (drag-and-drop or up/down arrows)
- Viewing bookings per service in the admin panel
- Soft delete (services are hard-deleted for now)
- Multi-admin support
