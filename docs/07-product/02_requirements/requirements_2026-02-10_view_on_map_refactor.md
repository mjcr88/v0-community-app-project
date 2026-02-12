# Requirements: Consolidate Map Views & Fix "View on Map"

## Problem Statement
The "View on map" button on the Location Details page currently redirects to `/dashboard/map`, which uses a legacy `ResidentMapClient` component. This component is "unsupported" (missing features like boundaries, filters) and does not support the `highlightLocation` functionality, leaving users lost on a default map view.

## Proposed Solution
### 1. Navigation Redirect
- **Change**: Update the "View on map" button in `LocationDetailsPage` (`app/t/[slug]/dashboard/locations/[id]/page.tsx`).
- **New Destination**: `/t/${slug}/dashboard/community-map?highlightLocationId=${location.id}`.
- **Rationale**: Directs users to the feature-rich `CommunityMapClient`.

### 2. Community Map Enhancement
- **Component**: `CommunityMapClient` (`app/t/[slug]/dashboard/community-map/community-map-client.tsx`).
- **Change**: pass the `highlightLocationId` prop to the inner `MapboxFullViewer`.
- **Validation**: `MapboxFullViewer` already supports this prop (verified in code and Storybook).

### 3. Cleanup & Debt Removal
- **Target 1**: Delete `/app/t/[slug]/dashboard/map/page.tsx` (Legacy Route).
- **Target 2**: Delete `/components/map/resident-map-client.tsx` (Legacy Component).
- **Verification**: Confirmed these are only used by the legacy route being deleted.

## Technical Details
- **Existing Capabilities**: `MapboxFullViewer` has a `highlightLocationId` prop that triggers a `flyTo` animation and selects the location.
- **Route Handling**: The `ResidentCommunityMapPage` already receives `searchParams`. We just need to ensure they are passed correctly to the client component.

## Cleanup
-   Delete `/app/t/[slug]/dashboard/map/page.tsx`
-   Delete `/components/map/resident-map-client.tsx` (if unused elsewhere)

## Dependencies
-   Existing `MapboxFullViewer` component.

## Risks
-   None identified. The `MapboxFullViewer` logic for highlighting already exists; we are just wiring it up.

## Technical Options

### Option 1: Direct Component Swap & Cleanup (Recommended)
Refactor the "View on map" button to point to `/t/${slug}/dashboard/community-map` and pass the `highlightLocationId` parameter. Update the `CommunityMapClient` to consume this parameter and pass it to `MapboxFullViewer`. Delete the legacy `ResidentMapClient` and the `/dashboard/map` page immediately.
- **Pros**: Cleanest codebase, reduces tech debt immediately, single source of truth for map logic.
- **Cons**: Slightly higher initial effort to verify `CommunityMapClient` wiring.
- **Effort**: Low (1-2 hours)

### Option 2: Server-Side Redirect
Modify `/dashboard/map` to perform a server-side redirect to `/t/${slug}/dashboard/community-map` while preserving query parameters.
- **Pros**: Preserves any external bookmarks to the old map URL.
- **Cons**: Keeps the directory structure for a simple redirect; less clean than removing it.
- **Effort**: Low (1 hour)

### Option 3: Client-Side Shim
Keep `ResidentMapPage` but replace `ResidentMapClient` with `CommunityMapClient`.
- **Pros**: Minimal file deletion.
- **Cons**: Confusing architecture (two pages rendering the same complex client).
- **Effort**: Low (1 hour)

## Recommendation

### Strategy: Option 1 (Direct Component Swap & Cleanup)
This approach aligns with our goal of reducing technical debt and maintaining a single source of truth for the map. The validation of `MapboxFullViewer` confirms that the necessary features are already present, making this a low-risk refactor.

### Metadata
- **Priority**: P2
- **Size**: S
- **Horizon**: Q1 26


