# Mapbox Implementation Plan
**Version:** 2.0  
**Date:** 2025-11-27  
**Status:** In Progress - Phase 1 Complete

---

## Executive Summary
Complete migration from Google Maps to Mapbox GL JS with enhanced features including 3D terrain, routing/directions, and a modern two-column interface for community location management.

---

## Phase 1: Test Page Development ✅ **COMPLETE**

### Status: ✅ Complete
**Test Page:** `/t/[slug]/admin/map/mapbox-test`

#### Completed Features:
- ✅ Mapbox GL JS integration (v2.x via react-map-gl v7.1.7)
- ✅ All 6 location layer types rendering:
  - Community boundary (polygon with inverse mask spotlight effect)
  - Lots (465 polygons with labels, green fill)
  - Facilities (6 polygons with labels, blue fill)
  - Streets (dashed gray lines)
  - Paths (dashed green lines)
  - Check-ins (profile picture markers with pulse effect)
- ✅ Layer visibility toggles (collapsible filter panel)
- ✅ 4 base map styles: Satellite, Streets, Outdoors, 3D Terrain
- ✅ Collapsible controls (filter + base map buttons, mutually exclusive)
- ✅ Click interaction with selection highlighting (orange border)
- ✅ Basic location info popup (right side)
- ✅ Hide labels at low zoom (facilities: 14+, lots: 15+)
- ✅ Filter "Imported LineString" dummy names from labels
- ✅ Inverse mask effect (dims area outside boundary)

#### Known Issues to Address:
- 3D Terrain not fully enabled (needs pitch/terrain configuration)
- Info popup needs enhancement to match Google Maps detail level
- No routing/directions yet
- Fixed layout (not responsive to selection state)

---

## Phase 2: Enhanced UI & Interactions 🔄 **NEXT**

### 2.1 Two-Column Responsive Layout
**Timeline:** 2-3 hours

#### Tasks:
1. **Container Layout**
   - Create flex container with transition
   - Map: `w-full` (default) → `w-2/3` (when selection active)
   - Sidebar: `w-0 hidden` → `w-1/3` (when selection active)
   - Smooth slide-in animation (300ms ease-in-out)

2. **State Management**
   - Add `sidebarOpen` boolean state
   - Trigger on location click (open)
   - Trigger on empty click or close button (close)
   - Update map bounds on resize

#### Files to Modify:
- `mapbox-test-client.tsx` - Main layout structure
- Add CSS transitions for smooth animation

---

### 2.2 Top Icon Bar with Category Filters
**Timeline:** 2-3 hours

#### Features:
- Horizontal row of category buttons at top of map
- Each button shows:
  - Icon (from design tokens)
  - Label (e.g., "Lots", "Facilities")
  - Counter badge (e.g., "465", "6")
- Multi-select mode:
  - Click to highlight all locations of that type
  - Click again to deselect
  - Multiple categories can be highlighted simultaneously
- Visual state:
  - Default: White background, gray border
  - Highlighted: Primary color background, white text
  - Disabled: Grayed out

#### Implementation:
```tsx
const categoryButtons = [
  { id: 'boundary', label: 'Boundary', icon: '🗺️', count: 1 },
  { id: 'lots', label: 'Lots', icon: '📦', count: lotsGeoJSON.features.length },
  { id: 'facilities', label: 'Facilities', icon: '🏛️', count: facilitiesGeoJSON.features.length },
  { id: 'streets', label: 'Streets', icon: '🛣️', count: streetsGeoJSON.features.length },
  { id: 'paths', label: 'Paths', icon: '🚶', count: pathsGeoJSON.features.length },
  { id: 'checkins', label: 'Check-ins', icon: '📍', count: distributedCheckIns.length },
];
```

#### Files to Modify:
- `mapbox-test-client.tsx` - Add icon bar component
- Add `highlightedCategories` state (Set<string>)

---

### 2.3 Enhanced Info Cards
**Timeline:** 3-4 hours

#### Features Matching Google Maps:
1. **Hero Image/Gallery**
   - Display hero_photo if available
   - Photo gallery for facilities (from photos array)
   - Fallback placeholder for locations without photos

2. **Metadata Display:**
   - **Lots:**
     - Lot number (name)
     - Neighborhood
     - Residents count (with avatars if available)
     - Family units count
     - Status (Occupied/Available)
     - "View Details" button → `/t/[slug]/dashboard/neighbours/[id]`
   
   - **Facilities:**
     - Name and type
     - Description
     - Hours
     - Amenities (badges)
     - Capacity/max occupancy
     - Parking spaces
     - Accessibility features
     - Photos
     - "View Details" button → `/t/[slug]/admin/map/locations/[id]`
   
   - **Check-ins:**
     - Resident name and photo
     - Location name
     - Timestamp (relative time)
     - Expires at (if applicable)
     - Private/public indicator

