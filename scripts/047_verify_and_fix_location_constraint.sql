-- Migration 047: Verify and fix location type constraint
-- This script checks the current constraint and updates it to include 'neighborhood'

-- First, let's see what constraint currently exists
DO $$ 
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_location_type'
    ) THEN
        ALTER TABLE locations DROP CONSTRAINT valid_location_type;
        RAISE NOTICE 'Dropped existing valid_location_type constraint';
    END IF;
END $$;

-- Add the new constraint with all four types
ALTER TABLE locations ADD CONSTRAINT valid_location_type 
  CHECK (type IN ('facility', 'lot', 'walking_path', 'neighborhood'));

-- Update the column comment
COMMENT ON COLUMN locations.type IS 'Type of location: facility (point), lot (polygon), walking_path (linestring), or neighborhood (polygon)';

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_location_type';
