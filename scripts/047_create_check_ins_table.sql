-- Migration 046: Create check_ins table for location-based social features

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Location reference
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  coordinates jsonb NOT NULL, -- {"lat": number, "lng": number, "accuracy": number}
  
  -- Check-in details
  message text,
  activity_type text, -- 'working', 'relaxing', 'exploring', 'socializing', etc.
  photo_url text, -- Single Vercel Blob URL
  
  -- Duration
  duration_minutes integer DEFAULT 60,
  expires_at timestamptz NOT NULL,
  
  -- Visibility
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  CONSTRAINT valid_message_length CHECK (char_length(message) <= 280)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_tenant ON check_ins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_location ON check_ins(location_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_active ON check_ins(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON check_ins(created_at DESC);

-- Enable Row Level Security
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admins: Full access
CREATE POLICY "Super admins have full access to check_ins"
  ON check_ins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Users can create their own check-ins
CREATE POLICY "Users can create their own check_ins"
  ON check_ins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = check_ins.tenant_id
    )
  );

-- Users can update/delete their own check-ins
CREATE POLICY "Users can manage their own check_ins"
  ON check_ins
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view check-ins from users who have opted in to sharing
CREATE POLICY "Users can view visible check_ins in their tenant"
  ON check_ins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id = auth.uid()
      AND u1.tenant_id = check_ins.tenant_id
    )
    AND EXISTS (
      SELECT 1 FROM user_privacy_settings ups
      WHERE ups.user_id = check_ins.user_id
      AND ups.show_check_ins_on_map = true
    )
    AND is_active = true
    AND expires_at > now()
  );

-- Create trigger for updated_at
CREATE TRIGGER update_check_ins_updated_at
  BEFORE UPDATE ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE check_ins IS 'Stores user check-ins for location-based social features';
COMMENT ON COLUMN check_ins.coordinates IS 'GPS coordinates with accuracy: {"lat", "lng", "accuracy"}';
COMMENT ON COLUMN check_ins.message IS 'User message describing their activity (max 280 chars)';
COMMENT ON COLUMN check_ins.duration_minutes IS 'How long the check-in should remain active (max 24 hours)';
COMMENT ON COLUMN check_ins.is_active IS 'Whether the check-in is currently active';
