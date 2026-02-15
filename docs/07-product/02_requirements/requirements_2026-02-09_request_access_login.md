# Requirements: Request Access on Login Page

## 1. Problem Statement

The application currently requires **admins to manually create resident accounts** before users can access the platform. The login page shows a static "Ask your admin for an invite" message, providing no actionable self-service path. This creates two friction points:

1. **For prospective residents**: They must contact an admin out-of-band (email, WhatsApp, in-person) to request access, with no visibility into whether their request was received.
2. **For admins**: They must manually collect first name, last name, family name, and lot number before creating the user — information the resident already knows.

Additionally, the current rollout is limited to **residents who currently live in Costa Rica** to support scaling and stability during early testing. This geographic constraint needs to be acknowledged during the request flow.

## 2. User Persona

- **Prospective Resident**: A person who currently lives in the community (Costa Rica) and wants to join the app. They know their name, family name, and lot number.
- **Community Admin**: A tenant admin who currently manually creates residents. They need to verify and approve access requests before sending invites.

## 3. User Stories

- **RA-1**: As a Prospective Resident, I want to request access from the login page so that my admin receives my information and can create my account.
- **RA-2**: As a Prospective Resident, I want to confirm that I live in Costa Rica so that the platform can enforce its geographic rollout limitation.
- **RA-3**: As an Admin, I want to see "Access Requested" entries in my residents list so that I can review and approve new user requests.
- **RA-4**: As an Admin, I want the request to pre-populate the resident creation form so that I don't have to re-enter information the user already provided.

## 4. Functional Requirements

### 4.1 Request Form (Public / Unauthenticated)
1. The login page's "New here? Ask your admin for an invite" section shall be **renamed** (e.g. "New here? Request access") and its link shall navigate to a **Request Access form** (new page).
2. The form shall collect:
   - **Email** (required) — used to check for duplicates
   - **First Name** (required)
   - **Last Name** (required)
   - **Family Name** (required, e.g. "Miller Family")
   - **Lot Number** (required) — dropdown/select populated from the tenant's lots
   - **Costa Rica Confirmation** (required) — checkbox: "I confirm I currently reside in Costa Rica"
3. **Duplicate Email Check**: If the email is already registered to an existing user, show: *"Looks like there's already an account using this email, please get in touch with your administrator."*
4. **Submission**: On success, return the user to the login screen with a confirmation toast: *"Your request has been submitted. An admin will review it shortly."*

### 4.2 New User Status: `access_requested`
1. A new status value `access_requested` shall be added to the resident lifecycle, extending the current derived statuses: `passive`, `created`, `invited`, `active`, `inactive`.
2. The admin `ResidentsTable` shall display `access_requested` entries with a distinct badge (e.g. amber/orange).

### 4.3 Admin Approval Flow
1. The admin Residents page shall have a **new tab** (e.g. "Access Requests") showing pending access requests alongside the existing residents tab.
2. Clicking an access-requested entry shall allow the admin to **review and confirm** the data (name, family, lot).
3. Upon confirmation, the admin creates the resident account (existing flow) with the data pre-filled.
4. Once the resident is created, the admin sends an invite link as per the existing invite mechanism.

## 5. Non-Functional Requirements

- **Security**: The request form is public (unauthenticated). The lot list must be served without leaking sensitive data. No PII beyond what the user submits should be exposed.
- **Rate Limiting**: The submission endpoint should be rate-limited to prevent spam.
- **Accessibility**: The form must follow existing design system patterns and be mobile-first.

## 6. Context & Issue Context

### Current Login Form
- File: `app/t/[slug]/login/login-form.tsx`
- The "New here?" section at line ~228 currently has a placeholder `href="#"`.

### Current Resident Lifecycle
- Statuses are **derived** in `getResidentStatus()` (line 111 of `residents-table.tsx`):
  - `passive` → no email
  - `created` → has email, not invited
  - `invited` → has `invited_at`
  - `active` → has `last_sign_in_at` within 30 days OR `onboarding_completed`
  - `inactive` → last sign-in > 30 days ago
- There is **no explicit `status` column** on the `users` table — statuses are computed.

