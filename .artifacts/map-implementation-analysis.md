# Map Implementation Analysis & Migration Planning
**Project**: Ecovilla Community Platform  
**Analysis Date**: November 26, 2024  
**Purpose**: Complete 360° analysis of current map implementation for Google Maps → Mapbox migration

---

## Executive Summary

This document provides a comprehensive analysis of the current map implementation across the Ecovilla Community Platform. The application has **6 distinct map pages** served by **18 map components**, powered by Google Maps API with extensive custom features including GeoJSON import, coordinate transformation (CRTM05/UTM → WGS84), and deep integration with community features.

### Current State Overview
- **Tech Stack**: Google Maps JavaScript API v3 (`@vis.gl/react-google-maps`)
- **Data System**: PostgreSQL/Supabase with PostGIS-style JSON storage
- **Coordinate Systems**: Handles WGS84, CRTM05 (Costa Rica), UTM zones 16N/17N
- **Integration Points**: Events, Check-ins, Requests, Exchange, Announcements, Residents
- **Location Types**: 6 distinct types (facility, lot, walking_path, neighborhood, boundary, public_street)

### Critical Issues Identified
1. **Complexity**: 103KB+ GoogleMapEditor component with multiple known bugs
2. **Performance**: Heavy client-side processing for large GeoJSON files
3. **UX Issues**: Minimal/non-minimal mode inconsistencies, highlight behavior bugs
4. **Maintenance**: "lots of issues" per project notes, incomplete features

---

## 1. Map Pages & Routes

### 1.1 Resident-Facing Pages

#### **Community Map** (`/t/[slug]/dashboard/community-map`)
- **Purpose**: Browse all community locations with filtering
- **Components**: `CommunityMapClient`, `MapPreviewWidget`, `LocationTypeCards`, `ResidentLocationsTable`
- **Features**:
  - Location type filter cards (11 types)
  - Full location table with search & filters
  - Preview map widget (96px height, minimal mode)
  - Click to highlight location types
- **Data**: Enriched locations with neighborhoods, lots, residents, families, pets
- **Permissions**: Resident read-only

#### **Full Map View** (`/t/[slug]/dashboard/map`)
- **Purpose**: Immersive full-screen map experience
- **Components**: `GoogleMapViewer` (non-minimal mode)
- **Features**:
  - Full screen height (`h-[calc(100vh-8rem)]`)
  - Location highlighting via URL query param
  - Click locations to view `LocationInfoCard`
  - Shows boundaries, facilities, lots, paths
- **URL Params**: `?highlightLocation={locationId}`
- **Auto-zoom**: Calculates zoom based on community boundary size

#### **Dashboard Map Section** (`/t/[slug]/dashboard`)
- **Purpose**: Quick glance at community map
- **Components**: `MapSectionLazy` (lazy-loaded for performance)
- **Features**:
  - Card-based widget (min-h-300px)
  - Shows resident's lot highlighted
  - Displays active check-ins
  - "Explore & catch-up" messaging
- **Data**: SWR-cached locations API call
- **CTA**: Link to full map view

### 1.2 Admin Pages

#### **Map Management** (`/t/[slug]/admin/map`)
- **Purpose**: Central hub for managing all locations
- **Components**: `LocationsTable`,  `LocationTypeCards`, `GeoJSONUploadButton`, `MapSettingsDialog`
- **Features**:
  - Bulk operations (select, delete)
  - Advanced filtering (type, neighborhood, name, description)
  - Pagination (load more pattern)
  - Jump to location on map
  - Edit/View/Delete actions
  - GeoJSON bulk import
  - Map center/zoom configuration
- **Permissions**: Admin only
- **Data**: Full join with neighborhoods, lots, users, family_units

#### **Map Viewer** (`/t/[slug]/admin/map/viewer`)
- **Purpose**: Full-screen map for viewing/inspecting
- **Components**: `GoogleMapEditor` (view mode)
- **Features**:
  - All editing tools disabled
  - Location inspection
  - Highlight specific locations via URL
- **Permissions**: Admin only

#### **Location Creator/Editor** (`/t/[slug]/admin/map/locations/create`)
- **Purpose**: Create or edit individual locations
- **Components**: `GoogleMapEditor` (edit mode - 103KB component!)
- **Features**:
  - Drawing modes: marker, polygon, polyline
  - Google Places autocomplete
  - Undo/redo for drawing
  - Photo upload (multiple)
  - Rich text editor for descriptions
  - Type-specific fields (facility types, path surface, etc.)
  - Lot/Neighborhood linking
  - Real-time coordinate display
- **Query Params**: `?editLocationId={id}` for editing
- **Known Issues**: Many features incomplete/buggy

---

## 2. Map Components Architecture

### 2.1 Core Map Components (18 total)

#### **GoogleMapViewer** (54KB, 1477 lines)
**Purpose**: Primary map display component (read-only locations)
**Props**:
```typescript
{
  locations: Location[]
  tenantId?: string
  tenantSlug?: string
  checkIns?: CheckIn[]
  mapCenter?: { lat, lng } | null
  mapZoom?: number
  isAdmin?: boolean
  highlightLocationId?: string
  minimal?: boolean  // Changes card size, interactivity
  selectedLocationId?: string
  onLocationSelect?: (id: string) => void
  enableClickablePlaces?: boolean
}
```

**Key Features**:
- **Map Type Toggle**: roadmap, satellite, terrain
- **User Geolocation**: "Locate me" button
- **Click-ins Distribution**: Distributes check-in markers within boundaries/along paths
- **Location Info Cards**: Popup cards with resident/family/pet info
- **Highlight Animation**: Pulsing effect on highlighted location
- **Boundary Management**: Community boundary overlay
- **Level Toggles**: Show/hide facilities, lots, paths, neighborhoods

**State Management**:
- 15+ useState hooks
- Dynamic highlighting
- Selected vs highlighted location
- Map type, zoom, center
- Toggle states for location types

**Known Issues**:
- Minimal mode inconsistencies
- Info card positioning on small screens
-  Check-in distribution algorithm needs refinement

#### **GoogleMapEditor** (103KB, 2563 lines!) 
**Purpose**: Full-featured map editor (create/edit locations)
**Warning**: This is the most complex component with many issues

**Features**:
- **Drawing Modes**: marker, polygon, polyline (multi-point)
- **Undo/Redo**: Drawing point history
- **Google Places**: Autocomplete search
- **Photo Manager**: Multiple photo upload
- **Rich Text Editor**: Location descriptions
- **Lot/Neighborhood Selectors**: Link to existing
- **Type-Specific Forms**: Different fields per location type
- **Save/Update Logic**: Create or update based on `editLocationId`
- **GeoJSON Import**: Session storage integration

**Complexity Drivers**:
- Inline form state (not extracted)
- Drawing state management
- Photo upload handling
- Polygon/polyline rendering
- Place search integration
- Type-specific validation

**Recommended Refactor**:
- Extract into smaller components
- Use form library (React Hook Form)
- Separate concerns (map  vs form vs upload)
- Move to Mapbox with cleaner drawing tools

#### **LocationInfoCard** (20KB, 511 lines)
**Purpose**: Popup card showing location details

**Displays**:
- Location name, icon, type badge
- Photos (if any) - click to enlarge
- Description
- Status (for facilities)
- Type-specific data:
  - **Facilities**: Capacity, hours, amenities, parking, accessibility
  - **Walking Paths**: Difficulty, surface, length, elevation
- **Linked Data** (fetched on demand):
  - Neighborhood badge
  - Lot number
  - Family unit (with avatar, link)
  - Residents (with avatars, links)
  - Pet count
- Event count (if passed as prop)
- "View Full Details" button linking to location detail page

**Modes**:
- `minimal={true}`: Smaller card, compact spacing
- `minimal={false}`: Full size with generous spacing

**Data Fetching**: Client-side fetching of related data (neighborhoods, lots, residents, families, pets)

#### **GeoJSONPreviewMap** (21KB, 583 lines)
**Purpose**: Preview and configure GeoJSON imports before saving

**Workflow**:
1. User uploads GeoJSON via dialog
2. File validated and parsed (`validateGeoJSON`, `parseGeoJSON`)
3. Coordinates transformed if needed (CRTM05/UTM → WGS84)
4. Preview on  map (satellite view)
5. User selects location type
6. Option to combine features or keep separate
7. Bulk create locations on save

