-- Add tenant_id to event_rsvps table for multi-tenancy isolation
ALTER TABLE event_rsvps ADD COLUMN tenant_id uuid REFERENCES tenants(id);

-- Populate tenant_id from events table
UPDATE event_rsvps 
SET tenant_id = (SELECT tenant_id FROM events WHERE events.id = event_rsvps.event_id);

-- Make tenant_id required
ALTER TABLE event_rsvps ALTER COLUMN tenant_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_event_rsvps_tenant_id ON event_rsvps(tenant_id);

-- Update RLS policies to include tenant_id check
DROP POLICY IF EXISTS "Users can view RSVPs for events in their tenant" ON event_rsvps;
CREATE POLICY "Users can view RSVPs for events in their tenant" ON event_rsvps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = event_rsvps.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can manage their own RSVPs in their tenant" ON event_rsvps;
CREATE POLICY "Users can manage their own RSVPs in their tenant" ON event_rsvps
  FOR ALL
  USING (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tenant_id = event_rsvps.tenant_id
    )
  );
