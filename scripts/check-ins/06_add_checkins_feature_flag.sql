-- Add checkins_enabled feature flag to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS checkins_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN tenants.checkins_enabled IS 'Enable check-ins feature for this tenant';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tenants_checkins_enabled ON tenants(checkins_enabled) WHERE checkins_enabled = true;