**Supported Geometry Types**:
- Point → facility marker
- LineString → walking path
- Polygon → boundary/lot/protection zone
- MultiPolygon → combined boundary

**Coordinate Transformation**:
- Detects projected coordinates (values > 180/-90)
- Tries CRTM05 first (Costa Rica official system)
- Falls back to UTM 16N, then 17N
- Validates result within Costa Rica bounds

**Special Handling**:
- GeometryCollection preprocessing
- LineString → Polygon conversion option
- Boundary validation (only 1 per tenant)

### 2.2 Supporting Components

#### **LocationTypeCards** (3.3KB)
- Visual filter cards for 11 location types
- Shows count per type
- Clickable to filter table/list
- Color-coded icons

#### **LocationsTable** (Admin) (13.8KB)
- Full CRUD table with filters
- Bulk select/delete
- View/Edit/Map actions per row
- Shows linked families/residents
- Pagination with "load more"

#### **ResidentLocationsTable** (11.3KB)
- Read-only version for residents
- Same filtering capabilities
- Links to location detail pages
- No edit/delete actions

#### **MapPreviewWidget** (1.8KB)
- Wrapper for GoogleMapViewer
- Used in dashboard and community map
- Adds header, "View Full Map" button
- `hideHeader` prop for inline usage

#### **GooglePlacesAutocomplete** (6.7KB)
- Search box with Google Places
- Returns place details (name, address, coords)
- Used in location creation/editing

#### **Polygon** & **Polyline** (2.3KB each)
- Wrapper components for `@vis.gl/react-google-maps`
- Handle Google Maps Polygon/Polyline rendering
- Accept path arrays, styling props

#### **GeoJSONUploadButton** & **GeoJSONUploadDialog**
- Trigger button for upload flow
- Modal with drag-drop file input
- Displays validation errors/warnings
- Routes to preview page on success

---

## 3. Data Architecture

### 3.1 Database Schema (`locations` table)

```sql
CREATE TABLE locations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identification
  name text NOT NULL,
  type text NOT NULL, -- See location types below
  description text,
  
  -- Geometry (mutually exclusive based on type)
  coordinates jsonb,  -- Point: {"lat": number, "lng": number}
  boundary_coordinates jsonb,  -- Polygon: [[lat, lng], [lat, lng], ...]
  path_coordinates jsonb,  -- LineString: [[lat, lng], [lat, lng], ...]
  
  -- Type-specific attributes
  facility_type text,  -- e.g., 'tool_library', 'garden', 'pool'
  icon text,  -- Emoji or icon identifier
  hours text,  -- Operating hours
  amenities text[],
  capacity integer,
  max_occupancy integer,
  parking_spaces integer,
  accessibility_features text,
  rules text,  -- Rich HTML
  
  -- Walking path specific
  path_difficulty text,  -- 'easy', 'moderate', 'difficult', 'expert'
  path_surface text,  -- 'paved', 'gravel', 'dirt', 'natural'
  path_length text,  -- e.g., "2.5 km"
  elevation_gain text,  -- e.g., "150m"
 
  -- Media
  photos text[],  -- Vercel Blob URLs
  hero_photo text,
  
  -- Status
  status text,  -- 'Open', 'Closed', 'Maintenance', etc.
  
  -- References
  lot_id uuid REFERENCES lots(id) ON DELETE SET NULL,
  neighborhood_id uuid REFERENCES neighborhoods(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Indexes**:
- `idx_locations_tenant` on `tenant_id`
- `idx_locations_type` on `type`
- `idx_locations_neighborhood` on `neighborhood_id`
- `idx_locations_lot` on `lot_id`

**RLS Policies**:
- Super admins: Full access
- Tenant admins: CRUD on their tenant's locations
- Residents: Read-only on their tenant's locations

### 3.2 Location Types

11 distinct types (expandable):

1. **facility** - Point markers (pools, libraries, gardens)
2. **lot** - Polygon boundaries (residential lots)
3. **walking_path** - LineString paths
4. **neighborhood** - Polygon boundaries
5. **boundary** - Community outer boundary (1 per tenant)
6. **protection_zone** - Protected environmental area
7. **easement** - Access easement
8. **playground** - Recreation for children
9. **public_street** - Roads/streets
10. **green_area** - Parks, open space
11. **recreational_zone** - Sports, group activities

**Type Badge Colors** (current implementation):
- Facility: Orange (`bg-orange-100 text-orange-800`)
- Lot: Blue (`bg-blue-100 text-blue-800`)
- Walking Path: Sky (`bg-sky-100 text-sky-800`)
- Neighborhood: Purple (`bg-purple-100 text-purple-800`)

### 3.3 Data Enrichment

The `getLocations()` function in `lib/data/locations.ts` supports enrichment flags:

```typescript
interface GetLocationsOptions {
  types?: LocationType[]  // Filter by type(s)
  neighborhoodId?: string  // Filter by neighborhood
  lotId?: string  // Filter by lot
  
