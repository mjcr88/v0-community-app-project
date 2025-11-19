-- Add announcements feature flag to tenants table

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS announcements_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN tenants.announcements_enabled IS 'Feature flag to enable/disable announcements for this tenant';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_announcements_enabled ON tenants(announcements_enabled);
