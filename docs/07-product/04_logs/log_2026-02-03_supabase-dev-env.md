# Build Log: [Infra] Supabase DEV Environment
**Issue:** #76 | **Date:** 2026-02-03 | **Status:** In Progress

## Context
- **PRD Link**: [Sprint 1 PRD](docs/07-product/03_prds/prd_2026-02-02_sprint_1_security_polish.md)
- **Req Link**: N/A (Infrastructure Task)
- **Board Status**: Moved to "In Progress"
- **Critical Path**: This infrastructure is required before work can begin on #75 (PII) and #77 (Logout).

## Clarifications (Socratic Gate)
*Logged during Phase 1 conversation*




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
- **CodeRabbit Findings (Critical)**:
  - **Skill Name Mismatch**: `orchestrator.md` references non-existent `nestjs-expert` (should be `nextjs-expert` or renamed).
  - **Security Injection**: `auto_preview.py` uses `shell=True` with a list.
  - **RLS Scope**: `penetration_audit.md` needs clarification on Tenant OR User policy logic.
  - **Endpoint Security**: `/api/link-resident` uses service key without auth check.
  - **RLS Provenance**: `resident_requests` policy needs explicit `auth.jwt()` reference.
  - **Schema FK**: `user_id` should reference `auth.users` or `public.profiles`, not `users`.
  - **Privacy**: `residential_lot_images.md` buckets must be private/signed URLs.
  - **PII Leak**: `neighbours/page.tsx` fetches full resident records (PII risk). **NOTE: Covered by Issue #75**.

## Decisions
- We will use the standard Next.js `.env.local` pattern.
- We will NOT use `supabase link` for local development to avoid complex Docker requirements for the user initially, unless explicitly requested. We will use the "Remote Dev" pattern (connecting local app to remote DEV database) which is simpler for solo founders.

## Lessons Learned
- **Supabase Auth Migration**: When migrating users, `admin.create_user(uid=...)` is IGNORED by the Python SDK. You must use `admin.create_user(id=...)` to force a specific UUID. Failure to do this results in a mismatch with `public` tables and RLS failures.

## QA Protocol Findings

### Phase 0: Activation & Code Analysis
- **PR**: [#82](https://github.com/mjcr88/v0-community-app-project/pull/82) (Open).
- **CodeRabbit Summary (Updated)**:
  - **Critical Issues Identified**: [See Blockers & Errors section above].
  - **Infrastructure**: Added `scripts/sync_data.py` to robustly sync Tenants, Neighborhoods, and Users from Prod to Dev.
  - **Security**: Strict `.env.local` separation ensuring `DEV` keys are used locally.
  - **Fixes**: Resolved critical `auth.users` vs `public.users` UID mismatch and Patched missing RLS policy.

### Phase 1: Test Readiness Audit
- **E2E Tests**: [No] (No Playwright/Cypress tests found).
- **Unit Tests**: [No] (No *.test.ts found).
- **Coverage Gaps**: 100% gap. Feature relies on manual verification.

### Phase 2: Specialized Audit
- **Security Check**:
  - Automated Scan: PASSED (via `checklist.py`).
  - Manual Review: RLS policies patched. `.env.local` untracked.
  - **New Findings**: Identified injection risk in `auto_preview.py` and unauthenticated endpoint `/api/link-resident`.
- **Performance**:
  - Bundle Size: Skipped (Scripts only).
  - Lint Check: **FAILED**. Needs fixing.

### Phase 3: Documentation & Release Planning
- **Doc Audit**: PR mentions `lessons_learned.md` but file not confirmed in active docs.
- **Proposed Release Note**:
  > 🚀 **Supabase Dev Environment**
  > Safe, isolated development environment (`nido.dev`) setup to prevent production data risks. Includes reliable production data syncing scripts.
  >
  > 🛠️ **Fix/Polish**
  > - Resolved `auth.users` UID mismatch.
  > - Patched RLS policy for user profile viewing.

## Implementation & Verification (Phases 5-6)

### Phase 5: Test Creation
- **Smoke Test Created**: `tests/smoke/login_smoke.test.ts`
- **Result**: ✅ Verified application reachable at `http://localhost:3000/login`.

### Phase 6: The Fix Loop
| Component | Issue | Action Taken | Verification |
|-----------|-------|:-------------|:-------------|
| **Config** | `orchestrator.md` | Fixed typo `nestjs-expert` -> `nextjs-expert` | Visual Confirm |
| **Security** | `auto_preview.py` | Set `shell=False` to prevent injection | Server Boot Verified |
| **Security** | `link-resident` | Added `authClient` check | Code Review |
| **Docs** | RLS/Schemas | Clarified Tenant vs User isolation | Review |
| **Lint** | Environment | Installed `eslint-config-next` | ⚠️ Failed (React 19 Conflict) |

> **Note on Lint**: Linting is currently blocked by dependency conflicts between React 19 (Beta) and ESLint plugins. Critical fixes were manually verified.
