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
| **Risk** | Low — isolated feature, no existing data migration, reversible |
