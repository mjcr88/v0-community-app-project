-- Fix handle_new_user to correctly INSERT new users with metadata
-- This ensures that users created via Auth (who don't match an existing placeholder)
-- are still created in public.users with the correct tenant_id and role.

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
BEGIN
  -- Extract metadata helper variables for clarity
  -- Note: explicit casting to text/uuid is safer
  meta_tenant_id := (new.raw_user_meta_data->>'tenant_id')::UUID;
  meta_role := COALESCE(new.raw_user_meta_data->>'role', 'resident');
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
    -- This requires ON UPDATE CASCADE on all FKs (which we just fixed!).
    UPDATE public.users SET id = new.id WHERE email = existing_user.email;
    
    -- Return NULL to cancel the pending INSERT from the trigger (since we updated existing)
    -- Wait, this function is AFTER INSERT on auth.users.
    -- We are inserting into public.users.
    -- Actually, this trigger is usually 'AFTER INSERT ON auth.users'.
    -- So we don't return NULL to cancel the Auth insert.
    -- We just don't do an INSERT into public.users.
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
