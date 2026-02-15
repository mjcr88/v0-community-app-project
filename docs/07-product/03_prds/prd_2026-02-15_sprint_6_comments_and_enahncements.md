# PRD: Sprint 6 - Community Engagement & Property Showcase

## Goal Description
Sprint 6 focuses on deepening resident engagement through social interactions (Comments) and enhancing the community directory with lot-specific visual content. It also expands the Exchange utility by allowing residents to post "Seeking" requests.

## User Review Required
> [!IMPORTANT]
> **Shared Comments Architecture**: We are implementing a unified `comments` table instead of siloed reply columns. This will deprecate the `admin_reply` column in `resident_requests`.

## Proposed Changes

### [Database & Infrastructure]
A single migration to update schemas for multiple features.

#### [NEW] `comments` table
- `id`: uuid (PK)
- `tenant_id`: uuid (FK)
- `author_id`: uuid (FK -> users.id)
- `content`: text
- `parent_id`: uuid (FK -> self.id, for threading)
- `resident_request_id`: uuid (FK -> resident_requests.id, nullable)
- `check_in_id`: uuid (FK -> check_ins.id, nullable)
- `created_at`: timestamptz

#### [MODIFY] `exchange_listings` table
- Add `listing_type`: text (CHECK: 'offer', 'seeking', default: 'offer')

#### [MODIFY] `lots` table
- Add `photos`: text[] (default: '{}')
- Add `hero_photo`: text (nullable)

---

### [Feature: Exchange Seeking Mode] (#74)
- **Goal**: Allow residents to request items/help.
- **Sizing**: S (4-8h)
- **Acceptance Criteria**:
    - [ ] AC1: When creating a listing, user can select "Seeking" as the listing type.
    - [ ] AC2: Given a "Seeking" listing, when viewed in the feed, it displays a distinct "REQUESTED" badge and different background tint.
    - [ ] AC3: When using the category filter, the user can toggle between "Offers" and "Requests".

### [Feature: Residential Lot Images] (#66)
- **Goal**: Showcase homes in the directory.
- **Sizing**: S/M (4-12h)
- **Acceptance Criteria**:
    - [ ] AC1: When in Family Settings, verified residents can see an "Upload Home Photos" section.
    - [ ] AC2: Given an uploaded lot photo, when a neighbor clicks "View on Map" -> "Lot Info", the photo is displayed in a gallery.
    - [ ] AC3: When privacy setting "Show on Map" is disabled, lot photos are hidden from non-verified residents.

### [Feature: Comments System] (#64, #79)
- **Goal**: Unified social layer for Admin Replies and Check-in interaction.
- **Sizing**: M (8-16h)
- **Acceptance Criteria**:
    - [ ] AC1: When an admin replies to a request, the resident receives a notification and can reply back within the same thread.
    - [ ] AC2: Given a Check-in, when a user adds a comment, it appears in a threaded view at the bottom of the modal.
    - [ ] AC3: When a user replies to a comment, the original author is notified.

## Implementation Order
1. **Security & Shared Infra**: Migration for `comments` table and `exchange_listings` type column.
2. **Exchange Quick Win**: Implement Type Discriminator and Filtering (#74).
3. **Property Showcase**: Implement Lot Image Upload and Gallery (#66).
4. **Social Core**: Implement `CommentSection` component and integrate with Check-ins (#79).
5. **Admin Integration**: Integrate Comments with Resident Requests and deprecate legacy column (#64).

## Architecture & Git Strategy

### Git Plan
- **Model**: Feature branches off `main`.
- **Naming**: `feat/{issue_number}-{description}`
- **Merge Order**:
    1. `feat/74-exchange-seeking` (Quick win)
    2. `feat/66-lot-images` (Quick win)
    3. `feat/64-79-comments-core` (Shared infra)

### Dependency Mapping
- #64 and #79 depend on the same shared `comments` table. They should be developed either in parallel or sequentially after the core table is created.

## Rollback Strategy (HIGH RISK)
> [!CAUTION]
> **Comments Table Migration**: If the migration fails or breaks existing Resident Request access:
> 1. Revert the migration.
> 2. Restore `admin_reply` column from backup if data was lost during deprecation move.

## Verification Plan

### Automated Tests
- `npm run test` for new component logic.
- Supabase RLS tests for the new `comments` table.

### Manual Verification
1. Create a "Seeking" listing in Exchange; verify it shows with a distinct badge.
2. Upload a photo to a Lot; verify it appears in the Directory for neighbors.
3. Reply to an admin message; verify the admin sees the reply thread.
4. Comment on a Check-in; verify the host receives a notification.

## Sprint Schedule

| Issue | Title | Size | Est. Hours | Start Date | Target Date |
|-------|-------|------|------------|------------|-------------|
| [#74](https://github.com/mjcr88/v0-community-app-project/issues/74) | Exchange Seeking Mode | S | 4-8h | 2026-02-16 | 2026-02-17 |
| [#66](https://github.com/mjcr88/v0-community-app-project/issues/66) | Lot Images | S/M | 4-12h | 2026-02-17 | 2026-02-18 |
| [#79](https://github.com/mjcr88/v0-community-app-project/issues/79) | Check-in Comments | M | 8-16h | 2026-02-18 | 2026-02-20 |
| [#64](https://github.com/mjcr88/v0-community-app-project/issues/64) | Admin Replied | M | 8-16h | 2026-02-20 | 2026-02-24 |

*Note: Dates include 1-day buffer for complex items (M/L).*

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)
