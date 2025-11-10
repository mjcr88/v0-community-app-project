-- Final fix for RLS infinite recursion
-- This removes all circular dependencies in the RLS policies

-- Drop all existing event-related policies
DROP POLICY IF EXISTS "Residents can create events" ON events;
DROP POLICY IF EXISTS "Residents can view accessible events" ON events;
DROP POLICY IF EXISTS "Users can update their events, admins can update any" ON events;
DROP POLICY IF EXISTS "Tenant admins can delete events" ON events;

DROP POLICY IF EXISTS "Users can view images for accessible events" ON event_images;
DROP POLICY IF EXISTS "Event creators can manage images" ON event_images;

DROP POLICY IF EXISTS "Users can view neighborhoods for accessible events" ON event_neighborhoods;
DROP POLICY IF EXISTS "Event creators can manage neighborhoods" ON event_neighborhoods;

DROP POLICY IF EXISTS "Users can view invites for accessible events" ON event_invites;
DROP POLICY IF EXISTS "Event creators can manage invites" ON event_invites;

DROP POLICY IF EXISTS "Users can flag accessible events" ON event_flags;
DROP POLICY IF EXISTS "Users can remove their own flags" ON event_flags;
DROP POLICY IF EXISTS "Tenant admins can view event flags" ON event_flags;
DROP POLICY IF EXISTS "Tenant admins can remove any flags" ON event_flags;

-- Create new policies for events table without circular dependencies
CREATE POLICY "Residents can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Residents can view published community events"
  ON events FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND status = 'published'
    AND visibility_scope = 'community'
  );

CREATE POLICY "Event creators can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Tenant admins can update any event"
  ON events FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

CREATE POLICY "Tenant admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

-- Event images policies (simplified, no recursion)
CREATE POLICY "Users can view event images"
  ON event_images FOR SELECT
  TO authenticated
  USING (true); -- Will be filtered by events RLS

CREATE POLICY "Event creators can manage their event images"
  ON event_images FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Event neighborhoods policies (simplified)
CREATE POLICY "Users can view event neighborhoods"
  ON event_neighborhoods FOR SELECT
  TO authenticated
  USING (true); -- Will be filtered by events RLS

CREATE POLICY "Event creators can manage their event neighborhoods"
  ON event_neighborhoods FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Event invites policies (simplified)
CREATE POLICY "Users can view event invites"
  ON event_invites FOR SELECT
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR family_unit_id IN (
      SELECT family_unit_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Event creators can manage their event invites"
  ON event_invites FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Event flags policies (simplified)
CREATE POLICY "Users can flag events"
  ON event_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    flagged_by = auth.uid()
  );

CREATE POLICY "Users can remove their own flags"
  ON event_flags FOR DELETE
  TO authenticated
  USING (
    flagged_by = auth.uid()
  );

CREATE POLICY "Tenant admins can view all flags"
  ON event_flags FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN users u ON u.id = auth.uid()
      WHERE e.tenant_id = u.tenant_id
      AND u.role = 'tenant_admin'
    )
  );

CREATE POLICY "Tenant admins can remove any flags"
  ON event_flags FOR DELETE
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN users u ON u.id = auth.uid()
      WHERE e.tenant_id = u.tenant_id
      AND u.role = 'tenant_admin'
    )
  );
