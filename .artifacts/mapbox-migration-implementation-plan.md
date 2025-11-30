# Mapbox Migration: Detailed Implementation Plan
**Project**: Ecovilla Community Platform - Map Refactoring  
**Created**: November 26, 2024  
**Status**: Ready for Implementation

---

## Executive Summary

This plan details the migration from Google Maps to Mapbox GL JS, addressing specific visual requirements (borders, fills, labels on polygons, profile picture markers) and leveraging Mapbox's superior capabilities for community mapping.

### Visual Goals (From Reference Image)
1. ✅ **Polygon borders + semi-transparent fills** (darker borders, light fill)
2. ✅ **Labels INSIDE polygons** (lot numbers like "E01", "E02", facility names)
3. ✅ **Profile picture markers** for check-ins (avatars, not dots)
4. ✅ **Multiple users at same location** all visible
5. ✅ **Community boundary** (outer red/orange border)

### Simplified Location Types (6 total)
- `facility` - Point markers (pools, gardens, tool libraries)
- `lot` - Polygon boundaries (residential lots)
- `walking_path` - LineStrings (trails, paths)
- `neighborhood` - Polygon areas
- `boundary` - Community outer boundary (1 per tenant)
- `public_street` - Roads/streets

---

## Mapbox Advantages Over Google Maps

### What You Get with Mapbox

**1. Visual Styling**
- ✅ **Full control over polygon fills/strokes** - exactly like your reference image
- ✅ **Text labels ON polygons** - lot numbers, facility names integrated into shapes
- ✅ **Custom layer styling** - borders, fills, opacity, colors all configurable
- ✅ **3D buildings** (optional) - add depth to facilities
- ✅ **Terrain/hillshade** - show topography for walking paths

**2. Performance**
- ✅ **Vector tiles** - smooth zooming, no pixelation
- ✅ **Client-side rendering** - faster than Google Maps raster tiles
- ✅ **Clustering built-in** - handle hundreds of check-in markers efficiently
- ✅ **WebGL rendering** - hardware-accelerated graphics

**3. Data & Features**
- ✅ **GeoJSON native** - no conversion needed (your current data works as-is!)
- ✅ **Data-driven styling** - color lots by occupancy, facilities by type, etc.
- ✅ **Expression language** - conditional styling based on properties
- ✅ **Time-based animations** - e.g., fade in/out check-ins over time

**4. Developer Experience**
- ✅ **React integration** - `react-map-gl` is cleaner than Google's wrapper
- ✅ **TypeScript support** - full type safety
- ✅ **Drawing tools** - `@mapbox/mapbox-gl-draw` for editing
- ✅ **Better docs** - comprehensive examples for every use case

**5. Advanced Capabilities**
- ✅ **Heatmaps** - visualize check-in density
- ✅ **Animated paths** - show walking path difficulty with moving lines
- ✅ **Extrusion** - 3D polygons for elevation/building heights
- ✅ **Clustering** - automatic marker grouping (Google charges extra)
- ✅ **Offline maps** - cache tiles for mobile users
- ✅ **Custom basemap styles** - night mode, high contrast, branded themes

**6. Cost**
- ✅ **Free tier**: 50,000 loads/month (Google: 28,000)
- ✅ **Cheaper at scale** - $5/1000 loads vs Google's $7/1000
- ✅ **No "premium" features** - clustering, styling all included

---

## Mapbox Studio: Visual Configuration Tool

### Yes, Mapbox Has a No-Code UI Editor!

