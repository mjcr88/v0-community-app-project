# Requirements: Exchange "Searching For" Mode

> **Date**: 2026-01-28
> **Topic**: Exchange "Searching For" Mode

## Problem Statement
Currently, the Exchange feature is designed exclusively for "Offerings" (giving away items, selling, or lending). Residents who need help or are looking for specific items have no dedicated way to signal this demand. They are forced to misuse the "Offering" listings or post elsewhere, leading to confusion and poor discoverability for requests.

## User Persona
- **Resident Requester**: Needs a specific item (e.g., a ladder, sugar) or help (e.g., someone to water plants) and wants to broadcast this need to the community.
- **Resident Provider**: Has items or time and might be willing to help if they knew someone needed it, but isn't actively creating "Offer" listings.

## Context
The current `exchange_listings` table and UI are optimized for:
- Title/Description
- Category (Giveaway, Lending, etc.)
- Images
- "I want this" CTA

We need to introduce a "Seeking" mode that flips this relationship:
- "I need this" instead of "I have this"
- "I can help you" instead of "I want this" as the CTA.

## Dependencies
- `exchange` feature flag (already active)
- `exchange_listings` table (needs schema update)
- UI components for Listing Cards (need visual differentiation)
- `exchange_transactions` (transaction flow might need adaptation)

## Issue Context
- **Gap**: Missing documentation for `exchange` module schema and flows in `docs/02-technical`.
- **Gap**: Missing user guide section for "Requesting Items" in `docs/01-manuals/resident-guide`.

## User Story
**As a** Resident,
**I want to** create a "Seeking" listing,
**So that** I can ask my neighbors for items or help I need.

**As a** Resident,
**I want to** filter the Exchange feed to see "Seeking" requests,
**So that** I can see if I can help anyone in my community.

## Technical Options

### Option 1: Single Table with Type Discriminator (Recommended)
Add a `listing_type` column (`offer`, `request`) to the existing `exchange_listings` table. Reuse `price` as `budget` for requests.
*   **Pros**:
    *   Minimal schema change (one column).
    *   Unified data model simplifies "My Listings" and admin views.
    *   Easier to aggregate all activity for broad queries.
*   **Cons**:
    *   Overloading columns (`price` vs `budget`) can be confusing in code if not strictly typed.
    *   Some fields (like `images`) might be required for Offers but optional for Requests.
*   **Effort**: Low (Schema: 1 migration, UI: Filter logic & Label adaptions).

### Option 2: Separate "Requests" Table
Create a new `exchange_requests` table specifically for this purpose.
*   **Pros**:
    *   Clean separation of concerns.
    *   Can have request-specific fields (e.g., `urgency`, `expiration_date`) without polluting the listings table.
*   **Cons**:
    *   Higher effort: New API endpoints, RLS policies, and admin UI components.
    *   "My Exchange" UI needs to fetch from two sources.
*   **Effort**: Medium-High (New table, RLS, APIs, Frontend types).

### Option 3: "Wishlist" Feature (Lightweight)
Instead of full listings, add a simple "Wishlist" on the user profile or a "Requests" board that is text-only (no categories, no images).
*   **Pros**:
    *   Very fast to implement.
    *   Distinct from the "Marketplace" feel of the Exchange.
*   **Cons**:
    *   Low discoverability (buried in profiles or a side board).
    *   Less functionality (no category filtering, no location context).
*   **Effort**: Low-Medium (New lightweight table, new UI view).

## Recommendation

**We recommend proceeding with Option 1 (Single Table with Type Discriminator).**

This approach provides the most integrated user experience. Residents can seamlessly switch between "Offering" and "Seeking" within the same Exchange interface. It leverages existing categories (e.g., "Seeking > Tools") and location logic without requiring significant new infrastructure.

### Classification
- **Priority**: P1 (High Impact - fills a major functional gap)
- **Size**: S (Small - Schema update + UI modifiers)
- **Horizon**: Q1 26 (Immediate roadmap)

## 8. Technical Review

### 8.0 Phase 0: Context & History
- **Issue**: [feat: Exchange Seeking Mode #74](https://github.com/mjcr88/v0-community-app-project/issues/74)
- **Goal**: Add "Seeking" mode to Exchange.
- **Impact Map**:
    - **Database**: `exchange_listings` (New `listing_type` column).
    - **Logic**: `lib/data/exchange.ts`, `app/actions/exchange-listings.ts`.
    - **UI**: `components/exchange/` (Listing Cards, Feed).
- **Historical Context**:
    - Recent activity in `exchange` module: `feat: Alpha Cohort Reliability & UI Fixes (COMAPP-26)` (Commit `42f7d362`).
    - Schema managed via SQL scripts in `scripts/exchange/`.

### 8.1 Phase 1: Security Audit
- **Vibe**: Code uses `createServerClient` properly (Backend-First).
- **Attack Surface**:
    - `exchange_listings` is projected by RLS (`08_create_exchange_rls_policies.sql`).
    - Existing Policy: `Residents can view published exchange listings` restricts to `status = 'published'`. This is safe for "Seeking" mode as long as requests also use "published" status.
    - **Risk**: `price` column reused as `budget`. Ensure separate UI/Validation logic prevents "Negative Budget" or misuse.
    - **Risk**: No specific `listing_type` RLS policy exists, so access is uniform across Offers/Requests. This is acceptable for this feature.

### 8.2 Phase 2: Test Strategy
- **Sad Paths**:
    - **Negative Budget**: User enters -100 for "Budget/Price".
    - **Type Confusion**: User tries to "Borrow" a "Request" (Logic should prevent this).
    - **Empty Search**: Filtering for "Requests" yields 0 results.
- **Test Plan**:
    - **Unit (Vitest)**: New test file `app/actions/exchange-listings.test.ts` to verify `createExchangeListing` with `type='request'` and `listing_type` column handling.
    - **E2E (Playwright)**:
        - `auth.setup.ts` to log in.
        - `exchange.spec.ts`: Test "Create Listing" flow, selecting "Looking For" toggle. Verify badge appears in feed.

### 8.3 Phase 3: Performance Review
- **Schema Analysis**:
    - `exchange_listings` table lacks an index for the proposed `listing_type` column.
    - **Recommendation**: Create index `idx_exchange_listings_type` covering `(tenant_id, listing_type)` to support efficient feed filtering.
    - Current indexes exist for `tenant_id`, `created_by`, `status`, `category_id`, `location_id`.
- **Query Impact**:
    - Filtering by `listing_type` on the main feed will be common. Without an index, this could slow down feed loading as the table grows.

### 8.4 Phase 4: Documentation Plan
- **Manuals**:
    - `docs/01-manuals/resident-guide.md` does not exist! **CRITICAL GAP**. Needs creation to explain "Requests".
    - `docs/01-manuals/admin-guide.md` (check existence) -> Update to include moderation of "Requests".
- **Schema**:
    - `docs/02-technical/schema/tables/exchange_listings.md` does not exist! **GAP**. Needs creation.
- **Action**: Logged to `docs/documentation_gaps.md`.

### 8.5 Phase 5: Decision
- **Recommendation**: Prioritize (Ready for Development).
- **Justification**: P1 item, safety risk is low (RLS protects), development effort is Small (schema + UI). Critical gap in current Exchange functionality.
- **Next Steps**:
    1. Turn Draft Issue into Full Issue.
    2. Move to "Ready for Development" column.
    3. Hand off to Dev for Implementation.
