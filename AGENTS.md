<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Rules

## Stack

Next.js 15 with App Router, TypeScript, Tailwind CSS v4, shadcn/ui

## Language

- Always use TypeScript, never plain JavaScript
- Apply the TypeScript skill (~/.claude/skills/typescript/SKILL.md) for all TypeScript work — strict types, no enums, no any, use satisfies, discriminated unions, utility types, and type guards

## Styling

- Always use Tailwind for styling, never plain CSS or inline styles
- Apply the Tailwind CSS v4 skill (~/.claude/skills/tailwind-css-v4/SKILL.md) for all Tailwind work

## Components

- Use server components by default, only use client components when needed
- Keep components small and single responsibility
- Always use kebab-case for component file names

## Next.js App Router

- Apply the Next.js skill (~/.claude/skills/nextjs/SKILL.md) for all Next.js work
- Default to Server Components — only add use client when interactivity or browser APIs are required
- Always await params before accessing values (Next.js 15+ requirement)
- Use Server Actions for mutations, not API routes, unless an external client needs to call the endpoint
- Always implement Suspense boundaries for any slow or independent data fetches
- Use middleware for auth guards, redirects, and locale handling
- Always provide loading.tsx, error.tsx, and not-found.tsx alongside every route

## Data & Auth

- Use Supabase for database and auth
- Always use the Supabase plugin skill for all Supabase work
- Always use the Postgres Best Practices plugin skill for all database queries and schema design

## UI & Design

For every UI task always follow this two-step workflow in order:

Step 1 — Design system (ui-ux-pro-max): Invoke the ui-ux-pro-max skill (~/.claude/skills/ui-ux-pro-max/SKILL.md) first. Select the style, color palette, typography, and UX patterns. Output a design brief.

Step 2 — Implementation (frontend-design): With the design brief, invoke the frontend-design skill (~/.claude/skills/frontend-design/SKILL.md) to implement the UI.

These two skills must always be used together in this order.

## Component Library

- Always use shadcn/ui for UI components
- Apply the shadcn/ui skill (~/.claude/skills/shadcn/SKILL.md) for all shadcn work
- Install components using: npx shadcn@latest add [component-name]
- Never build a component from scratch if shadcn/ui already has it

## Validation

- Apply the Zod skill (~/.claude/skills/zod/SKILL.md) for all validation work
- Use Zod for all form validation and environment variable validation
- Always use z.infer<typeof schema> to derive TypeScript types
- Always use .safeParse() in server code
- Use zodResolver from @hookform/resolvers/zod for React Hook Form

## Testing

- Apply the Vitest + RTL skill (~/.claude/skills/vitest/SKILL.md) for all test work
- Use the AAA pattern for all tests
- Query by role and accessibility attributes — never by class or id
- Always test loading, error, and success states

## Mobile-First — MANDATORY FOR EVERY FEATURE

Every feature that touches UI **must** include a mobile pass before it is considered done. This is not optional.

**Required viewports to verify:** Galaxy S20 (360px), iPhone SE (375px), iPhone 14 (390px), iPad (768px), Desktop (1280px).

**Process after every UI feature:**

1. Run Playwright with `headless: false` across all 5 viewports — take screenshots
2. Review every screenshot for: text overflow/truncation, broken flex/grid layouts, buttons too small or clipped, unreadable font sizes, overlapping elements
3. Fix any issues found before committing
4. Use the `playwright-skill` skill for all Playwright work

**Industry-standard mobile rules to enforce:**

- Touch targets minimum 44×44px (buttons, links)
- No horizontal scrolling on any viewport
- Text never truncates to `...` unless intentional — prefer wrapping or responsive font size
- Stacked layouts on mobile (`flex-col sm:flex-row`) instead of forcing inline
- Stats/grid rows: use `grid-cols-2 sm:grid-cols-3` when 3-col is too tight at 360px
- All interactive elements have `aria-label` for screen readers
- Avoid fixed widths — use `min-w-0` on flex children to allow shrinking

**This rule applies to:** new pages, new components, new buttons/forms, layout changes, any change that modifies visual structure.

## Linting & Formatting

- Always run npm run lint before committing
- Always run npm run format before committing
- Prettier config lives in .prettierrc — never override inline
- No unused variables, imports, or dead code
- No console.log in production code
- Always use absolute imports with @ alias

## Git Workflow

AGENTS: Before every git commit, stop and re-read this entire section.

Branching:

- Always branch from main: feature/feature-name, fix/bug-name, chore/task-name
- Never commit directly to main
- One branch per feature or fix

