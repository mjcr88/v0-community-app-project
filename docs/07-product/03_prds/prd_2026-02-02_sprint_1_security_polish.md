# PRD: Sprint 1 - Security Polish & Infra
**Date:** 2026-02-02
**Status:** DRAFT
**Sprint Goal:** Secure the application foundation (Auth & Data) and establish a safe development environment to prevent production regressions.

## Selected Issues (Sprint Scope)

| Issue | Priority | Size | Est. Hours | Risk | Title |
|-------|----------|------|------------|------|-------|
| #76 | **P0** | **M** | 1-2d | HIGH | [Infra] Supabase DEV Environment |
| #75 | **P0** | **S** | 4-8h | HIGH | [Security] PII Leak Prevention |
| #77 | **P0** | **M** | 1-2d | HIGH | [Security] Automatic Logout / Session Timeout |
| #63 | **P0** | **M** | 1-2d | MED | [Bug/Feat] Series RSVP Fix & Feature |

---

## Architecture & Git Strategy

### 1. Repository & Branching Strategy
*   **Repository:** `mjcr88/v0-community-app-project`
*   **Base Branch:** `main` (Production)
*   **Feature Branches:** Create `feat/<issue-number>-<short-slug>` for each ticket.
    *   Example: `feat/76-supabase-dev-env`
*   **Merge Strategy:** Squash & Merge via Pull Request.

### 2. CI/CD & Environment
*   **Build System:** Next.js (`npm run build`).
*   **Linting:** Native ESLint (`npm run lint`).
*   **Deployments:** Vercel (Auto-deploy on merge to `main`).
*   **Critical Env Vars:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   *Note: Issue #76 will introduce strict DEV vs PROD env var separation.*

### 3. Dependency Map
*   **[Critical Path] Issue #76 (Supabase Dev Env):** MUST be completed first. It establishes the `v0-dev` project.
    *   *Impact:* Issues #77 and #75 need this safe environment to test Auth/RLS changes without risking Production data.
*   **Issue #77 (Auto Logout):** Requires `middleware.ts` updates.
*   **Issue #75 (PII Leak):** Requires Refactoring `page.tsx` data fetching patterns.

---

## Implementation Plan
> *To be detailed in Phase 3*

### 1. [Infra] Supabase DEV Environment (#76)
*   **Owner:** `devops-engineer`
*   **Worklog:** [log_2026-02-03_supabase-dev-env.md](../../04_logs/log_2026-02-03_supabase-dev-env.md)
*   **Goal:** Configure existing project to separate Dev and Prod data.
*   **Implementation Steps:**
    1.  **Configure Existing Project:** Link local dev to project `ehovmoszgwchjtozsfjw` (v0-community-dev).
    2.  **Update `env` management:**
        *   Create `.env.local` (Gitignored) -> Point to `ehovmoszgwchjtozsfjw` keys.
        *   Create `.env.production` (Vercel) -> Point to PROD keys.
    3.  **Run Migrations:** Sync `ehovmoszgwchjtozsfjw` DB with Prod Schema.
*   **Acceptance Criteria:**
    - [x] Localhost connects to `v0-community-dev`.
    - [-] Vercel Preview deployments connect to `v0-community-dev`. (Skipped: Local-only workflow)
    - [x] Vercel Production connects to `v0-community-prod`. (Implicit)

### 2. [Security] PII Leak Prevention (#75)
*   **Owner:** `frontend-specialist` (Security Focus)
*   **Goal:** Stop sending raw user rows to the client in the Neighbors directory.
*   **Implementation Steps:**
    1.  Refactor `app/t/[slug]/dashboard/neighbours/page.tsx`.
    2.  Create a Data Transformation Object (DTO) / helper function `transformNeighbor(user)` that whitelist only public fields (id, name, avatar, unit).
    3.  Ensure `email`, `phone`, and `created_at` are NOT in the return object passed to the client component.
*   **Acceptance Criteria:**
    - [ ] Inspect Network Tab: Response for Neighbors request does NOT contain 'email'.
    - [ ] UI still renders names and units correctly.

### 3. [Security] Automatic Logout (#77)
*   **Owner:** `backend-specialist`
*   **Goal:** Force re-auth after 2 hours of inactivity unless "Remember Me" is checked.
*   **Implementation Steps:**
    1.  **Frontend:** Add "Remember Me" checkbox to Login Form (`app/login/page.tsx`).
    2.  **Auth Logic:**
        *   **Standard (Remember Me = TRUE):** Use default `localStorage` persistence. Session survives browser restart.
        *   **Strict (Remember Me = FALSE):** Use `sessionStorage` (cleared on tab close) OR set aggressive 2h idle timer.
    3.  **Middleware:** Ensure consistent session validation.
*   **Acceptance Criteria:**
    - [ ] User logged in WITHOUT "Remember Me" is logged out after 2h idle.
    - [ ] User logged in WITH "Remember Me" stays logged in after window close.

### 4. [Bug] Series RSVP Fix (#63)
*   **Owner:** `backend-specialist`
*   **Goal:** Allow users to RSVP to a whole series and fix individual session RSVP.
*   **Implementation Steps:**
    1.  **Backend:** Update `app/actions/events.ts` to handle `scope="series"`.
        *   When `scope="series"`, apply RSVP to ALL events with same `parent_event_id` (or recurrence grouping).
    2.  **Frontend:** Update `EventRsvpQuickAction.tsx`.
        *   Add Dropdown/Toggle: "This Event Only" vs "All Feature Events".
*   **Acceptance Criteria:**
    - [ ] "RSVP All" adds user to all future instances of the series.
    - [ ] "RSVP One" adds user only to that specific date.

---

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)

## Sprint Schedule
**Sprint Start:** Feb 3, 2026 (Tuesday)
**Sprint End:** Feb 6, 2026 (Friday)

| Issue | Title | Est. Duration | Start Date | Target Date | Dependencies |
|-------|-------|---------------|------------|-------------|--------------|
| #76 | **Supabase DEV Env** | 2 Days | **Feb 3** | **Feb 4** | None (Blocker) |
| #63 | **Series RSVP Fix** | 2 Days | **Feb 3** | **Feb 4** | None |
| #75 | **PII Leak Prevention** | 1 Day | **Feb 5** | **Feb 5** | Wait for #76 |
| #77 | **Auto Logout** | 2 Days | **Feb 5** | **Feb 6** | Wait for #76 |

> *Note: Schedule assumes parallel execution of #76 and #63.*

## Release Notes
### Release Notes (Draft)
🚀 **[Supabase Dev Env]**
Established a safe, isolated development environment (`v0-community-dev`) to prevent production regressions.

🛡️ **[Refactor/Security]**
- Hardened `auto_preview.py` against command injection.
- Secured `/api/link-resident` endpoint with strict Auth checks.
- Clarified RLS Policies for Tenant/User data isolation.
- Fixed `orchestrator.md` skill references.
- Added E2E Smoke Tests for deployment validation.
