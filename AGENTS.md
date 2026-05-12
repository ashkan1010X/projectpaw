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

**During implementation:** Use `mcp__ruflo__memory_store` to store project-specific knowledge (component patterns, API decisions, gotchas) as you discover them.

**At the end of every session:** Store all learned patterns into Ruflo before the session ends:
1. `mcp__ruflo__agentdb_pattern-store` — for reusable code patterns, error recoveries, and architectural decisions
2. `mcp__ruflo__memory_store` (namespace: `projectpaw`) — for project-specific context, component details, and implementation notes

**Before starting any task:** Search Ruflo first with `mcp__ruflo__memory_search` or `mcp__ruflo__agentdb_pattern-search` to check if relevant patterns already exist — never re-derive what Ruflo already knows.

The goal is continuous growth: every session should leave Ruflo smarter than it started.

## Code Quality
- Always handle loading and error states
- Never use any
- Use semantic HTML elements
- Before writing code, do a deep-dive review between <CODE_REVIEW> tags
- After review, produce a plan in <PLANNING> tags
- When there is a security risk, show reasoning between <SECURITY_REVIEW> tags
