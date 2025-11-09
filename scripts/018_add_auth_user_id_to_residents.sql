-- Add auth_user_id to residents table to link Supabase auth users
ALTER TABLE residents ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one auth user per resident
CREATE UNIQUE INDEX IF NOT EXISTS residents_auth_user_id_key ON residents(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Enable RLS on residents table
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own resident record
CREATE POLICY "residents_select_own" ON residents
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Policy: Users can update their own resident record
CREATE POLICY "residents_update_own" ON residents
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Policy: Admins can view all residents in their tenant
CREATE POLICY "admins_select_all_residents" ON residents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents admin_resident
      WHERE admin_resident.auth_user_id = auth.uid()
      AND admin_resident.is_admin = true
      AND admin_resident.lot_id IN (
        SELECT id FROM lots WHERE neighborhood_id IN (
          SELECT id FROM neighborhoods WHERE tenant_id = (
            SELECT tenant_id FROM residents WHERE id = residents.id
          )
        )
      )
    )
  );

-- Policy: Admins can insert residents in their tenant
CREATE POLICY "admins_insert_residents" ON residents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents admin_resident
      WHERE admin_resident.auth_user_id = auth.uid()
      AND admin_resident.is_admin = true
    )
  );

-- Policy: Admins can update residents in their tenant
CREATE POLICY "admins_update_residents" ON residents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM residents admin_resident
      WHERE admin_resident.auth_user_id = auth.uid()
      AND admin_resident.is_admin = true
    )
  );

-- Policy: Admins can delete residents in their tenant
CREATE POLICY "admins_delete_residents" ON residents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM residents admin_resident
      WHERE admin_resident.auth_user_id = auth.uid()
      AND admin_resident.is_admin = true
    )
  );
