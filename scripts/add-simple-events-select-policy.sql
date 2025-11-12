-- Add a simple SELECT policy for events that doesn't cause recursion
-- This allows users to read events, while visibility filtering happens in application code

-- Drop any existing problematic SELECT policies
DROP POLICY IF EXISTS "residents_can_view_events" ON events;
DROP POLICY IF EXISTS "events_visibility_select" ON events;
DROP POLICY IF EXISTS "Residents can view events based on visibility" ON events;

-- Create a simple SELECT policy that only checks tenant_id
-- No visibility_scope checks = no recursion
-- Visibility filtering will be done in application code
CREATE POLICY "residents_can_view_tenant_events" ON events
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Ensure events created without visibility_scope default to 'community'
UPDATE events SET visibility_scope = 'community' WHERE visibility_scope IS NULL;
