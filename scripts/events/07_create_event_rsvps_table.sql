-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL CHECK (rsvp_status IN ('yes', 'maybe', 'no')),
  attending_count INTEGER DEFAULT 1 CHECK (attending_count >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One RSVP per user per event
  UNIQUE(event_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(event_id, rsvp_status);

-- Add comments for documentation
COMMENT ON TABLE event_rsvps IS 'Event RSVP responses with family member attendance tracking';
COMMENT ON COLUMN event_rsvps.attending_count IS 'Number of family members attending (including the user)';
