-- Create saved_events table (personal calendar saves)
CREATE TABLE IF NOT EXISTS saved_events (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_events_user_id ON saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON saved_events(event_id);

-- Add comments for documentation
COMMENT ON TABLE saved_events IS 'Users can save events to their personal calendar';
