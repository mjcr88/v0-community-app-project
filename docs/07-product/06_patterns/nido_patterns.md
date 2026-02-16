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

### [2026-01-21] Mapbox Satellite Label Contrast
**Type**: Pattern
**Context**: Lot labels were illegible on Satellite view (variegated dark/light background).
**Problem**: Standard white or green text gets lost against complex satellite imagery.
**Fix**: Use **Dark Text** (`#111827`) with a **Thick White Halo** (`width: 2`). This high-contrast combination works on almost any background map style.

### [2026-01-21] Date Picker UTC Snapping
**Type**: Gotcha
**Context**: `RequestBorrowDialog` was saving dates as UTC midnight, causing them to appear as "Yesterday" in Western timezones (e.g., -6h).
**Problem**: Javascript generic `Date` objects often zero out time in UTC, which shifts the day when viewed in local time.
**Fix**: Explicitly handle local timezone rendering or strip time components safely before saving to ensure the calendar date remains stable.

### [2026-01-21] Jira API Group Visibility
**Type**: Gotcha
**Context**: Automated Jira comments failed with `GROUP_VISIBILITY_SETTING_NOT_ENABLED`.
**Problem**: The "Developers" group name is not standard across all Atlassian Cloud instances or may not have `comment` permissions enabled by default configuration.
**Fix**: Use `site-admins` for visibility restrictions or omit the `commentVisibility` parameter to default to internal/public based on project settings.

### [2026-01-21] Lender Self-Notification Pattern
**Type**: Pattern
**Context**: Lenders couldn't easily find the transaction to "Mark Returned" after confirming pickup because it disappeared from their actionable feed.
**Problem**: Bilateral actions (like Pickup) usually only notify the *other* party.
**Fix**: When an action enables a subsequent step (like "Mark Returned"), generate a **Self-Notification** for the actor. This bumps the item to the top of their feed, making the next step immediately accessible.

### [2026-01-21] Map Point Distribution Logic
**Type**: Pattern
**Context**: Multiple check-ins at the same "Community Hub" created overlapping markers that flickered (z-fighting) and were impossible to select individually.
**Problem**: Pins on exact same coordinates obscure each other.
**Fix**: Use a **Circular Distribution Algorithm** (Radius ~8m). If multiple points share coordinates, spread them out by calculating offsets: `lat + radius * cos(angle)`, `lng + radius * sin(angle)`. This ensures visibility without distorting the true location significantly.

### [2026-01-21] Native Migration Blockers
**Type**: Architectural Constraint
**Context**: Next.js Server Actions ("use server") and Radix UI ("shadcn") are functionally incompatible with React Native/Expo.
**Problem**: Client components importing server code cannot be bundled for native. HTML-based primitives (Radix) crash in Native View hierarchies.
**Strategy**: Native Migration is a **Rewrite**, not a Port. It requires a Monorepo with a shared business logic package, a dedicated API layer (tRPC/REST) to replace Server Actions for the native app, and a "Universal UI" library (NativeWind/Reusables) to replace Radix.

### [2026-01-26] Inventory Race Conditions
**Type**: Gotcha
**Context**: `confirmBorrowRequest` checked quantity (`SELECT`) then decremented it (`UPDATE`) in separate queries.
**Problem**: In high-concurrency (or malicious) scenarios, two requests can pass the check simultaneously, driving inventory negative (classic TOCTOU).
**Fix**: Use Atomic Updates. `UPDATE items SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`. Never check-then-set in code for critical resources.

### [2026-01-26] Infinite Supply Logic Flaw
**Type**: Anti-Pattern
**Context**: Exchange logic restored inventory for *all* items upon "Pickup", assuming a cycle (Borrow -> Return).
**Problem**: Consumable or one-way items (Food, services) should *not* restore inventory. This created an infinite supply exploit.
**Fix**: Business logic must explicitly categorize inventory flow types (Cyclic vs. Linear) and handle state transitions accordingly.

### [2026-01-26] Tailwind Schizophrenia
**Type**: Gotcha
**Context**: Project used `tailwind.config.ts` (v3 format) while importing Tailwind v4 CSS.
**Problem**: v4 expects CSS-first configuration. Feeding it a legacy TS config forces compatibility mode, slowing builds and causing double-processing of utilities.
**Fix**: Migrate fully to v4. Move tokens to `globals.css` `@theme` block and delete `tailwind.config.ts`.

### [2026-01-26] The Mapbox Monolith
**Type**: Pattern
**Context**: `MapboxViewer` imported `react-map-gl` and `turf` directly in `app/`.
**Problem**: This bundles the entire GIS stack (800KB+) into the main entry chunk or layout bundle, slowing down pages that don't even show the map.
**Fix**: **MANDATORY**: Always lazy load heavy UI libs.
```tsx
const MapboxViewer = dynamic(() => import('./MapboxViewer'), { 
  ssr: false, 
  loading: () => <Skeleton /> 
})
```


### [2026-01-26] Unprotected Service Role Usage
**Type**: Anti-Pattern
**Context**: Found `/api/link-resident` using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, but verified NO user session or permissions.
**Problem**: This allows any anonymous user to trigger admin-level actions (data deletion, account takeover) just by guessing the endpoint.
**Rule**: NEVER use `service_role` in an API route without first verifying `supabase.auth.getUser()` AND checking the user's role (e.g. `is_tenant_admin`).

