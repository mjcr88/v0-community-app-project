-- Add requests_enabled feature flag to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS requests_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN tenants.requests_enabled IS 'Enable/disable resident requests feature for this tenant';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tenants_requests_enabled ON tenants(requests_enabled) WHERE requests_enabled = true;
