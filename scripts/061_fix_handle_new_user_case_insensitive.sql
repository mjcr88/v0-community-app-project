-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users ((lower(email)));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user RECORD;
  new_first_name text;
  new_last_name text;
  raw_name text;
BEGIN
  -- Parse name from metadata if present
  raw_name := new.raw_user_meta_data->>'name';
  IF raw_name IS NOT NULL THEN
     -- Simple split on first space
     new_first_name := split_part(raw_name, ' ', 1);
     new_last_name := substring(raw_name from length(new_first_name) + 2);
     -- Handle case where there is no last name
     IF new_last_name = '' THEN new_last_name := NULL; END IF;
  END IF;

  -- Check if a user with this email already exists (from admin-created resident)
  -- Use LOWER() for case-insensitive comparison, ORDER BY for determinism
  SELECT * INTO existing_user 
  FROM public.users 
  WHERE lower(email) = lower(new.email)
  ORDER BY id LIMIT 1;
  
  IF FOUND THEN
    -- MERGE FLOW:
    -- 1. Insert the NEW user record using existing data but NEW ID (from Auth)
    -- We do this FIRST so dependent rows have a valid target to migrate to.
    -- We use ON CONFLICT DO NOTHING just in case, but usually this is a fresh ID.
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
      existing_user.email, -- Preserve original casing preference from DB
      existing_user.role,
      existing_user.first_name,
      existing_user.last_name,
      existing_user.phone,
      existing_user.profile_picture_url,
      existing_user.lot_id,
      existing_user.family_unit_id, -- Preserve link to family
      existing_user.tenant_id,
      existing_user.is_tenant_admin,
      NULL, -- Clear invite token since they have signed up
      existing_user.created_at, -- Preserve original creation date
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- 2. Migrate Foreign Keys 
    -- Update all dependent tables to point to the new User ID instead of the old one.
    -- This avoids deleting data via cascade or manual deletion.
    
    -- Family Relationships (both directions)
    UPDATE public.family_relationships SET user_id = new.id WHERE user_id = existing_user.id;
    UPDATE public.family_relationships SET related_user_id = new.id WHERE related_user_id = existing_user.id;
    
    -- Events
    UPDATE public.events SET created_by = new.id WHERE created_by = existing_user.id;
    
    -- Check-ins
    UPDATE public.check_ins SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- Announcements
    UPDATE public.announcements SET created_by = new.id WHERE created_by = existing_user.id;
    
    -- Listings (Marketplace)
    UPDATE public.listings SET created_by = new.id WHERE created_by = existing_user.id;
    
    -- RSVPs
    UPDATE public.rsvps SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- Saved Events
    UPDATE public.saved_events SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- User Skills (Table: user_skills)
    UPDATE public.user_skills SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- User Interests (Table: user_interests)
    UPDATE public.user_interests SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- Privacy Settings
    UPDATE public.privacy_settings SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- Document Reads
    UPDATE public.document_reads SET user_id = new.id WHERE user_id = existing_user.id;
    
    -- Note: 'neighbor_list_memberships' was mentioned but table status is unconfirmed in this context;
    -- if it exists, uncomment the following line:
    -- UPDATE public.neighbor_list_memberships SET user_id = new.id WHERE user_id = existing_user.id;

    -- 3. Delete the OLD user record
    -- Now safe to delete as no rows should reference it (assuming we caught them all).
    DELETE FROM public.users WHERE id = existing_user.id;

  ELSE
    -- NEW USER FLOW:
    -- No existing user, create a new one with parsed names
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        first_name, 
        last_name, 
        profile_picture_url, 
        created_at, 
        updated_at
    )
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'role', 'resident'),
      COALESCE(new_first_name, new.raw_user_meta_data->>'name'), -- Fallback to raw name if split fails? Or usually just parsed
      new_last_name,
      new.raw_user_meta_data->>'avatar_url',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; 
  END IF;
  
  RETURN new;
END;
$$;
