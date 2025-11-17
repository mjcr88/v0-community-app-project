-- Add action_response column to notifications table
-- This is a migration to add the missing column

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_response text 
CHECK (action_response IN ('confirmed', 'rejected', 'approved', 'declined', 'accepted'));

COMMENT ON COLUMN notifications.action_response IS 'Response to the action required notification (confirmed, rejected, approved, declined, accepted)';
