# PRD: Sprint 2 - UX Fixes & Consistency
**Date:** 2026-02-02
**Status:** DRAFT
**Sprint Goal:** Enhance user experience by fixing visual inconsistencies, streamlining admin workflows, and resolving UI bugs.

## Selected Issues (Sprint Scope)

| Issue | Priority | Size | Est. Hours | Risk | Title |
|-------|----------|------|------------|------|-------|
| #72 | **P0** | **S** | 4-8h | LOW | [Bug] Admin Family Selection Improvement |
| #81 | **P0** | **S** | 4-8h | LOW | [Design] Check-in RSVP Consistency |
| #69 | **P0** | **XS** | 2-4h | LOW | [Bug] Neighbor Directory Tab Alignment |
| #78 | **P0** | **XS** | 2-4h | LOW | [Bug] Upcoming Widget RSVP Count Fix |

---

## Architecture & Git Strategy

### 1. Repository & Branching Strategy
*   **Repository:** `mjcr88/v0-community-app-project`
*   **Base Branch:** `main` (Production)
*   **Feature Branches:** Create `feat/<issue-number>-<short-slug>` for each ticket.
    *   Example: `feat/72-admin-family-select`
*   **Merge Strategy:** Squash & Merge via Pull Request.

### 2. CI/CD & Environment
*   **Build System:** Next.js (`npm run build`).
*   **Linting:** Native ESLint (`npm run lint`).
*   **Deployments:** Vercel (Auto-deploy on merge to `main`).

### 3. Dependency Map
*   **Independence:** All items in this sprint are largely independent and can be worked on in parallel.
*   **Shared Components:**
    *   Issue #81 (Check-in RSVP) touches `CheckInRsvpQuickAction.tsx`.
    *   Issue #78 (Widget RSVP) touches `UpcomingEventsWidget.tsx`.

---

## Implementation Plan
> *To be detailed in Phase 3*

### 1. [Bug] Admin Family Selection (#72)
*   **Owner:** `frontend-specialist`
*   **Goal:** Streamline resident creation by auto-selecting existing families.
*   **Implementation Steps:**
    1.  **Hook:** Create `useFamilySelection` hook.
        *   Input: `lotId`.
        *   Logic: Fetch families on lot. If count == 1, auto-select and set "Existing Family" mode.
    2.  **UI:** Update `AdminResidentCreateForm` to use the hook.
        *   Add "Override" button to force new family creation if needed.
*   **Acceptance Criteria:**
    - [ ] Selecting a Lot with 1 family automatically selects that family in the dropdown.
    - [ ] Admin can manually clear selection to create a NEW family.

### 2. [Design] Check-in RSVP Consistency (#81)
*   **Owner:** `frontend-specialist`
*   **Goal:** Align Check-in RSVP UI with standard Events (3-state system).
*   **Implementation Steps:**
    1.  **Dashboard:** Refactor `CheckInRsvpQuickAction.tsx`.
        *   Replace single toggle with `ToggleButtonGroup` (Going, Maybe, Not Going).
        *   Map states: `going` -> `confirmed`, `maybe` -> `maybe`, `not_going` -> `declined`.
    2.  **Notifications:** Update Notification Card to use a `DropdownMenu` for RSVP actions to save space.
*   **Acceptance Criteria:**
    - [ ] Dashboard card shows 3 buttons (Check, Question, X).
    - [ ] Clicking "Maybe" updates state correctly in DB.
    - [ ] Notification card uses compact dropdown.

### 3. [Bug] Neighbor Directory Tab Alignment (#69)
*   **Owner:** `frontend-specialist`
*   **Goal:** Fix visual misalignment of tabs on desktop.
*   **Implementation Steps:**
    1.  **Component:** Edit `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`.
    2.  **Style:** Wrap `TabsList` in a container with `w-full max-w-md mx-auto` (matching Search Bar).
    3.  **Token:** Ensure usage of `rounded-full` or standard radius tokens.
*   **Acceptance Criteria:**
    - [ ] Tabs align perfectly with the Search bar on `md` and `lg` screens.
    - [ ] Mobile view remains responsive.

### 4. [Bug] Upcoming Widget RSVP Count Fix (#78)
*   **Owner:** `frontend-specialist`
*   **Goal:** Show actual RSVP counts in dashboard widget.
*   **Implementation Steps:**
    1.  **Component:** Edit `UpcomingEventsWidget.tsx`.
    2.  **Data:** Switch display logic from `attending_count` (which might be static/cached) to `_count.rsvps` (live aggregation) if available.
    3.  **Fallback:** If `_count` unavailable, check API query to ensure it's included (`include: { _count: { select: { rsvps: true } } }`).
*   **Acceptance Criteria:**
    - [ ] Widget shows "X attending" matching the actual database count.
    - [ ] Zero count only shown if truly 0 RSVPs.

---

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)

## Sprint Schedule
**Sprint Start:** Feb 9, 2026 (Monday)
**Sprint End:** Feb 12, 2026 (Thursday)

| Issue | Title | Est. Duration | Start Date | Target Date | Dependencies |
|-------|-------|---------------|------------|-------------|--------------|
| #72 | **Admin Family Select** | 2 Days | **Feb 9** | **Feb 10** | None |
| #81 | **Check-in Consistency** | 2 Days | **Feb 9** | **Feb 10** | None |
| #69 | **Tab Alignment** | 0.5 Days | **Feb 11** | **Feb 11** | None |
| #78 | **Widget RSVP Count** | 0.5 Days | **Feb 11** | **Feb 11** | None |

> *Note: Schedule assumes parallel execution of #72 and #81 is possible, otherwise sequential execution pushes end date to Feb 14.*

## Release Notes
### Neighbor Directory Polish
🚀 **Tab Alignment**
Fixed visual misalignment of tabs in the Neighbor Directory. Switched to a robust Grid Layout to ensure perfect symmetry and full-width touch targets on mobile.

🤝 **Privacy & Search**
- Restored Admin ability to view full resident profiles (Privacy Override).
- Fixed a bug where partial names could cause search errors.