### Lots Table
- `lots` table has `id`, `neighborhood_id`, `lot_number`, RLS requires authentication.
- **RLS Gap**: The request form is unauthenticated, so a public/anonymous endpoint or server action is needed to fetch lots for a given tenant.

### Documentation Gaps
- Missing `docs/02-technical/flows/auth/request-access.md` (new flow).
- Missing specification for public/anonymous data endpoints.

## 7. Dependencies

| Issue | Title | Relationship |
|-------|-------|-------------|
| #70 | [Requirement] Password Reset Feature | Both modify the login page. Coordinate UI placement. |
| #77 | [Brainstorm] Auto Logout / Session Timeout | Related auth system. No blocking dependency. |

## 8. Technical Options

### Option 1: Dedicated `access_requests` Table + API Route

**Mechanism**: Create a new `public.access_requests` table to store unauthenticated submissions. A public Next.js API route (`/api/v1/access-request`) handles form submissions and lot fetching. Admin sees requests in a new tab/filter on the residents page.

**Implementation**:
- **Database**: New `access_requests` table with columns: `id`, `tenant_id`, `email`, `first_name`, `last_name`, `family_name`, `lot_id`, `status` (`pending`/`approved`/`rejected`), `created_at`.
- **API**: `POST /api/v1/access-request` (public, rate-limited) to submit. `GET /api/v1/lots?tenant_slug=X` (public) to fetch lot list.
- **Admin**: New **"Access Requests" tab** on the existing residents page. "Approve" action pre-fills the existing resident creation form.
- **Frontend**: New `/t/[slug]/request-access` page with the form.

**Pros**:
- Clean separation — requests are isolated from the `users` table until approved.
- No risk of "ghost users" in the system.
- Easy to add request metadata (notes, rejection reason) in the future.
- RLS is simple: public insert, admin-only read/update.

**Cons**:
- Requires a new table + migration.
- Two API routes needed (lots + submit).
- Admin needs a new UI section to manage requests.

**Effort**: M (Medium) — ~1 sprint

---

### Option 2: Reuse `resident_requests` Table

**Mechanism**: Leverage the existing `resident_requests` table and system. Create a new request type `access_request` with the form data stored in a metadata/payload JSON column.

**Implementation**:
- **Database**: No new table needed. Add `access_request` as a valid request type. Store form fields in the existing `metadata` or `details` JSON column.
- **API**: Single public API route for submission. Lots endpoint still needed.
- **Admin**: Requests appear in the existing "Requests" admin dashboard alongside other request types.
- **Frontend**: Same new request-access page.

**Pros**:
- Reuses existing infrastructure (request system, notifications, admin UI).
- No new migration for table creation.
- Admin already knows the "Requests" workflow.

**Cons**:
- `resident_requests` is designed for authenticated residents — it has a `user_id` FK. Adapting for unauthenticated users requires making `user_id` nullable or using a service-role bypass.
- Mixes concerns: access requests are fundamentally different from "fix my faucet" requests.
- Pre-filling the resident creation form from JSON metadata is fragile.
- RLS policies on `resident_requests` assume authenticated users.

**Effort**: S (Small) — but with technical debt

---

### Option 3: Direct User Creation with `access_requested` Status Column

**Mechanism**: Add an explicit `status` column to the `users` table. When someone submits the request form, create a `users` row immediately with `status = 'access_requested'` (no Supabase Auth account yet). Admin "approves" by changing status to `created` and then sending an invite as usual.

**Implementation**:
- **Database**: Add `status TEXT DEFAULT 'created'` column to `users` table. Migration to backfill existing users.
- **API**: Public route creates user row directly (service role). Lots endpoint needed.
- **Admin**: `getResidentStatus()` checks the new `status` column first. "Approve" action transitions `access_requested` → `created`.
- **Frontend**: Same new request-access page.

**Pros**:
- No separate table — the user record is the request.
- Admin approval is a simple status flip.
- Pre-population is trivial (data is already in the `users` table).
- Simplifies the overall status model by making it explicit instead of derived.

