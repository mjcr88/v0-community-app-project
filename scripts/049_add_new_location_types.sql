-- Migration 049: Add new location types for GeoJSON import
-- Adds: boundary, protection_zone, easement, playground, public_street, green_area, recreational_zone

-- Drop the existing constraint
ALTER TABLE locations DROP CONSTRAINT IF EXISTS valid_location_type;

-- Add the new constraint with all location types
ALTER TABLE locations ADD CONSTRAINT valid_location_type
CHECK (type IN (
  'facility',
  'lot',
  'walking_path',
  'neighborhood',
  'boundary',
  'protection_zone',
  'easement',
  'playground',
  'public_street',
  'green_area',
  'recreational_zone'
));

-- Update the column comment to reflect all types
COMMENT ON COLUMN locations.type IS 'Type of location: facility (point), lot (polygon), walking_path (linestring), neighborhood (polygon), boundary (polygon), protection_zone (polygon), easement (polygon), playground (point/polygon), public_street (linestring), green_area (polygon), or recreational_zone (polygon)';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 049: Added new location types for GeoJSON import';
END $$;
