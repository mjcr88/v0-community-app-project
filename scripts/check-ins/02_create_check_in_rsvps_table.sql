-- Create check_in_rsvps table
CREATE TABLE IF NOT EXISTS check_in_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- RSVP information
  rsvp_status TEXT NOT NULL CHECK (rsvp_status IN ('yes', 'maybe', 'no')),
  attending_count INTEGER DEFAULT 1 CHECK (attending_count >= 0),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One RSVP per user per check-in
  UNIQUE(check_in_id, user_id)
);

-- Indexes
CREATE INDEX idx_check_in_rsvps_check_in_id ON check_in_rsvps(check_in_id);
CREATE INDEX idx_check_in_rsvps_user_id ON check_in_rsvps(user_id);
CREATE INDEX idx_check_in_rsvps_status ON check_in_rsvps(check_in_id, rsvp_status);
CREATE INDEX idx_check_in_rsvps_tenant_id ON check_in_rsvps(tenant_id);

-- Comments
COMMENT ON TABLE check_in_rsvps IS 'RSVP responses for check-ins (yes=coming, maybe, no=not coming)';
COMMENT ON COLUMN check_in_rsvps.rsvp_status IS 'yes: coming to join, maybe: might come, no: not coming';
COMMENT ON COLUMN check_in_rsvps.attending_count IS 'Number of people attending (including family members)';