**Cons**:
- Creates "real" user rows for unauthenticated submissions — potential for junk/spam data.
- Requires careful RLS: `access_requested` users should NOT appear in resident-facing queries (neighbor directory, etc.).
- Migration to add `status` column and backfill all existing users is a moderate effort.
- Blurs the line between "someone who requested access" and "a real resident."

**Effort**: M (Medium) — migration complexity

---

## 9. Recommendation

### ✅ Recommended: Option 1 — Dedicated `access_requests` Table

**Rationale**:

| Criteria | Option 1 (Dedicated Table) | Option 2 (Reuse resident_requests) | Option 3 (Direct User Creation) |
|---|---|---|---|
| **Separation of Concerns** | ✅ Clean boundary | ❌ Mixes request types | ❌ Blurs user vs. requester |
| **Security (RLS)** | ✅ Simple: anon insert, admin read | ⚠️ Requires nullable FK workaround | ⚠️ Ghost users visible to residents |
| **Spam Resistance** | ✅ Isolated from users table | ✅ Isolated | ❌ Pollutes users table |
| **Admin UX** | ✅ Clear "Access Requests" section | ⚠️ Mixed in with maintenance requests | ✅ Inline in residents list |
| **Pre-fill on Approve** | ✅ Straightforward copy | ⚠️ JSON extract fragile | ✅ Already in users table |
| **Future Extensibility** | ✅ Add rejection reason, notes, history | ⚠️ Constrained by existing schema | ⚠️ Status column grows |
| **Effort** | M | S (with debt) | M |

**Decision**: Option 1 provides the best balance of clean architecture, security, and future-proofing for an alpha-stage feature that will likely evolve. The extra effort vs. Option 2 is justified by avoiding technical debt that would block future request management features (rejection reasons, request history, bulk approval).

### Classification

| Property | Value |
|----------|-------|
| **Priority** | P1 — High (critical for onboarding new residents without manual admin work) |
| **Size** | M — Medium (~1 sprint: migration + API + frontend + admin UI) |
| **Horizon** | Now — Alpha feature, blocks first community rollout |

## 10. Technical Review (Phase 0-4)

### Phase 0: Context Gathering

