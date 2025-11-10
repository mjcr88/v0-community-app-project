-- Enable RLS on all event tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_flags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EVENT CATEGORIES POLICIES
-- =====================================================

-- Residents can view categories for their tenant
CREATE POLICY "Residents can view tenant event categories"
  ON event_categories FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Tenant admins can manage categories
CREATE POLICY "Tenant admins can insert event categories"
  ON event_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u
      WHERE u.id = auth.uid() 
        AND u.is_tenant_admin = true
    )
  );

CREATE POLICY "Tenant admins can update event categories"
  ON event_categories FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u
      WHERE u.id = auth.uid() 
        AND u.is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u
      WHERE u.id = auth.uid() 
        AND u.is_tenant_admin = true
    )
  );

CREATE POLICY "Tenant admins can delete event categories"
  ON event_categories FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u
      WHERE u.id = auth.uid() 
        AND u.is_tenant_admin = true
    )
  );

-- =====================================================
-- EVENTS POLICIES
-- =====================================================

-- Residents can view events based on visibility scope and status
CREATE POLICY "Residents can view accessible events"
  ON events FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- Creator can see their own events (including drafts)
      created_by = auth.uid()
      OR
      -- Others can only see published or cancelled events (not drafts)
      (
        status IN ('published', 'cancelled')
        AND (
          -- Community events visible to all tenant residents
          visibility_scope = 'community'
          OR
          -- Fixed neighborhood visibility logic to use lots table
          -- Neighborhood events visible to residents in those neighborhoods
          (
            visibility_scope = 'neighborhood'
            AND EXISTS (
              SELECT 1 FROM event_neighborhoods en
              JOIN lots l ON l.neighborhood_id = en.neighborhood_id
              JOIN users u ON u.lot_id = l.id
              WHERE en.event_id = events.id
                AND u.id = auth.uid()
            )
          )
          OR
          -- Private events visible to invited users/families
          (
            visibility_scope = 'private'
            AND (
              -- Direct user invite
              EXISTS (
                SELECT 1 FROM event_invites ei
                WHERE ei.event_id = events.id
                  AND ei.invitee_id = auth.uid()
              )
              OR
              -- Family unit invite
              EXISTS (
                SELECT 1 FROM event_invites ei
                JOIN users u ON u.family_unit_id = ei.family_unit_id
                WHERE ei.event_id = events.id
                  AND u.id = auth.uid()
              )
            )
          )
        )
      )
    )
  );

-- Residents can create events in their tenant
CREATE POLICY "Residents can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Creators can update their own events (unless cancelled)
-- Tenant admins can update any event in their tenant
CREATE POLICY "Users can update their events, admins can update any"
  ON events FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- Creator can update their own non-cancelled events
      (created_by = auth.uid() AND status != 'cancelled')
      OR
      -- Tenant admins can update any event
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.tenant_id = events.tenant_id
          AND u.is_tenant_admin = true
      )
    )
  );

-- Only tenant admins can delete events
CREATE POLICY "Tenant admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u
      WHERE u.id = auth.uid() 
        AND u.is_tenant_admin = true
    )
  );

-- =====================================================
-- EVENT IMAGES POLICIES
-- =====================================================

CREATE POLICY "Users can view images for accessible events"
  ON event_images FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events
      -- Inherits event visibility logic
    )
  );

CREATE POLICY "Event creators can manage images"
  ON event_images FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- EVENT NEIGHBORHOODS POLICIES
-- =====================================================

CREATE POLICY "Users can view neighborhoods for accessible events"
  ON event_neighborhoods FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events
      -- Inherits event visibility logic
    )
  );

CREATE POLICY "Event creators can manage neighborhoods"
  ON event_neighborhoods FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- EVENT INVITES POLICIES
-- =====================================================

CREATE POLICY "Users can view invites for accessible events"
  ON event_invites FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
    OR invitee_id = auth.uid()
    OR family_unit_id IN (
      SELECT family_unit_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Event creators can manage invites"
  ON event_invites FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- EVENT RSVPS POLICIES
-- =====================================================

CREATE POLICY "Users can view their own RSVPs"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own RSVPs"
  ON event_rsvps FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SAVED EVENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view their saved events"
  ON saved_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own saved events"
  ON saved_events FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- EVENT FLAGS POLICIES
-- =====================================================

-- Only admins can view flags
CREATE POLICY "Tenant admins can view event flags"
  ON event_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN events e ON e.id = event_flags.event_id
      WHERE u.id = auth.uid()
        AND u.tenant_id = e.tenant_id
        AND u.is_tenant_admin = true
    )
  );

-- Users can flag events they can see
CREATE POLICY "Users can flag accessible events"
  ON event_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    flagged_by = auth.uid()
    AND event_id IN (
      SELECT id FROM events
      -- Inherits event visibility logic
    )
  );

-- Users can remove their own flags
CREATE POLICY "Users can remove their own flags"
  ON event_flags FOR DELETE
  TO authenticated
  USING (flagged_by = auth.uid());

-- Admins can remove any flags in their tenant
CREATE POLICY "Tenant admins can remove any flags"
  ON event_flags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN events e ON e.id = event_flags.event_id
      WHERE u.id = auth.uid()
        AND u.tenant_id = e.tenant_id
        AND u.is_tenant_admin = true
    )
  );
