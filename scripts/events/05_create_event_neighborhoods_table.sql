-- Create event_neighborhoods junction table (for neighborhood-scoped events)
CREATE TABLE IF NOT EXISTS event_neighborhoods (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, neighborhood_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_neighborhoods_event_id ON event_neighborhoods(event_id);
CREATE INDEX IF NOT EXISTS idx_event_neighborhoods_neighborhood_id ON event_neighborhoods(neighborhood_id);

-- Add comments for documentation
COMMENT ON TABLE event_neighborhoods IS 'Junction table linking events to neighborhoods for neighborhood-scoped visibility';
