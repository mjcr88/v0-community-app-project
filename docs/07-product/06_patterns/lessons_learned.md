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
