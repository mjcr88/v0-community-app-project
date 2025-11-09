-- Migration: Add status, capacity, and amenities fields to locations table
-- This migration adds new fields to support enhanced location management

-- Add status field (Open, Closed, Temporarily Closed)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Temporarily Closed'));

-- Add capacity field for facilities (optional)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Add amenities field for facilities (optional)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Add comment to document the type field values
COMMENT ON COLUMN locations.type IS 'Location type: Facility, Neighborhood, Lot, or Walking Path';

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- Create index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Update existing locations to have default status if null
UPDATE locations SET status = 'Open' WHERE status IS NULL;
