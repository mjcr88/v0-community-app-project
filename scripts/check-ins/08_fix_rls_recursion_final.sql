-- Final fix for check-ins RLS infinite recursion
-- Removes ALL circular dependencies

-- Drop all existing policies
DROP POLICY IF EXISTS "Residents can create check-ins" ON check_ins;
DROP POLICY IF EXISTS "Residents can view community check-ins" ON check_ins;
DROP POLICY IF EXISTS "Residents can view neighborhood check-ins" ON check_ins;
DROP POLICY IF EXISTS "Residents can view private check-ins" ON check_ins;
DROP POLICY IF EXISTS "Creators can view own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Creators can update own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Creators can delete own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Tenant admins can update any check-in" ON check_ins;
DROP POLICY IF EXISTS "Tenant admins can delete any check-in" ON check_ins;

DROP POLICY IF EXISTS residents_can_view_checkins ON check_ins;
DROP POLICY IF EXISTS residents_can_create_checkins ON check_ins;
DROP POLICY IF EXISTS creators_can_update_checkins ON check_ins;
DROP POLICY IF EXISTS creators_can_delete_checkins ON check_ins;
DROP POLICY IF EXISTS tenant_admins_can_update_checkins ON check_ins;
DROP POLICY IF EXISTS tenant_admins_can_delete_checkins ON check_ins;

DROP POLICY IF EXISTS "Users can view check-in RSVPs" ON check_in_rsvps;
DROP POLICY IF EXISTS "Users can create their own RSVPs" ON check_in_rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON check_in_rsvps;
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON check_in_rsvps;

DROP POLICY IF EXISTS users_can_view_checkin_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_create_own_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_update_own_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_delete_own_rsvps ON check_in_rsvps;

DROP POLICY IF EXISTS "Users can view check-in neighborhoods" ON check_in_neighborhoods;
DROP POLICY IF EXISTS "Creators can manage their check-in neighborhoods" ON check_in_neighborhoods;

DROP POLICY IF EXISTS users_can_view_checkin_neighborhoods ON check_in_neighborhoods;
DROP POLICY IF EXISTS creators_can_manage_neighborhoods ON check_in_neighborhoods;

DROP POLICY IF EXISTS "Users can view check-in invites" ON check_in_invites;
DROP POLICY IF EXISTS "Creators can manage their check-in invites" ON check_in_invites;

DROP POLICY IF EXISTS users_can_view_checkin_invites ON check_in_invites;
DROP POLICY IF EXISTS creators_can_manage_invites ON check_in_invites;

-- ========================================
-- New policies for check_ins (no circular dependencies)
-- ========================================

CREATE POLICY "Users can create check-ins"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can view community check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND visibility_scope = 'community'
  );

CREATE POLICY "Users can view neighborhood check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND visibility_scope = 'neighborhood'
    AND EXISTS (
      SELECT 1
      FROM check_in_neighborhoods cin
      JOIN users u ON u.id = auth.uid()
      JOIN lots l ON l.id = u.lot_id
      WHERE cin.check_in_id = check_ins.id
      AND l.neighborhood_id = cin.neighborhood_id
    )
  );

CREATE POLICY "Users can view private check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND visibility_scope = 'private'
    AND (
      EXISTS (
        SELECT 1
        FROM check_in_invites
        WHERE check_in_id = check_ins.id
        AND invitee_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM check_in_invites ci
        JOIN users u ON u.id = auth.uid()
        WHERE ci.check_in_id = check_ins.id
        AND ci.family_unit_id = u.family_unit_id
      )
    )
  );

CREATE POLICY "Creators can view their own check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Creators can update their own check-ins"
  ON check_ins FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their own check-ins"
  ON check_ins FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update check-ins in their tenant"
  ON check_ins FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

CREATE POLICY "Admins can delete check-ins in their tenant"
  ON check_ins FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- ========================================
-- New policies for check_in_rsvps (simplified)
-- ========================================

CREATE POLICY "Users can view RSVPs in their tenant"
  ON check_in_rsvps FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their own RSVPs"
  ON check_in_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own RSVPs"
  ON check_in_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own RSVPs"
  ON check_in_rsvps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ========================================
-- New policies for check_in_neighborhoods (NO recursion)
-- ========================================

CREATE POLICY "Anyone can view check-in neighborhoods"
  ON check_in_neighborhoods FOR SELECT
  TO authenticated
  USING (true);

-- NO policy that queries check_ins table - store created_by directly
-- Add column first
ALTER TABLE check_in_neighborhoods ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE POLICY "Creators can insert neighborhoods"
  ON check_in_neighborhoods FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their neighborhoods"
  ON check_in_neighborhoods FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their neighborhoods"
  ON check_in_neighborhoods FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ========================================
-- New policies for check_in_invites (NO recursion)
-- ========================================

CREATE POLICY "Users can view their own invites"
  ON check_in_invites FOR SELECT
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR family_unit_id IN (
      SELECT family_unit_id FROM users WHERE id = auth.uid()
    )
  );

-- NO policy that queries check_ins table - store created_by directly
-- Add column first
ALTER TABLE check_in_invites ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE POLICY "Creators can insert invites"
  ON check_in_invites FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their invites"
  ON check_in_invites FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their invites"
  ON check_in_invites FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
