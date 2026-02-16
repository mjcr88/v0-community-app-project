-- Secure handle_new_user and add missing FK cascades

BEGIN;

-- 1. Redefine handle_new_user to use raw_app_meta_data for secure fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  existing_user public.users%ROWTYPE;
  meta_tenant_id UUID;
  meta_role TEXT;
  meta_name TEXT;
  meta_avatar TEXT;
  tenant_str TEXT;
BEGIN
  -- Extract metadata helper variables
  -- SECURITY: Use raw_app_meta_data for trusted fields (tenant_id, role)
  -- Fallback to raw_user_meta_data only for user-editable profile fields
  
  tenant_str := new.raw_app_meta_data->>'tenant_id';
  meta_role := COALESCE(new.raw_app_meta_data->>'role', 'resident');
  
  -- Fallback logic for tenant_str if empty?
  -- If empty, try user_metadata just in case? Or stricter?
  -- The review said: "Use raw_app_meta_data instead...".
  -- Let's stick to app_metadata primarily.
  
  meta_tenant_id := NULLIF(tenant_str, '')::UUID;
  
  meta_name := new.raw_user_meta_data->>'full_name';
  meta_avatar := new.raw_user_meta_data->>'avatar_url';

  -- Check if a user with the same email (case-insensitive) already exists
  SELECT * INTO existing_user 
  FROM public.users 
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF existing_user.id IS NOT NULL THEN
    -- User exists (e.g. created by admin invite). 
    -- We update the existing record to "claim" it.
    
    UPDATE public.users
    SET 
      profile_picture_url = COALESCE(meta_avatar, existing_user.profile_picture_url),
      name = COALESCE(meta_name, existing_user.name, split_part(new.email, '@', 1)),
      updated_at = NOW()
    WHERE id = existing_user.id;
    
    -- Update the ID to match the Auth User ID.
    -- This requires ON UPDATE CASCADE on all FKs.
    UPDATE public.users SET id = new.id WHERE email = existing_user.email;
    
    RETURN NEW;
    
  ELSE
    -- No existing user placeholder found.
    -- MUST INSERT a new record into public.users.
    
    INSERT INTO public.users (
      id,
      email,
      role,
      tenant_id,
      name,
      profile_picture_url,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      new.email,
      meta_role,
      meta_tenant_id, -- Critical: usage of tenant_id from metadata
      COALESCE(meta_name, split_part(new.email, '@', 1)),
      meta_avatar,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
      
    RETURN NEW; 
  END IF;
END;
$$;

-- 2. Add missing cascades (missed in 062)
-- 2b. Tenants (tenant_admin_id) - Admin reference
ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_tenant_admin_id_fkey,
ADD CONSTRAINT tenants_tenant_admin_id_fkey
  FOREIGN KEY (tenant_admin_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 2b. Family Relationships (user_id)
ALTER TABLE public.family_relationships
DROP CONSTRAINT IF EXISTS family_relationships_user_id_fkey,
ADD CONSTRAINT family_relationships_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 2c. Family Relationships (related_user_id)
ALTER TABLE public.family_relationships
DROP CONSTRAINT IF EXISTS family_relationships_related_user_id_fkey,
ADD CONSTRAINT family_relationships_related_user_id_fkey
  FOREIGN KEY (related_user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

COMMIT;
