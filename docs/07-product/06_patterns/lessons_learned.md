# Lessons Learned & "Gotchas"

## Supabase / PostgreSQL

### 1. Migrating Auth Users (Preserving UIDs)
**Context:** When moving users from Production to Development (or Staging), you must preserve their `auth.users.id` (UUID) because `public` tables (like `profiles`, `users`) reference this ID as a Foreign Key.

**The Gotcha:**
Using the Supabase Python SDK (or GoTrue API), `admin.create_user()` logic is strict:
- If you pass `uid="..."`, it **IGNORES** it and generates a random new UUID.
- You **MUST** pass `id="..."` to force the specific UUID.

**Incorrect (Generates Random ID):**
```python
supabase.auth.admin.create_user({
    "uid": "a3b2...", # IGNORED
    "email": "..."
})
```

**Correct (Preserves ID):**
```python
supabase.auth.admin.create_user({
    "id": "a3b2...", # RESPECTED
    "email": "..."
})
```
**Impact:** If missed, the User logs in successfully (new ID), but queries to `public.users` fail (RLS blocks access) because the authenticated ID doesn't match the existing foreign key record.

### 5. Testing Supabase Clients in Vitest
**Context:** Supabase JS client v2 returns a "thenable" object (Promise-like) from `createServerClient`.
**The Gotcha:**
- If you mock the client itself as "thenable" (having a `.then` method), `await createServerClient()` will try to resolve it immediately during initialization.
- If you mock chained methods like `.from().select()` by returning `this`, the client itself becomes the query builder.
- **Pattern:** Always separate the `client` (not thenable) from the `queryBuilder` (thenable) in your mocks. Use `vi.hoisted` to ensure the mock factory runs before imports.

## GeoJSON & Map Data

### 2. DB Constraints vs UI Options
**Context:** When using strict Postgres `CHECK` constraints (e.g., `valid_path_surface`), the Frontend validation/options must be _identical_ to the DB allowed values.
**The Gotcha:**
- DB had `CHECK (path_surface IN ('paved', 'natural', ...))`
- UI had "Mixed" option.
- Result: Silent 500 errors on save.
**Pattern:** Always check `information_schema.check_constraints` when adding new dropdowns.

### 3. Server Action Types for Legacy Schema
**Context:** Some legacy columns might be `text` even if they store numbers (e.g., `path_length` as "1200").
**The Gotcha:**
- Client sends `number` (1200).
- Server Action typed as `number`.
- DB insertion fails or requires cast if ORM is strict.
**Pattern:** Server Action input types should be loose (`string | number`) to accept client data, then explicitly cast/validate before DB insertion.

### 4. Next.js Cache Invalidation for Admin Dashboards
**Context:** Next.js App Router aggressively caches GET requests.
**The Gotcha:** Admin makes a change -> Refresh -> Old data shows.
**Pattern:** For "Live" dashboards, always explicitly set `export const dynamic = 'force-dynamic'` or use `revalidatePath` on the Server Action.

### 6. Mobile Wrapper Div Misalignment (Issue #69)
**Context:** Tab alignment fix (`grid-cols-3`) worked on desktop but was invisible on mobile.
**The Gotcha:** The `TabsList` was wrapped in an extra `<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">` that the search bar above it did not have. On mobile, this created a different layout context (scroll container + negative margin), causing the grid to not fill width properly despite `w-full` being set.
**Pattern:** When two UI elements must visually align (e.g., search bar + tabs), they **must** share the same wrapper structure. Never add mobile-specific wrappers (`-mx-*`, `overflow-x-auto`, `no-scrollbar`) to only one of them.
**Debugging Tip:** When a Tailwind fix works on desktop but not mobile, run `tailwind-merge` output through `node -e` to verify class resolution, then check the **wrapper divs** for mobile-only classes.

### [2026-02-16] Middleware Session Grace Period (Issue #108)
**Type**: Pattern
**Context**: Middleware checks `last-active` cookie to enforce inactivity timeouts.
**The Gotcha**: Upon a fresh login, the browser sends the request *before* the `last-active` cookie is set/propagated, causing the middleware to see "No Cookie" -> "Inactive" -> "Logout", triggering a loop or double-login friction.
**Pattern**: Trusted **Grace Period**.
Use `user.last_sign_in_at` (from Supabase Auth, the source of truth) to detect if the session is brand new (< 60s). If so, bypass the cookie check.
**Rule**: Never rely solely on client-side cookies for "Am I active?" checks during the login transition state. always have a server-side baked-in grace period.
