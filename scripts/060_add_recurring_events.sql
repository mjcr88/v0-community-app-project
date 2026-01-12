
ALTER TABLE events ADD COLUMN parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN recurrence_rule JSONB;
CREATE INDEX idx_events_parent_event_id ON events(parent_event_id);
