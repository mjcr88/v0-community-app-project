-- Create resident_requests table for resident-submitted requests to community admins
CREATE TABLE IF NOT EXISTS resident_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- null if anonymous
  
  -- Core fields
  title TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('maintenance', 'question', 'complaint', 'safety', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  
  -- Location (reusing existing pattern from events/listings)
  location_type TEXT CHECK (location_type IN ('community', 'custom')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- community location
  custom_location_name TEXT, -- custom location name
  custom_location_lat DOUBLE PRECISION, -- custom location coordinates
  custom_location_lng DOUBLE PRECISION,
  
  -- Metadata
  is_anonymous BOOLEAN DEFAULT FALSE,
  images TEXT[], -- Array of Blob URLs
  
  -- Admin interaction
  admin_reply TEXT, -- Single external message to resident
  admin_internal_notes TEXT, -- Private notes for admins
  rejection_reason TEXT, -- Why request was rejected
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Which admin resolved it
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  first_reply_at TIMESTAMPTZ -- When admin first responded
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resident_requests_tenant_id ON resident_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resident_requests_created_by ON resident_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_resident_requests_status ON resident_requests(status);
CREATE INDEX IF NOT EXISTS idx_resident_requests_request_type ON resident_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_resident_requests_priority ON resident_requests(priority);
CREATE INDEX IF NOT EXISTS idx_resident_requests_created_at ON resident_requests(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE resident_requests IS 'Tracks resident requests (maintenance, questions, complaints, etc.) to community admins';
COMMENT ON COLUMN resident_requests.status IS 'pending → in_progress → resolved/rejected';
COMMENT ON COLUMN resident_requests.created_by IS 'NULL if request is anonymous';
COMMENT ON COLUMN resident_requests.admin_reply IS 'External message sent to resident';
COMMENT ON COLUMN resident_requests.admin_internal_notes IS 'Private notes for admin use only';

-- RLS Policies

-- Residents can view their own requests
CREATE POLICY residents_view_own_requests ON resident_requests
  FOR SELECT 
  USING (
    created_by = auth.uid()
    AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Residents can create requests
CREATE POLICY residents_create_requests ON resident_requests
  FOR INSERT 
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Residents can update their own pending requests only
CREATE POLICY residents_update_own_pending ON resident_requests
  FOR UPDATE 
  USING (
    created_by = auth.uid() 
    AND status = 'pending'
  );

-- Admins can view all requests in their tenant
CREATE POLICY admins_view_all_requests ON resident_requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND tenant_id = resident_requests.tenant_id
        AND (role = 'tenant_admin' OR role = 'super_admin' OR is_tenant_admin = true)
    )
  );

-- Admins can update all requests in their tenant
CREATE POLICY admins_update_requests ON resident_requests
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND tenant_id = resident_requests.tenant_id
        AND (role = 'tenant_admin' OR role = 'super_admin' OR is_tenant_admin = true)
    )
  );

-- Enable RLS
ALTER TABLE resident_requests ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_resident_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resident_requests_updated_at
  BEFORE UPDATE ON resident_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_requests_updated_at();
