-- Add tenant_id to residents table for direct tenant association
ALTER TABLE residents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add auth_user_id column to link residents to Supabase auth users
ALTER TABLE residents ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill tenant_id for existing residents based on their lot's neighborhood
UPDATE residents
SET tenant_id = (
  SELECT n.tenant_id
  FROM lots l
  JOIN neighborhoods n ON n.id = l.neighborhood_id
  WHERE l.id = residents.lot_id
)
WHERE tenant_id IS NULL AND lot_id IS NOT NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_residents_tenant_id ON residents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_residents_auth_user_id ON residents(auth_user_id);

-- Make lot_id nullable since residents might not have a lot assigned yet
ALTER TABLE residents ALTER COLUMN lot_id DROP NOT NULL;

-- Update RLS policies to use tenant_id

-- Drop old policies
DROP POLICY IF EXISTS "Tenant admins can manage their tenant's residents" ON residents;
DROP POLICY IF EXISTS "Residents can view residents in their tenant" ON residents;
DROP POLICY IF EXISTS "admins_select_all_residents" ON residents;
DROP POLICY IF EXISTS "admins_insert_residents" ON residents;
DROP POLICY IF EXISTS "admins_update_residents" ON residents;
DROP POLICY IF EXISTS "admins_delete_residents" ON residents;

-- Policy: Tenant admins can manage all residents in their tenant
CREATE POLICY "tenant_admins_full_access" ON residents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM residents admin_resident
      WHERE admin_resident.auth_user_id = auth.uid()
      AND admin_resident.is_admin = true
      AND admin_resident.tenant_id = residents.tenant_id
    )
  );

-- Policy: Residents can view other residents in their tenant
CREATE POLICY "residents_view_same_tenant" ON residents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents viewer
      WHERE viewer.auth_user_id = auth.uid()
      AND viewer.tenant_id = residents.tenant_id
    )
  );

-- Policy: Residents can update their own record
CREATE POLICY "residents_update_own" ON residents
  FOR UPDATE
  USING (auth_user_id = auth.uid());
