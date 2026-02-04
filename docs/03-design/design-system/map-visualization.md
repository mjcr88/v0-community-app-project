# Map Visualization System

> **Component**: `components/map/MapboxViewer.tsx`
> **Primary Technology**: Mapbox GL JS + React Map GL

## 1. Visual Hierarchy & Layer Stack

The map handles complex data by stacking layers logically. Rendering order (bottom-to-top):

| Order | Layer ID | Type | Z-Index Equivalent | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `mapbox-dem` | Raster | -1 | 3D Terrain data |
| 2 | `boundary-line` | Line | 0 | Community Perimeter (`#D97742`) |
| 3 | `lots-fill` | Fill | 1 | Base occupancy layer |
| 4 | `lots-border` | Line | 2 | Highlights on selection |
| 5 | `facilities-fill` | Fill | 3 | Blue shared spaces |
| 6 | `streets-line` | Line | 4 | Road network |
| 7 | `paths-line` | Line | 5 | Walking trails |
| 8 | `lot-labels` | Symbol | 6 | Text with halos |
| 9 | `check-in-markers` | Marker | 50 (active) | Profile pictures |

## 2. Occupancy & Color Logic ("Living Glow")

The map uses a dynamic color system to indicate activity.

### Lots
*   **Occupied**: Warm Amber (`#F59E0B`), **50% Opacity**. Creates a "warm light" effect.
*   **Vacant**: Organic Green (`#86B25C`), **30% Opacity**. Blends with terrain.

### Facilities
*   **Base**: Blue (`#3B82F6`), **20% Opacity**. Subtle indication of common areas.
*   **Border**: Deep Blue (`#1E40AF`).

### Interaction States
*   **Hover**: Pointer cursor.
*   **Selected**: Orange Border (`#F97316`), **3px Width**.
*   **Category Highlight**: Sets border color to Orange (`#F97316`) for all items in category.

## 3. Advanced Features

### Check-in Distribution
When multiple people check in at the same location (e.g., "The Hub"), markers would overlap. The map automatically distributes them:
*   **Single**: Uses exact coordinates.
*   **Multiple**: Distributes points in a circle (Radius ~8m) around the center.

### Smart Labels
Labels automatically switch color logic to ensure readability:
*   **Text Color**: Dark Gray (`#111827`) for sharpness.
*   **Halo**: White (`#FFFFFF`), **2px Width**. Creates "sticker" effect readable on any background.

## 4. Interaction Rules

1.  **Selection**: Clicking a lot/facility centers the map (FlyTo) and opens the Sidebar.
2.  **Boundary Check**: `checkIfInsideBoundary(lat, lng)` verifies if a click is valid.
3.  **Search**: Debounced (1.5s) analytic tracking. Auto-focuses result.
