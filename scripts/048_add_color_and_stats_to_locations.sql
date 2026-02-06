-- Migration 048: Add color and path stats to locations
-- Issue #83: GeoJSON Reliability & Map Color

ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#F97316', -- Default to 'Sunrise Orange' (Shadcn Orange-500 equivalent used in app)
  ADD COLUMN IF NOT EXISTS elevation_gain numeric,
  ADD COLUMN IF NOT EXISTS path_length numeric; -- In meters

COMMENT ON COLUMN locations.color IS 'HEX color code for map rendering';
COMMENT ON COLUMN locations.elevation_gain IS 'Total elevation gain in meters (calculated from Z-coords)';
COMMENT ON COLUMN locations.path_length IS 'Total length of the path in meters';
