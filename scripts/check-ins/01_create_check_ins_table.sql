-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic information
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  
  -- Location (same pattern as events)
  location_type TEXT CHECK (location_type IN ('community_location', 'custom_temporary')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  custom_location_name TEXT,
  custom_location_coordinates JSONB,
  custom_location_type TEXT CHECK (custom_location_type IN ('marker', 'polygon', 'polyline')),
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 30 AND duration_minutes <= 480),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ended_at TIMESTAMPTZ,
  
  -- Visibility (same as events)
  visibility_scope TEXT NOT NULL CHECK (visibility_scope IN ('community', 'neighborhood', 'private')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_location CHECK (
    (location_type = 'community_location' AND location_id IS NOT NULL) OR
    (location_type = 'custom_temporary' AND custom_location_name IS NOT NULL AND custom_location_coordinates IS NOT NULL)
  ),
  CONSTRAINT future_start_buffer CHECK (
    start_time <= now() + INTERVAL '1 hour'
  )
);

-- Indexes for performance
CREATE INDEX idx_check_ins_tenant_id ON check_ins(tenant_id);
CREATE INDEX idx_check_ins_created_by ON check_ins(created_by);
CREATE INDEX idx_check_ins_location_id ON check_ins(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_check_ins_start_time ON check_ins(start_time);
CREATE INDEX idx_check_ins_status ON check_ins(status);
CREATE INDEX idx_check_ins_visibility_scope ON check_ins(visibility_scope);
CREATE INDEX idx_check_ins_active ON check_ins(tenant_id, status, start_time) WHERE status = 'active';

-- Comments
COMMENT ON TABLE check_ins IS 'Spontaneous location-based check-ins for real-time community engagement';
COMMENT ON COLUMN check_ins.activity_type IS 'Type of activity: coffee, working, socializing, exercise, games, meal, relaxing, other';
COMMENT ON COLUMN check_ins.duration_minutes IS 'Duration in minutes (30-480), adjustable in 30-minute increments';
COMMENT ON COLUMN check_ins.start_time IS 'When the check-in starts, can be up to 1 hour in the future';
COMMENT ON COLUMN check_ins.status IS 'active: currently active, ended: manually ended by creator';
