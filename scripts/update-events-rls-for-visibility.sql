-- Update RLS policies for events table to handle all visibility scopes

-- Drop existing restrictive SELECT policy  
DROP POLICY IF EXISTS "Residents can view published community events" ON events;

-- Create new comprehensive SELECT policy that handles all visibility scopes
CREATE POLICY "Residents can view events based on visibility scope"
ON events
FOR SELECT
USING (
  status = 'published' 
  AND (
    -- Community events: everyone in tenant can see
    visibility_scope = 'community'
    OR
    -- Neighborhood events: user must be in one of the selected neighborhoods
    (
      visibility_scope = 'neighborhood'
      AND EXISTS (
        SELECT 1 FROM event_neighborhoods en
        INNER JOIN users u ON u.tenant_id = events.tenant_id
        INNER JOIN lots l ON l.id = u.lot_id
        WHERE en.event_id = events.id
        AND u.id = auth.uid()
        AND l.neighborhood_id = en.neighborhood_id
      )
    )
    OR
    -- Private events: user must be invited individually or as part of family
    (
      visibility_scope = 'private'
      AND EXISTS (
        SELECT 1 FROM event_invites ei
        INNER JOIN users u ON u.tenant_id = events.tenant_id
        WHERE ei.event_id = events.id
        AND u.id = auth.uid()
        AND (
          ei.invitee_id = u.id 
          OR ei.family_unit_id = u.family_unit_id
        )
      )
    )
    OR
    -- Event creator can always see their own events regardless of visibility
    created_by = auth.uid()
  )
);

-- Update UPDATE policy to not fail when selecting after update
DROP POLICY IF EXISTS "Event creators can update their events" ON events;

CREATE POLICY "Event creators can update their events"
ON events
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());
