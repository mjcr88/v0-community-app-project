-- Create check_in_invites table (for private check-ins)
CREATE TABLE IF NOT EXISTS check_in_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_unit_id UUID REFERENCES family_units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Must invite either a user or a family unit
  CHECK (invitee_id IS NOT NULL OR family_unit_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_check_in_invites_check_in_id ON check_in_invites(check_in_id);
CREATE INDEX idx_check_in_invites_invitee_id ON check_in_invites(invitee_id) WHERE invitee_id IS NOT NULL;
CREATE INDEX idx_check_in_invites_family_unit_id ON check_in_invites(family_unit_id) WHERE family_unit_id IS NOT NULL;

-- Comments
COMMENT ON TABLE check_in_invites IS 'Defines who is invited to private check-ins';
