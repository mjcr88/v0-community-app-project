# Requirements: Series RSVP Fix & Feature

## Problem Statement
1. **Bug**: Users are unable to RSVP to specific events within a recurring series effectively. The RSVP action is missing for subsequent events in a series.
2. **Missing Feature**: Users lack the ability to "RSVP to All" events in a series at once, which is standard expectation for recurring events (e.g., "Going to all future yoga classes").

## User Persona
- **Resident**: Wants to RSVP to *one* specific session OR *all future* sessions with a single click.
- **Event Organizer**: Needs accurate headcount for each session, but wants to minimize friction for regulars.

## Context
- **Current Behavior**: 
    - Frontend: `EventRsvpQuickAction` only calls `rsvpToEvent` with default scope ("this"). No UI exists to select scope.
    - Backend: `rsvpToEvent` *already supports* `scope: "series"`, but it's unused by the frontend.
    - Bug: `requires_rsvp` field is likely not propagating to child events, checking individual RSVSs impossible.

## Dependencies
- **Backend Capability**: `app/actions/events.ts` already has logic for `scope === "series"`.
- **Issue #50** (Integrate with personal calendars): distinct scope.

## Technical Options

### Option 1: Comprehensive Series Support (Recommended)
Solve both the data bug and the feature request together.
- **Backend (Fix)**: Update `updateEvent` to correctly propagate `requires_rsvp` to child events so individual buttons appear.
- **Frontend (Feature)**: Update `EventRsvpQuickAction` to show a dropdown/modal when clicking RSVP on a recurring event: "Attend this event only" vs "Attend all future events".
- **Pros**: Fixes the bug AND delivers the requested feature. leverages existing backend logic.
- **Cons**: Slightly more complex UI component.

### Option 2: Fix Bug Only
- **Backend**: Fix `updateEvent` propagation.
- **Frontend**: No change.
- **Pros**: Minimal effort.
- **Cons**: Ignores clear user desire for "Reply to all".

## Recommendation

### Strategy
**Implement Option 1**. The user explicitly asked for "reply to all", and the backend already supports it. It makes sense to bundle the "Fix Series Data" work with "Expose Series RSVP UI" work.

### Implementation Plan
1.  **Backend**: Fix `updateEvent` to propagate `requires_rsvp` to children (The Bug Fix).
2.  **Frontend**: Update `EventRsvpQuickAction` to handle "Series" RSVP mode (The Feature).
    - If event is part of series, show Popover/Dialog on RSVP click.
    - Call `rsvpToEvent` with `scope="series"` if selected.

### Classification
- **Priority**: P1
- **Size**: M (Frontend focus)
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context Gathering
- **Explorer Map**:
    - **Frontend**: `app/t/[slug]/dashboard/events/[eventId]/event-rsvp-section.tsx` (Likely location of `EventRsvpQuickAction` logic or its parent).
    - **Backend**: `app/actions/events.ts` (Contains `rsvpToEvent` server action).
    - **API**: `app/api/v1/events/[id]/rsvp/route.ts` (Alternative API endpoint).
- **Historical Context**:
    - Recent activity in `app/actions/events.ts` detected.
    - Repo active with "Alpha Cohort Reliability" updates.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: PASS. Code uses `use server` and proper auth patterns.
- **Attack Surface**:
    - `rsvpToEvent` handles series logic but iterates sequentially.
    - **Authorization**: Relies on RLS for series event fetching (Line 776). `createServerClient` context ensures user cannot RSVP to events they cannot see.
    - **Vulnerability**: No critical vulnerabilities found.

### Phase 2: Test Strategy
- **Sad Paths**:
    - RSVP to "Full" series event (Logic says "skip full ones" or "apply to as many as possible" - code checks capacity per event).
    - RSVP after deadline (Logic checks deadline per event).
- **Test Plan**:
    - **Unit**: Create `events.test.ts` to test attributes of `rsvpToEvent` (mocking Supabase).
    - **Integration**: Verify `scope="series"` updates multiple rows in `event_rsvps`.
    - **E2E**: User flows for "RSVP All" button.
    - **Note**: No existing tests found in standard locations.

### Phase 3: Performance Assessment
- **N+1 Issue**: The `rsvpToEvent` loop (Line 789) executes `select (capacity)` and `upsert` for EACH event in the series.
    - **Impact**: High for long series (e.g., weekly for a year = 52 round trips).
    - **Recommendation**: Refactor to use bulk `upsert` for rsvps and bulk `select` for capacity checks.

### Phase 4: Documentation Plan
- **Manuals**: Check `docs/01-manuals/resident-guide` for event workflows and update to include "RSVP to Series" options.
- **Gaps**: API documentation for server actions is missing in `docs/02-technical/api`.

### Phase 5: Strategic Alignment
- **Decision**: **Prioritize** (Ready for Development).
- **Sizing**: M (Confirmed).
- **Rationale**: High user value. Backend capability exists. The identified N+1 performance issue must be addressed during implementation.
