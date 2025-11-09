-- Add location_id field to lots and neighborhoods tables to link them to their map locations

-- Add location_id to lots table
ALTER TABLE lots ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Add location_id to neighborhoods table
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lots_location_id ON lots(location_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_location_id ON neighborhoods(location_id);

-- Add comments for documentation
COMMENT ON COLUMN lots.location_id IS 'Reference to the location record that contains the lot boundary coordinates';
COMMENT ON COLUMN neighborhoods.location_id IS 'Reference to the location record that contains the neighborhood boundary coordinates';
