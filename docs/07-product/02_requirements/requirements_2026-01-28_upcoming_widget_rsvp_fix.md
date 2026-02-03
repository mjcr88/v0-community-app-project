# Requirements: Upcoming Widget RSVP Count Fix

## Problem Statement
The "Upcoming Events" widget on the dashboard displays "0" attendees for events that have known RSVPs (e.g., "2/100 going" on the details page). This misleads users into thinking events are empty.

## User Persona
- **Resident**: Wants to see at a glance if their neighbors are attending events directly from the dashboard.
- **Organizer**: Wants their event excitement to be visible on the home feed.

## Context
- **Issue**: [Verified Issue #78](https://github.com/mjcr88/v0-community-app-project/issues/78)
- **Current Behavior**:
    - The API `/api/events/upcoming/[tenantId]` calls `getEvents` which returns an object with `_count: { rsvps: number }`.
    - The Frontend `UpcomingEventsWidget` expects `attending_count` in its local `Event` interface.
    - Result: `attending_count` is undefined/0, so the UI shows 0.
- **Technical Root Cause**: Mismatch between the Data Layer return type (`_count.rsvps`) and the attributes expected by the UI component (`attending_count`).

## Dependencies
- `lib/data/events.ts`: Source of truth for event fetching.
- `components/dashboard/upcoming-events-widget.tsx`: The consumer component.

## issue_context
- Related to visual alignment task but functional in nature.

## Technical Options

### Option 1: Frontend Adaptation (Recommended)
Update `UpcomingEventsWidget` to read the data structure returned by the API (`_count.rsvps`) instead of expecting a flat properties `attending_count`.
- **Pros**: Localizes the fix to the component displaying the data. No risk of breaking other consumers of the API/Data layer.
- **Cons**: Component interface becomes "looser" or requires type assertion to match `EventWithRelations`.
- **Effort**: XS

### Option 2: API Transformation
Update `/api/events/upcoming/[id]/route.ts` to map `_count.rsvps` to `attending_count` before sending the response.
- **Pros**: Keeps the `Event` interface on the frontend cleaner.
- **Cons**: Adds ad-hoc mapping logic to the route handler.
- **Effort**: XS

### Option 3: Data Layer Update
Update `getEvents` in `lib/data/events.ts` to always flatten specific counts.
- **Pros**: Solves it universally.
- **Cons**: High risk of regression or breaking changes for other components expecting the nested structure.
- **Effort**: M

## Recommendation

### Strategy
**Implement Option 1 (Frontend Adaptation)**. This is a display-layer issue where the component's expected interface does not match the actual API response structure for this specific field. Adapting the component is the safest and most direct fix.

### Implementation Plan
1.  **Frontend**: Update `UpcomingEventsWidget` component.
2.  **Interface**: Update local `Event` interface to include `_count?: { rsvps: number }`.
3.  **Logic**: Update the rendering logic to check `event.attending_count` OR `event._count?.rsvps`.
4.  **Verification**: Verify the widget displays the correct number (e.g., "2/100") matching the event details page.

### Classification
- **Priority**: P1 (Bug Fix)
- **Size**: XS
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Draft Item 152699400 "Upcoming Widget RSVP Count Fix". Status: In Review.
- **Impact Map**:
  - Primary Component: `components/dashboard/upcoming-events-widget.tsx`
  - API Route: `/api/events/upcoming/[tenantId]` (Implicit dependency)
- **Historical Context**:
  - Component converted to SWR/CSR in commit `615816ed` (Nov 16 2025).
  - Last touched in `190f2660` (Dec 5 2025) for mobile optimization.
  - **Regression**: The move to client-side fetching likely exposed the type mismatch where `getEvents` returns nested `_count` but the component interface expects flattened `attending_count`.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Passed. Component uses `useSWR` for data fetching (CSR) and Server Actions for mutations, adhering to Next.js data patterns. No client-side DB access found.
- **Attack Surface**:
  - `GET /api/events/upcoming/[tenantId]`: Correctly authenticates user via `createServerClient` and passes `requestingUserId` to `getEvents` for visibility filtering.
  - `rsvpToEvent` (Server Action): Verifies user auth and ownership permissions.
- **Findings**:
  - Code is secure.
  - The issue is purely a data interface mismatch (Type Safety gap).

### Phase 2: Test Strategy
- **Sad Paths**:
  - API returns 500 (Handled by SWR `onError`).
  - `attending_count` is 0/undefined (Current bug).
  - Network failure (SWR retains stale data or shows error).
- **Test Plan**:
  - **E2E**:
    1. Login as User A.
    2. Create Event (ensure it appears in "Upcoming").
    3. User B RSVPs "Yes".
    4. User A checks Dashboard -> Verify `EventRsvpQuickAction` shows "1 going" (or correct count).
  - **Unit**: Verify `Event` interface update in `upcoming-events-widget.tsx`.

### Phase 3: Performance Review
- **Query Analysis**:
  - `GET /api/events/upcoming` calls `getEvents`.
  - **Bottleneck**: `route.ts` fetches **ALL** upcoming events (`const events = await getEvents(...)`) and then slices them locally (`events.slice(0, limit)`).
  - **Risk**: As event history/schedule grows, this will become slow.
  - **Recommendation**: Add `limit` parameter to `getEvents` and `repository` layer to push limit to the SQL query.
- **Specific Fix Impact**: Reading `_count.rsvps` has negligible performance cost (already fetched).

### Phase 4: Documentation Plan
- **Manuals**: No updates required (Bug fix, no workflow change).
- **API/Schema**: No changes.
- **Gaps**: None identified.



