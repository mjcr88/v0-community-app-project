-- Fix infinite recursion in check-ins RLS policies
-- Based on the same fix applied to events table

-- Drop all existing check-in policies that cause recursion
DROP POLICY IF EXISTS residents_can_view_checkins ON check_ins;
DROP POLICY IF EXISTS residents_can_create_checkins ON check_ins;
DROP POLICY IF EXISTS creators_can_update_checkins ON check_ins;
DROP POLICY IF EXISTS creators_can_delete_checkins ON check_ins;
DROP POLICY IF EXISTS tenant_admins_can_update_checkins ON check_ins;
DROP POLICY IF EXISTS tenant_admins_can_delete_checkins ON check_ins;

DROP POLICY IF EXISTS users_can_view_checkin_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_create_own_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_update_own_rsvps ON check_in_rsvps;
DROP POLICY IF EXISTS users_can_delete_own_rsvps ON check_in_rsvps;

DROP POLICY IF EXISTS users_can_view_checkin_neighborhoods ON check_in_neighborhoods;
DROP POLICY IF EXISTS creators_can_manage_neighborhoods ON check_in_neighborhoods;

DROP POLICY IF EXISTS users_can_view_checkin_invites ON check_in_invites;
DROP POLICY IF EXISTS creators_can_manage_invites ON check_in_invites;

-- ========================================
-- Recreate policies for check_ins table WITHOUT circular dependencies
-- ========================================

-- Simplified policies to avoid infinite recursion
CREATE POLICY "Residents can create check-ins"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- View community check-ins
CREATE POLICY "Residents can view community check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND status = 'active'
    AND visibility_scope = 'community'
  );

-- View neighborhood check-ins (if user is in that neighborhood)
CREATE POLICY "Residents can view neighborhood check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND status = 'active'
    AND visibility_scope = 'neighborhood'
    AND id IN (
      SELECT cin.check_in_id 
      FROM check_in_neighborhoods cin
      JOIN users u ON u.id = auth.uid()
      JOIN lots l ON l.id = u.lot_id
      WHERE l.neighborhood_id = cin.neighborhood_id
    )
  );

-- View private check-ins (if invited)
CREATE POLICY "Residents can view private check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND status = 'active'
    AND visibility_scope = 'private'
    AND (
      id IN (
        SELECT check_in_id FROM check_in_invites WHERE invitee_id = auth.uid()
      )
      OR id IN (
        SELECT ci.check_in_id
        FROM check_in_invites ci
        JOIN users u ON u.id = auth.uid()
        WHERE ci.family_unit_id = u.family_unit_id
      )
    )
  );

-- Creators can always view their own check-ins
CREATE POLICY "Creators can view own check-ins"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Creators can update their own check-ins
CREATE POLICY "Creators can update own check-ins"
  ON check_ins FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Creators can delete their own check-ins
CREATE POLICY "Creators can delete own check-ins"
  ON check_ins FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Tenant admins can update any check-in in their tenant
CREATE POLICY "Tenant admins can update any check-in"
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

-- Tenant admins can delete any check-in in their tenant
CREATE POLICY "Tenant admins can delete any check-in"
  ON check_ins FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- ========================================
-- Recreate policies for check_in_rsvps (simplified, no recursion)
-- ========================================

CREATE POLICY "Users can view check-in RSVPs"
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
-- Recreate policies for check_in_neighborhoods (simplified)
-- ========================================

CREATE POLICY "Users can view check-in neighborhoods"
  ON check_in_neighborhoods FOR SELECT
  TO authenticated
  USING (true); -- Will be filtered by check_ins RLS

CREATE POLICY "Creators can manage their check-in neighborhoods"
  ON check_in_neighborhoods FOR ALL
  TO authenticated
  USING (
    check_in_id IN (
      SELECT id FROM check_ins WHERE created_by = auth.uid()
    )
  );

-- ========================================
-- Recreate policies for check_in_invites (simplified)
-- ========================================

CREATE POLICY "Users can view check-in invites"
  ON check_in_invites FOR SELECT
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR family_unit_id IN (
      SELECT family_unit_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage their check-in invites"
  ON check_in_invites FOR ALL
  TO authenticated
  USING (
    check_in_id IN (
      SELECT id FROM check_ins WHERE created_by = auth.uid()
    )
  );
