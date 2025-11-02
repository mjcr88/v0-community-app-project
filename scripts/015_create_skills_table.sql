-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create resident_skills junction table
CREATE TABLE IF NOT EXISTS resident_skills (
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  open_to_requests BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resident_id, skill_id)
);

-- Add RLS policies
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_skills ENABLE ROW LEVEL SECURITY;

-- Skills policies
CREATE POLICY "Users can view skills for their tenant"
  ON skills FOR SELECT
  USING (true);

CREATE POLICY "Users can create skills"
  ON skills FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage skills"
  ON skills FOR ALL
  USING (true);

-- Resident skills policies
CREATE POLICY "Users can view resident skills"
  ON resident_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skills"
  ON resident_skills FOR ALL
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_skills_tenant_id ON skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resident_skills_resident_id ON resident_skills(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_skills_skill_id ON resident_skills(skill_id);
