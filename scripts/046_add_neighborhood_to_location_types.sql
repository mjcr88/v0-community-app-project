-- Migration 046: Add 'neighborhood' to valid location types
-- This allows neighborhoods to be stored as locations with boundary coordinates

-- Drop the old constraint
ALTER TABLE locations DROP CONSTRAINT IF EXISTS valid_location_type;

-- Add the new constraint with 'neighborhood' included
ALTER TABLE locations ADD CONSTRAINT valid_location_type 
  CHECK (type IN ('facility', 'lot', 'walking_path', 'neighborhood'));

-- Update comment to reflect the change
COMMENT ON COLUMN locations.type IS 'Type of location: facility (point), lot (polygon), walking_path (linestring), or neighborhood (polygon)';
