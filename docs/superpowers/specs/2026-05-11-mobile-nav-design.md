# Mobile Navigation Design Spec
**Date:** 2026-05-11
**Project:** ProjectPaw
**Status:** Approved

---

## Overview

Add a production-quality mobile navigation drawer to the existing `NavBar` component. The current navbar hides all links on mobile (`hidden md:flex`) with no fallback — this spec fills that gap with a right-side Sheet drawer, morphing hamburger button, staggered link animations, and full dark premium theme integration.

---

## Scope

**In scope:**
- Hamburger button (mobile only, `md:hidden`) on the right side of the navbar
- shadcn `Sheet` component (right side) containing nav links with icons
- Morphing X animation on the hamburger button
- Staggered fade-up animation on nav links inside the drawer
- Active route indicator (left border + background pill)
- Branded Sheet header (ProjectPaw logo) and footer tagline
- Auto-close on link click and backdrop tap
- Playwright tests on iPhone and desktop viewports

**Out of scope:**
- Auth actions inside the drawer (stays top-right as-is)
- Bottom tab bar
- Sub-menus or nested navigation
- Any changes to desktop navigation

---

## Architecture

**Files changed:**
- `components/nav-bar.tsx` — only file modified; all mobile nav logic lives here
- `components/ui/sheet.tsx` — added via `npx shadcn@latest add sheet`

**Component tree inside NavBar:**
```
NavBar
├── Logo                          (unchanged)
├── Desktop links ul              (unchanged, hidden on mobile)
├── Desktop auth div              (unchanged, hidden on mobile)
└── Mobile right group (md:hidden)
    ├── HamburgerButton           (inline component, morphing X)
    └── Sheet (side="right")
        ├── SheetContent
        │   ├── Sheet header      (ProjectPaw brand mark)
        │   ├── Nav links list    (icon + label, stagger animation)
        │   └── Sheet footer      (tagline)
        └── SheetOverlay          (backdrop, tap-to-close)
```

**State:** Single `const [isOpen, setIsOpen] = useState(false)` in `NavBar`. Sheet's `onOpenChange` drives it. Each nav link's `onClick` calls `setIsOpen(false)`.

---

## Nav Links & Icons

| Route | Label | Lucide Icon |
|-------|-------|-------------|
| `/` | Home | `Home` |
| `/about` | About | `Info` |
| `/gallery` | Gallery | `Images` |
| `/services` | Services | `Scissors` |

Icons: 18px, `text-doggy` on active route, `text-paw/40` otherwise.

---

## Animations

### Hamburger → X Morph
Three `<span>` elements styled as bars. On `isOpen`:
- Top bar: `rotate-45 translate-y-[7px]`
- Middle bar: `opacity-0 scale-x-0`
- Bottom bar: `-rotate-45 -translate-y-[7px]`
- Transition: `duration-300 ease-in-out` on all properties

### Sheet Slide-in
shadcn Sheet uses Radix `DialogContent` with hardware-accelerated `translateX`. Override transition timing by passing `className="duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"` directly to `SheetContent` — scoped to this instance only, does not affect other Sheet uses.

### Nav Link Stagger
Each link animates on Sheet open: `opacity-0 → 1`, `translateY(8px) → 0`.
Delay per item: `50ms × index` (0ms, 50ms, 100ms, 150ms).
Define `@keyframes fadeUp` in `globals.css` and reference it as `animate-fade-up` via Tailwind's `@theme`. Apply per-link delay with `style={{ animationDelay: \`${index * 50}ms\` }}`.

### Backdrop
`bg-black/60 backdrop-blur-sm` behind the Sheet. Provided by shadcn `SheetOverlay`.

---

## Visual Design

| Property | Value |
|----------|-------|
| Sheet width | `280px` (fixed, `w-[280px]`) |
| Sheet background | `bg-[#0f0d09]` |
| Sheet border | `border-l border-paw/[0.08]` |
| Link text | `font-pawprint text-lg font-semibold` |
| Active link | `border-l-2 border-doggy bg-doggy/10 text-paw` |
| Inactive link | `text-paw/60 hover:text-paw hover:bg-paw/[0.04]` |
| Header brand | `font-elegant text-xl font-black text-paw` + PawPrint icon with doggy glow |
| Footer tagline | `"Find your perfect paw match"` — `font-elegant text-sm italic text-paw/30` |
| Hamburger button | `44×44px` touch target, `rounded-lg`, `border border-paw/15` |

---

## Accessibility

- Hamburger button: `aria-label="Open navigation menu"` / `"Close navigation menu"` toggled on state
- Sheet uses Radix Dialog under the hood — focus trap, `Escape` to close, and `aria-modal` are built in
- All links are native `<Link>` elements — keyboard navigable
- Touch targets minimum 44×44px per Apple HIG

---

## Testing (Playwright)

Run in headed mode (`headless: false, slowMo: 500`) so the developer can watch live.

**Test cases:**
1. **Desktop viewport (1280×800)** — hamburger button is not visible; desktop links are visible
2. **iPhone viewport (390×844)** — hamburger button is visible; desktop links are hidden
3. **Open drawer** — tap hamburger, Sheet slides in from right, links visible with icons
4. **Active link highlight** — current route link has doggy border + bg
5. **Navigate via drawer** — tap a link, drawer closes, page navigates
6. **Close via backdrop** — tap outside Sheet, drawer closes
7. **Close via X** — tap hamburger again (now X), drawer closes
8. **Screenshot** — capture both viewports open/closed for visual record

---

## Implementation Order

1. Install shadcn Sheet: `npx shadcn@latest add sheet`
2. Add `useState` for `isOpen` to `NavBar`
3. Build `HamburgerButton` with morphing X
4. Add `Sheet` with `SheetContent` (header, links, footer)
5. Add stagger animation (CSS keyframe or Tailwind)
6. Wire up close-on-navigate and close-on-backdrop
7. Polish: active states, icons, footer
8. Write and run Playwright tests
