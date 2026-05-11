# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context
This is a dog services booking platform built with Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase, and shadcn/ui.

## App Description
A dog services booking platform where users can browse grooming, boarding, training, walking, vet, daycare, and custom services, create an account, and book appointments. Booking confirmation emails are sent via Nodemailer via `POST /api/bookings/email`.

## Technical Stack
- Framework: Next.js 15 (actually 16.2.6) with App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4 + shadcn/ui
- Database & Auth: Supabase
- Package manager: npm

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
```

No test runner is configured yet. When adding tests, use Vitest + React Testing Library per AGENTS.md.

## Architecture

### Auth
Auth is client-side only via `contexts/auth-context.tsx`. It stores `{ name, email }` + a token in `localStorage` under keys `doguser` and `token`. `AuthProvider` wraps the entire app in `app/layout.tsx`. Any component that needs the current user or token calls `useAuth()`. There is no Supabase session integration yet — this is a placeholder auth layer.

### Booking Flow
`app/services/page.tsx` is a client component that renders all 7 services as a static `SERVICES` array (no database fetch yet). When a logged-in user clicks "Book Now", it opens `components/booking-modal.tsx`, which POSTs to `/api/bookings/email` with `{ serviceId, serviceName, dogName, datetime, notes }` and a Bearer token header.

### Theme & Fonts
All custom tokens live in `app/globals.css` under `@theme inline`:
- Colors: `paw-light` (#FDF6F0), `paw` (#F5CBA7), `paw-dark` (#A67C52), `doggy` (#B2A4FF), `accent` (#F9D923)
- Fonts: `font-elegant` → Playfair Display, `font-pawprint` → Baloo 2
- Dark mode uses the `.dark` class variant (toggled manually via `localStorage` in `components/nav-bar.tsx`)

### Routing
All routes are under `app/`. Every route has a `loading.tsx` skeleton. Current routes: `/`, `/about`, `/gallery`, `/services`, `/login`, `/signup`.

### Import Alias
Use `@/` for all absolute imports (maps to project root).

## Custom Theme
- Colors: paw (tan), doggy (#B2A4FF purple), accent (#F9D923 yellow)
- Fonts: Playfair Display (font-elegant), Baloo 2 (font-pawprint)

## Development Approach
- Always follow the Superpowers methodology
- Always reference AGENTS.md for all coding rules
- Use server components by default
- Mobile first responsive design
- Accessibility first

## End of Session
When the user says they are done or are ending the session, always save memory before they leave:
1. Update `memory/project_status.md` with what was completed and what's still pending
2. Update `memory/feedback.md` with any new preferences or corrections from this session
3. Update `memory/user_profile.md` if anything new was learned about the user
4. Confirm to the user that memory has been saved
