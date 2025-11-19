-- Create announcements tables with RLS policies

-- Create announcements type enum
CREATE TYPE announcement_type AS ENUM ('general', 'emergency', 'maintenance', 'event', 'policy', 'safety');
CREATE TYPE announcement_priority AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE announcement_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  announcement_type announcement_type NOT NULL DEFAULT 'general',
  priority announcement_priority NOT NULL DEFAULT 'normal',
  status announcement_status NOT NULL DEFAULT 'draft',
  
  -- Optional event link
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  -- Location (optional)
  location_type TEXT, -- 'community_location' or 'custom_temporary'
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  custom_location_name TEXT,
  custom_location_lat DOUBLE PRECISION,
  custom_location_lng DOUBLE PRECISION,
  
  -- Images (array of blob URLs)
  images TEXT[] DEFAULT '{}',
  
  -- Auto-archive date (optional)
  auto_archive_date TIMESTAMPTZ,
  
  -- Status timestamps
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ, -- Track updates after publish
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_location CHECK (
    (location_type IS NULL) OR
    (location_type = 'community_location' AND location_id IS NOT NULL) OR
    (location_type = 'custom_temporary' AND custom_location_name IS NOT NULL AND custom_location_lat IS NOT NULL AND custom_location_lng IS NOT NULL)
  )
);

-- Create announcement_neighborhoods junction table
CREATE TABLE IF NOT EXISTS announcement_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(announcement_id, neighborhood_id)
);

-- Create announcement_reads tracking table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(announcement_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_auto_archive_date ON announcements(auto_archive_date);
CREATE INDEX idx_announcement_neighborhoods_announcement_id ON announcement_neighborhoods(announcement_id);
CREATE INDEX idx_announcement_neighborhoods_neighborhood_id ON announcement_neighborhoods(neighborhood_id);
CREATE INDEX idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_user_id ON announcement_reads(user_id);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements

-- Admins can manage all announcements in their tenant
CREATE POLICY admins_manage_announcements ON announcements
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND (is_tenant_admin = true OR role IN ('tenant_admin', 'super_admin'))
    )
  );

-- Residents can view published announcements in their tenant (not deleted)
CREATE POLICY residents_view_published_announcements ON announcements
  FOR SELECT
  USING (
    status = 'published' 
    AND tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- RLS Policies for announcement_neighborhoods

-- Admins can manage announcement neighborhoods
CREATE POLICY admins_manage_announcement_neighborhoods ON announcement_neighborhoods
  FOR ALL
  USING (
    announcement_id IN (
      SELECT id FROM announcements 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users 
        WHERE id = auth.uid() 
        AND (is_tenant_admin = true OR role IN ('tenant_admin', 'super_admin'))
      )
    )
  );

-- Users can view announcement neighborhoods
CREATE POLICY users_view_announcement_neighborhoods ON announcement_neighborhoods
  FOR SELECT
  USING (
    announcement_id IN (
      SELECT id FROM announcements 
      WHERE status = 'published' 
      AND tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- RLS Policies for announcement_reads

-- Users can mark announcements as read
CREATE POLICY users_mark_as_read ON announcement_reads
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND announcement_id IN (
      SELECT id FROM announcements 
      WHERE status = 'published' 
      AND tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can view their own read status
CREATE POLICY users_view_own_reads ON announcement_reads
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their read timestamp
CREATE POLICY users_update_own_reads ON announcement_reads
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Stores community announcements created by tenant admins';
COMMENT ON TABLE announcement_neighborhoods IS 'Maps announcements to specific neighborhoods for targeted distribution';
COMMENT ON TABLE announcement_reads IS 'Tracks which users have read which announcements';
COMMENT ON COLUMN announcements.last_edited_at IS 'Timestamp of last edit after initial publish (used to show "Updated" indicator)';
COMMENT ON COLUMN announcements.auto_archive_date IS 'Optional date when announcement should automatically be archived';
