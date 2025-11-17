-- Fix RLS policies to allow admins to unflag and archive listings

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can remove exchange flags" ON exchange_flags;
DROP POLICY IF EXISTS "Tenant admins can update exchange listings" ON exchange_listings;

-- Create new policy that allows tenant admins to delete ANY flag in their tenant
CREATE POLICY "Tenant admins can remove any flags"
ON exchange_flags
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM users 
    WHERE id = auth.uid() AND is_tenant_admin = true
  )
);

-- Ensure tenant admins can archive listings (update archived_at, archived_by)
CREATE POLICY "Tenant admins can archive and update exchange listings"
ON exchange_listings
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM users 
    WHERE id = auth.uid() AND is_tenant_admin = true
  )
);

-- Grant admins ability to update listing status fields
COMMENT ON POLICY "Tenant admins can archive and update exchange listings" ON exchange_listings IS 
'Allows tenant admins to archive listings, unflag them, and perform other administrative updates';
