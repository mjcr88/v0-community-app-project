# PRD: Sprint 5 - UX Consolidation & Map Refactor (2026-02-15)

## Goal Description
Sprint 5 focuses on consolidating UX patterns across the application, specifically aligning the Check-in creation flow with the modern "step-based" wizard pattern used in Exchange Listings, and cleaning up technical debt in the Mapbox implementation.

## User Review Required
> [!IMPORTANT]
> **Issue #116 Cleanup**: We are deleting the legacy `/dashboard/map` route. Any browser bookmarks to this specific URL will break and need to be updated to `/dashboard/community-map`.
> [!NOTE]
> **Issue #114 Icons**: We are adopting a "Dual Input" system. Admins can either type a single emoji or upload a small image asset (e.g., logo).

## Selected Issues & Sizing

| Issue | Title | Size | Est. Hours |
|-------|-------|------|------------|
| #80 | [Brainstorm] Check-in Form Refactor | S | 4-8h |
| #116 | [Brainstorm] View on Map Refactor | XS | 2-4h |
| #114 | [Brainstorm] Mapbox Cleanup & Icons | XS | 2-4h |

**Total Est. Effort**: 8-16 hours.

## Architecture & Git Strategy

### Git Strategy
- **Branching Model**: A single sprint branch `feat/sprint-5-ux-consolidation`.
- **Merging**: Final merge to `main` after verification of all three issues.

### Component Design
- **Check-in Wizard (#80)**: 
  - New directory: `components/check-ins/create_check_in_steps/`
  - Pattern: wizard-style modal with `currentStep` state, passing `formData` and `updateFields` to sub-components.
- **Map Consolidation (#116)**:
  - Consolidate all "View on Map" requests to `CommunityMapClient`.
  - Pass `highlightLocationId` via query params.
- **Mapbox Cleanup (#114)**:
  - Unify marker rendering logic in `MapboxViewer.tsx` to a single loop for facilities.
  - Implement `icon` property as a mixed string (URL or Emoji).

## Proposed Changes

### [Check-in Form]
#### [NEW] [step-1-what.tsx](components/check-ins/create_check_in_steps/step-1-what.tsx)
#### [NEW] [step-2-when.tsx](components/check-ins/create_check_in_steps/step-2-when.tsx)
#### [NEW] [step-3-where.tsx](components/check-ins/create_check_in_steps/step-3-where.tsx)
#### [NEW] [step-4-who.tsx](components/check-ins/create_check_in_steps/step-4-who.tsx)
#### [NEW] [step-5-review.tsx](components/check-ins/create_check_in_steps/step-5-review.tsx)
#### [MODIFY] [create-check-in-modal.tsx](components/check-ins/create-check-in-modal.tsx)
- Implementation of the wizard logic and step transition animations.

### [Map Consolidation & Cleanup]
#### [DELETE] [/app/t/[slug]/dashboard/map/page.tsx](app/t/[slug]/dashboard/map/page.tsx)
#### [DELETE] [/components/map/resident-map-client.tsx](components/map/resident-map-client.tsx)
#### [MODIFY] [MapboxViewer.tsx](components/map/MapboxViewer.tsx)
- Remove duplicate facility rendering loops (L1117-1159 & L1213-1265).
- Add support for image icons in the facility marker.
#### [MODIFY] [FacilityFields.tsx](components/map/form-fields/FacilityFields.tsx)
- Add "Icon" input with dual emoji/upload support.

## Verification Plan

### Automated Tests
- `npm run lint` & `npx tsc --noEmit`
- Smoke test for the New Check-in flow (Playwright).
- Verification of Map parameters in `CommunityMapClient`.

### Manual Verification
1.  **Check-in creation**: Complete a full 5-step flow on mobile and desktop.
2.  **Redirect**: Click "View on Map" from a Location Details page and ensure the map zooms to and highlights the correct facility.
3.  **Icons**: Set a facility icon to an emoji, then change it to an uploaded logo. Verify both render correctly on the map.

---

## Agent Assignments & Order

### Implementation Order
1.  **Mapbox Cleanup & Icons (#114)** [XS] - Quick win, resolves visual bugs.
2.  **View on Map Refactor (#116)** [XS] - Clean up technical debt.
3.  **Check-in Form Refactor (#80)** [S] - Most complex, requires parallel testing.

### Assignments
- **Specialist**: `frontend-specialist` (All issues)
- **Reviewer**: `devops-engineer` (For #116 route deletion safety)

---

## Acceptance Criteria

### #114: Mapbox Cleanup & Icons
- [ ] **AC1**: Given `MapboxViewer`, when facilities are rendered, then only one `Marker` instance exists per facility (no duplication/z-fighting).
- [ ] **AC2**: Given `FacilityFields`, when an admin enters a single emoji in the Icon field, then that emoji is used as the map marker content.
- [ ] **AC3**: Given `FacilityFields`, when an admin uploads an image, then the image URL is used to render the marker content.

### #116: View on Map Refactor
- [ ] **AC1**: Given a Location Details page, when clicking "View on map", then the user is redirected to `/dashboard/community-map?highlightLocationId=[ID]`.
- [ ] **AC2**: Given `/dashboard/community-map` with a `highlightLocationId`, then the map automatically centers on and highlights that location.
- [ ] **AC3**: Given the source code, then `/app/t/[slug]/dashboard/map` and `resident-map-client.tsx` are deleted.

### #80: Check-in Form Refactor
- [ ] **AC1**: Given the "Check-in" trigger, when clicked, then the user sees "Step 1: What" of a 5-step wizard.
- [ ] **AC2**: Given user input on any step, when clicking "Next", then data is preserved and the next step is shown.
- [ ] **AC3**: Given Step 5 (Review), when clicking "Submit", then the check-in is created via server action and the modal closes.

---

## Definition of Done
- [ ] Code passes `npm run lint` & `npm run type-check`
- [ ] Unit tests for step preservation logic passing (Vitest)
- [ ] Manual QA verification completed per ACs
- [ ] No regression in map selection or filter performance
- [ ] Documentation updated in `docs/01-manuals/resident-guide/`

---

## Sprint Schedule

Targeting a start date of **Monday, Feb 16, 2026**.

| Issue | Size | Est. Hours | Start Date | Target Date |
|-------|------|------------|------------|-------------|
| #114 | XS | 2-4h | Feb 16, 2026 | Feb 17, 2026 |
| #116 | XS | 2-4h | Feb 17, 2026 | Feb 18, 2026 |
| #80 | S | 4-8h | Feb 18, 2026 | Feb 20, 2026 |

*Schedules include a small buffer for testing and review.*
