-- Fix the handle_new_user trigger to preserve family_unit_id
-- This ensures family relationships are maintained when residents sign up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Check if a user with this email already exists (from admin-created resident)
  SELECT * INTO existing_user FROM public.users WHERE email = new.email;
  
  IF FOUND THEN
    -- Delete the old record (with random UUID from admin creation)
    DELETE FROM public.users WHERE email = new.email;
    
    -- Insert new record with auth user's ID, preserving ALL data including family_unit_id
    INSERT INTO public.users (
      id, 
      email, 
      role, 
      first_name, 
      last_name, 
      phone, 
      profile_picture_url,
      lot_id,
      family_unit_id,
      tenant_id,
      is_tenant_admin,
      invite_token,
      created_at,
      updated_at
    )
    VALUES (
      new.id, -- Use the auth user's ID
      existing_user.email,
      existing_user.role,
      existing_user.first_name,
      existing_user.last_name,
      existing_user.phone,
      existing_user.profile_picture_url,
      existing_user.lot_id,
      existing_user.family_unit_id, -- Preserve family_unit_id
      existing_user.tenant_id,
      existing_user.is_tenant_admin,
      NULL, -- Clear invite token
      existing_user.created_at,
      NOW()
    );
  ELSE
    -- No existing user, create a new one
    INSERT INTO public.users (id, email, role, name)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'role', 'resident'),
      COALESCE(new.raw_user_meta_data->>'name', null)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;
