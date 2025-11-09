-- Migration 045: Create locations table for map features
-- Supports facilities (points), lots (polygons), and walking paths (linestrings)

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Location identification
  name text NOT NULL,
  type text NOT NULL,
  description text,
  
  -- Geospatial data (different geometry types)
  coordinates jsonb, -- For facilities (point): {"lat": number, "lng": number}
  boundary_coordinates jsonb, -- For lots (polygon): [{"lat": number, "lng": number}, ...]
  path_coordinates jsonb, -- For walking paths (linestring): [{"lat": number, "lng": number}, ...]
  
  -- Type-specific fields
  facility_type text, -- 'tool_library', 'garden', 'pool', 'community_center', etc.
  hours text,
  icon text, -- emoji or icon identifier
  path_surface text, -- For walking paths: 'paved', 'gravel', 'dirt', 'natural'
  path_difficulty text, -- For walking paths: 'easy', 'moderate', 'difficult'
  
  -- Media
  photos text[] DEFAULT '{}',
  
  -- References
  lot_id uuid REFERENCES lots(id) ON DELETE SET NULL,
  neighborhood_id uuid REFERENCES neighborhoods(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_location_type CHECK (type IN ('facility', 'lot', 'walking_path')),
  CONSTRAINT valid_path_surface CHECK (path_surface IS NULL OR path_surface IN ('paved', 'gravel', 'dirt', 'natural')),
  CONSTRAINT valid_path_difficulty CHECK (path_difficulty IS NULL OR path_difficulty IN ('easy', 'moderate', 'difficult'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_neighborhood ON locations(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_locations_lot ON locations(lot_id);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admins: Full access
CREATE POLICY "Super admins have full access to locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Tenant admins: Full access to their tenant's locations
CREATE POLICY "Tenant admins can manage their tenant locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tenant_admin'
      AND users.tenant_id = locations.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tenant_admin'
      AND users.tenant_id = locations.tenant_id
    )
  );

-- Residents: Read-only access to their tenant's locations
CREATE POLICY "Residents can view their tenant locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'resident'
      AND users.tenant_id = locations.tenant_id
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE locations IS 'Stores map locations including facilities, lot boundaries, and walking paths';
COMMENT ON COLUMN locations.type IS 'Type of location: facility (point), lot (polygon), or walking_path (linestring)';
COMMENT ON COLUMN locations.coordinates IS 'Single point coordinates for facilities: {"lat": number, "lng": number}';
COMMENT ON COLUMN locations.boundary_coordinates IS 'Polygon coordinates for lots: array of {"lat", "lng"} objects';
COMMENT ON COLUMN locations.path_coordinates IS 'LineString coordinates for walking paths: array of {"lat", "lng"} objects';
COMMENT ON COLUMN locations.photos IS 'Array of Vercel Blob URLs for location photos';