  enrichWithNeighborhood?: boolean  // Join neighborhoods table
  enrichWithLot?: boolean  // Join lots table
  enrichWithResidents?: boolean  // Join users (residents)
  enrichWithFamilies?: boolean  // Join family_units
  enrichWithPets?: boolean  // Join pets
}
```

**Usage Pattern**:
```typescript
const locations = await getLocations(tenantId, {
  enrichWithNeighborhood: true,
  enrichWithLot: true,
  enrichWithResidents: true,
  enrichWithFamilies: true,
  enrichWithPets: true,
});
```

This is used extensively in map pages to display related community data.

### 3.4 Tenant Map Configuration

**Stored in `tenants` table**:
```typescript
{
  map_center_coordinates: { lat: number, lng: number },
  map_default_zoom: number,
  map_boundary_coordinates: [[lat, lng], ...],  // Mirrored from boundary location
  features: { map: boolean }  // Feature flag
}
```

**Map Settings Dialog** (`/t/[slug]/admin/map/map-settings-dialog.tsx`):
- Admin can configure default center/zoom
- Used as fallback if no boundary exists
- Updated via server action

---

## 4. GeoJSON Processing Pipeline

### 4.1 File Upload Flow

```
User uploads file
     ↓
Validate JSON structure (validateGeoJSON)
     ↓
Check geometry types supported
     ↓
Detect coordinate system
     ↓
Transform to WGS84 if needed (transformGeometry)
     ↓
Parse into features (parseGeoJSON )
     ↓
Store in sessionStorage
     ↓
Route to preview page
     ↓
User configures options
     ↓
Bulk create locations
```

### 4.2 Coordinate Transformation

**Problem**: Uploaded GeoJSON may use projected coordinate systems

**Solution**: `lib/coordinate-transformer.ts`

**Detection Logic**:
```typescript
function detectCoordinateSystem(coords: [x, y]) {
  // WGS84 range check
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return { isProjected: false }
  }
  
  // CRTM05 range (Costa Rica official)
  if (x >= 160000 && x <= 840000 && y >= 0 && y <= 10000000) {
    return { isProjected: true, detectedSystem: "CRTM05" }
  }
  
  return { isProjected: true, detectedSystem: "Unknown" }
}
```

**Transformation Process**:
1. Try CRTM05 projection
2. Validate result in Costa Rica bounds
3. If invalid, try UTM Zone 16N
4. If still invalid, try UTM Zone 17N
5. Return best match (with logging)

**Costa Rica Bounds**:
```typescript
{
  minLng: -86.0,
  maxLng: -82.0,
  minLat: 8.0,
  maxLat: 11.5
}
```

**Library**: Uses `proj4` for coordinate transformations

### 4.3 Supported GeoJSON Structures

**FeatureCollection** (preferred):
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      },
      "properties": {
        "name": "Location Name",
        "description": "Optional description"
      }
    }
  ]
}
```

**Single Feature**:
```json
{
  "type": "Feature",
  "geometry": { ... },
  "properties": { ... }
}
```

**GeometryCollection** (preprocessed):
```json
{
  "type": "GeometryCollection",
  "geometries": [
    { "type": "LineString", "coordinates": [...] },
    { "type": "Polygon", "coordinates": [[...]] }
  ]
}
```

**Special Handling**:
- If all geometries are LineStrings, offers option to combine into single Polygon
- Each geometry converted to a Feature
- Properties inherited or auto-generated

---

## 5. Integration Points

### 5.1 Events

**Integration**: Events can be linked to locations

