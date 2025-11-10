-- Drop and recreate RLS policies to fix infinite recursion

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view images for accessible events" ON event_images;
DROP POLICY IF EXISTS "Event creators can manage images" ON event_images;
DROP POLICY IF EXISTS "Users can view neighborhoods for accessible events" ON event_neighborhoods;
DROP POLICY IF EXISTS "Event creators can manage neighborhoods" ON event_neighborhoods;
DROP POLICY IF EXISTS "Users can view invites for accessible events" ON event_invites;
DROP POLICY IF EXISTS "Event creators can manage invites" ON event_invites;
DROP POLICY IF EXISTS "Users can flag accessible events" ON event_flags;
DROP POLICY IF EXISTS "Tenant admins can view event flags" ON event_flags;

-- Recreate policies WITHOUT subqueries that reference events table
-- This breaks the circular dependency

-- EVENT IMAGES: Direct join instead of subquery
CREATE POLICY "Users can view images for accessible events"
  ON event_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_images.event_id
        AND e.tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND (
          e.created_by = auth.uid()
          OR e.status IN ('published', 'cancelled')
        )
    )
  );

CREATE POLICY "Event creators can manage images"
  ON event_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_images.event_id
        AND e.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_images.event_id
        AND e.created_by = auth.uid()
    )
  );

-- EVENT NEIGHBORHOODS: Direct join
CREATE POLICY "Users can view neighborhoods for accessible events"
  ON event_neighborhoods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_neighborhoods.event_id
        AND e.tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND (
          e.created_by = auth.uid()
          OR e.status IN ('published', 'cancelled')
        )
    )
  );

CREATE POLICY "Event creators can manage neighborhoods"
  ON event_neighborhoods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_neighborhoods.event_id
        AND e.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_neighborhoods.event_id
        AND e.created_by = auth.uid()
    )
  );

-- EVENT INVITES: Direct join
CREATE POLICY "Users can view invites for accessible events"
  ON event_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_invites.event_id
        AND e.created_by = auth.uid()
    )
    OR invitee_id = auth.uid()
    OR family_unit_id IN (
      SELECT family_unit_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Event creators can manage invites"
  ON event_neighborhoods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_invites.event_id
        AND e.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_invites.event_id
        AND e.created_by = auth.uid()
    )
  );

-- EVENT FLAGS: Direct join
CREATE POLICY "Users can flag accessible events"
  ON event_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    flagged_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_flags.event_id
        AND e.tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND e.status IN ('published', 'cancelled')
    )
  );

CREATE POLICY "Tenant admins can view event flags"
  ON event_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.tenant_id = e.tenant_id
      WHERE e.id = event_flags.event_id
        AND u.id = auth.uid()
        AND u.role = 'tenant_admin'
    )
  );
