-- Sprint 6: Create unified notifications table
-- This table will handle all notification types across the platform

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  type text NOT NULL, -- 'exchange_request', 'exchange_confirmed', 'event_invite', etc.
  title text NOT NULL,
  message text,
  
  -- Status flags
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  action_required boolean NOT NULL DEFAULT false,
  action_taken boolean NOT NULL DEFAULT false,
  action_response text CHECK (action_response IN ('confirmed', 'rejected', 'approved', 'declined', 'accepted')), -- Add action_response to track confirm/decline/approve/reject
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  
  -- Polymorphic relationships (only one should be populated per notification)
  exchange_transaction_id uuid REFERENCES exchange_transactions(id) ON DELETE CASCADE,
  exchange_listing_id uuid REFERENCES exchange_listings(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  check_in_id uuid REFERENCES check_ins(id) ON DELETE CASCADE,
  -- announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE, -- Future
  
  -- Additional context
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Who triggered this notification
  action_url text, -- Deep link to relevant page
  metadata jsonb -- Flexible storage for additional data
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_action_required ON notifications(action_required);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_exchange_transaction ON notifications(exchange_transaction_id) WHERE exchange_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_exchange_listing ON notifications(exchange_listing_id) WHERE exchange_listing_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY notifications_select_own 
  ON notifications 
  FOR SELECT 
  USING (recipient_id = auth.uid());

-- RLS Policy: Users can update their own notifications (mark read/archived)
CREATE POLICY notifications_update_own 
  ON notifications 
  FOR UPDATE 
  USING (recipient_id = auth.uid());

-- RLS Policy: Only system/server can insert notifications (via service role)
CREATE POLICY notifications_insert_service 
  ON notifications 
  FOR INSERT 
  WITH CHECK (true); -- Service role bypass will handle this

-- Create function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = p_user_id
      AND is_read = false
      AND is_archived = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get action required count
CREATE OR REPLACE FUNCTION get_action_required_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = p_user_id
      AND action_required = true
      AND action_taken = false
      AND is_archived = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'Unified notifications table for all platform notifications';
COMMENT ON COLUMN notifications.type IS 'Notification type discriminator: exchange_request, exchange_confirmed, event_invite, etc.';
COMMENT ON COLUMN notifications.action_required IS 'True if notification requires user action (e.g., approve/reject)';
COMMENT ON COLUMN notifications.action_taken IS 'True if user has responded to action_required notification';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered this notification (e.g., who sent the request)';
COMMENT ON COLUMN notifications.action_response IS 'Response to the action required notification (confirmed, rejected, approved, declined, accepted)';
