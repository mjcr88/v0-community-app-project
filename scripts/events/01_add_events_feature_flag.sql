-- Add events feature flag to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS events_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN tenants.events_enabled IS 'Enable/disable events feature for this tenant';