3. **Card List View** (when category highlighted):
   - Scrollable list of cards for all locations in category
   - Clicking card highlights that location on map
   - Virtual scrolling for performance (if >50 items)

#### Files to Modify:
- `mapbox-test-client.tsx` - Enhance popup component
- Create new `LocationCard.tsx` component (reusable)
- Create new `CardList.tsx` component

---

### 2.4 3D Terrain Implementation
**Timeline:** 1-2 hours

#### Mapbox 3D Configuration:
```tsx
// Add to Map component
terrain={{
  source: 'mapbox-dem',
  exaggeration: 1.5
}}

// Add terrain source
<Source
  id="mapbox-dem"
  type="raster-dem"
  url="mapbox://mapbox.mapbox-terrain-dem-v1"
  tileSize={512}
  maxzoom={14}
/>
```

#### Features:
- Enable terrain only for "standard-satellite" style
- Add pitch/bearing controls for 3D navigation
- Initial pitch: 45° (for terrain visibility)
- Add "Reset Camera" button to return to top-down view
- Smooth camera transitions

#### Files to Modify:
- `mapbox-test-client.tsx` - Add terrain configuration

---

### 2.5 Routing & Directions
**Timeline:** 4-5 hours

#### Features:
1. **Route Planner UI:**
   - "Get Directions" button in info cards
   - Origin/destination input fields
   - Mode selector: Driving, Walking, Biking
   - Route options: Fastest, Shortest, Avoid tolls

2. **Mapbox Directions API Integration:**
   ```tsx
   // Use Mapbox Directions API
   fetch(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${token}`)
   ```

3. **Route Display:**
   - Draw route line on map (blue, semi-transparent)
   - Turn-by-turn markers
   - Distance and duration display
   - Elevation profile (for 3D terrain mode)

4. **Features:**
   - Draggable waypoints
   - Alternative routes (show up to 3)
   - Clear route button
   - Print/share route

#### New Components:
- `RoutePanel.tsx` - Side panel for route planning
- `RouteLayer.tsx` - Map layer for route visualization
- `DirectionsService.ts` - API integration

#### Files to Create:
- `/lib/services/mapbox-directions.ts`
- `/components/map/RoutePanel.tsx`
- `/components/map/RouteLayer.tsx`

---

## Phase 3: Reusable Components 📦

### 3.1 MapboxViewer Component (Read-only)
**Timeline:** 4-5 hours

#### Purpose:
Reusable, production-ready component for displaying locations on Mapbox maps.

#### Props Interface:
```typescript
interface MapboxViewerProps {
  locations: LocationWithRelations[];
  checkIns?: CheckIn[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onLocationClick?: (location: LocationWithRelations) => void;
  showControls?: boolean;
  showLayerToggles?: boolean;
  enableRouting?: boolean;
  enableSelection?: boolean;
  highlightLocationIds?: string[];
  customStyles?: {
    lotColor?: string;
    facilityColor?: string;
    selectionColor?: string;
  };
}
```

#### Features:
- All Phase 1 & 2 features
- Configurable via props
- Event callbacks for integration
- Responsive design
- Loading states
- Error boundaries

#### Files to Create:
- `/components/map/MapboxViewer.tsx`
- `/components/map/types.ts`
- `/components/map/hooks/useMapboxViewer.ts`

---

### 3.2 MapboxEditor Component (Admin)
**Timeline:** 6-8 hours

#### Purpose:
Admin component with editing capabilities for location management.

#### Additional Features (beyond Viewer):
1. **Drawing Tools:**
   - Draw new lot polygons
   - Draw new facility boundaries
   - Draw streets/paths
   - Place markers

2. **Editing Tools:**
   - Move/drag locations
   - Reshape polygons (vertex editing)
   - Delete locations
   - Merge/split polygons

3. **Validation:**
   - Prevent overlapping lots
   - Validate polygon shapes (minimum area, no self-intersections)
   - Required fields check

4. **Auto-save:**
   - Debounced saves to Supabase
   - Optimistic UI updates
   - Conflict resolution

#### Libraries to Add:
- `@mapbox/mapbox-gl-draw` - Drawing/editing tools
- Custom draw modes for specific workflows

#### Files to Create:
- `/components/map/MapboxEditor.tsx`
- `/components/map/DrawControls.tsx`
- `/lib/services/location-validation.ts`
- `/lib/services/location-mutations.ts`

---

## Phase 4: Google Maps Replacement 🔄

### 4.1 Identify Google Maps Usage
**Timeline:** 2 hours

#### Current Google Maps Pages (Audit):
1. `/t/[slug]/dashboard/map` - Main resident map
2. `/t/[slug]/admin/map` - Admin location map
3. Other embedded maps (check for components using `@react-google-maps/api`)

#### Audit Checklist:
- [ ] List all pages using Google Maps
- [ ] Document features used on each page
- [ ] Identify custom overlays/markers
- [ ] Check for Geocoding API usage
- [ ] Check for Places API usage
- [ ] Verify all map interactions

---

### 4.2 Replace Resident Map View
**Timeline:** 3-4 hours

#### Page: `/t/[slug]/dashboard/map/page.tsx`

#### Migration Steps:
1. Replace existing map with `<MapboxViewer />`
2. Port existing features:
   - Location filtering
   - Search functionality
   - Boundaries and zones display
   - Check-in markers
3. Test all interactions
4. Update any map-related actions
5. Performance testing

#### Files to Modify:
- `/app/t/[slug]/dashboard/map/page.tsx`
- `/app/t/[slug]/dashboard/map/map-client.tsx`

---

### 4.3 Replace Admin Map View
**Timeline:** 4-5 hours

#### Page: `/t/[slug]/admin/map/page.tsx`

#### Migration Steps:
1. Replace with `<MapboxEditor />`
2. Port editing features:
   - Add/edit/delete locations
   - Boundary management
   - Location status updates
3. Migrate any admin-specific tools
4. Test data mutations
5. Verify permissions

#### Files to Modify:
- `/app/t/[slug]/admin/map/page.tsx`
- `/app/t/[slug]/admin/map/map-admin-client.tsx`

---

### 4.4 Search & Geocoding Migration
**Timeline:** 3 hours

#### Replace Google Places/Geocoding:
Use **Mapbox Geocoding API** instead:

```typescript
// Search for locations
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}`)

// Reverse geocoding (lat/lng → address)
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`)
```

#### Files to Create/Modify:
- `/lib/services/mapbox-geocoding.ts`
- Update any search components

---

### 4.5 Remove Google Maps Dependencies
**Timeline:** 1 hour

#### Cleanup Tasks:
1. Remove `@react-google-maps/api` from package.json
2. Remove `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from .env
3. Remove Google Maps script tags
4. Update documentation
5. Final testing

