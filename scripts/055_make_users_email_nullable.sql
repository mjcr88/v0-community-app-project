-- Make users.email nullable to support Passive members (e.g. children)
-- Passive members exist in the public.users directory but do not have auth accounts/emails initially.

ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email' 
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'SUCCESS: users.email is now nullable';
  ELSE
    RAISE EXCEPTION 'FAILURE: users.email is still NOT NULL';
  END IF;
END $$;
