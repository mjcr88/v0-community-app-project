-- Drop the old delete policy that only allowed admins
DROP POLICY IF EXISTS "Tenant admins can delete events" ON events;

-- Create new delete policy that allows creators to delete their own events
CREATE POLICY "Event creators can delete their events"
  ON events FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );
