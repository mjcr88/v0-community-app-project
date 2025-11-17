-- Rollback problematic policies and create proper ones

-- First, drop the policies we just created that might be causing issues
DROP POLICY IF EXISTS "Tenant admins can remove any flags" ON exchange_flags;
DROP POLICY IF EXISTS "Tenant admins can archive and update exchange listings" ON exchange_listings;

-- Recreate DELETE policy for exchange_flags with simpler logic
CREATE POLICY "tenant_admins_delete_exchange_flags"
ON exchange_flags
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = exchange_flags.tenant_id
    AND users.is_tenant_admin = true
  )
);

-- Recreate UPDATE policy for exchange_listings with proper USING and WITH CHECK
CREATE POLICY "tenant_admins_update_exchange_listings"
ON exchange_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = exchange_listings.tenant_id
    AND users.is_tenant_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = exchange_listings.tenant_id
    AND users.is_tenant_admin = true
  )
);