**Mapbox Studio** (https://studio.mapbox.com) is your visual map configurator:

#### What You Can Do Without Code:
1. **Design Custom Map Styles**
   - Choose color schemes (light, dark, satellite hybrid)
   - Adjust road widths, label sizes
   - Toggle POI visibility (restaurants, gas stations, etc.)
   - Set building extrusion heights

2. **Upload Your Data**
   - Drag-drop GeoJSON files (your lots, facilities, streets)
   - Convert to vector tilesets
   - Style programmatically OR in UI

3. **Configure Layers**
   - Fill colors for polygons
   - Stroke colors/widths for borders
   - Text labels (font, size, color, placement)
   - Icon symbols (upload custom images)

4. **Export Style JSON**
   - Download entire style as JSON
   - Load in your app with one line of code:
   ```javascript
   mapboxgl.accessToken = 'YOUR_TOKEN';
   const map = new mapboxgl.Map({
     style: 'mapbox://styles/yourUsername/yourStyleId'
   });
   ```

#### Workflow:
```
Upload Ecovilla GeoJSON 
    ↓
Style in Mapbox Studio (visual editor)
    ↓
Get style URL
    ↓
Use in React app
```

**What You Still Need Code For**:
- Interactivity (click to view location details)
- Dynamic data updates (new check-ins appear)
- Forms/editing (drawing new locations)
- Business logic (filtering, searching)

**Recommendation**: Start with Mapbox Studio to design the "look" (colors, borders, labels), then add interactivity in code.

---

## How Mapbox Solves Your Specific Problems

### 1. Borders + Fills on Polygons ✅

**Google Maps Issue**: Limited control over polygon styling

**Mapbox Solution**: Full layer control

```javascript
// Fill layer (light opacity)
{
  id: 'lots-fill',
  type: 'fill',
  source: 'lots',
  paint: {
    'fill-color': '#6B9B47',  // Your design system green
    'fill-opacity': 0.2
  }
}

// Border layer (darker, crisp)
{
  id: 'lots-border',
  type: 'line',
  source: 'lots',
  paint: {
    'line-color': '#2D5016',  // Your deep forest color
    'line-width': 2opacity': 1
  }
}
```

**Result**: Exactly like your reference image - visible boundaries with transparent interiors.

---

### 2. Labels ON Polygons (Lot Numbers, Facility Names) ✅

**Google Maps Issue**: Can't place labels inside custom polygons

**Mapbox Solution**: Symbol layers with centroid calculation

**Method 1: Pre-calculate Centroids (Server-Side)**
```typescript
// When creating location, store centroid
import * as turf from '@turf/turf';

const polygon = { type: 'Polygon', coordinates: [...] };
const centroid = turf.centroid(polygon);

await supabase.from('locations').insert({
  boundary_coordinates: polygon.coordinates,
  label_coordinate: centroid.geometry.coordinates  // [lng, lat]
});
```

**Method 2: Calculate On-the-Fly (Client-Side)**
```javascript
// Add symbol layer for labels
{
  id: 'lot-labels',
  type: 'symbol',
  source: 'lots',
  layout: {
    'text-field': ['get', 'lot_number'],  // "E01", "E02", etc.
    'text-font': ['Inter SemiBold', 'Arial Unicode MS Bold'],
    'text-size': 14,
    'text-anchor': 'center'
  },
  paint: {
    'text-color': '#1A1A1A',
    'text-halo-color': '#FFFFFF',  // White outline for visibility
    'text-halo-width': 2
  }
}
```

**For Complex Polygons**: Use `polylabel` to find optimal label position
```javascript
import polylabel from 'polylabel';

// Find the "pole of inaccessibility" (best label spot)
const bestPoint = polylabel(polygonCoordinates, 1.0);
```

**Result**: Lot numbers appear centered in each lot, facility names on facility polygons.

---

### 3. Profile Picture Markers for Check-Ins ✅

**Google Maps Issue**: Custom HTML markers are clunky, slow for many users

**Mapbox Solution**: Custom image markers OR HTML markers (your choice)

**Option A: Image Markers (Faster)**
```javascript
// Convert profile pictures to map icons
residents.forEach(resident => {
  map.loadImage(resident.profile_picture_url, (error, image) => {
    if (!error) {
      map.addImage(`avatar-${resident.id}`, image, {
        width: 40,
        height: 40,
        borderRadius: '50%'  // circular
      });
    }
  });
});

// Add check-in layer
{
  id: 'check-ins',
  type: 'symbol',
  source: 'check-ins',
  layout: {
    'icon-image': ['get', 'avatar_id'],  // avatar-{userId}
    'icon-size': 1,
    'icon-allow-overlap': true  // Show all, even if close together
  }
}
```

**Option B: HTML Markers (More Flexible)**
```javascript
// Create custom HTML marker for each check-in
checkIns.forEach(checkIn => {
  const el = document.createElement('div');
  el.className = 'check-in-marker';
  el.innerHTML = `
    <img 
      src="${checkIn.user.profile_picture_url}" 
      class="w-10 h-10 rounded-full border-2 border-white shadow-md"
      alt="${checkIn.user.name}"
    />
  `;
  
  new mapboxgl.Marker(el)
    .setLngLat([checkIn.lng, checkIn.lat])
    .addTo(map);
});
```

**Handling Multiple Users at Same Location**:
```javascript
// Offset markers in a circle around the location
function distributeMarkers(checkIns, center, radius = 0.00005) {
  return checkIns.map((checkIn, i) => {
    const angle = (i / checkIns.length) * 2 * Math.PI;
    return {
      ...checkIn,
      lng: center.lng + radius * Math.cos(angle),
      lat: center.lat + radius * Math.sin(angle)
    };
  });
}
```

**Result**: Circle-cropped profile pictures as map markers, spread out if multiple people at same spot.

---

### 4. Community Boundary (Bold Outline) ✅

```javascript
{
  id: 'community-boundary',
  type: 'line',
  source: 'boundary',
  paint: {
    'line-color': '#D97742',  // Your Sunrise Orange
    'line-width': 3,
    'line-opacity': 0.9
  }
}

// Optional: Add subtle fill
{
  id: 'community-boundary-fill',
  type: 'fill',
  source: 'boundary',
  paint: {
    'fill-color': '#D97742',
    'fill-opacity': 0.05  // Very subtle
  }
}
```

---

## Phase 1: Standalone Test Page (Week 1)

### Goal
Build a working Mapbox page using your **actual Ecovilla San Mateo data** to validate:
- GeoJSON data compatibility
- Visual styling matches reference image
- Profile picture check-in markers work
- Performance is acceptable

### Setup

**1. Install Dependencies**
```bash
npm install mapbox-gl react-map-gl @turf/turf polylabel
npm install --save-dev @types/mapbox-gl
```

**2. Get Mapbox Access Token**
- Sign up at https://mapbox.com (free tier: 50K loads/month)
- Get access token from account dashboard
- Add to `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZS...
```

**3. Choose Base Style**

Options (pick one to start):
- `mapbox://styles/mapbox/satellite-v9` (matches your reference image)
- `mapbox://styles/mapbox/outdoors-v12` (good for trails)
- `mapbox://styles/mapbox/light-v11` (clean, modern)
- Create custom in Mapbox Studio

### File Structure

```
app/t/[slug]/admin/map/mapbox-test/
├── page.tsx                    # Server component (data loading)
└── mapbox-test-client.tsx      # Client component (map rendering)

components/map-mapbox/
├── MapboxViewer.tsx            # Main map component
├── layers/
│   ├── BoundaryLayer.tsx       # Community boundary
│   ├── LotsLayer.tsx           # Lot polygons + labels
│   ├── FacilitiesLayer.tsx     # Facility markers + labels
│   ├── StreetsLayer.tsx        # Public streets
│   └── CheckInsLayer.tsx       # Profile picture markers
├── controls/
│   ├── MapTypeToggle.tsx       # Satellite/Streets/Terrain
│   ├── LayerToggle.tsx         # Show/hide layers
│   └── GeolocateButton.tsx     # "Locate me"
└── utils/
    ├── mapbox-config.ts        # Base config, styles
    ├── calculate-centroids.ts  # Label positioning
    └── prepare-geojson.ts      # Format data for Mapbox
```

### Implementation Tasks

#### **Task 1.1: Basic Map Display** (2-3 hours)
```typescript
// app/t/[slug]/admin/map/mapbox-test/mapbox-test-client.tsx
'use client';

import { useState } from 'react';
import Map, { Layer, Source } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export function MapboxTestClient({ locations, tenantId }) {
  const [viewState, setViewState] = useState({
    longitude: -84.5333,  // Costa Rica default
    latitude: 9.9567,
    zoom: 14
  });

  return (
    <div className="h-screen">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {/* Layers will go here */}
      </Map>
    </div>
  );
}
```

**Validation**: Map loads, can pan/zoom

---

#### **Task 1.2: Display Lots with Borders + Fills** (2 hours)

```typescript
// Prepare lot data
const lotFeatures = locations
  .filter(loc => loc.type === 'lot' && loc.boundary_coordinates)
  .map(lot => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [lot.boundary_coordinates.map(([lat, lng]) => [lng, lat])]  // Swap lat/lng!
    },
    properties: {
      id: lot.id,
      lot_number: lot.name,  // "E01", "E02", etc.
      neighborhood: lot.neighborhood?.name
    }
  }));

const lotsGeoJSON = {
  type: 'FeatureCollection',
  features: lotFeatures
};

// In Map component:
<Source id="lots" type="geojson" data={lotsGeoJSON}>
  {/* Fill layer */}
  <Layer
    id="lots-fill"
    type="fill"
    paint={{
      'fill-color': '#6B9B47',  // Fresh Growth green
      'fill-opacity': 0.2
    }}
  />
  
  {/* Border layer */}
  <Layer
    id="lots-border"
    type="line"
    paint={{
      'line-color': '#2D5016',  // Deep Forest
      'line-width': 2
    }}
  />
</Source>
```

**Validation**: Lots show as polygons with semi-transparent fills and dark borders

---

#### **Task 1.3: Add Lot Number Labels** (3 hours)

```typescript
// Calculate centroids
import * as turf from '@turf/turf';

const lotLabels = lotFeatures.map(feature => {
  const centroid = turf.centroid(feature);
  return {
    type: 'Feature',
    geometry: centroid.geometry,
    properties: feature.properties
  };
});

const labelsGeoJSON = {
  type: 'FeatureCollection',
  features: lotLabels
};

// Add label layer
<Source id="lot-labels" type="geojson" data={labelsGeoJSON}>
  <Layer
    id="lot-labels"
    type="symbol"
    layout={{
      'text-field': ['get', 'lot_number'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 14,
      'text-anchor': 'center'
    }}
    paint={{
      'text-color': '#1A1A1A',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2,
      'text-halo-blur': 1
    }}
  />
</Source>
```

**Validation**: Lot numbers appear inside each polygon

---

#### **Task 1.4: Display Facilities** (2 hours)

```typescript
const facilityFeatures = locations
  .filter(loc => loc.type === 'facility' && loc.coordinates)
  .map(fac => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [fac.coordinates.lng, fac.coordinates.lat]
    },
    properties: {
      id: fac.id,
      name: fac.name,
      icon: fac.icon || '🏠',
      facility_type: fac.facility_type
    }
  }));

<Source id="facilities" type="geojson" data={facilitiesGeoJSON}>
  <Layer
    id="facilities"
    type="symbol"
    layout={{
      'text-field': ['get', 'icon'],
      'text-size': 24,
      'text-offset': [0, 0.5],
      'text-anchor': 'top'
    }}
  />
  
  {/* Facility name labels */}
  <Layer
    id="facility-labels"
    type="symbol"
    layout={{
      'text-field': ['get', 'name'],
      'text-font': ['Inter SemiBold', 'Arial Unicode MS Regular'],
      'text-size': 12,
      'text-offset': [0, 1.5],
      'text-anchor': 'top'
    }}
    paint={{
      'text-color': '#1A1A1A',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 1.5
    }}
  />
</Source>
```

**Validation**: Facilities show with emoji/icon and name label below

---

#### **Task 1.5: Add Community Boundary** (1 hour)

```typescript
const boundary = locations.find(loc => loc.type === 'boundary');

if (boundary && boundary.boundary_coordinates) {
  const boundaryGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [boundary.boundary_coordinates.map(([lat, lng]) => [lng, lat])]
    }
  };

  // In Map:
  <Source id="boundary" type="geojson" data={boundaryGeoJSON}>
    <Layer
      id="boundary-line"
      type="line"
      paint={{
        'line-color': '#D97742',  // Sunrise Orange
        'line-width': 3,
        'line-opacity': 0.9
      }}
    />
  </Source>
}
```

**Validation**: Orange/red boundary outlines the community

---

#### **Task 1.6: Public Streets** (1 hour)

```typescript
const streetFeatures = locations
  .filter(loc => loc.type === 'public_street' && loc.path_coordinates)
  .map(street => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: street.path_coordinates.map(([lat, lng]) => [lng, lat])
    },
    properties: {
      id: street.id,
      name: street.name
    }
  }));

<Source id="streets" type="geojson" data={streetsGeoJSON}>
  <Layer
    id="streets"
    type="line"
    paint={{
      'line-color': '#8C8C8C',  // Morning Mist gray
      'line-width': 3,
      'line-dasharray': [2, 2]  // Dashed line
    }}
  />
</Source>
```

**Validation**: Streets show as dashed gray lines

---

#### **Task 1.7: Check-In Markers with Profile Pictures** (4 hours)

**Step 1: Create circular avatar images**
```typescript
// utils/create-avatar-marker.ts
export function createAvatarMarkerElement(checkIn: CheckIn) {
  const el = document.createElement('div');
  el.className = 'check-in-marker';
  el.style.width = '40px';
  el.style.height = '40px';
  
  el.innerHTML = `
    <div class="relative group cursor-pointer">
      <img 
        src="${checkIn.resident.profile_picture_url || '/default-avatar.png'}" 
        class="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
        alt="${checkIn.resident.first_name}"
      />
      <!-- Pulse animation -->
      <div class="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75"></div>
      
      <!-- Tooltip on hover -->
      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        ${checkIn.resident.first_name}
        ${checkIn.location_name ? ` @ ${checkIn.location_name}` : ''}
      </div>
    </div>
  `;
  
  return el;
}
```

**Step 2: Add markers to map**
```typescript
import { Marker } from 'react-map-gl';
import { createAvatarMarkerElement } from './utils/create-avatar-marker';

// In component:
{checkIns.map(checkIn => {
  // If multiple check-ins at same location, distribute them
  const position = distributeIfNeeded(checkIn, checkIns);
  
  return (
    <Marker
      key={checkIn.id}
      longitude={position.lng}
      latitude={position.lat}
      anchor="center"
    >
      {createAvatarMarkerElement(checkIn)}
    </Marker>
  );
})}
```

**Step 3: Handle collisions**
```typescript
// utils/distribute-markers.ts
export function distributeIfNeeded(checkIn: CheckIn, allCheckIns: CheckIn[]) {
  // Find all check-ins at the same location
  const sameLocation = allCheckIns.filter(ci => 
    ci.location_id === checkIn.location_id &&
    Math.abs(ci.coordinates.lat - checkIn.coordinates.lat) < 0.0001 &&
    Math.abs(ci.coordinates.lng - checkIn.coordinates.lng) < 0.0001
  );
  
  if (sameLocation.length === 1) {
    return checkIn.coordinates;
  }
  
  // Distribute in circle
  const index = sameLocation.indexOf(checkIn);
  const angle = (index / sameLocation.length) * 2 * Math.PI;
  const radius = 0.00005;  // ~5 meters
  
  return {
    lat: checkIn.coordinates.lat + radius * Math.sin(angle),
    lng: checkIn.coordinates.lng + radius * Math.cos(angle)
  };
}
```

**Validation**: 
- Profile pictures show as circular markers
- Multiple users at same location spread in circle
- Hover shows name + location
- Pulsing animation indicates active check-in

---

#### **Task 1.8: Interactive Popups** (2 hours)

```typescript
import { Popup } from 'react-map-gl';
import { useState } from 'react';

const [selectedLot, setSelectedLot] = useState<string | null>(null);

// Make lots clickable
<Layer
  id="lots-fill-interactive"
  type="fill"
  paint={{...}}
  onClick={(e) => {
    const feature = e.features?.[0];
    if (feature) {
      setSelectedLot(feature.properties.id);
    }
  }}
/>

{/* Show popup */}
{selectedLot && (
  <Popup
    longitude={popupLng}
    latitude={popupLat}
    anchor="bottom"
    onClose={() => setSelectedLot(null)}
  >
    <LocationInfoCard locationId={selectedLot} />
  </Popup>
)}
```

---

### Phase 1 Deliverables

**✅ Working test page at**: `/t/ecovilla-san-mateo/admin/map/mapbox-test`

**Features**:
- [ ] Satellite base map
- [ ] Community boundary (orange outline)
- [ ] Lots with borders + fills + lot numbers inside
- [ ] Facilities with icons + names
- [ ] Public streets (dashed lines)
- [ ] Check-in profile picture markers (circular, distributed if multiple)
- [ ] Click lots to see info popup
- [ ] Geolocation button
- [ ] Map type toggle (satellite/streets/terrain)

**Success Criteria**:
- Visually matches reference image
- Loads actual Ecovilla San Mateo data
- Performance: <2s initial load, smooth 60fps pan/zoom
- Mobile responsive

---

## Phase 2: Component Library (Week 2-3)

### Goal
Build reusable, production-ready Mapbox components aligned with your design system.

### Component Specifications

#### **MapboxViewer.tsx**
**Purpose**: Main read-only map display (equivalent to GoogleMapViewer)

**Props**:
```typescript
interface MapboxViewerProps {
  locations: EnrichedLocation[];
  tenantId: string;
  tenantSlug: string;
  checkIns?: CheckIn[];
  mapCenter?: { lat: number; lng: number } | null;
  mapZoom?: number;
  highlightLocationId?: string;
  minimal?: boolean;
  showControls?: boolean;
  baseStyle?: 'satellite' | 'streets' | 'outdoors' | 'terrain';
}
```

**Features**:
- All layer types (boundary, lots, facilities, streets, walking_paths)
- Layer toggles (show/hide each type)
- Highlight specific location
- Info card popups
- Geolocation
- Map type switcher
- Responsive (mobile/desktop)

**Design Alignment**:
- Use Library components (`Card`, `Button`, `Badge`)
- Inter font (from design system)
- Colors from design tokens
- 8px grid spacing

---

#### **MapboxEditor.tsx**
**Purpose**: Location creation/editing (replacement for GoogleMapEditor)

**Props**:
```typescript
interface MapboxEditorProps {
  tenantId: string;
  tenantSlug: string;
  existingLocations: Location[];
  editLocationId?: string;  // If editing
  onSave: (location: LocationData) => Promise<void>;
  onCancel: () => void;
}
```

**Features**:
- Mapbox Draw integration
  - Draw markers (facilities)
  - Draw polygons (lots, neighborhoods)
  - Draw lines (streets, walking paths)
- Edit mode (modify existing shapes)
- Delete mode
- Snap to existing geometry (optional)
- Coordinate display (show lat/lng on hover)

**UI Structure**:
```
┌─────────────────────────────────┐
│ [Save] [Cancel]     [Undo][Redo]│
├─────────────────────────────────┤
│                                  │
│         MAP CANVAS               │
│                                  │
│                                  │
├─────────────────────────────────┤
│ Drawing Tools:                   │
│ [📍 Point] [▬ Line] [▭ Polygon] │
│                                  │
│ Location Details Form:           │
│ Name: [___________]              │
│ Type: [Dropdown]                 │
│ Icon: [🏊 __]                   │
│ Description: [Rich Text Editor]  │
│ ...                              │
└─────────────────────────────────┘
```

**Improvements Over GoogleMapEditor**:
- **Simpler**: Mapbox Draw handles drawing, we only handle form
- **Cleaner**: Separate map from form (side-by-side or stacked)
- **Reusable**: Extract form into separate component
- **Type-safe**: Use React Hook Form with Zod validation

---

#### **Layer Components** (Composable)

```
layers/
├── BoundaryLayer.tsx
├── LotsLayer.tsx
├── FacilitiesLayer.tsx
├── WalkingPathsLayer.tsx
├── StreetsLayer.tsx
├── NeighborhoodsLayer.tsx
└── CheckInsLayer.tsx
```

Each layer component:
```typescript
interface LayerProps {
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  interactive?: boolean;
  onClick?: (feature: GeoJSON.Feature) => void;
}

// Usage:
<BoundaryLayer 
  data={boundaryGeoJSON} 
  visible={showBoundary} 
/>

<LotsLayer
  data={lotsGeoJSON}
  visible={showLots}
  interactive={true}
  onClick={handleLotClick}
/>
```

**Benefits**:
- Reusable across pages
- Easy  to toggle on/off
- Testable in isolation
- Consistent styling

---

#### **Controls**

```
controls/
├── MapTypeToggle.tsx       # Satellite/Streets/Terrain
├── LayerToggle.tsx         # Checkbox list to show/hide layers
├── GeolocateButton.tsx     # "Locate me"
├── ZoomControls.tsx        # +/- buttons
└── FullscreenButton.tsx    # Expand to fullscreen
```

**Example: LayerToggle**
```typescript
<LayerToggle
  layers={[
    { id: 'boundary', label: 'Community Boundary', visible: showBoundary, onChange: setShowBoundary },
    { id: 'lots', label: 'Lots', visible: showLots, onChange: setShowLots },
    { id: 'facilities', label: 'Facilities', visible: showFacilities, onChange: setShowFacilities },
    { id: 'streets', label: 'Streets', visible: showStreets, onChange: setShowStreets },
    { id: 'walking_paths', label: 'Walking Paths', visible: showPaths, onChange: setShowPaths },
    { id: 'check_ins', label: 'Check-Ins', visible: showCheckIns, onChange: setShowCheckIns }
  ]}
/>
```

---

#### **Utilities**

```
utils/
├── mapbox-config.ts              # Access token, base styles, defaults
├── convert-coordinates.ts        # [lat, lng] ↔ [lng, lat] conversion
├── calculate-centroids.ts        # Turf.js helpers for labeling
├── prepare-geojson.ts            # Transform DB data → GeoJSON
├── cluster-check-ins.ts          # Clustering logic (optional)
└── coordinate-transformer.ts     # REUSE existing file (CRTM05/UTM → WGS84)
```

---

### Testing Strategy

**Unit Tests** (Vitest):
- [ ] Coordinate conversion helpers
- [ ] GeoJSON preparation
- [ ] Centroid calculation

**Component Tests** (React Testing Library):
- [ ] MapboxViewer renders without crashing
- [ ] Layers toggle on/off correctly
- [ ] Info cards open/close

**Integration Tests** (Playwright):
- [ ] Full map page loads real data
- [ ] Click on lot opens info card
- [ ] Drawing tools create valid GeoJSON

**Visual Regression** (Percy or Chromatic):
- [ ] Screenshot map with all layers enabled
- [ ] Compare to reference image

---

## Phase 3: Page Replacement (Week 4)

### Pages to Rebuild

#### 1. **Community Map** (`/dashboard/community-map`)

**Before**: `GoogleMapViewer` + `LocationTypeCards` + `ResidentLocationsTable`

**After**: Same layout, swap in `MapboxViewer`

**Changes**:
```diff
- import { GoogleMapViewer } from '@/components/map/google-map-viewer';
+ import { MapboxViewer } from '@/components/map-mapbox/MapboxViewer';

<MapPreviewWidget
-  GoogleMapViewer
+  MapboxViewer
  tenantSlug={slug}
  locations={locations}
  ...
/>
```

**Testing**:
- [ ] Map displays correctly in widget
- [ ] "View Full Map" button works
- [ ] Filter cards update map
- [ ] Table rows link to map highlighting

---

#### 2. **Full Map View** (`/dashboard/map`)

**Before**: Full-screen GoogleMapViewer

**After**: Full-screen MapboxViewer

**Additions**:
- Add layer toggle panel (sidebar or bottom sheet)
- Add search box (Mapbox Search API - optional Phase 4)

---

#### 3. **Dashboard Map Section** (`/dashboard`)

**Before**: `MapSectionLazy` with GoogleMapViewer

**After**: Same, swap viewer

**Special Consideration**: Lazy loading
```typescript
// Keep lazy loading for performance
import dynamic from 'next/dynamic';

const MapboxDashboardWidget = dynamic(
  () => import('@/components/map-mapbox/MapboxDashboardWidget'),
  { ssr: false, loading: () => <MapSkeleton /> }
);
```

---

#### 4. **Admin Map Management** (`/admin/map`)

**Before**: LocationsTable + GeoJSON uploader

**After**: Same functionality, updated links

**Changes**:
- "View on Map" buttons link to Mapbox viewer
- GeoJSON preview uses Mapbox

---

#### 5. **Location Editor** (`/admin/map/locations/create`)

**Before**: GoogleMapEditor (103KB monster)

**After**: MapboxEditor (clean, modern)

**Wins**:
- 70% less code
- Better UX (Mapbox Draw is intuitive)
- Faster performance
- Maintainable

---

#### 6. **Map Viewer** (`/admin/map/viewer`)

**Before**: GoogleMapEditor in view mode

**After**: MapboxViewer with admin tools

**Additional Features**:
- Measurement tool (distance between points)
- Coordinate inspector (click to see lat/lng)
- Export to GeoJSON button

---

### No Feature Flag Needed (Good Point!)

You're right - with only one tenant, no need for complex feature flagging.

**Simple Approach**:
1. Build Mapbox pages on new routes first (`/mapbox-test`)
2. Test thoroughly
3. Swap out components in existing routes
4. Delete Google Maps code

**Rollback Plan**:
- Keep Google Maps components in git history
- If Mapbox has issues, revert commit
- Should never need to go back after testing!

---

## Phase 4: Enhanced Features (Week 5+)

### Features Mapbox Enables That Google Maps Didn't

#### 1. **Search on Map** (Mapbox Search API)
```typescript
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Search locations...',
    bbox: boundingBox,  // Limit to community bounds
    proximity: communityCenter  // Prioritize nearby results
  })
);
```

**Or**: Build custom search using your location data
```typescript
<Input 
  placeholder="Search lots, facilities..."
  onChange={e => {
    const query = e.target.value.toLowerCase();
    const matches = locations.filter(loc => 
      loc.name.toLowerCase().includes(query)
    );
    setFilteredLocations(matches);
  }}
/>
```

---

#### 2. **Heatmaps** (Check-In Density)

Show where people gather most:
```javascript
{
  id: 'check-in-heatmap',
  type: 'heatmap',
  source: 'check-ins',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,255,0)',
      0.5, 'rgb(0,255,0)',
      1, 'rgb(255,0,0)'
    ],
    'heatmap-radius': 30
  }
}
```

**Use Case**: "Where do residents spend time?"

---

#### 3. **3D Buildings/Terrain**

Enable 3D extrusion for facilities:
```javascript
{
  id: 'facilities-3d',
  type: 'fill-extrusion',
  source: 'facilities',
  paint: {
    'fill-extrusion-color': '#6B9B47',
    'fill-extrusion-height': ['get', 'height'],  // From building data
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.8
  }
}
```

**Use Case**: Distinguish tall buildings (community center) from low structures

---

#### 4. **Terrain/Hillshade** (For Walking Paths)

Show elevation changes:
```javascript
map.addSource('mapbox-dem', {
  type: 'raster-dem',
  url: 'mapbox://mapbox.terrain-rgb'
});

map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

map.addLayer({
  id: 'hillshade',
  type: 'hillshade',
  source: 'mapbox-dem'
});
```

**Use Case**: "This path has a steep climb"

---

#### 5. **Animated Paths**

Animate along walking path:
```javascript
// Draw walking path with moving dot
let counter = 0;
function animatePath() {
  const point = turf.along(pathGeoJSON, counter, { units: 'meters' });
  
  map.getSource('walker').setData(point);
  counter += 10;  // Move 10 meters
  
  if (counter < pathLength) {
    requestAnimationFrame(animatePath);
  }
}
```

**Use Case**: Virtual tour of walking paths

---

#### 6. **Measurement Tools**

Let users measure distances:
```javascript
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { LineString } from '@turf/helpers';
import length from '@turf/length';

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    line_string: true,
    trash: true
  }
});

map.addControl(draw);

map.on('draw.create', (e) => {
  const line = e.features[0];
  const distanceKm = length(line);
  toast(`Distance: ${distanceKm.toFixed(2)} km`);
});
```

**Use Case**: "How far is the pool from my lot?"

---

#### 7. **Offline Maps**

Cache map tiles for mobile:
```javascript
// Service worker caches Mapbox tiles
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('mapbox.com')) {
    event.respondWith(
      caches.match(event.request).then(response => 
        response || fetch(event.request)
      )
    );
  }
});
```

**Use Case**: Works in poor connectivity areas

---

#### 8. **Time-Based Animations**

Show check-ins appearing/disappearing over time:
```javascript
// Filter check-ins by time
{
  id: 'active-check-ins',
  type: 'symbol',
  source: 'check-ins',
  filter: [
    'all',
    ['>=', ['get', 'created_at'], now - 3600000],  // Last hour
    ['<=', ['get', 'expires_at'], now]
  ]
}

// Update every minute
setInterval(() => {
  map.setFilter('active-check-ins', ['>=', ['get', 'created_at'], Date.now() - 3600000]);
}, 60000);
```

**Use Case**: "Show who checked in during last hour"

---

#### 9. **Custom Basemap Styles**

Design your own map theme in Mapbox Studio:
- **Night mode**: Dark background, neon borders
- **High contrast**: For accessibility
- **Branded**: Match Ecovilla colors exactly

**How**:
1. Go to Mapbox Studio
2. Duplicate "Satellite Streets" template
3. Adjust colors, fonts, layer visibility
4. Get style URL: `mapbox://styles/yourusername/ckXXXXXXX`
5. Use in app:
```javascript
<Map mapStyle="mapbox://styles/yourteam/ecovilla-custom" />
```

---

#### 10. **Smart Label Collision**

Mapbox automatically hides labels that overlap (Google Maps doesn't):
```javascript
{
  id: 'lot-labels',
  type: 'symbol',
  layout: {
    'text-field': ['get', 'lot_number'],
    'text-allow-overlap': false,  // Don't show if overlaps
    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],  // Try different positions
    'text-radial-offset': 0.5,
    'text-justify': 'auto'
  }
}
```

**Result**: Labels dynamically reposition based on zoom level

---

## Database Updates (Optional)

### Add Centroid Column for Performance

**Problem**: Calculating centroids on every map load is slow

**Solution**: Pre-calculate and store

**Migration**:
```sql
-- Add centroid column
ALTER TABLE locations 
ADD COLUMN label_coordinate JSONB;

-- Populate for existing locations
UPDATE locations 
SET label_coordinate = (
  -- Calculate centroid from boundary_coordinates
  SELECT jsonb_build_object(
    'lat', AVG((coord->>0)::float),
    'lng', AVG((coord->>1)::float)
  )
  FROM jsonb_array_elements(boundary_coordinates) AS coord
)
WHERE type IN ('lot', 'neighborhood') 
AND boundary_coordinates IS NOT NULL;
```

**Update createLocation action**:
```typescript
// In app/actions/locations.ts
if (data.boundary_coordinates) {
  const centroid = calculateCentroid(data.boundary_coordinates);
  data.label_coordinate = { lat: centroid[1], lng: centroid[0] };
}
```

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Week 1 (30-40 hrs) | Working Mapbox test page with real data |
| **Phase 2** | Weeks 2-3 (40-60 hrs) | Production Mapbox components |
| **Phase 3** | Week 4 (20-30 hrs) | All 6 pages using Mapbox |
| **Phase 4** | Week 5+ (optional) | Enhanced features (search, 3D, animations) |

**Total Core Migration**: 3-4 weeks (90-130 hours)

**Phases 1-3 can be parallelized if you have multiple developers**

---

## Cost Analysis

### Mapbox Pricing

**Free Tier**: 50,000 map loads/month
- Typical load: User opens map page
- Estimate: 10-20 users × 5 views/day × 30 days = 1,500-3,000 loads/month
- **You'll stay in free tier easily**

**When You'd Pay** (if growth happens):
- $0.50 per 1,000 loads (51K-100K loads)
- $0.40 per 1,000 loads (100K-250K loads)
- Volume discounts above 250K

**Comparison**:
- Google Maps: $7 per 1,000 loads (after 28K free)
- **Mapbox is 94% cheaper at scale**

---

## Risk Mitigation

### What Could Go Wrong?

**Risk 1**: Mapbox looks different than expected
- **Mitigation**: Phase 1 test page validates visuals before commitment
- **Fallback**: Adjust styling in Mapbox Studio

**Risk 2**: Performance issues on mobile
- **Mitigation**: Test on real devices in Phase 1
- **Fallback**: Reduce marker count, use clustering

**Risk 3**: Missing Google Maps feature
- **Mitigation**: Feature inventory checklist (see below)
- **Fallback**: Mapbox has equivalents for 99% of features

**Risk 4**: User confusion with new interface
- **Mitigation**: Keep interaction patterns identical
- **Fallback**: Add tooltips/onboarding for new features

**Risk 5**: Coordinate transformation breaks
- **Mitigation**: REUSE existing `coordinate-transformer.ts` (tested)
- **Fallback**: No changes needed, same CRTM05 logic works

---

## Feature Parity Checklist

| Feature | Google Maps | Mapbox | Status |
|---------|-------------|--------|--------|
| Display polygons | ✅ | ✅ | ✅ Same |
| Display markers | ✅ | ✅ | ✅ Better (custom images) |
| Info popups | ✅ | ✅ | ✅ Cleaner API |
| Drawing tools | ✅ (custom) | ✅ (Mapbox Draw) | ✅ Better UX |
| Geolocation | ✅ | ✅ | ✅ Same browser API |
| Geocoding | ✅ (Places) | ✅ (Search API) | ✅ Same functionality |
| Labels on polygons | ❌ | ✅ | ✅ **New capability!** |
| Polygon fills | ⚠️ Limited | ✅ Full control | ✅ **Better** |
| Satellite view | ✅ | ✅ | ✅ Mapbox sharper |
| Terrain/hillshade | ❌ | ✅ | ✅ **New!** |
| 3D buildings | ⚠️ Limited | ✅ Easy | ✅ **Better** |
| Clustering | ❌ (paid) | ✅ Built-in | ✅ **Free!** |
| Offline maps | ❌ | ✅ | ✅ **New!** |
| Custom styles | ⚠️ Limited | ✅ Full control | ✅ **Much better** |

**Verdict**: Mapbox has everything Google Maps has + more

---

## Success Metrics

### How We'll Know It Worked

**Week 1 (Phase 1)**:
- [ ] Test page loads in <2 seconds
- [ ] Visual matches reference image (lot borders, fills, labels)
- [ ] Profile picture markers work
- [ ] All Ecovilla locations display correctly

**Week 4 (Phase 3)**:
- [ ] All 6 pages use Mapbox
- [ ] No regressions (all existing features work)
- [ ] Load time improved by >30%
- [ ] Mobile experience smooth

**Week 5+ (Post-launch)**:
- [ ] User feedback positive ("easier to read", "looks better")
- [ ] No bug reports related to map
- [ ] Cost = $0 (free tier sufficient)

---

## Next Steps

### To Start Phase 1 Tomorrow:

1. **Get Mapbox Account** (15 min)
   - Sign up at https://mapbox.com
   - Get access token
   - Add to `.env.local`

2. **Install Dependencies** (5 min)
   ```bash
   npm install mapbox-gl react-map-gl @turf/turf polylabel
   npm install --save-dev @types/mapbox-gl
   ```

3. **Create Test Page** (1 hour)
   - New route: `/admin/map/mapbox-test`
   - Basic Map component renders

4. **Load Real Data** (1 hour)
   - Fetch Ecovilla locations
   - Display on map

5. **Style Lots** (2 hours)
   - Borders + fills
   - Lot number labels

6. **Iterate** (rest of week)
   - Add facilities, streets, boundary
   - Profile picture check-in markers
   - Fine-tune styling

---

## Questions?

**Q: Do I need to redesign the entire map UI?**  
A: No! Keep the same page layouts, buttons, cards. Just swap the map rendering engine.

**Q: Will my existing GeoJSON imports still work?**  
A: Yes! Coordinate transformation logic is reusable. Mapbox consumes GeoJSON natively.

**Q: Can I style the map without coding?**  
A: Yes! Use Mapbox Studio to design the basemap visually, then load that style in code.

**Q: What if I want to go back to Google Maps?**  
A: Keep old code in git. Reverting is just a `git revert`. But you won't want to 😉

**Q: How do I show labels inside complex polygons?**  
A: Use `polylabel` to find the optimal label position (pole of inaccessibility).

**Q: Can I show 100+ check-in markers without lag?**  
A: Yes! Mapbox clustering handles thousands. Or use WebGL layers for max performance.

---

## Appendix: Code Templates

### MapboxViewer Component (Starter)

```typescript
// components/map-mapbox/MapboxViewer.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import Map, { Layer, Source, Marker, Popup } from 'react-map-gl';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { EnrichedLocation, CheckIn } from '@/types';

interface MapboxViewerProps {
  locations: EnrichedLocation[];
  checkIns?: CheckIn[];
  mapCenter?: { lat: number; lng: number } | null;
  mapZoom?: number;
  highlightLocationId?: string;
  minimal?: boolean;
}

export function MapboxViewer({
  locations,
  checkIns = [],
  mapCenter,
  mapZoom = 14,
  highlightLocationId,
  minimal = false
}: MapboxViewerProps) {
  const [viewState, setViewState] = useState({
    longitude: mapCenter?.lng || -84.5333,
    latitude: mapCenter?.lat || 9.9567,
    zoom: mapZoom
  });
  
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLots, setShowLots] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  
  // Prepare GeoJSON for lots
  const lotsGeoJSON = useMemo(() => {
    const features = locations
      .filter(loc => loc.type === 'lot' && loc.boundary_coordinates)
      .map(lot => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [lot.boundary_coordinates!.map(([lat, lng]) => [lng, lat])]
        },
        properties: {
          id: lot.id,
          lot_number: lot.name,
          highlighted: lot.id === highlightLocationId
        }
      }));
      
    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [locations, highlightLocationId]);
  
  // Calculate lot label positions
  const lotLabelsGeoJSON = useMemo(() => {
    const features = lotsGeoJSON.features.map(feature => {
      const centroid = turf.centroid(feature);
      return {
        type: 'Feature' as const,
        geometry: centroid.geometry,
        properties: feature.properties
      };
    });
    
    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [lotsGeoJSON]);
  
  return (
    <div className="h-full w-full">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {/* Lots - Fill */}
        <Source id="lots" type="geojson" data={lotsGeoJSON}>
          <Layer
            id="lots-fill"
            type="fill"
            paint={{
              'fill-color': [
                'case',
                ['get', 'highlighted'],
                '#D97742',  // Sunrise orange for highlighted
                '#6B9B47'   // Fresh growth for normal
              ],
              'fill-opacity': 0.2
            }}
          />
          
          {/* Lots - Border */}
          <Layer
            id="lots-border"
            type="line"
            paint={{
              'line-color': '#2D5016',
              'line-width': [
                'case',
                ['get', 'highlighted'],
                3,
                2
              ]
            }}
          />
        </Source>
        
        {/* Lot Labels */}
        <Source id="lot-labels" type="geojson" data={lotLabelsGeoJSON}>
          <Layer
            id="lot-labels"
            type="symbol"
            layout={{
              'text-field': ['get', 'lot_number'],
              'text-font': ['Inter SemiBold', 'Arial Unicode MS Regular'],
              'text-size': 14,
              'text-anchor': 'center'
            }}
            paint={{
              'text-color': '#1A1A1A',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 2,
              'text-halo-blur': 1
            }}
          />
        </Source>
        
        {/* Check-in markers */}
        {checkIns.map(checkIn => (
          <Marker
            key={checkIn.id}
            longitude={checkIn.coordinates.lng}
            latitude={checkIn.coordinates.lat}
            anchor="center"
          >
            <img
              src={checkIn.resident.profile_picture_url || '/default-avatar.png'}
              alt={checkIn.resident.first_name}
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setSelectedLocation(checkIn.location_id)}
            />
          </Marker>
        ))}
        
        {/* Popup for selected location */}
        {selectedLocation && (
          <Popup
            longitude={/* ... */}
            latitude={/* ... */}
            onClose={() => setSelectedLocation(null)}
          >
            {/* Your existing LocationInfoCard component */}
          </Popup>
        )}
      </Map>
      
      {/* Layer toggles (if not minimal) */}
      {!minimal && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLots}
              onChange={e => setShowLots(e.target.checked)}
            />
            Lots
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFacilities}
              onChange={e => setShowFacilities(e.target.checked)}
            />
            Facilities
          </label>
        </div>
      )}
    </div>
  );
}
```

---

**Ready to start Phase 1?** Let me know and I'll create the initial files and help you get the Mapbox test page running!
