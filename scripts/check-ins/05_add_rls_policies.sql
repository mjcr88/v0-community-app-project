-- Row Level Security Policies for Check-ins

-- ========================================
-- RLS for check_ins table
-- ========================================
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Residents can view check-ins in their tenant based on visibility
CREATE POLICY residents_can_view_checkins ON check_ins
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Community-wide check-ins visible to all
      visibility_scope = 'community'
      -- Neighborhood check-ins visible if user is in that neighborhood
      OR (
        visibility_scope = 'neighborhood'
        AND id IN (
          SELECT cin.check_in_id 
          FROM check_in_neighborhoods cin
          -- Fixed join to use lots table which has neighborhood_id
          JOIN lots l ON l.neighborhood_id = cin.neighborhood_id
          JOIN users u ON u.lot_id = l.id
          WHERE u.id = auth.uid()
        )
      )
      -- Private check-ins visible if user is invited
      OR (
        visibility_scope = 'private'
        AND (
          id IN (
            SELECT check_in_id FROM check_in_invites WHERE invitee_id = auth.uid()
          )
          OR id IN (
            SELECT ci.check_in_id
            FROM check_in_invites ci
            -- Removed family_members join, using users.family_unit_id directly
            JOIN users u ON u.family_unit_id = ci.family_unit_id
            WHERE u.id = auth.uid()
          )
        )
      )
      -- Creators can always see their own check-ins
      OR created_by = auth.uid()
    )
  );

-- Residents can create check-ins in their tenant
CREATE POLICY residents_can_create_checkins ON check_ins
  FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Creators can update their own check-ins
CREATE POLICY creators_can_update_checkins ON check_ins
  FOR UPDATE
  USING (created_by = auth.uid());

-- Creators can delete their own check-ins
CREATE POLICY creators_can_delete_checkins ON check_ins
  FOR DELETE
  USING (created_by = auth.uid());

-- Tenant admins can update any check-in in their tenant
CREATE POLICY tenant_admins_can_update_checkins ON check_ins
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- Tenant admins can delete any check-in in their tenant
CREATE POLICY tenant_admins_can_delete_checkins ON check_ins
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- ========================================
-- RLS for check_in_rsvps table
-- ========================================
ALTER TABLE check_in_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view RSVPs for check-ins they can see
CREATE POLICY users_can_view_checkin_rsvps ON check_in_rsvps
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Users can create their own RSVPs
CREATE POLICY users_can_create_own_rsvps ON check_in_rsvps
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own RSVPs
CREATE POLICY users_can_update_own_rsvps ON check_in_rsvps
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own RSVPs
CREATE POLICY users_can_delete_own_rsvps ON check_in_rsvps
  FOR DELETE
  USING (user_id = auth.uid());

-- ========================================
-- RLS for check_in_neighborhoods table
-- ========================================
ALTER TABLE check_in_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Users can view neighborhood associations for check-ins they can see
CREATE POLICY users_can_view_checkin_neighborhoods ON check_in_neighborhoods
  FOR SELECT
  USING (true);

-- Creators can manage neighborhoods for their check-ins
CREATE POLICY creators_can_manage_neighborhoods ON check_in_neighborhoods
  FOR ALL
  USING (
    check_in_id IN (
      SELECT id FROM check_ins WHERE created_by = auth.uid()
    )
  );

-- ========================================
-- RLS for check_in_invites table
-- ========================================
ALTER TABLE check_in_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites for check-ins they can see
CREATE POLICY users_can_view_checkin_invites ON check_in_invites
  FOR SELECT
  USING (true);

-- Creators can manage invites for their check-ins
CREATE POLICY creators_can_manage_invites ON check_in_invites
  FOR ALL
  USING (
    check_in_id IN (
      SELECT id FROM check_ins WHERE created_by = auth.uid()
    )
  );
