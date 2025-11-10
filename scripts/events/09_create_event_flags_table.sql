-- Create event_flags table (resident flagging for moderation)
CREATE TABLE IF NOT EXISTS event_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One flag per user per event
  UNIQUE(event_id, flagged_by)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_flags_event_id ON event_flags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_flags_flagged_by ON event_flags(flagged_by);

-- Add comments for documentation
COMMENT ON TABLE event_flags IS 'Residents can flag events for admin review';

-- Create trigger to set is_flagged on first flag
CREATE OR REPLACE FUNCTION set_event_flagged()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events 
  SET is_flagged = true, 
      flagged_at = now()
  WHERE id = NEW.event_id 
    AND is_flagged = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_event_flagged ON event_flags;
CREATE TRIGGER trigger_set_event_flagged
  AFTER INSERT ON event_flags
  FOR EACH ROW
  EXECUTE FUNCTION set_event_flagged();

-- Create function to unflag event when all flags are removed
CREATE OR REPLACE FUNCTION check_event_unflagged()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any remaining flags for this event
  IF NOT EXISTS (SELECT 1 FROM event_flags WHERE event_id = OLD.event_id) THEN
    UPDATE events 
    SET is_flagged = false, 
        flagged_at = NULL
    WHERE id = OLD.event_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_event_unflagged ON event_flags;
CREATE TRIGGER trigger_check_event_unflagged
  AFTER DELETE ON event_flags
  FOR EACH ROW
  EXECUTE FUNCTION check_event_unflagged();
