-- Fix infinite recursion in events RLS policy
-- This script completely removes and recreates the visibility policy without recursion

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "events_visibility_select" ON events;
DROP POLICY IF EXISTS "Residents can view events based on visibility" ON events;

-- Step 2: Set all existing NULL visibility events to 'community'
UPDATE events 
SET visibility_scope = 'community' 
WHERE visibility_scope IS NULL;

-- Step 3: Set default for future inserts
ALTER TABLE events 
ALTER COLUMN visibility_scope SET DEFAULT 'community';

-- Step 4: Create a clean, non-recursive SELECT policy
CREATE POLICY "residents_can_view_events" ON events
FOR SELECT
USING (
  -- Always allow if community-wide
  visibility_scope = 'community'
  
  -- Allow if neighborhood event and user is in one of those neighborhoods
  OR (
    visibility_scope = 'neighborhood'
    AND EXISTS (
      SELECT 1 FROM event_neighborhoods en
      INNER JOIN lots l ON l.neighborhood_id = en.neighborhood_id
      INNER JOIN users u ON u.lot_id = l.id
      WHERE en.event_id = events.id
      AND u.id = auth.uid()
    )
  )
  
  -- Allow if private event and user is invited (individual or family)
  OR (
    visibility_scope = 'private'
    AND (
      -- Individual invite
      EXISTS (
        SELECT 1 FROM event_invites ei
        WHERE ei.event_id = events.id
        AND ei.invitee_id = auth.uid()
      )
      -- Family invite
      OR EXISTS (
        SELECT 1 FROM event_invites ei
        INNER JOIN users u ON u.family_unit_id = ei.family_unit_id
        WHERE ei.event_id = events.id
        AND u.id = auth.uid()
      )
    )
  )
  
  -- Always allow event creators to see their own events
  OR created_by = auth.uid()
);

-- Step 5: Ensure the policy doesn't conflict with existing policies
COMMENT ON POLICY "residents_can_view_events" ON events IS 
'Non-recursive policy that allows users to view events based on visibility scope';