---

## Phase 5: Testing & Optimization 🧪

### 5.1 Functional Testing
**Timeline:** 2-3 hours

#### Test Scenarios:
- [ ] All map styles load correctly
- [ ] All location types render properly
- [ ] Selection/deselection works
- [ ] Layer toggles function correctly
- [ ] Info cards display accurate data
- [ ] Routing calculates correctly
- [ ] 3D terrain displays properly
- [ ] Mobile responsiveness
- [ ] Touch interactions (mobile)
- [ ] Search/geocoding accuracy

---

### 5.2 Performance Optimization
**Timeline:** 2-3 hours

#### Optimizations:
1. **Layer Performance:**
   - Cluster check-ins if >100 markers
   - Simplify polygon geometries for distant zoom
   - Use tile-based rendering for large datasets

2. **Code Splitting:**
   - Lazy load Mapbox components
   - Dynamic imports for heavy libraries

3. **Caching:**
   - Cache geocoding results
   - Cache route calculations
   - Service worker for offline maps (optional)

---

### 5.3 Browser Testing
**Timeline:** 2 hours

#### Test Matrix:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## Phase 6: Documentation & Deployment 📚

### 6.1 Component Documentation
**Timeline:** 2 hours

#### Create Docs:
- `/docs/components/MapboxViewer.md`
- `/docs/components/MapboxEditor.md`
- `/docs/services/mapbox-integration.md`
- Usage examples and Storybook stories

---

### 6.2 Migration Guide
**Timeline:** 1 hour

#### Create Guide:
- `/docs/migration/google-maps-to-mapbox.md`
- Deprecated features list
- Breaking changes
- Migration checklist

---

### 6.3 Deployment
**Timeline:** 1-2 hours

#### Steps:
1. Feature flag for gradual rollout
2. Deploy to staging
3. QA testing
4. Deploy to production
5. Monitor performance
6. Gather user feedback

---

## Timeline Summary

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| **Phase 1** | Test Page (Complete) | ✅ Done | None |
| **Phase 2** | Enhanced UI | 12-17 hours | Phase 1 |
| **Phase 3** | Reusable Components | 10-13 hours | Phase 2 |
| **Phase 4** | Google Maps Replacement | 13-15 hours | Phase 3 |
| **Phase 5** | Testing & Optimization | 6-8 hours | Phase 4 |
| **Phase 6** | Documentation & Deployment | 4-5 hours | Phase 5 |
| **Total** | | **45-58 hours** | |

---

## Current Status: Phase 1 Complete ✅

**Next Immediate Steps (Phase 2.1):**
1. Implement two-column responsive layout with animation
2. Test selection → sidebar open/close
3. Adjust map bounds on resize

**Ready to proceed?** The plan is comprehensive and sequential. Each phase builds on the previous one, ensuring a smooth migration path.
