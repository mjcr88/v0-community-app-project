-- Phase 3: Migrate all resident data to users table
-- This copies residents into users with role='resident' and migrates junction table data

-- Step 1: Add migration tracking column to residents (for rollback capability)
ALTER TABLE residents ADD COLUMN IF NOT EXISTS migrated_to_user_id UUID;

-- Step 2: Insert residents into users table
-- Using id as both the user id and linking to auth.users
INSERT INTO users (
  id,
  email,
  role,
  tenant_id,
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
  invited_at,
  created_at,
  updated_at
)
SELECT 
  r.auth_user_id,  -- Use auth_user_id as the id (links to auth.users)
  r.email,
  'resident',  -- Use TEXT instead of enum cast
  r.tenant_id,
  r.first_name,
  r.last_name,
  r.phone,
  r.birthday,
  r.profile_picture_url,
  r.birth_country,
  r.current_country,
  r.languages,
  r.preferred_language,
  r.lot_id,
  r.family_unit_id,
  r.journey_stage,
  r.estimated_move_in_date,
  COALESCE(r.onboarding_completed, false),
  r.onboarding_completed_at,
  r.invite_token,  -- Remove uuid cast, both are TEXT
  r.invited_at,
  r.created_at,
  r.updated_at
FROM residents r
WHERE r.auth_user_id IS NOT NULL  -- Only migrate residents with auth accounts
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = r.auth_user_id
  );

-- Step 3: Update residents table with migration tracking
UPDATE residents 
SET migrated_to_user_id = auth_user_id
WHERE auth_user_id IS NOT NULL AND migrated_to_user_id IS NULL;

-- Step 4: Migrate resident_interests to user_interests
-- Map resident_id to auth_user_id for the user_id
INSERT INTO user_interests (user_id, interest_id, created_at)
SELECT 
  r.auth_user_id,  -- Map to auth_user_id
  ri.interest_id,
  ri.created_at
FROM resident_interests ri
JOIN residents r ON r.id = ri.resident_id
WHERE r.auth_user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users WHERE users.id = r.auth_user_id AND users.role = 'resident'
  )
ON CONFLICT (user_id, interest_id) DO NOTHING;

-- Step 5: Migrate resident_skills to user_skills
INSERT INTO user_skills (user_id, skill_id, open_to_requests, created_at)
SELECT 
  r.auth_user_id,  -- Map to auth_user_id
  rs.skill_id,
  rs.open_to_requests,
  rs.created_at
FROM resident_skills rs
JOIN residents r ON r.id = rs.resident_id
WHERE r.auth_user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users WHERE users.id = r.auth_user_id AND users.role = 'resident'
  )
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Step 6: Migrate resident_privacy_settings to user_privacy_settings (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resident_privacy_settings') THEN
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
      r.auth_user_id,  -- Map to auth_user_id
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
    JOIN residents r ON r.id = rps.resident_id
    WHERE r.auth_user_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM users WHERE users.id = r.auth_user_id AND users.role = 'resident'
      )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

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
  SELECT COUNT(*) INTO resident_count FROM residents WHERE auth_user_id IS NOT NULL;
  SELECT COUNT(*) INTO user_resident_count FROM users WHERE role = 'resident';
  SELECT COUNT(*) INTO interests_count FROM resident_interests;
  SELECT COUNT(*) INTO user_interests_count FROM user_interests;
  SELECT COUNT(*) INTO skills_count FROM resident_skills;
  SELECT COUNT(*) INTO user_skills_count FROM user_skills;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Residents with auth: % -> Users (resident): %', resident_count, user_resident_count;
  RAISE NOTICE '  Resident Interests: % -> User Interests: %', interests_count, user_interests_count;
  RAISE NOTICE '  Resident Skills: % -> User Skills: %', skills_count, user_skills_count;
  
  IF resident_count != user_resident_count THEN
    RAISE WARNING 'Resident count mismatch! Expected %, got %', resident_count, user_resident_count;
  END IF;
  
  RAISE NOTICE 'Phase 3 complete: Resident data migrated to users table';
END $$;

-- Add comments
COMMENT ON COLUMN residents.migrated_to_user_id IS 'Tracks which user record this resident was migrated to. Used for rollback if needed.';
