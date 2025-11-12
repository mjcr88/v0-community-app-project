-- ============================================================================
-- FIX: Infinite Recursion in Events RLS Policy
-- ============================================================================
-- Root Cause: The existing RLS policy creates circular references
-- Solution: Simplified policy using IN clauses instead of EXISTS subqueries
-- ============================================================================

-- Step 1: Drop ALL existing visibility-related policies
DROP POLICY IF EXISTS "Residents can view events based on visibility" ON events;
DROP POLICY IF EXISTS "Residents can view events based on visibility scope" ON events;
DROP POLICY IF EXISTS "Residents can view events in their tenant with visibility rules" ON events;
DROP POLICY IF EXISTS "Residents can view published community events" ON events;

-- Step 2: Set default and update existing NULL values
ALTER TABLE events ALTER COLUMN visibility_scope SET DEFAULT 'community';
UPDATE events SET visibility_scope = 'community' WHERE visibility_scope IS NULL;
ALTER TABLE events ALTER COLUMN visibility_scope SET NOT NULL;

-- Step 3: Create simplified, non-recursive policy
CREATE POLICY "events_visibility_select" 
ON events
FOR SELECT
USING (
  -- User must be in same tenant
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND
  (
    -- Community: everyone in tenant sees
    visibility_scope = 'community'
    
    OR
    
    -- Creator always sees own events
    created_by = auth.uid()
    
    OR
    
    -- Neighborhood: user's lot neighborhood matches
    (
      visibility_scope = 'neighborhood'
      AND id IN (
        SELECT en.event_id
        FROM event_neighborhoods en
        INNER JOIN lots l ON l.neighborhood_id = en.neighborhood_id
        INNER JOIN users u ON u.lot_id = l.id
        WHERE u.id = auth.uid()
      )
    )
    
    OR
    
    -- Private: user invited individually
    (
      visibility_scope = 'private'
      AND id IN (
        SELECT event_id FROM event_invites WHERE invitee_id = auth.uid()
      )
    )
    
    OR
    
    -- Private: user's family invited
    (
      visibility_scope = 'private'
      AND id IN (
        SELECT ei.event_id
        FROM event_invites ei
        INNER JOIN users u ON u.family_unit_id = ei.family_unit_id
        WHERE u.id = auth.uid() AND u.family_unit_id IS NOT NULL
      )
    )
  )
);

COMMENT ON POLICY "events_visibility_select" ON events IS 
'Non-recursive visibility policy: community (all), neighborhood (user lot matches), private (invited), or creator.';
