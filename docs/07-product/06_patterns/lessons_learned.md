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
