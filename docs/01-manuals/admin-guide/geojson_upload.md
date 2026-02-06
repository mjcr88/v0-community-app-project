# Admin Guide: GeoJSON Upload & Map Management

## Overview
The Map Editor allows administrators to upload GeoJSON files to populate the community map. This includes Residential Lots, Walking Paths, and Common Facilities.

## Initial Setup
1. Navigate to **Admin Dashboard > Map**.
2. Locate the **"Upload GeoJSON"** button in the sidebar (or top action bar).

## Uploading Data
### Step 1: Prepare your File
 Ensure your file is standard GeoJSON format (`.json` or `.geojson`).
- **Lots**: Should be Polygons.
- **Paths**: Should be LineStrings.
- **Facilities**: Can be Points or Polygons.

### Step 2: Import Dialog
Click "Upload GeoJSON". A dialog will appear:
1. **Select File**: Choose your `.geojson` file.
2. **Default Color**: Choose a color for all items in this upload.
   - *Recommendation*: Use **Green (`#4ade80`)** for Lots/Property Lines.
   - *Recommendation*: Use **Yellow (`#eab308`)** for Streets.
3. **Properties**: The system will attempt to auto-detect `name`, `type`, and `description` from your file's properties.

### Step 3: Review & Save
The map will show a preview of your data.
- **Walking Paths**: Elevation data (Z-coordinates) is automatically preserved.
- **Click "Save"** to commit changes to the database.

## Editing Locations
To change the color or details of an existing location:
1. Click on the location in the map.
2. In the sidebar, use the **Color Picker** to change its styling.
3. Update Name, Description, or Difficulty (for paths).
4. Changes save automatically or via the "Save" button.

## Troubleshooting
- **"Merged Paths"**: If your paths look connected when they shouldn't be, ensure they are separate Feature objects in your GeoJSON, not a single MultiLineString.
- **Zero Elevation**: If "0 m" elevation appears, check if your GeoJSON includes 3D coordinates (e.g., `[lon, lat, alt]`). Flat stats are normal for 2D inputs.
