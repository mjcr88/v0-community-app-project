-- Migration: Add documents_enabled column to tenants table
-- This allows superadmins to enable/disable the Documents Library feature per tenant

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS documents_enabled BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN tenants.documents_enabled IS 'Controls whether the Documents Library feature is enabled for this tenant';
