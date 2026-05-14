# User Profile Page — Implementation Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** A `/profile` page where logged-in users can view and edit their personal info and dog details, with photo upload to Supabase Storage and a nav pill dropdown for access.

**Architecture:** Supabase `profiles` table (linked to `auth.users` by `user_id`) stores all profile data. Client-side direct upload to Supabase Storage bucket `dog-photos`. Two API routes (`GET /api/profile`, `PATCH /api/profile`). Nav pill dropdown replaces the static "Hi, name" text in `nav-bar.tsx`.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (DB + Storage), Tailwind CSS v4, shadcn/ui, Lucide icons

---

## Data Layer

### Supabase `profiles` table

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  dog_name TEXT,
  dog_breed TEXT,
  dog_age TEXT,
  dog_photo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Supabase Storage bucket `dog-photos`

- Public read (so `getPublicUrl()` works without auth)
- Authenticated write (RLS policy: users can only write to `{user_id}/*`)
- File path convention: `{user_id}/{timestamp}.{ext}` (prevents collisions)
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB (enforced client-side before upload)

Storage RLS policy:
```sql
CREATE POLICY "Authenticated users can upload their own dog photo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can read dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

CREATE POLICY "Users can delete own dog photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## API Routes

### `GET /api/profile`

- Auth: Bearer token required
- Fetches row from `profiles` where `user_id = user.id`
- Returns `{ profile: ProfileRow | null }` — null means no profile row yet (first visit)
- Also returns `email` and `name` from `user.email` / `user.user_metadata.name`

### `PATCH /api/profile`

- Auth: Bearer token required
- Body: `{ phone?, address?, dog_name?, dog_breed?, dog_age?, dog_photo_url? }`
- Uses `supabaseAdmin.from('profiles').upsert({ user_id: user.id, ...body })`
- Returns `{ success: true }`
- Does NOT update `name` here — name is updated separately via `supabase.auth.updateUser({ data: { name } })` using the user's own token (not admin)

---

## Files

### New files
- `app/profile/page.tsx` — client component, auth-gated
- `app/profile/loading.tsx` — skeleton matching the two-column layout
- `components/dog-photo-upload.tsx` — circular upload component (photo, spinner, paw placeholder, camera badge)
- `components/toast.tsx` — lightweight toast notification (bottom-right, 3s auto-dismiss, success/error variants)
- `app/api/profile/route.ts` — GET + PATCH handlers

### Modified files
- `components/nav-bar.tsx` — replace "Hi, name" + logout button with pill dropdown
- `components/booking-modal.tsx` — read `dog_name` from profile API on open, pre-fill the dog name field
- `contexts/auth-context.tsx` — add `updateName(name: string)` helper so profile save can sync the displayed name

---

## Page: `/profile`

### Layout (desktop: two-column, mobile: single-column stack)

**Left column — Personal Info:**
- Full Name — editable text input (also updates `user_metadata.name` on save)
- Email — view-only, dashed border, "locked" badge
- Phone — editable
- Address — editable

**Right column — My Dog card:**
- Gradient card (`rgba(178,164,255,0.07)` background, `rgba(178,164,255,0.15)` border)
- Centered 108px circular photo with camera badge (📷) at bottom-right
  - No photo: paw placeholder (🐾), dashed purple border
  - With photo: shows image, hover reveals camera overlay to replace
  - Uploading: spinner overlay on the circle, button disabled
- Dog's Name — full-width input
- Breed + Age — 2-column grid inputs

**Footer:**
- Left: success toast slot ("✓ Profile saved" in emerald, fades out after 3s)
- Right: Cancel button + Save Changes button (purple gradient, shadow)

### Behaviour

1. Page loads → `GET /api/profile` → fields populated (empty placeholders if no profile yet)
2. User edits any field → local state only (no auto-save)
3. User clicks photo circle → hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` triggered
4. File selected →
   - Client-side size check (> 5MB → error toast, stop)
   - `FileReader.readAsDataURL` → instant local preview (before upload)
   - Upload to Supabase Storage at `{user_id}/{Date.now()}.{ext}`
   - Delete old photo if `dog_photo_url` exists (Supabase Storage `remove()`)
   - Get public URL → update local `dogPhotoUrl` state
5. User clicks Save Changes →
   - `PATCH /api/profile` with all fields
   - If name changed → `supabase.auth.updateUser({ data: { name } })`
   - On success: show toast "✓ Profile saved", call `auth.updateName(name)` to sync nav
   - On error: show error toast "Failed to save — try again"
6. Cancel → reset local state to last saved values

### Auth guard
If `!user || !token` after `initialized`, redirect to `/login`.

---

## Component: `DogPhotoUpload`

```typescript
interface DogPhotoUploadProps {
  currentUrl: string | null;
  userId: string;
  token: string;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
}
```

- Wraps a hidden `<input type="file">` triggered by clicking the circle
- Handles: size validation, FileReader preview, Supabase Storage upload, old photo deletion
- Shows spinner overlay during upload
- Self-contained — parent only receives the final public URL via `onUpload`

---

## Component: `Toast`

```typescript
interface ToastProps {
  message: string;
  variant: 'success' | 'error';
  onDismiss: () => void;
}
```

- Fixed bottom-right (`fixed bottom-6 right-6 z-50`)
- Auto-dismisses after 3000ms via `useEffect`
- Animate in: slide up + fade in. Animate out: fade out
- Success: emerald border + text. Error: red border + text.

---

## Nav Pill Dropdown

Replace the current desktop "Hi, name" + Dashboard/Admin/Logout buttons with:

```
[A] Ashkan ▾   ← pill button, opens dropdown on click
```

Dropdown menu (absolute positioned, right-aligned):
- My Profile → `/profile`
- My Bookings → `/dashboard`
- Admin → `/admin` (only if `user.email === ADMIN_EMAIL`)
- Divider
- Logout

Mobile drawer: existing drawer structure unchanged (Dashboard + Admin + Logout links already there). Add "My Profile" link to the mobile drawer's user section.

The dropdown closes on: clicking outside (click-outside handler), pressing Escape, or selecting any item.

---

## Booking Modal Auto-fill

In `BookingModal`, on mount fetch `GET /api/profile`. If `profile.dog_name` exists and `initialDogName` prop is empty, pre-fill the dog name field.

Only pre-fill if the user hasn't already provided an `initialDogName` (rebook flow passes one in).

---

## Loading Skeleton (`app/profile/loading.tsx`)

Two-column skeleton matching the layout:
- Left: 4 field skeletons (label + input bar, `animate-pulse bg-paw/[0.08]`)
- Right: centered circle skeleton + 3 field skeletons

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Profile fetch fails | Show inline error, fields empty but editable |
| File > 5MB | Error toast immediately, no upload started |
| Upload to Storage fails | Error toast, photo reverts to previous |
| PATCH /api/profile fails | Error toast "Failed to save — try again" |
| Name update fails | Log error, profile still saved (non-blocking) |

---

## Spec Self-Review

**Placeholder scan:** No TBDs or TODOs. All fields, behaviours, and error cases specified.

**Internal consistency:** `DogPhotoUpload` receives `userId` and `token` — both available from `useAuth()` in the profile page. `PATCH /api/profile` uses `supabaseAdmin` for the profiles upsert (consistent with other admin routes). Name update uses user's own token (correct — `updateUser` requires the user's JWT, not the service role key).

**Scope check:** Single focused feature. No scope creep.

**Ambiguity check:** "Cancel resets to last saved values" — means a `savedProfile` ref is kept alongside the editable `form` state. Reset on cancel copies `savedProfile` → `form`. Clarified.
