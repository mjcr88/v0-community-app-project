-- Helper script to verify migration readiness and provide statistics

-- Check current state
DO $$
DECLARE
  old_resident_count INTEGER;
  new_user_resident_count INTEGER;
  old_interests_count INTEGER;
  new_interests_count INTEGER;
  old_skills_count INTEGER;
  new_skills_count INTEGER;
  old_privacy_count INTEGER;
  new_privacy_count INTEGER;
BEGIN
  -- Count records in old tables
  SELECT COUNT(*) INTO old_resident_count FROM residents;
  SELECT COUNT(*) INTO old_interests_count FROM resident_interests;
  SELECT COUNT(*) INTO old_skills_count FROM resident_skills;
  SELECT COUNT(*) INTO old_privacy_count FROM resident_privacy_settings;
  
  -- Count records in new tables
  SELECT COUNT(*) INTO new_user_resident_count FROM users WHERE role = 'resident';
  SELECT COUNT(*) INTO new_interests_count FROM user_interests;
  SELECT COUNT(*) INTO new_skills_count FROM user_skills;
  SELECT COUNT(*) INTO new_privacy_count FROM user_privacy_settings;
  
  RAISE NOTICE '=== MIGRATION STATUS ===';
  RAISE NOTICE 'Residents: % (old) → % (new)', old_resident_count, new_user_resident_count;
  RAISE NOTICE 'Interests: % (old) → % (new)', old_interests_count, new_interests_count;
  RAISE NOTICE 'Skills: % (old) → % (new)', old_skills_count, new_skills_count;
  RAISE NOTICE 'Privacy Settings: % (old) → % (new)', old_privacy_count, new_privacy_count;
  
  IF old_resident_count = new_user_resident_count AND 
     old_interests_count = new_interests_count AND
     old_skills_count = new_skills_count THEN
    RAISE NOTICE '✓ Migration data looks good!';
  ELSE
    RAISE WARNING '⚠ Data counts do not match - review migration';
  END IF;
END $$;
