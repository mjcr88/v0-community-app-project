-- Fix the handle_new_user trigger to handle email conflicts
-- This allows residents created by admins to be properly linked when they sign up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if a user with this email already exists (from admin-created resident)
  IF EXISTS (SELECT 1 FROM public.users WHERE email = new.email) THEN
    -- Update the existing user record to use the new auth user ID
    -- This happens when a resident created by admin signs up
    UPDATE public.users 
    SET 
      id = new.id,
      role = COALESCE(new.raw_user_meta_data->>'role', role),
      name = COALESCE(new.raw_user_meta_data->>'name', name),
      updated_at = NOW()
    WHERE email = new.email;
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