**Data Flow**:
- Event form has `location_id` field
- `LocationSelector` component for choosing location
- Event detail page shows linked location
- Location detail page shows events at that location
- Map can highlight event locations

**Components**:
- `location-map-preview.tsx`: Shows small map for event location
- `event-location-section.tsx`: Section on event detail page

### 5.2 Check-Ins

**Purpose**: Residents "check in" to locations to show where they are

**Map Display**:
- Check-ins shown as markers on map
- If check-in at boundary/path location, position distributed within area
- `distributePointsInBoundary()` and `distributePointsAlongPath()` algorithms
- Check-in cards show with timer/RSVP info

**Algorithms**:
- **Boundary**: Random points within polygon using ray-casting
- **Path**: Even distribution along polyline segments
- Ensures visual spread (not all same spot)

### 5.3 Requests

**Integration**: Resident requests can specify pickup/delivery location

**Flow**:
- Request form includes location selector
- Can choose community location or custom address
- Location info shown on request detail page/modal

### 5.4 Exchange Listings

**Integration**: Exchange items can have pickup location

**Usage**:
- Optional location field
- Shows on listing detail
- Map preview available

### 5.5 Announcements

**Integration**: Announcements can be linked to location

**Purpose**: "Pool closed for maintenance" announcement links to pool location

### 5.6 Resident Profiles

**Integration**: Residents linked to lots

**Data Model**:
```
users.lot_id → lots.id
lots.location_id → locations.id
```

**Display**:
- Resident profiles show lot location
- Lot locations show residents
- Family info displayed on lot location

---

## 6. Map Behavior & UX

### 6.1 Highlighting System

**Two Modes**:
1. **URL-based highlighting**: `?highlightLocation={id}`
   - Red pulsing border on highlighted location
   - Auto-zoom to highlighted location
   - Used for deep links from other pages

2. **Click-based selection**: User clicks location
   - Opens `LocationInfoCard`
   - Different from highlight (can have both)
   - Card shows detailed info

**Visual Differences**:
- **Highlighted**: Red pulsing stroke, auto-zoom
- **Selected**: Info card  open, no special stroke (unless also highlighted)

### 6.2 Map Type Toggle

**Options**:
1. **Satellite**: Aerial imagery (default for community maps)
2. **Roadmap**: Street map
3. **Terrain**: Topographic

**Stored State**: Component-level (not persisted)

### 6.3 Layer Visibility Toggles

**Options** (admin/extended view):
- Show/hide Facilities
- Show/hide Lots
- Show/hide Walking Paths
- Show/hide Neighborhoods
- Show/hide Check-ins

**Implementation**: Boolean state per layer type, filter locations array

### 6.4 User Geolocation

**"Locate Me" Button**:
- Requests browser geolocation
- Centers map on user position
- Adds blue dot marker
- Fallback error toast if denied/failed

**Library**: Uses `lib/geolocate.ts` wrapper around browser API

### 6.5 Minimal vs Full Mode

**Minimal Mode** (`minimal={true}`):
- Smaller info cards (w-80, max-h-350px)
- Less padding
- Smaller avatars
- Used in dashboard widgets

**Full Mode** (`minimal={false}`):
- Larger info cards (w-80, max-h-400px)
- Generous padding
- Full-size avatars
- Used in dedicated map pages

**Issue**: Some inconsistencies between modes (cards still large in minimal)

---

## 7. Known Issues & Technical Debt

### 7.1 Documented Issues

Per project notes: **"We've had lots of issues with the map components so there might be things in the code that we intended to do that never ended up working"**

### 7.2 Identified Problems

1. **GoogleMapEditor Complexity**
   - 103KB, 2563 lines
   - Mix of concerns (map, form, upload, state)
   - Hard to maintain/debug
   - Many incomplete features

2. **Drawing Tools**
   - Undo/redo sometimes breaks
   - Polygon closing behavior inconsistent
   - Point deletion issues

3. **Info Card Positioning**
   - Can go  off-screen on mobile
   - No boundary checking

4. **Performance**
   - Large location datasets (200+) slow rendering
   - No virtualization
   - Client-side joins expensive

5. **Check-In Distribution**
   - Algorithm can produce overlapping markers
   - No clustering on dense areas
   - May not respect polygon holes

6. **GeoJSON Import**
   - Max file size 10MB (could be larger)
   - No progress indicator for transform
   - Error messages generic

