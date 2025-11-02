-- Add address field to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN tenants.address IS 'Optional default address for the tenant/community';