Commits:

- Follow Conventional Commits: type(scope): description
- Types: feat, fix, refactor, test, chore, docs, style, perf
- Description: lowercase, present tense, no period
- Use git add -p — never git add .
- Maximum 72 characters in commit subject line

Post-Commit Report — after every git commit and git push, always report:

1. Exact commit message
2. Files committed
3. Short commit hash
4. Confirmation push succeeded

Never do this:

- Never use vague messages like fix, update, changes
- Never commit node_modules or .env files
- Never force push to main
- Never merge with failing tests

## Development Methodology

- Always use the Superpowers methodology
- Before writing any code: brainstorm first, write a spec, create a plan, use TDD

## Ruflo Memory — MANDATORY

Ruflo must be used in every session. This is non-negotiable.

**After every completed feature or fix (mandatory, not just end of session):** Immediately call both:

1. `mcp__ruflo__agentdb_pattern-store` — what was built, what pattern was used, any gotchas
2. `mcp__ruflo__memory_store` (namespace: `projectpaw`) — project-specific context and decisions

Do not wait until end of session. Store immediately when the feature works.

**During implementation:** Use `mcp__ruflo__memory_store` to store project-specific knowledge (component patterns, API decisions, gotchas) as you discover them.

**At the end of every session:** Store all learned patterns into Ruflo before the session ends:

1. `mcp__ruflo__agentdb_pattern-store` — for reusable code patterns, error recoveries, and architectural decisions
2. `mcp__ruflo__memory_store` (namespace: `projectpaw`) — for project-specific context, component details, and implementation notes

**Before starting any task:** Search Ruflo first with `mcp__ruflo__memory_search` or `mcp__ruflo__agentdb_pattern-search` to check if relevant patterns already exist — never re-derive what Ruflo already knows.

The goal is continuous growth: every session should leave Ruflo smarter than it started.

## Model Selection

- Default to Sonnet 4.6 for all implementation work (API routes, components, tests, commits)
- Only request Opus 4.7 when the task genuinely requires deep reasoning: complex architecture decisions, ambiguous multi-system problems, or when stuck after multiple failed attempts
- Always tell the user explicitly: "This task needs Opus 4.7" before switching — never switch silently

## Top-Tier UI Details — MANDATORY

Every UI feature must meet the standard of the best production apps (Airbnb, Linear, Stripe, Notion). Never ship the "good enough" version when the top-tier version takes 5 minutes more.

**Form inputs:**

- Use `<input type="text">` for single-sentence fields — never `<textarea>` for data that is conceptually one line. Textarea implies multi-paragraph content.
- Sanitize text on save: `value.replace(/\s+/g, ' ').trim()` — collapse all whitespace/newlines before writing to the DB. Never trust raw textarea output.
- Per-field validation: `onBlur` sets the error, `onChange` clears it. Never validate only on submit. Show the error message inline below the field, not in a toast or at the top of the form.
- Red border (`border-red-500/60`) + small red message below the field — not a generic "form has errors" banner.

**Dialogs and confirmations:**

- Never use `window.confirm`, `window.alert`, or `window.prompt` — always use the branded `<ConfirmDialog>` component.
- Destructive actions (delete, cancel booking) use the red/`destructive` variant with `AlertTriangle` icon.
- Non-destructive confirmations use the `Info` icon and doggy color.
- Always include: focus trap, Escape to close, focus restored to trigger element on close, `type="button"` on all dialog buttons.

**Loading states:**

- Never return `null` while loading — always show a skeleton.
- Skeletons use `animate-pulse` with `bg-paw/[0.08]` (dark-theme shimmer, not white flash).
- Match the skeleton shape to the actual content layout.

**Cursor behavior (non-negotiable):**

- Every `button`, toggle (`[role="switch"]`), and interactive label must show `cursor-pointer` — this is set globally in `globals.css` and must never be overridden to `cursor-default`.
- Disabled buttons/inputs must show `cursor-not-allowed` — also set globally.
- Never add a new interactive element without verifying the cursor changes on hover.

**Accessibility (non-negotiable):**

- Every interactive element that doesn't have visible text must have `aria-label`.
- When a page has dual mobile/desktop layouts in the DOM, both versions need `aria-label` — Playwright `.first()` picks the hidden one otherwise.

## Code Quality

- Always handle loading and error states
- Never use any
- Use semantic HTML elements
- Before writing code, do a deep-dive review between <CODE_REVIEW> tags
- After review, produce a plan in <PLANNING> tags
- When there is a security risk, show reasoning between <SECURITY_REVIEW> tags
