---
name: nido-patterns
description: Essential patterns and "gotchas" for the Nido codebase (Next.js, Supabase, Mapbox, TipTap).
skills: [react-patterns, nextjs-best-practices, database-design]
---

# Nido Project Patterns

> **Context**: Nido is a multi-tenant SaaS for community management.

## 1. Supabase & Multi-Tenancy

### Client-Side Access
ALWAYS use the typed client hook from `@/lib/supabase/client`.
```tsx
import { createClient } from '@/lib/supabase/client'

// Inside component
const supabase = createClient()
```

### Server-Side Access (Server Actions/Components)
Use `@/lib/supabase/server`.
```tsx
import { createClient } from '@/lib/supabase/server'

// Inside async component/action
const supabase = await createClient()
```

### RLS & Tenant Isolation
- **CRITICAL**: Every table has a `tenant_id` column.
- **NEVER** manually filter by `tenant_id` in queries if RLS is enabled (it should be), BUT...
- **ALWAYS** include `tenant_id` when **inserting** data.
```tsx
const { error } = await supabase.from('events').insert({
  ...data,
  tenant_id: tenantId // Mandatory
})
```

## 2. Mapbox Implementation

### Viewer Component
Primary map component: `components/map/MapboxViewer.tsx`
- Uses `react-map-gl`.
- Handles `locations` geojson data.

### Common Gotchas
- **Popup/Marker Z-Index**: Ensure markers don't overlap with the Mobile Dock (z-index issue).
- **Map Resize**: Always invalidate map size when a sidebar toggles.

## 3. TipTap Rich Text

### Content Sanitization
- We use `DOMPurify` before rendering content from TipTap.
- Utility: `lib/sanitize-html.ts`

### Editor Component
- Path: `components/ui/rich-text-editor.tsx`
- Tailwind prose class: `prose prose-stone dark:prose-invert`

## 4. Mobile Web / PWA optimization

### Mobile Dock (`components/ecovilla/navigation/mobile-dock.tsx`)
- Fixed at bottom.
- Ensure strict `pb-[80px]` (padding-bottom) on main page containers so content isn't hidden behind the dock.
- **Safe Area**: Check for `env(safe-area-inset-bottom)` support.

## 🧠 Collective Memory (Learnings)

### [2026-01-19] Postgres Views Security Bypass
**Type**: Gotcha
Standard Views run with the owner's privileges (usually admin), BYPASSING RLS on the underlying tables.
**Fix**: Always use `active_check_ins WITH (security_invoker = true)` to force RLS compliance for the querying user.

### [2026-01-19] Explicit RLS Enablement
**Type**: Gotcha
Creating a table in Supabase/Postgres does NOT enable RLS by default. It defaults to 'disabled', meaning public access (relying solely on application-level filtering).
**Fix**: You must explicitly run `ALTER TABLE x ENABLE ROW LEVEL SECURITY`.

### [2026-01-19] Public Storage Buckets
**Type**: Gotcha
A `public` bucket allows file access via URL without any authentication. `storage.objects` RLS policies (e.g., `bucket_id = 'documents'`) DO NOT protect public buckets from direct URL access.
**Fix**: Use Private buckets for sensitive docs (leases, IDs) and rely on Signed URLs or RLS-protected download endpoints.

### [2026-01-19] The Documentation Triad
**Type**: Pattern
Information must be strictly routed to ensure truthfulness:
1. **Work/Status** → **Jira** (Tickets)
2. **Strategy/Business** → **Google Docs** (Collaboration)
3. **Product Truth/Manuals/Specs** → **Codebase `docs/`** (Docusaurus)
*Never* mix these. Do not put "Plans" in Docusaurus or "Specs" in Google Docs.

### [2026-01-19] Design Truth Location
**Type**: Pattern
Design Principles and Tokens live in **`docs/03-design/`**.
Component Examples and visual testing live in **Storybook**.
Codebase `CODEBASE.md` links these two. There is no other source of design truth.

### [2026-01-19] No Custom Wrappers for UI Libs
**Type**: Anti-Pattern
**Context**: Found `Button.tsx` wrapping Shadcn's simple `cva` with a custom `getButtonStateClasses` logic.
**Problem**: This creates a non-standard abstraction layer ("The Nido Way" vs "The Shadcn Way") that breaks copy-paste compatibility and makes updates painful.
**Rule**: Use Shadcn components exactly as provided. Do not wrap them in "Design System" helper functions.

### [2026-01-19] Production Scaffolding Pollution
**Type**: Anti-Pattern
**Context**: Found `app/test-*` folders committed to the repo.
**Problem**: These create active public routes (e.g. `yoursite.com/test-utils`) that likely contain unoptimized or insecure code.
**Rule**: Playground code goes in `_playground/` (which Next.js ignores) or `stories/`. Never in `app/`.

### [2026-01-19] Client Component Overuse
**Type**: Anti-Pattern
**Context**: 343 files using `"use client"`.
**Problem**: This indicates we are building a Single Page App (SPA) inside the App Router, negating Server Component performance benefits.
**Rule**: Move `"use client"` down to the leaves (buttons, inputs). Do not wrap entire pages or layouts unless they use Context Providers found only in the client.

### [2026-01-19] The dangerousSetInnerHTML Trap
**Type**: Gotcha
**Context**: Found raw HTML rendering in `PriorityFeed.tsx` and `ExchangeListingDetailModal.tsx`.
**Problem**: This acts as an open door for XSS attacks if the content comes from user input (descriptions, comments), bypassing React's built-in escaping.
**Rule**: NEVER use `dangerouslySetInnerHTML` without `DOMPurify.sanitize(content)`.

### [2026-01-19] The Div-Button Trap
**Type**: Gotcha
**Context**: Found `div onClick={...}` used for main interactions in `PriorityFeed.tsx`.
**Problem**: This violates WCAG 2.1 Criteria 2.1.1 (Keyboard). Users cannot tab to it or activate it with Enter/Space, and screen readers treat it as text. Legal compliance failure.
**Fix**: Use `<button>` or `<div role="button" tabIndex={0} onKeyDown={handleKey}>` with proper styles.
