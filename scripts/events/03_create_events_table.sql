-- Create main events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  additional_notes TEXT,
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  external_url TEXT,
  
  -- Event type (resident vs official - for display/filtering)
  event_type TEXT NOT NULL CHECK (event_type IN ('resident', 'official')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  is_flagged BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  
  -- Date & time
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  
  -- Location
  location_type TEXT CHECK (location_type IN ('community_location', 'custom_temporary')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  custom_location_name TEXT,
  custom_location_coordinates JSONB,
  custom_location_type TEXT CHECK (custom_location_type IN ('marker', 'polygon', 'polyline')),
  
  -- RSVP settings
  requires_rsvp BOOLEAN DEFAULT false,
  rsvp_deadline TIMESTAMPTZ,
  max_attendees INTEGER,
  
  -- Visibility
  visibility_scope TEXT NOT NULL CHECK (visibility_scope IN ('community', 'neighborhood', 'private')),
  
  -- Contact info
  hide_creator_contact BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_location_community CHECK (
    location_type = 'community_location' AND location_id IS NOT NULL OR
    location_type = 'custom_temporary' AND custom_location_name IS NOT NULL OR
    location_type IS NULL
  ),
  CONSTRAINT valid_rsvp_settings CHECK (
    requires_rsvp = false OR 
    (requires_rsvp = true AND rsvp_deadline IS NOT NULL)
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_visibility_scope ON events(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_events_is_flagged ON events(is_flagged) WHERE is_flagged = true;

-- Add comments for documentation
COMMENT ON TABLE events IS 'Community events with flexible visibility and RSVP management';
COMMENT ON COLUMN events.event_type IS 'resident = created by residents, official = marked as official community event';
COMMENT ON COLUMN events.visibility_scope IS 'community = all residents, neighborhood = specific neighborhoods, private = invited only';
