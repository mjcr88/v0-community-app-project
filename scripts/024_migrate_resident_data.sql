-- Phase 3: Migrate all resident data to users table
-- This copies residents into users with role='resident' and migrates junction table data

-- Step 1: Add migration tracking column to residents (for rollback capability)
ALTER TABLE residents ADD COLUMN IF NOT EXISTS migrated_to_user_id UUID;

-- Step 2: Insert residents into users table
INSERT INTO users (
  id,
  email,
  role,
  tenant_id,
  auth_user_id,
  first_name,
  last_name,
  phone,
  birthday,
  profile_picture_url,
  birth_country,
  current_country,
  languages,
  preferred_language,
  lot_id,
  family_unit_id,
  journey_stage,
  estimated_move_in_date,
  onboarding_completed,
  onboarding_completed_at,
  invite_token,
  invite_sent_at,
  created_at,
  updated_at
)
SELECT 
  id,  -- Keep the same ID for easier migration
  email,
  'resident'::user_role,
  tenant_id,
  auth_user_id,
  first_name,
  last_name,
  phone,
  birthday,
  profile_picture_url,
  birth_country,
  current_country,
  languages,
  preferred_language,
  lot_id,
  family_unit_id,
  journey_stage,
  estimated_move_in_date,
  CASE WHEN onboarding_completed_at IS NOT NULL THEN true ELSE false END,
  onboarding_completed_at,
  invite_token,
  invite_sent_at,
  created_at,
  updated_at
FROM residents
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.id = residents.id
);

-- Step 3: Update residents table with migration tracking
UPDATE residents 
SET migrated_to_user_id = id
WHERE migrated_to_user_id IS NULL;

-- Step 4: Migrate resident_interests to user_interests
INSERT INTO user_interests (user_id, interest_id, created_at)
SELECT 
  ri.resident_id,  -- resident_id becomes user_id (same UUID)
  ri.interest_id,
  ri.created_at
FROM resident_interests ri
WHERE EXISTS (
  SELECT 1 FROM users WHERE users.id = ri.resident_id AND users.role = 'resident'
)
ON CONFLICT (user_id, interest_id) DO NOTHING;

-- Step 5: Migrate resident_skills to user_skills
INSERT INTO user_skills (user_id, skill_id, open_to_requests, created_at)
SELECT 
  rs.resident_id,  -- resident_id becomes user_id (same UUID)
  rs.skill_id,
  rs.open_to_requests,
  rs.created_at
FROM resident_skills rs
WHERE EXISTS (
  SELECT 1 FROM users WHERE users.id = rs.resident_id AND users.role = 'resident'
)
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Step 6: Migrate resident_privacy_settings to user_privacy_settings
INSERT INTO user_privacy_settings (
  user_id,
  show_profile_picture,
  show_phone,
  show_birthday,
  show_birth_country,
  show_current_country,
  show_languages,
  show_journey_stage,
  show_estimated_move_in_date,
  show_interests,
  show_skills,
  created_at,
  updated_at
)
SELECT 
  rps.resident_id,  -- resident_id becomes user_id (same UUID)
  rps.show_profile_picture,
  rps.show_phone,
  rps.show_birthday,
  rps.show_birth_country,
  rps.show_current_country,
  rps.show_languages,
  rps.show_journey_stage,
  rps.show_estimated_move_in_date,
  rps.show_interests,
  rps.show_skills,
  rps.created_at,
  rps.updated_at
FROM resident_privacy_settings rps
WHERE EXISTS (
  SELECT 1 FROM users WHERE users.id = rps.resident_id AND users.role = 'resident'
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Create default privacy settings for residents who don't have them
INSERT INTO user_privacy_settings (user_id)
SELECT id FROM users 
WHERE role = 'resident' 
  AND NOT EXISTS (
    SELECT 1 FROM user_privacy_settings WHERE user_privacy_settings.user_id = users.id
  );

-- Step 8: Verify migration counts
DO $$
DECLARE
  resident_count INTEGER;
  user_resident_count INTEGER;
  interests_count INTEGER;
  user_interests_count INTEGER;
  skills_count INTEGER;
  user_skills_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO resident_count FROM residents;
  SELECT COUNT(*) INTO user_resident_count FROM users WHERE role = 'resident';
  SELECT COUNT(*) INTO interests_count FROM resident_interests;
  SELECT COUNT(*) INTO user_interests_count FROM user_interests;
  SELECT COUNT(*) INTO skills_count FROM resident_skills;
  SELECT COUNT(*) INTO user_skills_count FROM user_skills;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Residents: % -> Users (resident): %', resident_count, user_resident_count;
  RAISE NOTICE '  Resident Interests: % -> User Interests: %', interests_count, user_interests_count;
  RAISE NOTICE '  Resident Skills: % -> User Skills: %', skills_count, user_skills_count;
  
  IF resident_count != user_resident_count THEN
    RAISE WARNING 'Resident count mismatch! Check migration.';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN residents.migrated_to_user_id IS 'Tracks which user record this resident was migrated to. Used for rollback if needed.';