7. **Coordinate Transformation**
   - Hardcoded Costa Rica bounds
   - Won't work for other countries
   - No user override if detection wrong

8. **Minimal Mode**
   - Not truly minimal (cards still large)
   - Inconsistent behavior across components

### 7.3 Missing Features

1. **Clustering**: No marker clustering for dense areas
2. **Directions**: No routing/directions to locations
3. **Search**: No fuzzy search on map
4. **Offline**: No offline map tiles
5. **Drawing Export**: Can't export drawn shapes
6. **Bulk Edit**: Can't bulk update locations
7. **History**: No location edit history
8. **Permissions**: All residents see all locations (no granular privacy)

---

## 8. Design System Integration

### 8.1 Current Design Tokens

**Not yet aligned with WP2 design system**

Current styling uses:
- Tailwind classes (not design tokens)
- Hardcoded colors for location types
- Inconsistent spacing

**Migration Needed**:
- Badge colors → semantic color tokens
- Spacing → 8pt grid system
- Typography → Inter font system
- Shadows → design shadow scale

### 8.2 Tone of Voice

Map copy generally aligns with  TOV guide:
- ✅ "Explore locations in your community" (warm, inviting)
- ✅ "No locations yet? Time to change that!" (playful nudge)
- ✅ Río mascot in empty states

**Needs Refinement**:
- Error messages technical (e.g., "Invalid GeoJSON type")
- Some button text too formal ("Manage Location")
- Confirmation dialogs abrupt

---

## 9. Mapbox Migration Considerations

### 9.1 Why Migrate?

1. **Cost**: Google Maps pricing scales  aggressively
2. **Features**: Mapbox has better vector tiles, styling
3. **Performance**: Lighter weight, faster rendering
4. **Customization**: More control over map appearance
5. **Future-proof**: GL JS standard, active development

### 9.2 Google Maps Dependencies

**Direct Dependencies**:
- `@vis.gl/react-google-maps` (React wrapper)
- `@googlemaps/js-api-loader` (API loader)
- `@googlemaps/markerclusterer` (clustering - unused?)
- Google Places API (autocomplete)

**Features to Replicate**:
1. **Markers**: Mapbox GL JS custom markers
2. **Polygons/Polylines**: Mapbox layers
3. **Info Windows**: Mapbox popups
4. **Geocoding**: Mapbox Geocoding API
5. **Places Search**: Mapbox Search API
6. **Drawing Tools**: Mapbox Draw plugin
7. **Geolocation**: Browser API (no change)

### 9.3 Migration Strategy

**Phase 1: Standalone Test Page**
- Create `/t/[slug]/admin/map/mapbox-test`
- Build equivalent GoogleMapViewer in Mapbox
- Test with sample location data
- Validate coordinate handling

**Phase 2: Component Parity**
- Build `MapboxViewer` (replaces GoogleMapViewer)
- Build `MapboxEditor` (replaces GoogleMapEditor)
- Build `MapboxLocationCard` (replaces LocationInfoCard)
- Ensure feature parity

**Phase 3: Incremental Replacement**
- Feature flag for Mapbox vs Google Maps
- A/B test with admin users
- Monitor performance/bugs
- Gradual rollout

**Phase 4: Deprecation**
- Remove Google Maps code
- Remove dependencies
- Update documentation

### 9.4 Mapbox Component Structure (Proposed)

```
components/map-mapbox/
├── MapboxViewer.tsx           # Main map display
├── MapboxEditor.tsx           # Drawing/editing tools
├── MarkerCluster.tsx          # Clustering for dense areas
├── LocationPopup.tsx          # Info popup
├── DrawingToolbar.tsx         # Drawing controls
├── LayerToggle.tsx            # Show/hide layers
├── MapTypeToggle.tsx          # Satellite/streets
├── GeolocateControl.tsx       # User location
├── SearchBox.tsx              # Mapbox search
├── layers/
│   ├── BoundaryLayer.tsx     # Community boundary
│   ├── FacilityLayer.tsx     # Point markers
│   ├── LotLayer.tsx          # Polygon fills
│   ├── PathLayer.tsx         # LineString
│   └── CheckInLayer.tsx      # Active check-ins
└── utils/
    ├── mapbox-config.ts       # Style URLs, tokens
    └── coordinate-helpers.ts  # Reuse transform logic
```

