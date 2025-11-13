-- Add cancelled_by column to events table to track who cancelled the event
ALTER TABLE events
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_events_cancelled_by ON events(cancelled_by);

-- Add comment
COMMENT ON COLUMN events.cancelled_by IS 'User who cancelled the event (admin or creator)';
