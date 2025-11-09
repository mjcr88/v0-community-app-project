-- Add new columns for location attributes
-- These columns enhance facilities and walking paths with detailed information

-- Facility-specific columns
ALTER TABLE locations ADD COLUMN IF NOT EXISTS accessibility_features text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS max_occupancy integer;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS parking_spaces integer;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS rules text; -- Will store HTML from rich text editor

-- Walking path-specific columns
ALTER TABLE locations ADD COLUMN IF NOT EXISTS path_length text; -- e.g., "2.5 km"
ALTER TABLE locations ADD COLUMN IF NOT EXISTS elevation_gain text; -- e.g., "150m"

-- Note: The following columns already exist and don't need to be added:
-- - capacity (integer)
-- - amenities (ARRAY)
-- - hours (text)
-- - status (text)
-- - path_difficulty (text)
-- - path_surface (text)