### 9.5 Dependencies to Add

```json
{
  "mapbox-gl": "^3.0.0",
  "react-map-gl": "^7.1.0",
  "@mapbox/mapbox-gl-draw": "^1.4.0",
  "@mapbox/mapbox-gl-geocoder": "^5.0.0"
}
```

### 9.6 Key Differences

| Feature | Google Maps | Mapbox |
|---------|-------------|--------|
| **Markers** | `<Marker>` component | Custom HTML elements |
| **Polygons** | `<Polygon>` component | GeoJSON layer |
| **Popups** | `<InfoWindow>` | `<Popup>` component |
| **Drawing** | Custom implementation | `MapboxDraw` plugin |
| **Geocoding** | Places API | Geocoding API |
| **Styling** | Limited themes | Full style control |
| **Performance** | OK for <100 markers | Great for 1000s |

### 9.7 Coordinate Transformation

**No Change Needed**:
- `lib/coordinate-transformer.ts` is system-agnostic
- Works with any map library
- Continue using for GeoJSON imports

---

## 10. Component Library Review

### 10.1 Library Components (`components/Library/`)

**Map-Relevant Components** (104 total library components):
- ✅ `Card` - Used for location cards
- ✅ `Button` - CTAs throughout
- ✅ `Badge` - Location type badges
- ✅ `Avatar` - Resident avatars in info cards
- ✅ `Dialog` - Modals for settings, GeoJSON upload
- ✅ `Input` - Search, filters
- ✅ `Select` - Type/neighborhood filters
- ✅ `Table` - Location tables
- ✅ `Checkbox` - Bulk selection
- ✅ `Tabs` - (could use for map settings)
- ❌ Map components - **None in library yet**

**Design Alignment**:
- Library uses Tailwind + shadcn/ui
- Aligned with WP2 design tokens (Inter font, spacing, colors)
- Map components **NOT YET** in library

### 10.2 Redesigned Pages for Reference

**Pages to Align With**:
1. Dashboard (`/t/[slug]/dashboard`) - Redesigned
2. Resident Directory (`/t/[slug]/dashboard/neighbours`) - Redesigned
3. Events (`/t/[slug]/dashboard/events`) - Redesigned
4. Announcements (`/t/[slug]/dashboard/announcements`) - Redesigned

**Common Patterns**:
- Page header with title + description
- Search bar with icon (magnifying glass)
- Filter dropdowns (NOT filter cards like resident page)
- Data table with pagination
- Empty states with Río illustrations
- Consistent card styling (rounded-lg, shadow-sm)

**Map Pages Should Match**:
- Same header structure
- Same search/filter pattern
- Same table styling
- Same empty states
- Same button styling

---

## 11. Recommendations

### 11.1 Immediate Actions

1. **Create Standalone Mapbox Test Page**
   - Purpose: Validate Mapbox feasibility without breaking existing
   - Location: `/t/[slug]/admin/map/mapbox-test`
   - Features: Display locations, basic interactivity
   - **Start Here First**

2. **Document Current Map Component API**
   - Props, state, behavior
   - Enables like-for-like Mapbox replacement

3. **Identify Must-Have Features**
   - Not all GoogleMapEditor features are used
   - Focus migration on actually-used functionality

### 11.2 Refactoring Strategy

**DO NOT** try to migrate GoogleMapEditor directly!

Instead:
1. **Build New, Clean Mapbox Components**
   - Start from scratch with clear separation of concerns
   - Use form libraries (React Hook Form)
   - Extract reusable parts early

2. **Incremental Replacement**
   - Replace MapPreviewWidget first (simplest)
   - Then GoogleMapViewer (no editing)
   - Then GoogleMapEditor (most complex)

3. **Preserve Data Layer**
   - No changes to database schema needed
   - Coordinate transformation logic reusable
   - GeoJSON parsing reusable

### 11.3 Design System Integration

1. **Use Library Components**
   - All UI from `components/Library`
   - No custom Tailwind unless necessary

2. **Match Redesigned Pages**
   - Headers, search, filters, tables
   - Empty states with Río
   - Button styles, card styles

3. **Location Type Badges**
   - Align with new admin page designs
   - Use design token colors

