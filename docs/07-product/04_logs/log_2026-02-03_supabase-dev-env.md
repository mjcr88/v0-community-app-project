# Build Log: [Infra] Supabase DEV Environment
**Issue:** #76 | **Date:** 2026-02-03 | **Status:** In Progress

## Context
- **PRD Link**: [Sprint 1 PRD](docs/07-product/03_prds/prd_2026-02-02_sprint_1_security_polish.md)
- **Req Link**: N/A (Infrastructure Task)
- **Board Status**: Moved to "In Progress"
- **Critical Path**: This infrastructure is required before work can begin on #75 (PII) and #77 (Logout).

## Clarifications (Socratic Gate)
*Logged during Phase 1 conversation*

### Q: Why separate Dev/Prod environments?
**A:** (Educational Context)
- **Safety**: Prevents accidental deletion or corruption of real user data (Production).
- **Testing**: Allows breaking schema changes (migrations) to be tested without downtime.
- **Security**: "Real" user emails/PII are never exposed to developers during testing.

### Q: Why .env.local?
**A:**
- `.env` files store "Environment Variables" - configuration settings that change based on where the app runs.
- **Next.js Hierarchy**:
  - `.env`: Default values (Checked into Git).
  - `.env.local`: Overrides for your LOCAL machine (IGNORED by Git - **Secret**).
  - `.env.production`: Overrides for Production builds (IGNORED by Git or managed in Vercel dashboard).

## Progress Log
- **2026-02-03**: Phase 0 Activation.
  - Verified `.env.local` is untracked (Secure).
  - Created branch `feat/76-supabase-dev-env`.
- **2026-02-03**: Implementation (Phase 2).
  - Dumped production schema (`supabase db dump`).
  - Created `scripts/definitive_clean_sql.py` to scrub "OWNER TO" and hanging statements.
  - Successfully applied `clean_schema_final.sql` to `nido.dev`.
  - Created `scripts/sync_data.py` to replicate Tenants, Neighborhoods, and Users.
  - **Critical Fix**: Identified mismatch in Auth UIDs. Wrote `scripts/recreate_auth_user.py` to force-create Auth users with Prod UIDs.
  - **RLS Fix**: Applied `fix_rls_login.sql` to allow "Users to view own profile".
- **2026-02-03**: Verification (Phase 3).
  - Verified `localhost` login works with `michaelpjedamski+testresident@gmail.com`.
  - Confirmed data integrity between `auth.users` and `public.users`.

## Handovers
- **From**: Product Manager
- **To**: Devops Engineer (Orchestrated by Antigravity)

## Blockers & Errors
- None currently.

## Decisions
- We will use the standard Next.js `.env.local` pattern.
- We will NOT use `supabase link` for local development to avoid complex Docker requirements for the user initially, unless explicitly requested. We will use the "Remote Dev" pattern (connecting local app to remote DEV database) which is simpler for solo founders.

## Lessons Learned
- **Supabase Auth Migration**: When migrating users, `admin.create_user(uid=...)` is IGNORED by the Python SDK. You must use `admin.create_user(id=...)` to force a specific UUID. Failure to do this results in a mismatch with `public` tables and RLS failures.