### [2026-01-26] The 'Ignore Build Errors' Trap
**Type**: Anti-Pattern
**Context**: `next.config.mjs` had `eslint: { ignoreDuringBuilds: true }` and `typescript: { ignoreBuildErrors: true }`.
**Problem**: This silences critical security warnings (like `dangerouslySetInnerHTML`) and type safety checks during deployment, allowing vulnerabilities to ship to production.
**Rule**: Never enable these flags in production. If the build fails, fix the code.

### [2026-01-26] The Zombie Toolchain
**Type**: Gotcha
**Context**: Project had Storybook, Chromatic, and Playwright installed but "sleeping" in the garage.
**Problem**: Tools without enforcement are just npm bloat.
**Learning**: World-class quality comes from *orchestration* (CI/CD enforcement), not just installation. If a tool is in `package.json`, it MUST run in CI.

### Empty States
- **Standard Component**: Always use `RioEmptyState` (from `@/components/dashboard/rio-empty-state`) for empty states in dashboard widgets and lists.
- **Visual**: Use the "Rio Confused" image (`rio_no_results_confused.png`).
- **Functionality**: Retain primary action buttons (e.g., "Create", "Browse") within the empty state to guide users.
- **Consistency**: Avoid manual implementations of empty states with custom images or layouts.

### User Interface
### [2026-02-06] Geolocation "Lazy Enable" Pattern
**Type**: Pattern
**Context**: Issue #86 (User Location Beacon).
**Problem**: Requesting location permissions on page load (useEffect) causes high rejection rates ("Permission Fatigue") and poor UX.
**Rule**: NEVER prompt for sensitive permissions (Location, Camera, Mic) on mount. ALWAYS require a user interaction (Click "Find Me") to trigger the permission prompt.
**Implementation**: Use a hook that monitors permission state but only triggers `navigator.geolocation.getCurrentPosition` inside an `enable()` function bound to a button handler.

### [2026-02-07] Event Bus Sync
**Type**: Pattern
**Context**: Issue #78 (RSVP Sync). Independent widgets (Priority Feed, Upcoming List) needed to share ephemeral state without a global store (Redux) or deep Context prop-drilling.
**Problem**: RSVPing in one widget left the others stale until a full page refresh or server revalidation (slow).
**Solution**: Use a lightweight, typed Custom Event Bus: `window.dispatchEvent(new CustomEvent('rio-sync', { detail: payload }))`.
**Rule**: Use only for **ephemeral, cross-widget UI state** (like optimistic updates). Do not use for critical business logic or data persistence. Always namespace events (e.g., `rio-series-rsvp-sync`).
**Cleanup**: MUST remove event listeners in `useEffect` return function to prevent memory leaks (`window.removeEventListener`).

### [2026-02-11] Mobile Wrapper Structural Parity
**Type**: Anti-Pattern
**Context**: Issue #69 (Tab Alignment). Tabs used `grid-cols-3 w-full` but were wrapped in a scroll container (`overflow-x-auto -mx-4 px-4`) that the adjacent search bar did not have.
**Problem**: On mobile, the extra wrapper created a different layout context. The negative margin shifted the container, and `overflow-x-auto` turned it into a scroll box that prevented the grid from expanding to full width. Fix appeared correct in code and production build CSS, but was invisible on mobile.
**Rule**: When UI elements must visually align, they MUST share the same wrapper structure. Never add mobile-specific wrappers (`-mx-*`, `overflow-x-auto`) to only one element in a group. If horizontal scrolling is needed, apply it consistently or use a shared component.
**Debugging**: Use `node -e "const { twMerge } = require('tailwind-merge'); console.log(twMerge(defaults, overrides))"` to verify class resolution when `cn()` overrides aren't working as expected.

### [2026-02-12] RLS Infinite Recursion
**Type**: Anti-Pattern
**Context**: Issue #72 (Admin Resident Creation). Failed with `infinite recursion detected in policy for relation "users"`.
**Problem**: RLS policies on the `users` table used subqueries that selected from `users` (e.g., checking if `auth.uid()` is a tenant admin). This triggers the policy again, creating an infinite loop.
**Fix**: Encapsulate the permission check in a `SECURITY DEFINER` function (e.g., `is_tenant_admin_of_tenant`). This runs with the creator's privileges, bypassing RLS for that specific check and breaking the recursion.

### 11. Radix UI / Shadcn UI Gotchas

#### Dialogs inside DropdownMenus
**Problem:** Rendering a `Dialog` inside a `DropdownMenuItem` can cause focus management issues, specifically blocking the "Space" key (which triggers the menu item) from working in inputs within the Dialog.
**Solution:**
1.  **Lift State Up:** Manage the `Dialog`'s open state in the parent component (e.g., `isOpen`, `setIsOpen`).
2.  **Separate Components:** Render the `DropdownMenuItem` solely as a trigger that sets the state.
3.  **Render Outside:** Render the `Dialog` component *outside* of the `DropdownMenu` content, passing the controlled state to it.

```tsx
// ❌ Avoid this pattern
<DropdownMenu>
  <DropdownMenuContent>
    <DropdownMenuItem>
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>...</DialogContent>
      </Dialog>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// ✅ Use this pattern
const [open, setOpen] = useState(false)
return (
  <>
    <DropdownMenu>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          Open Dialog
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>...</DialogContent>
    </Dialog>
  </>
)
```