### 11.4 UX Improvements

1. **Clustering**: Essential for communities with many locations
2. **Search**: Fuzzy search on map (Mapbox Search API)
3. **Responsive Info Cards**: Better mobile positioning
4. **Drawing UX**: Clear visual feedback, forgiving undo
5. **Performance**: Lazy load location details, virtualize lists

---

## 12. Next Steps

### Step 1: Review This Document ✓
**Action**: User to review and approve analysis

### Step 2: Create Implementation Plan
**Output**: Detailed step-by-step plan for building Mapbox components
**Includes**:
- Component specifications
- Data flow diagrams  
- Task breakdown
- Timeline estimates

### Step 3: Design Layout Options
**Output**: 3-5 wireframe/mockup options for new map pages
**Considerations**:
- Alignment with redesigned pages
- Mobile-first approach
- Clear information hierarchy

### Step 4: Build Standalone Test Page
**Output**: Working Mapbox page with sample data
**Validates**:
- Mapbox integration
- Coordinate handling
- Performance
- Browser compatibility

### Step 5: Iterate Based on Testing
**Output**: Refined components ready for production replacement

---

## 13. Appendix: File Reference

### Map Components
```
components/map/
├── community-map.tsx (6.7KB) - Mapbox GL basic integration
├── geojson-preview-map.tsx (21KB) - GeoJSON preview/import
├── geojson-upload-button.tsx (0.7KB) - Upload trigger
├── geojson-upload-dialog.tsx (7.2KB) - Upload modal
├── google-map-editor-client.tsx (0.7KB) - Client wrapper
├── google-map-editor.tsx (103KB) - ⚠️ Complex editor
├── google-map-viewer.tsx (55KB) - Main viewer
├── google-places-autocomplete.tsx (6.7KB) - Places search
├── leaflet-map-editor.tsx (10KB) - Unused Leaflet experiment
├── location-info-card.tsx (20KB) - Location popup cards
├── location-type-cards.tsx (3.4KB) - Filter cards
├── locations-table.tsx (13.8KB) - Admin location table
├── map-editor.tsx (12.9KB) - Generic wrapper
├── map-preview-widget.tsx (1.8KB) - Dashboard widget
├── map-viewer.tsx (10.5KB) - Generic wrapper
├── polygon.tsx (2.3KB) - Polygon wrapper
├── polyline.tsx (2.4KB) - Polyline wrapper
└── resident-locations-table.tsx (11.3KB) - Resident table
```

### Map Pages
```
app/t/[slug]/
├── dashboard/
│   ├── community-map/
│   │   ├── page.tsx
│   │   └── community-map-client.tsx
│   ├── map/
│   │   ├── page.tsx
│   │   └── full-map-client.tsx
│   └── page.tsx (includes map section)
└── admin/map/
    ├── page.tsx (management hub)
    ├── admin-map-client.tsx
    ├── map-settings-dialog.tsx
    ├── viewer/
    │   └── page.tsx
    └── locations/
        └── create/
            └── page.tsx
```

### Data & Utilities
```
lib/
├── data/locations.ts (12.3KB) - Data access layer
├── geojson-parser.ts (12.8KB) - GeoJSON validation/parsing
├── coordinate-transformer.ts (4.9KB) - Coordinate transforms
└── location-utils.ts - Helper functions

app/actions/locations.ts (6.1KB) - Server actions

types/locations.ts (1KB) - TypeScript types
```

### Database
```
scripts/
├── 045_create_locations_table.sql - Initial schema
├── 046_add_neighborhood_to_location_types.sql
├── 049_add_new_location_types.sql
├── add-location-attributes.sql
└── add-hero-photo-support.sql
```

---

## Questions for Planning Phase

1. **Scope**: Rebuild all 6 map pages or focus on core functionality first?
2. **Timeline**: Phased rollout or big bang replacement?
3. **Feature Parity**: Keep all GoogleMapEditor features or simplify?
4. **Design**: How much creative freedom for layout redesign?
5. **Testing**: User testing plan with residents/admins?
6. **Rollback**: Feature flag vs separate route for testing?

---

**End of Analysis Document**

This document should be treated as the source of truth for map implementation details during the refactoring project. All information is based on actual code inspection as of November 26, 2024.
