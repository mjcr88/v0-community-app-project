-- First, drop the problematic RLS policy that's causing infinite recursion
DROP POLICY IF EXISTS "Residents can view events based on visibility scope" ON events;

-- Set default value for visibility_scope column
ALTER TABLE events ALTER COLUMN visibility_scope SET DEFAULT 'community';

-- Update all existing events to have 'community' visibility if null
UPDATE events SET visibility_scope = 'community' WHERE visibility_scope IS NULL;

-- Make visibility_scope NOT NULL now that all events have a value
ALTER TABLE events ALTER COLUMN visibility_scope SET NOT NULL;

-- Create a simplified RLS policy that doesn't cause recursion
-- This policy uses auth.uid() which is available in RLS context without recursion
CREATE POLICY "Residents can view events in their tenant with visibility rules"
ON events
FOR SELECT
USING (
  -- Must be in the same tenant
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
  AND (
    -- Community events: everyone can see
    visibility_scope = 'community'
    OR
    -- Neighborhood events: user must be in one of the event's neighborhoods
    (
      visibility_scope = 'neighborhood'
      AND EXISTS (
        SELECT 1 FROM event_neighborhoods en
        INNER JOIN users u ON u.id = auth.uid()
        WHERE en.event_id = events.id
        AND u.neighborhood_id = en.neighborhood_id
      )
    )
    OR
    -- Private events: user must be invited (either individually or as part of family)
    (
      visibility_scope = 'private'
      AND (
        EXISTS (
          SELECT 1 FROM event_invites ei
          WHERE ei.event_id = events.id
          AND ei.invitee_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM event_invites ei
          INNER JOIN users u ON u.id = auth.uid()
          WHERE ei.event_id = events.id
          AND ei.family_unit_id = u.family_unit_id
        )
      )
    )
    OR
    -- Event creator can always see their own events
    created_by = auth.uid()
  )
);
