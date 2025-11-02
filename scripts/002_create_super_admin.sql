-- Create the first super admin user (idempotent - safe to run multiple times)
-- This script creates both the auth user and the public.users record

-- Create auth user with email and password
-- Replace these values with your desired super admin credentials
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
  admin_email text := 'michaelpjedamski@gmail.com'; -- CHANGE THIS
  admin_password text := 'SuperAdmin123!'; -- CHANGE THIS
  admin_name text := 'Super Admin'; -- CHANGE THIS
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Only create if user doesn't exist
  IF existing_user_id IS NULL THEN
    -- Create the auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', admin_name),
      false,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    -- Create the public.users record
    INSERT INTO public.users (id, email, role, name)
    VALUES (new_user_id, admin_email, 'super_admin', admin_name);

    RAISE NOTICE 'Super admin created successfully with email: %', admin_email;
  ELSE
    RAISE NOTICE 'Super admin with email % already exists. Skipping creation.', admin_email;
  END IF;
END $$;
