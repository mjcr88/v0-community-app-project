-- Phase 2: Migrate junction tables from resident_* to user_*
-- This renames tables and updates foreign keys to reference users instead of residents

-- Step 1: Create new user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, interest_id)
);

-- Step 2: Create new user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  open_to_requests BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- Step 3: Create new user_privacy_settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_profile_picture BOOLEAN DEFAULT true,
  show_phone BOOLEAN DEFAULT true,
  show_birthday BOOLEAN DEFAULT true,
  show_birth_country BOOLEAN DEFAULT true,
  show_current_country BOOLEAN DEFAULT true,
  show_languages BOOLEAN DEFAULT true,
  show_journey_stage BOOLEAN DEFAULT true,
  show_estimated_move_in_date BOOLEAN DEFAULT true,
  show_interests BOOLEAN DEFAULT true,
  show_skills BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_open_to_requests ON user_skills(open_to_requests) WHERE open_to_requests = true;

-- Create trigger for updated_at on user_privacy_settings
CREATE OR REPLACE FUNCTION update_user_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_privacy_settings_updated_at();

-- Enable RLS on new tables
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policies to use users.id instead of auth_user_id
-- Create RLS policies for user_interests
CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interests"
  ON user_interests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Tenant members can view interests of users in their tenant"
  ON user_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
        AND u2.id = user_interests.user_id
        AND u1.tenant_id = u2.tenant_id
        AND u1.tenant_id IS NOT NULL
    )
  );

-- Create RLS policies for user_skills
CREATE POLICY "Users can view their own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own skills"
  ON user_skills FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Tenant members can view skills of users in their tenant"
  ON user_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
        AND u2.id = user_skills.user_id
        AND u1.tenant_id = u2.tenant_id
        AND u1.tenant_id IS NOT NULL
    )
  );

-- Create RLS policies for user_privacy_settings
CREATE POLICY "Users can view their own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own privacy settings"
  ON user_privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE user_interests IS 'Junction table linking users to their interests';
COMMENT ON TABLE user_skills IS 'Junction table linking users to their skills, with optional help availability';
COMMENT ON TABLE user_privacy_settings IS 'Privacy settings controlling visibility of user profile fields';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Phase 2 complete: Junction tables created (user_interests, user_skills, user_privacy_settings)';
END $$;
