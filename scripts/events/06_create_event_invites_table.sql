-- Create event_invites junction table (for private events)
CREATE TABLE IF NOT EXISTS event_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_unit_id UUID REFERENCES family_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Must have either invitee_id OR family_unit_id, not both or neither
  CONSTRAINT invite_target_required CHECK (
    (invitee_id IS NOT NULL AND family_unit_id IS NULL) OR 
    (invitee_id IS NULL AND family_unit_id IS NOT NULL)
  ),
  
  -- Prevent duplicate invites
  UNIQUE(event_id, invitee_id, family_unit_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_invitee_id ON event_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_family_unit_id ON event_invites(family_unit_id);

-- Add comments for documentation
COMMENT ON TABLE event_invites IS 'Junction table for private event invitations (individual users or entire families)';
