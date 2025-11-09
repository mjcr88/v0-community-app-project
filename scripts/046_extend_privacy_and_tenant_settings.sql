-- Migration 046: Extend privacy settings and tenant settings for map features

-- Add map-related privacy settings
ALTER TABLE user_privacy_settings
  ADD COLUMN IF NOT EXISTS show_on_map boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_check_ins_on_map boolean DEFAULT false;

-- Add map configuration to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS map_center_coordinates jsonb,
  ADD COLUMN IF NOT EXISTS map_default_zoom integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS map_boundary_coordinates jsonb;

-- Add comments for documentation
COMMENT ON COLUMN user_privacy_settings.show_on_map IS 'Whether user location is visible on community map (default: false)';
COMMENT ON COLUMN user_privacy_settings.show_check_ins_on_map IS 'Whether user check-ins are visible to others (default: false)';
COMMENT ON COLUMN tenants.map_center_coordinates IS 'Default center point for community map as JSON object with lat and lng';
COMMENT ON COLUMN tenants.map_default_zoom IS 'Default zoom level for community map (1-22)';
COMMENT ON COLUMN tenants.map_boundary_coordinates IS 'Polygon boundary of the entire community as array of coordinate objects';
