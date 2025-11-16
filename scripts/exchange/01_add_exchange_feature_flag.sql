-- Add exchange feature flag to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS exchange_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN tenants.exchange_enabled IS 'Enable/disable exchange directory feature for this tenant';
