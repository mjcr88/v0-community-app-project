-- Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create resident_interests junction table
CREATE TABLE IF NOT EXISTS resident_interests (
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resident_id, interest_id)
);

-- Add RLS policies
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_interests ENABLE ROW LEVEL SECURITY;

-- Interests policies
CREATE POLICY "Users can view interests for their tenant"
  ON interests FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage interests"
  ON interests FOR ALL
  USING (true);

-- Resident interests policies
CREATE POLICY "Users can view resident interests"
  ON resident_interests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interests"
  ON resident_interests FOR ALL
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_interests_tenant_id ON interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resident_interests_resident_id ON resident_interests(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_interests_interest_id ON resident_interests(interest_id);