#### Issue Details
- **Issue**: [#99 Request Access on Login Page](https://github.com/mjcr88/v0-community-app-project/issues/99)
- **Scope**: Frontend (Login, New Page, Admin UI), Backend (API, Schema).
- **Goal**: Allow prospective residents to request access, creating a `access_requested` state before full account creation.

#### Impact Map
- **Frontend**:
    - `app/t/[slug]/login/login-form.tsx` (Entry point)
    - `app/t/[slug]/request-access/page.tsx` (New Page)
    - `app/t/[slug]/admin/residents/residents-table.tsx` (Admin UI)
- **Backend / Schema**:
    - `supabase/migrations/*` (New `access_requests` table or schema change)
    - `app/api/v1/access-request/route.ts` (New API)
- **Dependencies**:
    - Users Table (`public.users` or `auth.users` wrapper)
    - `residents-table.tsx` relies on `getResidentStatus`.

#### Historical Context
- Recent changes to `residents-table.tsx` and `login-form.tsx` suggest active development in these areas.
- **Git Log**:
    - `login-form.tsx`: Modified recently for visual updates or refactoring.
    - `residents-table.tsx`: Updated to handle tenant logic and filters.

### Phase 1: Vibe & Security Audit

#### Vibe Code Check
- **Zero Policy RLS**:
    - The new `access_requests` table MUST have RLS enabled.
    - Policy: `public` (anon) can `INSERT`. `tenant_admin` can `SELECT`, `UPDATE`.
    - **Risk**: `users` table should NOT be used for unverified requests (Option 3 rejected).
- **Backend-First**:
    - `POST /api/v1/access-request` must use Zod for strict validation.
    - `GET /api/v1/lots` must be a custom route, NOT a direct PostgREST exposure, to strip sensitive fields.

#### Attack Surface Analysis
- **Public API (`POST /access-request`)**:
    - **Vector**: Spam / DDoS.
    - **Mitigation**: `upstash/ratelimit` (referenced in package.json) is MANDATORY.
- **Data Leakage (`GET /lots`)**:
    - **Vector**: Enumeration of vacant lots or resident locations.
    - **Mitigation**: Return ONLY `id` and `lot_number`. Do NOT return `owner_id` or `status` if sensitive.
- **Ghost Users**:
    - By using a separate `access_requests` table, we avoid polluting the main `users` table with unverified emails.

### Phase 2: Test Strategy

#### Sad Paths
- **Duplicate Email**: User tries to request access with an email already in `users` or `access_requests`. Expect: "Administrator contact" message.
- **Invalid Lot**: User ID manipulation to submit a lot ID from another tenant. Expect: 400 Bad Request (Validation check).
- **Rate Limit**: Spam submission. Expect: 429 Too Many Requests.
- **Empty Fields**: Client-side evasion. Expect: 400 Bad Request.

#### Test Plan
- **Unit**:
    - Test `POST` route validation (Zod) ensures all fields are present and valid.
    - Test rate limiter rejection.
- **Integration**:
    - Submit valid request -> Verify row in `access_requests`.
    - Admin "Approve" -> Verify `users` row created and `access_requests` status updated.
- **E2E (Playwright)**:
    - Flow: Login Page -> "Request Access" -> Fill Form -> Submit -> Toast.
- **Manual**:
    - Verify "Costa Rica" checkbox is mandatory.
    - Verify "Family Name" is collected.

### Phase 3: Performance Assessment

#### Schema Analysis
- **New Table**: `access_requests`
- **Indexes Required**:
    - `CREATE INDEX idx_access_requests_tenant_status ON access_requests(tenant_id, status);` — For admin dashboard filtering.
    - `CREATE INDEX idx_access_requests_email ON access_requests(lower(email));` — For duplicate checking (case-insensitive).
- **Query Impact**:
    - The admin dashboard "Access Requests" tab must use pagination (`page`, `limit`) to avoid loading all requests if spam attacks occur.
    - `GET /lots` must use `select('id, lot_number')` to minimize payload size.

### Phase 4: Documentation Logic

#### Documentation Plan
- **User Manuals**:
    - [NEW] `docs/01-manuals/resident-guide/request-access.md`: Instructions for prospective residents.
    - [NEW] `docs/01-manuals/admin-guide/review-access-requests.md`: Instructions for admins on reviewing and approving.
- **API Reference**:
    - [NEW] `docs/02-technical/api/access-requests.md`: Endpoint specs for `POST /api/v1/access-request` and `GET /api/v1/lots`.
- **Flows**:
    - [NEW] `docs/02-technical/flows/auth/request-access-flow.md`: Sequence diagram of the request -> approve -> invite lifecycle.
- **Schema**:
    - [NEW] `docs/02-technical/schema/tables/access_requests.md`: Table definition and RLS details.
    - [NEW] `docs/02-technical/schema/policies/access_requests.md`: Plain English RLS rules.

#### Documentation Gaps (Logged to `docs/documentation_gaps.md`)
- **2026-02-14**: Missing comprehensive Admin Guide for resident management.
- **2026-02-14**: Missing public API documentation for unauthenticated endpoints.
- **2026-02-14**: Missing explicit RLS policy documentation for new tables.

### Phase 5: Strategic Alignment & Decision

#### Board Context
- **Issue #99** is currently a P1 Enhancement.
- **Dependency**: Blocked by or highly coordinated with **Issue #70** (Password Reset) as both touch the login page UI layout.
- **Capacity**: Sprint 2 alignment required.

#### Product Owner Decision
- **Sizing**: M (Medium) - Initial backend setup + Frontend form + Admin UI.
- **Recommendation**: **Prioritize** for Sprint 2. The manual onboarding bottleneck is a significant friction point for community growth.

#### Definition of Done (DoD)
- [ ] `access_requests` table created with RLS.
- [ ] `/api/v1/access-request` endpoint implemented with rate limiting.
- [ ] `/t/[slug]/request-access` page functional with lot selection.
- [ ] Residents table in Admin UI updated with "Access Requests" tab.
- [ ] "Approve" action pre-fills resident creation form.
- [ ] Documentation updated (Manuals, API, Schema).





