


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."announcement_priority" AS ENUM (
    'normal',
    'important',
    'urgent'
);


ALTER TYPE "public"."announcement_priority" OWNER TO "postgres";


CREATE TYPE "public"."announcement_status" AS ENUM (
    'draft',
    'published',
    'archived',
    'deleted'
);


ALTER TYPE "public"."announcement_status" OWNER TO "postgres";


CREATE TYPE "public"."announcement_type" AS ENUM (
    'general',
    'emergency',
    'maintenance',
    'event',
    'policy',
    'safety'
);


ALTER TYPE "public"."announcement_type" OWNER TO "postgres";


CREATE TYPE "public"."resident_visibility_scope" AS ENUM (
    'neighborhood',
    'tenant'
);


ALTER TYPE "public"."resident_visibility_scope" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_resident"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
    AS $$
DECLARE
  viewer_role TEXT;
  viewer_tenant_id UUID;
  target_role TEXT;
  target_tenant_id UUID;
  target_lot_id UUID;
  target_neighborhood_id UUID;
  viewer_lot_id UUID;
  viewer_neighborhood_id UUID;
  viewer_family_id UUID;
  target_family_id UUID;
  tenant_scope TEXT;
BEGIN
  -- Get viewer's role, tenant, and family
  SELECT role, tenant_id, family_unit_id INTO viewer_role, viewer_tenant_id, viewer_family_id
  FROM public.users WHERE id = auth.uid();
  
  -- If viewer is super admin or tenant admin, allow
  IF viewer_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Get target user's info
  SELECT role, tenant_id, lot_id, family_unit_id INTO target_role, target_tenant_id, target_lot_id, target_family_id
  FROM public.users WHERE id = target_user_id;
  
  -- If viewer is tenant admin in same tenant, allow
  IF viewer_role = 'tenant_admin' AND viewer_tenant_id = target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewing self, allow
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- 1. Family Check: Always allow viewing members of the same family
  -- IMPORTANT: Must verify tenant match to prevent cross-tenant leakage
  IF viewer_family_id IS NOT NULL 
     AND viewer_family_id = target_family_id 
     AND viewer_tenant_id = target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewer is resident
  IF viewer_role = 'resident' AND target_role = 'resident' AND viewer_tenant_id = target_tenant_id THEN
    -- Get tenant's visibility scope
    SELECT resident_visibility_scope INTO tenant_scope
    FROM public.tenants WHERE id = viewer_tenant_id;
    
    -- If scope is 'tenant', allow viewing all residents in tenant
    IF tenant_scope = 'tenant' THEN
      RETURN TRUE;
    END IF;
    
    -- If scope is 'neighborhood', check if same neighborhood
    IF tenant_scope = 'neighborhood' THEN
      -- Get viewer's neighborhood
      SELECT l.neighborhood_id INTO viewer_neighborhood_id
      FROM public.users u
      INNER JOIN public.lots l ON l.id = u.lot_id
      WHERE u.id = auth.uid();
      
      -- Get target's neighborhood
      SELECT l.neighborhood_id INTO target_neighborhood_id
      FROM public.lots l
      WHERE l.id = target_lot_id;
      
      -- Allow if same neighborhood
      IF viewer_neighborhood_id = target_neighborhood_id THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."can_view_resident"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_view_resident"("target_user_id" "uuid") IS 'Fixed to properly handle neighborhood-based visibility by checking lot neighborhoods directly';



CREATE OR REPLACE FUNCTION "public"."check_event_unflagged"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if there are any remaining flags for this event
  IF NOT EXISTS (SELECT 1 FROM event_flags WHERE event_id = OLD.event_id) THEN
    UPDATE events 
    SET is_flagged = false, 
        flagged_at = NULL
    WHERE id = OLD.event_id;
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."check_event_unflagged"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_exchange_listing_unflagged"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if there are any remaining flags for this listing
  IF NOT EXISTS (SELECT 1 FROM exchange_flags WHERE listing_id = OLD.listing_id) THEN
    UPDATE exchange_listings 
    SET is_flagged = false, 
        flagged_at = NULL
    WHERE id = OLD.listing_id;
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."check_exchange_listing_unflagged"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_action_required_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = p_user_id
      AND action_required = true
      AND action_taken = false
      AND is_archived = false
  );
END;
$$;


ALTER FUNCTION "public"."get_action_required_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_flag_count"("p_event_id" "uuid", "p_tenant_id" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM event_flags
  WHERE event_id = p_event_id
    AND tenant_id = p_tenant_id;
$$;


ALTER FUNCTION "public"."get_event_flag_count"("p_event_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM exchange_flags
  WHERE listing_id = p_listing_id
    AND tenant_id = p_tenant_id;
$$;


ALTER FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") IS 'Get accurate flag count for an exchange listing (bypasses pooler cache)';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = p_user_id
      AND is_read = false
      AND is_archived = false
  );
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "role" "text" NOT NULL,
    "tenant_id" "uuid",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "invited_at" timestamp with time zone,
    "invite_token" "text",
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "birthday" "date",
    "profile_picture_url" "text",
    "birth_country" "text",
    "current_country" "text",
    "languages" "text"[],
    "preferred_language" "text",
    "lot_id" "uuid",
    "family_unit_id" "uuid",
    "journey_stage" "text",
    "estimated_move_in_date" "date",
    "is_tenant_admin" boolean DEFAULT false,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_completed_at" timestamp with time zone,
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "hero_photo" "text",
    "dashboard_stats_config" "jsonb" DEFAULT '[]'::"jsonb",
    "banner_image_url" "text",
    "about" "text",
    "estimated_construction_start_date" "date",
    "estimated_construction_end_date" "date",
    "last_sign_in_at" timestamp with time zone,
    CONSTRAINT "users_about_check" CHECK (("char_length"("about") <= 1000)),
    CONSTRAINT "users_journey_stage_check" CHECK (("journey_stage" = ANY (ARRAY['planning'::"text", 'building'::"text", 'arriving'::"text", 'integrating'::"text"]))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'tenant_admin'::"text", 'resident'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Unified user table containing super_admins, tenant_admins, and residents. Role field determines user type.';



COMMENT ON COLUMN "public"."users"."id" IS 'Primary key. Can be set to auth.users.id for authenticated users, or auto-generated for users created before authentication (e.g., invited residents).';



COMMENT ON COLUMN "public"."users"."role" IS 'User role: super_admin (platform admin), tenant_admin (community admin), or resident (community member)';



COMMENT ON COLUMN "public"."users"."is_tenant_admin" IS 'Flag for residents who also have admin privileges in their tenant';



COMMENT ON COLUMN "public"."users"."photos" IS 'Array of photo URLs for user gallery';



COMMENT ON COLUMN "public"."users"."hero_photo" IS 'URL of the hero/featured photo for this user';



COMMENT ON COLUMN "public"."users"."dashboard_stats_config" IS 'Stores the user-specific configuration for dashboard stats (order, visibility)';



COMMENT ON COLUMN "public"."users"."banner_image_url" IS 'URL to user uploaded banner image (max 5MB, stored in Vercel Blob)';



COMMENT ON COLUMN "public"."users"."about" IS 'Rich text about section (max 1000 characters, supports line breaks and URLs)';



CREATE OR REPLACE FUNCTION "public"."get_user_full_name"("public"."users") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $_$
  SELECT CASE 
    WHEN $1.first_name IS NOT NULL AND $1.last_name IS NOT NULL 
    THEN $1.first_name || ' ' || $1.last_name
    WHEN $1.name IS NOT NULL 
    THEN $1.name
    ELSE $1.email
  END;
$_$;


ALTER FUNCTION "public"."get_user_full_name"("public"."users") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
    AS $$
DECLARE
  existing_user public.users%ROWTYPE;
BEGIN
  -- Check if a user with the same email (case-insensitive) already exists
  -- Use LIMIT 1 to ensure determinism and avoid multi-row errors
  SELECT * INTO existing_user 
  FROM public.users 
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF existing_user.id IS NOT NULL THEN
    -- User exists (created by admin invite). 
    -- Instead of DELETING (which breaks FKs), we UPDATE the existing record
    -- with the new authentication ID and metadata.
    
    UPDATE public.users
    SET 
      id = new.id, -- This might require special handling if ID is FK elsewhere, but usually users.id is the main PK. 
                   -- Update public.users.id is allowed if not referenced by RESTRICT FKs essentially.
                   
      profile_picture_url = COALESCE(new.raw_user_meta_data->>'avatar_url', existing_user.profile_picture_url),
      first_name = COALESCE(new.raw_user_meta_data->>'full_name', existing_user.first_name, split_part(new.email, '@', 1)),
      updated_at = NOW()
     
    WHERE id = existing_user.id;
    
    -- Now we need to update the ID to the new Auth ID. 
    -- We do this in a separate command to be clear.
    -- WARNING: This is the risky part.
    UPDATE public.users SET id = new.id WHERE email = existing_user.email; -- using email as key since we know it's unique-ish here
    
    -- Cancel the pending INSERT operation because we 'recycled' the existing row
    RETURN NULL;
    
  ELSE
    -- No existing user, proceed with normal insert
    -- Use COALESCE for name fallbacks as requested
    RETURN NEW; 
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_sign_in"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_sign_in"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_user_flagged_event"("p_event_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM event_flags
    WHERE event_id = p_event_id
      AND flagged_by = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;


ALTER FUNCTION "public"."has_user_flagged_event"("p_event_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM exchange_flags
    WHERE listing_id = p_listing_id
      AND flagged_by = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;


ALTER FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") IS 'Check if a user has flagged an exchange listing';



CREATE OR REPLACE FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) < NOW();
END;
$$;


ALTER FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) IS 'Returns true if check-in has passed its end time (start_time + duration_minutes)';



CREATE OR REPLACE FUNCTION "public"."is_resident_of_tenant"("check_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
    AS $$
DECLARE
  is_auth_resident BOOLEAN;
BEGIN
  -- Check if the current user is a resident of the specific tenant
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'resident'
    AND tenant_id = check_tenant_id
  ) INTO is_auth_resident;
  
  RETURN is_auth_resident;
END;
$$;


ALTER FUNCTION "public"."is_resident_of_tenant"("check_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
    AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the current user is a tenant_admin of the specific tenant
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'tenant_admin'
    AND tenant_id = check_tenant_id
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;


ALTER FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_event_flagged"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE events 
  SET is_flagged = true, 
      flagged_at = now()
  WHERE id = NEW.event_id 
    AND is_flagged = false;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_event_flagged"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_exchange_listing_flagged"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE exchange_listings 
  SET is_flagged = true, 
      flagged_at = now()
  WHERE id = NEW.listing_id 
    AND is_flagged = false;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_exchange_listing_flagged"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE exchange_listings
  SET 
    is_flagged = p_is_flagged,
    flagged_at = CASE 
      WHEN p_is_flagged THEN NOW() 
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE id = p_listing_id 
    AND tenant_id = p_tenant_id;
END;
$$;


ALTER FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) IS 'Updates the is_flagged and flagged_at columns on exchange_listings. Uses SECURITY DEFINER to bypass RLS policies that would otherwise prevent non-creators from updating these flag-related columns.';



CREATE OR REPLACE FUNCTION "public"."update_exchange_listings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_exchange_listings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_exchange_transactions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_exchange_transactions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resident_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resident_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_privacy_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_privacy_settings_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."check_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text",
    "location_type" "text",
    "location_id" "uuid",
    "custom_location_name" "text",
    "custom_location_coordinates" "jsonb",
    "custom_location_type" "text",
    "start_time" timestamp with time zone NOT NULL,
    "duration_minutes" integer NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "ended_at" timestamp with time zone,
    "visibility_scope" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_ins_custom_location_type_check" CHECK (("custom_location_type" = ANY (ARRAY['marker'::"text", 'polygon'::"text", 'polyline'::"text"]))),
    CONSTRAINT "check_ins_duration_minutes_check" CHECK ((("duration_minutes" >= 30) AND ("duration_minutes" <= 480))),
    CONSTRAINT "check_ins_location_type_check" CHECK (("location_type" = ANY (ARRAY['community_location'::"text", 'custom_temporary'::"text"]))),
    CONSTRAINT "check_ins_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'ended'::"text"]))),
    CONSTRAINT "check_ins_visibility_scope_check" CHECK (("visibility_scope" = ANY (ARRAY['community'::"text", 'neighborhood'::"text", 'private'::"text"]))),
    CONSTRAINT "future_start_buffer" CHECK (("start_time" <= ("now"() + '01:00:00'::interval))),
    CONSTRAINT "valid_location" CHECK (((("location_type" = 'community_location'::"text") AND ("location_id" IS NOT NULL)) OR (("location_type" = 'custom_temporary'::"text") AND ("custom_location_name" IS NOT NULL) AND ("custom_location_coordinates" IS NOT NULL))))
);


ALTER TABLE "public"."check_ins" OWNER TO "postgres";


COMMENT ON TABLE "public"."check_ins" IS 'Spontaneous location-based check-ins for real-time community engagement';



COMMENT ON COLUMN "public"."check_ins"."activity_type" IS 'Type of activity: coffee, working, socializing, exercise, games, meal, relaxing, other';



COMMENT ON COLUMN "public"."check_ins"."start_time" IS 'When the check-in starts, can be up to 1 hour in the future';



COMMENT ON COLUMN "public"."check_ins"."duration_minutes" IS 'Duration in minutes (30-480), adjustable in 30-minute increments';



COMMENT ON COLUMN "public"."check_ins"."status" IS 'active: currently active, ended: manually ended by creator';



CREATE OR REPLACE VIEW "public"."active_check_ins" AS
 SELECT "id",
    "tenant_id",
    "created_by",
    "title",
    "activity_type",
    "description",
    "location_type",
    "location_id",
    "custom_location_name",
    "custom_location_coordinates",
    "custom_location_type",
    "start_time",
    "duration_minutes",
    "status",
    "ended_at",
    "visibility_scope",
    "created_at",
    "updated_at"
   FROM "public"."check_ins"
  WHERE (("status" = 'active'::"text") AND (NOT "public"."is_check_in_expired"("start_time", "duration_minutes")));


ALTER VIEW "public"."active_check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcement_neighborhoods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "announcement_id" "uuid" NOT NULL,
    "neighborhood_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcement_neighborhoods" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcement_neighborhoods" IS 'Maps announcements to specific neighborhoods for targeted distribution';



CREATE TABLE IF NOT EXISTS "public"."announcement_reads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "announcement_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcement_reads" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcement_reads" IS 'Tracks which users have read which announcements';



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "announcement_type" "public"."announcement_type" DEFAULT 'general'::"public"."announcement_type" NOT NULL,
    "priority" "public"."announcement_priority" DEFAULT 'normal'::"public"."announcement_priority" NOT NULL,
    "status" "public"."announcement_status" DEFAULT 'draft'::"public"."announcement_status" NOT NULL,
    "event_id" "uuid",
    "location_type" "text",
    "location_id" "uuid",
    "custom_location_name" "text",
    "custom_location_lat" double precision,
    "custom_location_lng" double precision,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "auto_archive_date" timestamp with time zone,
    "published_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "last_edited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_location" CHECK ((("location_type" IS NULL) OR (("location_type" = 'community_location'::"text") AND ("location_id" IS NOT NULL)) OR (("location_type" = 'custom_temporary'::"text") AND ("custom_location_name" IS NOT NULL) AND ("custom_location_lat" IS NOT NULL) AND ("custom_location_lng" IS NOT NULL))))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcements" IS 'Stores community announcements created by tenant admins';



COMMENT ON COLUMN "public"."announcements"."auto_archive_date" IS 'Optional date when announcement should automatically be archived';



COMMENT ON COLUMN "public"."announcements"."last_edited_at" IS 'Timestamp of last edit after initial publish (used to show "Updated" indicator)';



CREATE TABLE IF NOT EXISTS "public"."check_in_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_in_id" "uuid" NOT NULL,
    "invitee_id" "uuid",
    "family_unit_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "check_in_invites_check" CHECK ((("invitee_id" IS NOT NULL) OR ("family_unit_id" IS NOT NULL)))
);


ALTER TABLE "public"."check_in_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."check_in_invites" IS 'Defines who is invited to private check-ins';



CREATE TABLE IF NOT EXISTS "public"."check_in_neighborhoods" (
    "check_in_id" "uuid" NOT NULL,
    "neighborhood_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."check_in_neighborhoods" OWNER TO "postgres";


COMMENT ON TABLE "public"."check_in_neighborhoods" IS 'Defines which neighborhoods can see neighborhood-scoped check-ins';



CREATE TABLE IF NOT EXISTS "public"."check_in_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_in_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "rsvp_status" "text" NOT NULL,
    "attending_count" integer DEFAULT 1,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_in_rsvps_attending_count_check" CHECK (("attending_count" >= 0)),
    CONSTRAINT "check_in_rsvps_rsvp_status_check" CHECK (("rsvp_status" = ANY (ARRAY['yes'::"text", 'maybe'::"text", 'no'::"text"])))
);


ALTER TABLE "public"."check_in_rsvps" OWNER TO "postgres";


COMMENT ON TABLE "public"."check_in_rsvps" IS 'RSVP responses for check-ins (yes=coming, maybe, no=not coming)';



COMMENT ON COLUMN "public"."check_in_rsvps"."rsvp_status" IS 'yes: coming to join, maybe: might come, no: not coming';



COMMENT ON COLUMN "public"."check_in_rsvps"."attending_count" IS 'Number of people attending (including family members)';



CREATE TABLE IF NOT EXISTS "public"."document_changelog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "change_summary" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_changelog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_reads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "cover_image_url" "text",
    "file_url" "text",
    "document_type" "text",
    "category" "text",
    "is_featured" boolean DEFAULT false,
    "status" "text" DEFAULT 'published'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "documents_category_check" CHECK (("category" = ANY (ARRAY['regulation'::"text", 'financial'::"text", 'construction'::"text", 'hoa'::"text"]))),
    CONSTRAINT "documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['page'::"text", 'pdf'::"text"]))),
    CONSTRAINT "documents_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_categories" IS 'Event categories with default seeds: Social, Maintenance, Educational, Sports, Community Meeting, Celebration';



COMMENT ON COLUMN "public"."event_categories"."icon" IS 'Lucide icon name for category display';



CREATE TABLE IF NOT EXISTS "public"."event_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "flagged_by" "uuid" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."event_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_flags" IS 'Residents can flag events for admin review';



CREATE TABLE IF NOT EXISTS "public"."event_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "is_hero" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_images" IS 'Event images with hero image selection (max 5 per event)';



COMMENT ON COLUMN "public"."event_images"."is_hero" IS 'Primary image displayed prominently on event details';



CREATE TABLE IF NOT EXISTS "public"."event_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "invitee_id" "uuid",
    "family_unit_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invite_target_required" CHECK (((("invitee_id" IS NOT NULL) AND ("family_unit_id" IS NULL)) OR (("invitee_id" IS NULL) AND ("family_unit_id" IS NOT NULL))))
);


ALTER TABLE "public"."event_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_invites" IS 'Junction table for private event invitations (individual users or entire families)';



CREATE TABLE IF NOT EXISTS "public"."event_neighborhoods" (
    "event_id" "uuid" NOT NULL,
    "neighborhood_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_neighborhoods" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_neighborhoods" IS 'Junction table linking events to neighborhoods for neighborhood-scoped visibility';



CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rsvp_status" "text" NOT NULL,
    "attending_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "event_rsvps_attending_count_check" CHECK (("attending_count" >= 0)),
    CONSTRAINT "event_rsvps_rsvp_status_check" CHECK (("rsvp_status" = ANY (ARRAY['yes'::"text", 'maybe'::"text", 'no'::"text"])))
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_rsvps" IS 'Event RSVP responses with family member attendance tracking';



COMMENT ON COLUMN "public"."event_rsvps"."attending_count" IS 'Number of family members attending (including the user)';



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "additional_notes" "text",
    "category_id" "uuid",
    "external_url" "text",
    "event_type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "is_flagged" boolean DEFAULT false,
    "flagged_at" timestamp with time zone,
    "cancellation_reason" "text",
    "cancelled_at" timestamp with time zone,
    "start_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_date" "date",
    "end_time" time without time zone,
    "is_all_day" boolean DEFAULT false,
    "location_type" "text",
    "location_id" "uuid",
    "custom_location_name" "text",
    "custom_location_coordinates" "jsonb",
    "custom_location_type" "text",
    "requires_rsvp" boolean DEFAULT false,
    "rsvp_deadline" timestamp with time zone,
    "max_attendees" integer,
    "visibility_scope" "text" DEFAULT 'community'::"text" NOT NULL,
    "hide_creator_contact" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cancelled_by" "uuid",
    "parent_event_id" "uuid",
    "recurrence_rule" "jsonb",
    CONSTRAINT "events_custom_location_type_check" CHECK (("custom_location_type" = ANY (ARRAY['marker'::"text", 'polygon'::"text", 'polyline'::"text"]))),
    CONSTRAINT "events_event_type_check" CHECK (("event_type" = ANY (ARRAY['resident'::"text", 'official'::"text"]))),
    CONSTRAINT "events_location_type_check" CHECK (("location_type" = ANY (ARRAY['community_location'::"text", 'custom_temporary'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "events_visibility_scope_check" CHECK (("visibility_scope" = ANY (ARRAY['community'::"text", 'neighborhood'::"text", 'private'::"text"]))),
    CONSTRAINT "valid_location_community" CHECK (((("location_type" = 'community_location'::"text") AND ("location_id" IS NOT NULL)) OR (("location_type" = 'custom_temporary'::"text") AND ("custom_location_name" IS NOT NULL)) OR ("location_type" IS NULL))),
    CONSTRAINT "valid_rsvp_settings" CHECK ((("requires_rsvp" = false) OR (("requires_rsvp" = true) AND ("rsvp_deadline" IS NOT NULL))))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Community events with flexible visibility and RSVP management';



COMMENT ON COLUMN "public"."events"."event_type" IS 'resident = created by residents, official = marked as official community event';



COMMENT ON COLUMN "public"."events"."visibility_scope" IS 'community = all residents, neighborhood = specific neighborhoods, private = invited only';



COMMENT ON COLUMN "public"."events"."cancelled_by" IS 'User who cancelled the event (admin or creator)';



CREATE TABLE IF NOT EXISTS "public"."exchange_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exchange_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_categories" IS 'Hard-coded categories for exchange listings';



CREATE TABLE IF NOT EXISTS "public"."exchange_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "flagged_by" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exchange_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_flags" IS 'Residents can flag exchange listings for admin review';



CREATE TABLE IF NOT EXISTS "public"."exchange_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "is_hero" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exchange_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_images" IS 'Images for exchange listings (up to 5 per listing)';



COMMENT ON COLUMN "public"."exchange_images"."is_hero" IS 'First image is hero by default, can be changed by creator';



COMMENT ON COLUMN "public"."exchange_images"."display_order" IS 'Order of images in gallery';



CREATE TABLE IF NOT EXISTS "public"."exchange_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "is_available" boolean DEFAULT true,
    "pricing_type" "text" DEFAULT 'free'::"text" NOT NULL,
    "price" numeric(10,2),
    "condition" "text",
    "available_quantity" integer DEFAULT 1,
    "location_id" "uuid",
    "custom_location_name" "text",
    "custom_location_lat" numeric(10,8),
    "custom_location_lng" numeric(11,8),
    "custom_location_address" "text",
    "visibility_scope" "text" DEFAULT 'community'::"text" NOT NULL,
    "is_flagged" boolean DEFAULT false,
    "flagged_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "hero_photo" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    CONSTRAINT "exchange_listings_condition_check" CHECK (("condition" = ANY (ARRAY['new'::"text", 'slightly_used'::"text", 'used'::"text", 'slightly_damaged'::"text", 'maintenance'::"text"]))),
    CONSTRAINT "exchange_listings_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['free'::"text", 'fixed_price'::"text", 'pay_what_you_want'::"text"]))),
    CONSTRAINT "exchange_listings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'paused'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "exchange_listings_visibility_scope_check" CHECK (("visibility_scope" = ANY (ARRAY['community'::"text", 'neighborhood'::"text"])))
);


ALTER TABLE "public"."exchange_listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_listings" IS 'Main exchange listings table for community item/service sharing';



COMMENT ON COLUMN "public"."exchange_listings"."description" IS 'Optional detailed description of the listing';



COMMENT ON COLUMN "public"."exchange_listings"."status" IS 'draft, published, paused, or cancelled';



COMMENT ON COLUMN "public"."exchange_listings"."pricing_type" IS 'free, fixed_price, or pay_what_you_want';



COMMENT ON COLUMN "public"."exchange_listings"."condition" IS 'Item condition for Tools & Equipment category';



COMMENT ON COLUMN "public"."exchange_listings"."available_quantity" IS 'Available quantity for Food & Produce and Services';



COMMENT ON COLUMN "public"."exchange_listings"."visibility_scope" IS 'community-wide or neighborhood-only';



COMMENT ON COLUMN "public"."exchange_listings"."photos" IS 'Array of photo URLs uploaded to Vercel Blob';



COMMENT ON COLUMN "public"."exchange_listings"."hero_photo" IS 'Primary photo URL to display in listings';



COMMENT ON COLUMN "public"."exchange_listings"."archived_at" IS 'Timestamp when listing was archived (manually or cancelled)';



COMMENT ON COLUMN "public"."exchange_listings"."archived_by" IS 'User who archived the listing';



CREATE TABLE IF NOT EXISTS "public"."exchange_neighborhoods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "neighborhood_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exchange_neighborhoods" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_neighborhoods" IS 'Junction table linking exchange listings to neighborhoods for neighborhood-only visibility';



CREATE TABLE IF NOT EXISTS "public"."exchange_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "lender_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "proposed_pickup_date" timestamp with time zone,
    "proposed_return_date" timestamp with time zone,
    "confirmed_pickup_date" timestamp with time zone,
    "expected_return_date" timestamp with time zone,
    "actual_pickup_date" timestamp with time zone,
    "actual_return_date" timestamp with time zone,
    "borrower_message" "text",
    "lender_message" "text",
    "rejection_reason" "text",
    "extension_requested" boolean DEFAULT false,
    "extension_new_date" timestamp with time zone,
    "extension_message" "text",
    "return_condition" "text",
    "return_notes" "text",
    "return_damage_photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "exchange_transactions_return_condition_check" CHECK (("return_condition" = ANY (ARRAY['good'::"text", 'minor_wear'::"text", 'damaged'::"text", 'broken'::"text"]))),
    CONSTRAINT "exchange_transactions_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'rejected'::"text", 'confirmed'::"text", 'picked_up'::"text", 'returned'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."exchange_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_transactions" IS 'Tracks borrowing/lending transactions from request to completion';



COMMENT ON COLUMN "public"."exchange_transactions"."borrower_id" IS 'The person requesting/borrowing';



COMMENT ON COLUMN "public"."exchange_transactions"."lender_id" IS 'The listing creator (person lending/offering)';



COMMENT ON COLUMN "public"."exchange_transactions"."status" IS 'requested → rejected/confirmed → picked_up → returned → completed';



CREATE TABLE IF NOT EXISTS "public"."family_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "related_user_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."family_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "primary_contact_id" "uuid",
    "profile_picture_url" "text",
    "description" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "hero_photo" "text",
    "banner_image_url" "text"
);


ALTER TABLE "public"."family_units" OWNER TO "postgres";


COMMENT ON COLUMN "public"."family_units"."profile_picture_url" IS 'URL to the family profile picture stored in Blob storage';



COMMENT ON COLUMN "public"."family_units"."description" IS 'Family description or bio written by the primary contact';



COMMENT ON COLUMN "public"."family_units"."photos" IS 'Array of photo URLs for family gallery';



COMMENT ON COLUMN "public"."family_units"."hero_photo" IS 'URL of the hero/featured photo for this family';



CREATE TABLE IF NOT EXISTS "public"."interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "coordinates" "jsonb",
    "boundary_coordinates" "jsonb",
    "path_coordinates" "jsonb",
    "facility_type" "text",
    "hours" "text",
    "icon" "text",
    "path_surface" "text",
    "path_difficulty" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "lot_id" "uuid",
    "neighborhood_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'Open'::"text",
    "capacity" integer,
    "amenities" "text"[],
    "accessibility_features" "text",
    "max_occupancy" integer,
    "parking_spaces" integer,
    "rules" "text",
    "path_length" "text",
    "elevation_gain" "text",
    "hero_photo" "text",
    "is_reservable" boolean DEFAULT false,
    CONSTRAINT "locations_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'Closed'::"text", 'Maintenance'::"text", 'Coming Soon'::"text", 'Temporarily Unavailable'::"text"]))),
    CONSTRAINT "valid_location_type" CHECK (("type" = ANY (ARRAY['facility'::"text", 'lot'::"text", 'walking_path'::"text", 'neighborhood'::"text", 'boundary'::"text", 'protection_zone'::"text", 'easement'::"text", 'playground'::"text", 'public_street'::"text", 'green_area'::"text", 'recreational_zone'::"text"]))),
    CONSTRAINT "valid_path_difficulty" CHECK ((("path_difficulty" IS NULL) OR ("path_difficulty" = ANY (ARRAY['easy'::"text", 'moderate'::"text", 'difficult'::"text"])))),
    CONSTRAINT "valid_path_surface" CHECK ((("path_surface" IS NULL) OR ("path_surface" = ANY (ARRAY['paved'::"text", 'gravel'::"text", 'dirt'::"text", 'natural'::"text"]))))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."locations" IS 'Stores map locations including facilities, lot boundaries, and walking paths';



COMMENT ON COLUMN "public"."locations"."type" IS 'Type of location: facility (point), lot (polygon), walking_path (linestring), neighborhood (polygon), boundary (polygon), protection_zone (polygon), easement (polygon), playground (point/polygon), public_street (linestring), green_area (polygon), or recreational_zone (polygon)';



COMMENT ON COLUMN "public"."locations"."coordinates" IS 'Single point coordinates for facilities: {"lat": number, "lng": number}';



COMMENT ON COLUMN "public"."locations"."boundary_coordinates" IS 'Polygon coordinates for lots: array of {"lat", "lng"} objects';



COMMENT ON COLUMN "public"."locations"."path_coordinates" IS 'LineString coordinates for walking paths: array of {"lat", "lng"} objects';



COMMENT ON COLUMN "public"."locations"."photos" IS 'Array of Vercel Blob URLs for location photos';



COMMENT ON COLUMN "public"."locations"."hero_photo" IS 'URL of the hero/featured photo for this location';



CREATE TABLE IF NOT EXISTS "public"."lots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "neighborhood_id" "uuid" NOT NULL,
    "lot_number" "text" NOT NULL,
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    "location_id" "uuid"
);


ALTER TABLE "public"."lots" OWNER TO "postgres";


COMMENT ON COLUMN "public"."lots"."location_id" IS 'Reference to the location record that contains the lot boundary coordinates';



CREATE TABLE IF NOT EXISTS "public"."neighbor_list_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "neighbor_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "added_by" "uuid" NOT NULL
);


ALTER TABLE "public"."neighbor_list_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."neighbor_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "emoji" character varying(10) DEFAULT '📝'::character varying NOT NULL,
    "description" "text",
    "is_shared" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."neighbor_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."neighborhoods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "location_id" "uuid",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "hero_photo" "text"
);


ALTER TABLE "public"."neighborhoods" OWNER TO "postgres";


COMMENT ON COLUMN "public"."neighborhoods"."location_id" IS 'Reference to the location record that contains the neighborhood boundary coordinates';



COMMENT ON COLUMN "public"."neighborhoods"."photos" IS 'Array of photo URLs for neighborhood gallery';



COMMENT ON COLUMN "public"."neighborhoods"."hero_photo" IS 'URL of the hero/featured photo for this neighborhood';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "action_required" boolean DEFAULT false NOT NULL,
    "action_taken" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "exchange_transaction_id" "uuid",
    "exchange_listing_id" "uuid",
    "event_id" "uuid",
    "check_in_id" "uuid",
    "actor_id" "uuid",
    "action_url" "text",
    "metadata" "jsonb",
    "action_response" "text",
    "document_id" "uuid",
    CONSTRAINT "notifications_action_response_check" CHECK (("action_response" = ANY (ARRAY['confirmed'::"text", 'rejected'::"text", 'approved'::"text", 'declined'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Unified notifications table for all platform notifications';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification type discriminator: exchange_request, exchange_confirmed, event_invite, etc.';



COMMENT ON COLUMN "public"."notifications"."action_required" IS 'True if notification requires user action (e.g., approve/reject)';



COMMENT ON COLUMN "public"."notifications"."action_taken" IS 'True if user has responded to action_required notification';



COMMENT ON COLUMN "public"."notifications"."actor_id" IS 'User who triggered this notification (e.g., who sent the request)';



COMMENT ON COLUMN "public"."notifications"."action_response" IS 'Response to the action required notification (confirmed, rejected, approved, declined, accepted)';



CREATE TABLE IF NOT EXISTS "public"."pets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_unit_id" "uuid",
    "lot_id" "uuid",
    "name" "text" NOT NULL,
    "species" "text" NOT NULL,
    "breed" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_picture_url" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "hero_photo" "text"
);


ALTER TABLE "public"."pets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pets"."profile_picture_url" IS 'URL to the pet profile picture stored in Blob storage';



COMMENT ON COLUMN "public"."pets"."photos" IS 'Array of photo URLs for pet gallery';



COMMENT ON COLUMN "public"."pets"."hero_photo" IS 'URL of the hero/featured photo for this pet';



CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "notes" "text",
    CONSTRAINT "reservations_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'cancelled'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resident_interests" (
    "resident_id" "uuid" NOT NULL,
    "interest_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resident_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resident_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "request_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "location_type" "text",
    "location_id" "uuid",
    "custom_location_name" "text",
    "custom_location_lat" double precision,
    "custom_location_lng" double precision,
    "is_anonymous" boolean DEFAULT false,
    "images" "text"[],
    "admin_reply" "text",
    "admin_internal_notes" "text",
    "rejection_reason" "text",
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "first_reply_at" timestamp with time zone,
    "tagged_resident_ids" "uuid"[],
    "tagged_pet_ids" "uuid"[],
    "original_submitter_id" "uuid",
    CONSTRAINT "resident_requests_location_type_check" CHECK (("location_type" = ANY (ARRAY['community'::"text", 'custom'::"text"]))),
    CONSTRAINT "resident_requests_priority_check" CHECK (("priority" = ANY (ARRAY['normal'::"text", 'urgent'::"text", 'emergency'::"text"]))),
    CONSTRAINT "resident_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['maintenance'::"text", 'question'::"text", 'complaint'::"text", 'safety'::"text", 'account_access'::"text", 'other'::"text"]))),
    CONSTRAINT "resident_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'resolved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."resident_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."resident_requests" IS 'Tracks resident requests (maintenance, questions, complaints, etc.) to community admins';



COMMENT ON COLUMN "public"."resident_requests"."created_by" IS 'NULL if request is anonymous';



COMMENT ON COLUMN "public"."resident_requests"."status" IS 'pending → in_progress → resolved/rejected';



COMMENT ON COLUMN "public"."resident_requests"."admin_reply" IS 'External message sent to resident';



COMMENT ON COLUMN "public"."resident_requests"."admin_internal_notes" IS 'Private notes for admin use only';



COMMENT ON COLUMN "public"."resident_requests"."tagged_resident_ids" IS 'Array of user IDs tagged in the request (for complaints about residents)';



COMMENT ON COLUMN "public"."resident_requests"."tagged_pet_ids" IS 'Array of pet IDs tagged in the request (for complaints about pets)';



COMMENT ON COLUMN "public"."resident_requests"."original_submitter_id" IS 'Always stores the actual submitter, even for anonymous requests (visible to admins only)';



CREATE TABLE IF NOT EXISTS "public"."resident_skills" (
    "resident_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "open_to_requests" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resident_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."residents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lot_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "family_unit_id" "uuid",
    "journey_stage" "text",
    "birthday" "date",
    "birth_country" "text",
    "current_country" "text",
    "languages" "text"[],
    "preferred_language" "text",
    "estimated_move_in_date" "date",
    "profile_picture_url" "text",
    "onboarding_completed" boolean DEFAULT false,
    "invited_at" timestamp with time zone,
    "invite_token" "text",
    "is_admin" boolean DEFAULT false,
    "tenant_id" "uuid",
    "auth_user_id" "uuid",
    "migrated_to_user_id" "uuid",
    CONSTRAINT "residents_journey_stage_check" CHECK (("journey_stage" = ANY (ARRAY['planning'::"text", 'building'::"text", 'arriving'::"text", 'integrating'::"text"])))
);


ALTER TABLE "public"."residents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."residents"."migrated_to_user_id" IS 'Tracks which user record this resident was migrated to. Used for rollback if needed.';



CREATE TABLE IF NOT EXISTS "public"."saved_events" (
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."saved_events" IS 'Users can save events to their personal calendar';



CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "max_neighborhoods" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_admin_id" "uuid",
    "features" "jsonb" DEFAULT '{"lots": true, "pets": true, "skills": true, "families": true, "interests": true, "onboarding": true, "neighborhoods": true, "journey_stages": true}'::"jsonb",
    "resident_visibility_scope" "public"."resident_visibility_scope" DEFAULT 'tenant'::"public"."resident_visibility_scope",
    "map_center_coordinates" "jsonb",
    "map_default_zoom" integer DEFAULT 15,
    "map_boundary_coordinates" "jsonb",
    "events_enabled" boolean DEFAULT false,
    "checkins_enabled" boolean DEFAULT false,
    "exchange_enabled" boolean DEFAULT false,
    "requests_enabled" boolean DEFAULT true,
    "announcements_enabled" boolean DEFAULT true NOT NULL,
    "documents_enabled" boolean DEFAULT true,
    "neighbor_lists_enabled" boolean DEFAULT true,
    "reservations_enabled" boolean DEFAULT true
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tenants"."resident_visibility_scope" IS 'Controls whether residents can view all residents in tenant or only in their neighborhood';



COMMENT ON COLUMN "public"."tenants"."map_center_coordinates" IS 'Default center point for community map as JSON object with lat and lng';



COMMENT ON COLUMN "public"."tenants"."map_default_zoom" IS 'Default zoom level for community map (1-22)';



COMMENT ON COLUMN "public"."tenants"."map_boundary_coordinates" IS 'Polygon boundary of the entire community as array of coordinate objects';



COMMENT ON COLUMN "public"."tenants"."events_enabled" IS 'Enable/disable events feature for this tenant';



COMMENT ON COLUMN "public"."tenants"."checkins_enabled" IS 'Enable check-ins feature for this tenant';



COMMENT ON COLUMN "public"."tenants"."exchange_enabled" IS 'Enable/disable exchange directory feature for this tenant';



COMMENT ON COLUMN "public"."tenants"."requests_enabled" IS 'Enable/disable resident requests feature for this tenant';



COMMENT ON COLUMN "public"."tenants"."announcements_enabled" IS 'Feature flag to enable/disable announcements for this tenant';



COMMENT ON COLUMN "public"."tenants"."documents_enabled" IS 'Controls whether the Documents Library feature is enabled for this tenant';



COMMENT ON COLUMN "public"."tenants"."neighbor_lists_enabled" IS 'Controls whether the Neighbor Lists feature is enabled for this tenant';



CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "user_id" "uuid" NOT NULL,
    "interest_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_interests" IS 'Junction table linking users to their interests';



CREATE TABLE IF NOT EXISTS "public"."user_privacy_settings" (
    "user_id" "uuid" NOT NULL,
    "show_profile_picture" boolean DEFAULT true,
    "show_phone" boolean DEFAULT true,
    "show_birthday" boolean DEFAULT true,
    "show_birth_country" boolean DEFAULT true,
    "show_current_country" boolean DEFAULT true,
    "show_languages" boolean DEFAULT true,
    "show_journey_stage" boolean DEFAULT true,
    "show_estimated_move_in_date" boolean DEFAULT true,
    "show_interests" boolean DEFAULT true,
    "show_skills" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "show_email" boolean DEFAULT true,
    "show_preferred_language" boolean DEFAULT true,
    "show_neighborhood" boolean DEFAULT true,
    "show_family" boolean DEFAULT true,
    "show_family_relationships" boolean DEFAULT true,
    "show_open_to_requests" boolean DEFAULT true,
    "show_on_map" boolean DEFAULT false,
    "show_check_ins_on_map" boolean DEFAULT false,
    "show_construction_dates" boolean DEFAULT true
);


ALTER TABLE "public"."user_privacy_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_privacy_settings" IS 'Privacy settings for users to control what information is visible to other residents';



COMMENT ON COLUMN "public"."user_privacy_settings"."show_on_map" IS 'Whether user location is visible on community map (default: false)';



COMMENT ON COLUMN "public"."user_privacy_settings"."show_check_ins_on_map" IS 'Whether user check-ins are visible to others (default: false)';



CREATE TABLE IF NOT EXISTS "public"."user_skills" (
    "user_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "open_to_requests" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_skills" IS 'Junction table linking users to their skills, with optional help availability';



ALTER TABLE ONLY "public"."announcement_neighborhoods"
    ADD CONSTRAINT "announcement_neighborhoods_announcement_id_neighborhood_id_key" UNIQUE ("announcement_id", "neighborhood_id");



ALTER TABLE ONLY "public"."announcement_neighborhoods"
    ADD CONSTRAINT "announcement_neighborhoods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_announcement_id_user_id_key" UNIQUE ("announcement_id", "user_id");



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_in_invites"
    ADD CONSTRAINT "check_in_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_in_neighborhoods"
    ADD CONSTRAINT "check_in_neighborhoods_pkey" PRIMARY KEY ("check_in_id", "neighborhood_id");



ALTER TABLE ONLY "public"."check_in_rsvps"
    ADD CONSTRAINT "check_in_rsvps_check_in_id_user_id_key" UNIQUE ("check_in_id", "user_id");



ALTER TABLE ONLY "public"."check_in_rsvps"
    ADD CONSTRAINT "check_in_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_changelog"
    ADD CONSTRAINT "document_changelog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_reads"
    ADD CONSTRAINT "document_reads_document_id_user_id_key" UNIQUE ("document_id", "user_id");



ALTER TABLE ONLY "public"."document_reads"
    ADD CONSTRAINT "document_reads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_flags"
    ADD CONSTRAINT "event_flags_event_id_flagged_by_key" UNIQUE ("event_id", "flagged_by");



ALTER TABLE ONLY "public"."event_flags"
    ADD CONSTRAINT "event_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_images"
    ADD CONSTRAINT "event_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_event_id_invitee_id_family_unit_id_key" UNIQUE ("event_id", "invitee_id", "family_unit_id");



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_neighborhoods"
    ADD CONSTRAINT "event_neighborhoods_pkey" PRIMARY KEY ("event_id", "neighborhood_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_categories"
    ADD CONSTRAINT "exchange_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_categories"
    ADD CONSTRAINT "exchange_categories_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."exchange_flags"
    ADD CONSTRAINT "exchange_flags_listing_id_flagged_by_key" UNIQUE ("listing_id", "flagged_by");



ALTER TABLE ONLY "public"."exchange_flags"
    ADD CONSTRAINT "exchange_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_images"
    ADD CONSTRAINT "exchange_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_neighborhoods"
    ADD CONSTRAINT "exchange_neighborhoods_listing_id_neighborhood_id_key" UNIQUE ("listing_id", "neighborhood_id");



ALTER TABLE ONLY "public"."exchange_neighborhoods"
    ADD CONSTRAINT "exchange_neighborhoods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_transactions"
    ADD CONSTRAINT "exchange_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_relationships"
    ADD CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_units"
    ADD CONSTRAINT "family_units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_neighborhood_id_lot_number_key" UNIQUE ("neighborhood_id", "lot_number");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."neighbor_list_members"
    ADD CONSTRAINT "neighbor_list_members_list_id_neighbor_id_key" UNIQUE ("list_id", "neighbor_id");



ALTER TABLE ONLY "public"."neighbor_list_members"
    ADD CONSTRAINT "neighbor_list_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."neighbor_lists"
    ADD CONSTRAINT "neighbor_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."neighborhoods"
    ADD CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."neighborhoods"
    ADD CONSTRAINT "neighborhoods_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pets"
    ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resident_interests"
    ADD CONSTRAINT "resident_interests_pkey" PRIMARY KEY ("resident_id", "interest_id");



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resident_skills"
    ADD CONSTRAINT "resident_skills_pkey" PRIMARY KEY ("resident_id", "skill_id");



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_events"
    ADD CONSTRAINT "saved_events_pkey" PRIMARY KEY ("user_id", "event_id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "unique_category_per_tenant" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."family_relationships"
    ADD CONSTRAINT "unique_user_relationship" UNIQUE ("user_id", "related_user_id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("user_id", "interest_id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_pkey" PRIMARY KEY ("user_id", "skill_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_announcement_neighborhoods_announcement_id" ON "public"."announcement_neighborhoods" USING "btree" ("announcement_id");



CREATE INDEX "idx_announcement_neighborhoods_neighborhood_id" ON "public"."announcement_neighborhoods" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_announcement_reads_announcement_id" ON "public"."announcement_reads" USING "btree" ("announcement_id");



CREATE INDEX "idx_announcement_reads_user_id" ON "public"."announcement_reads" USING "btree" ("user_id");



CREATE INDEX "idx_announcements_auto_archive_date" ON "public"."announcements" USING "btree" ("auto_archive_date");



CREATE INDEX "idx_announcements_created_by" ON "public"."announcements" USING "btree" ("created_by");



CREATE INDEX "idx_announcements_published_at" ON "public"."announcements" USING "btree" ("published_at");



CREATE INDEX "idx_announcements_status" ON "public"."announcements" USING "btree" ("status");



CREATE INDEX "idx_announcements_tenant_id" ON "public"."announcements" USING "btree" ("tenant_id");



CREATE INDEX "idx_check_in_invites_check_in_id" ON "public"."check_in_invites" USING "btree" ("check_in_id");



CREATE INDEX "idx_check_in_invites_family_unit_id" ON "public"."check_in_invites" USING "btree" ("family_unit_id") WHERE ("family_unit_id" IS NOT NULL);



CREATE INDEX "idx_check_in_invites_invitee_id" ON "public"."check_in_invites" USING "btree" ("invitee_id") WHERE ("invitee_id" IS NOT NULL);



CREATE INDEX "idx_check_in_neighborhoods_neighborhood_id" ON "public"."check_in_neighborhoods" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_check_in_rsvps_check_in_id" ON "public"."check_in_rsvps" USING "btree" ("check_in_id");



CREATE INDEX "idx_check_in_rsvps_status" ON "public"."check_in_rsvps" USING "btree" ("check_in_id", "rsvp_status");



CREATE INDEX "idx_check_in_rsvps_tenant_id" ON "public"."check_in_rsvps" USING "btree" ("tenant_id");



CREATE INDEX "idx_check_in_rsvps_user_id" ON "public"."check_in_rsvps" USING "btree" ("user_id");



CREATE INDEX "idx_check_ins_active" ON "public"."check_ins" USING "btree" ("tenant_id", "status", "start_time") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_check_ins_created_by" ON "public"."check_ins" USING "btree" ("created_by");



CREATE INDEX "idx_check_ins_creator_tenant" ON "public"."check_ins" USING "btree" ("created_by", "tenant_id");



CREATE INDEX "idx_check_ins_location_id" ON "public"."check_ins" USING "btree" ("location_id") WHERE ("location_id" IS NOT NULL);



CREATE INDEX "idx_check_ins_start_time" ON "public"."check_ins" USING "btree" ("start_time");



CREATE INDEX "idx_check_ins_status" ON "public"."check_ins" USING "btree" ("status");



CREATE INDEX "idx_check_ins_tenant_id" ON "public"."check_ins" USING "btree" ("tenant_id");



CREATE INDEX "idx_check_ins_visibility_scope" ON "public"."check_ins" USING "btree" ("visibility_scope");



CREATE INDEX "idx_event_categories_tenant_id" ON "public"."event_categories" USING "btree" ("tenant_id");



CREATE INDEX "idx_event_flags_event_id" ON "public"."event_flags" USING "btree" ("event_id");



CREATE INDEX "idx_event_flags_flagged_by" ON "public"."event_flags" USING "btree" ("flagged_by");



CREATE INDEX "idx_event_flags_tenant_event" ON "public"."event_flags" USING "btree" ("tenant_id", "event_id");



CREATE INDEX "idx_event_flags_tenant_id" ON "public"."event_flags" USING "btree" ("tenant_id");



CREATE INDEX "idx_event_images_display_order" ON "public"."event_images" USING "btree" ("event_id", "display_order");



CREATE INDEX "idx_event_images_event_id" ON "public"."event_images" USING "btree" ("event_id");



CREATE INDEX "idx_event_invites_event_id" ON "public"."event_invites" USING "btree" ("event_id");



CREATE INDEX "idx_event_invites_family_unit_id" ON "public"."event_invites" USING "btree" ("family_unit_id");



CREATE INDEX "idx_event_invites_invitee_id" ON "public"."event_invites" USING "btree" ("invitee_id");



CREATE INDEX "idx_event_neighborhoods_event_id" ON "public"."event_neighborhoods" USING "btree" ("event_id");



CREATE INDEX "idx_event_neighborhoods_neighborhood_id" ON "public"."event_neighborhoods" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_event_rsvps_event_id" ON "public"."event_rsvps" USING "btree" ("event_id");



CREATE INDEX "idx_event_rsvps_status" ON "public"."event_rsvps" USING "btree" ("event_id", "rsvp_status");



CREATE INDEX "idx_event_rsvps_tenant_id" ON "public"."event_rsvps" USING "btree" ("tenant_id");



CREATE INDEX "idx_event_rsvps_user_id" ON "public"."event_rsvps" USING "btree" ("user_id");



CREATE INDEX "idx_events_cancelled_by" ON "public"."events" USING "btree" ("cancelled_by");



CREATE INDEX "idx_events_category_id" ON "public"."events" USING "btree" ("category_id");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_events_is_flagged" ON "public"."events" USING "btree" ("is_flagged") WHERE ("is_flagged" = true);



CREATE INDEX "idx_events_location_id" ON "public"."events" USING "btree" ("location_id");



CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");



CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_events_tenant_date" ON "public"."events" USING "btree" ("tenant_id", "start_date" DESC);



CREATE INDEX "idx_events_tenant_id" ON "public"."events" USING "btree" ("tenant_id");



CREATE INDEX "idx_events_visibility_scope" ON "public"."events" USING "btree" ("visibility_scope");



CREATE INDEX "idx_exchange_categories_tenant_id" ON "public"."exchange_categories" USING "btree" ("tenant_id");



CREATE INDEX "idx_exchange_flags_flagged_by" ON "public"."exchange_flags" USING "btree" ("flagged_by");



CREATE INDEX "idx_exchange_flags_listing_id" ON "public"."exchange_flags" USING "btree" ("listing_id");



CREATE INDEX "idx_exchange_flags_tenant_id" ON "public"."exchange_flags" USING "btree" ("tenant_id");



CREATE INDEX "idx_exchange_images_listing_id" ON "public"."exchange_images" USING "btree" ("listing_id");



CREATE UNIQUE INDEX "idx_exchange_images_one_hero_per_listing" ON "public"."exchange_images" USING "btree" ("listing_id") WHERE ("is_hero" = true);



CREATE INDEX "idx_exchange_images_tenant_id" ON "public"."exchange_images" USING "btree" ("tenant_id");



CREATE INDEX "idx_exchange_listings_archived" ON "public"."exchange_listings" USING "btree" ("tenant_id", "archived_at") WHERE ("archived_at" IS NOT NULL);



CREATE INDEX "idx_exchange_listings_archived_creator" ON "public"."exchange_listings" USING "btree" ("tenant_id", "created_by", "archived_at") WHERE ("archived_at" IS NOT NULL);



CREATE INDEX "idx_exchange_listings_category_id" ON "public"."exchange_listings" USING "btree" ("category_id");



CREATE INDEX "idx_exchange_listings_created_by" ON "public"."exchange_listings" USING "btree" ("created_by");



CREATE INDEX "idx_exchange_listings_hero_photo" ON "public"."exchange_listings" USING "btree" ("hero_photo") WHERE ("hero_photo" IS NOT NULL);



CREATE INDEX "idx_exchange_listings_is_flagged" ON "public"."exchange_listings" USING "btree" ("is_flagged");



CREATE INDEX "idx_exchange_listings_location_id" ON "public"."exchange_listings" USING "btree" ("location_id");



CREATE INDEX "idx_exchange_listings_status" ON "public"."exchange_listings" USING "btree" ("status");



CREATE INDEX "idx_exchange_listings_tenant_id" ON "public"."exchange_listings" USING "btree" ("tenant_id");



CREATE INDEX "idx_exchange_neighborhoods_listing_id" ON "public"."exchange_neighborhoods" USING "btree" ("listing_id");



CREATE INDEX "idx_exchange_neighborhoods_neighborhood_id" ON "public"."exchange_neighborhoods" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_exchange_neighborhoods_tenant_id" ON "public"."exchange_neighborhoods" USING "btree" ("tenant_id");



CREATE INDEX "idx_exchange_transactions_borrower_id" ON "public"."exchange_transactions" USING "btree" ("borrower_id");



CREATE INDEX "idx_exchange_transactions_expected_return_date" ON "public"."exchange_transactions" USING "btree" ("expected_return_date");



CREATE INDEX "idx_exchange_transactions_lender_id" ON "public"."exchange_transactions" USING "btree" ("lender_id");



CREATE INDEX "idx_exchange_transactions_listing_id" ON "public"."exchange_transactions" USING "btree" ("listing_id");



CREATE INDEX "idx_exchange_transactions_status" ON "public"."exchange_transactions" USING "btree" ("status");



CREATE INDEX "idx_exchange_transactions_tenant_id" ON "public"."exchange_transactions" USING "btree" ("tenant_id");



CREATE INDEX "idx_family_relationships_related_user_id" ON "public"."family_relationships" USING "btree" ("related_user_id");



CREATE INDEX "idx_family_relationships_tenant_id" ON "public"."family_relationships" USING "btree" ("tenant_id");



CREATE INDEX "idx_family_relationships_user_id" ON "public"."family_relationships" USING "btree" ("user_id");



CREATE INDEX "idx_family_units_primary_contact" ON "public"."family_units" USING "btree" ("primary_contact_id");



CREATE INDEX "idx_family_units_tenant_id" ON "public"."family_units" USING "btree" ("tenant_id");



CREATE INDEX "idx_interests_tenant_id" ON "public"."interests" USING "btree" ("tenant_id");



CREATE INDEX "idx_locations_created_by" ON "public"."locations" USING "btree" ("created_by");



CREATE INDEX "idx_locations_lot" ON "public"."locations" USING "btree" ("lot_id");



CREATE INDEX "idx_locations_neighborhood" ON "public"."locations" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_locations_neighborhood_id" ON "public"."locations" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_locations_status" ON "public"."locations" USING "btree" ("status");



CREATE INDEX "idx_locations_tenant" ON "public"."locations" USING "btree" ("tenant_id");



CREATE INDEX "idx_locations_tenant_id" ON "public"."locations" USING "btree" ("tenant_id");



CREATE INDEX "idx_locations_tenant_type" ON "public"."locations" USING "btree" ("tenant_id", "type");



CREATE INDEX "idx_locations_type" ON "public"."locations" USING "btree" ("type");



CREATE INDEX "idx_lots_location_id" ON "public"."lots" USING "btree" ("location_id");



CREATE INDEX "idx_lots_neighborhood_id" ON "public"."lots" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_lots_tenant_id" ON "public"."lots" USING "btree" ("tenant_id");



CREATE INDEX "idx_neighbor_list_members_list" ON "public"."neighbor_list_members" USING "btree" ("list_id");



CREATE INDEX "idx_neighbor_list_members_neighbor" ON "public"."neighbor_list_members" USING "btree" ("neighbor_id");



CREATE INDEX "idx_neighbor_lists_owner" ON "public"."neighbor_lists" USING "btree" ("owner_id");



CREATE INDEX "idx_neighbor_lists_tenant" ON "public"."neighbor_lists" USING "btree" ("tenant_id");



CREATE INDEX "idx_neighborhoods_location_id" ON "public"."neighborhoods" USING "btree" ("location_id");



CREATE INDEX "idx_neighborhoods_tenant_id" ON "public"."neighborhoods" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_action_required" ON "public"."notifications" USING "btree" ("action_required");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_event" ON "public"."notifications" USING "btree" ("event_id") WHERE ("event_id" IS NOT NULL);



CREATE INDEX "idx_notifications_exchange_listing" ON "public"."notifications" USING "btree" ("exchange_listing_id") WHERE ("exchange_listing_id" IS NOT NULL);



CREATE INDEX "idx_notifications_exchange_transaction" ON "public"."notifications" USING "btree" ("exchange_transaction_id") WHERE ("exchange_transaction_id" IS NOT NULL);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_tenant" ON "public"."notifications" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_tenant_id" ON "public"."notifications" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE UNIQUE INDEX "idx_one_hero_per_event" ON "public"."event_images" USING "btree" ("event_id") WHERE ("is_hero" = true);



CREATE INDEX "idx_pets_family_unit_id" ON "public"."pets" USING "btree" ("family_unit_id");



CREATE INDEX "idx_pets_lot_id" ON "public"."pets" USING "btree" ("lot_id");



CREATE INDEX "idx_reservations_location_status" ON "public"."reservations" USING "btree" ("location_id", "status");



CREATE INDEX "idx_reservations_start_time" ON "public"."reservations" USING "btree" ("start_time");



CREATE INDEX "idx_reservations_tenant_id" ON "public"."reservations" USING "btree" ("tenant_id");



CREATE INDEX "idx_reservations_user_id" ON "public"."reservations" USING "btree" ("user_id");



CREATE INDEX "idx_resident_interests_interest_id" ON "public"."resident_interests" USING "btree" ("interest_id");



CREATE INDEX "idx_resident_interests_resident_id" ON "public"."resident_interests" USING "btree" ("resident_id");



CREATE INDEX "idx_resident_requests_created_at" ON "public"."resident_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_resident_requests_created_by" ON "public"."resident_requests" USING "btree" ("created_by");



CREATE INDEX "idx_resident_requests_original_submitter_id" ON "public"."resident_requests" USING "btree" ("original_submitter_id");



CREATE INDEX "idx_resident_requests_priority" ON "public"."resident_requests" USING "btree" ("priority");



CREATE INDEX "idx_resident_requests_request_type" ON "public"."resident_requests" USING "btree" ("request_type");



CREATE INDEX "idx_resident_requests_status" ON "public"."resident_requests" USING "btree" ("status");



CREATE INDEX "idx_resident_requests_tagged_pet_ids" ON "public"."resident_requests" USING "gin" ("tagged_pet_ids");



CREATE INDEX "idx_resident_requests_tagged_resident_ids" ON "public"."resident_requests" USING "gin" ("tagged_resident_ids");



CREATE INDEX "idx_resident_requests_tenant_id" ON "public"."resident_requests" USING "btree" ("tenant_id");



CREATE INDEX "idx_resident_skills_resident_id" ON "public"."resident_skills" USING "btree" ("resident_id");



CREATE INDEX "idx_resident_skills_skill_id" ON "public"."resident_skills" USING "btree" ("skill_id");



CREATE INDEX "idx_residents_auth_user_id" ON "public"."residents" USING "btree" ("auth_user_id");



CREATE INDEX "idx_residents_family_unit_id" ON "public"."residents" USING "btree" ("family_unit_id");



CREATE INDEX "idx_residents_invite_token" ON "public"."residents" USING "btree" ("invite_token");



CREATE INDEX "idx_residents_lot_id" ON "public"."residents" USING "btree" ("lot_id");



CREATE INDEX "idx_residents_tenant_id" ON "public"."residents" USING "btree" ("tenant_id");



CREATE INDEX "idx_saved_events_event_id" ON "public"."saved_events" USING "btree" ("event_id");



CREATE INDEX "idx_saved_events_user_id" ON "public"."saved_events" USING "btree" ("user_id");



CREATE INDEX "idx_skills_tenant_id" ON "public"."skills" USING "btree" ("tenant_id");



CREATE INDEX "idx_tenants_announcements_enabled" ON "public"."tenants" USING "btree" ("announcements_enabled");



CREATE INDEX "idx_tenants_checkins_enabled" ON "public"."tenants" USING "btree" ("checkins_enabled") WHERE ("checkins_enabled" = true);



CREATE INDEX "idx_tenants_requests_enabled" ON "public"."tenants" USING "btree" ("requests_enabled") WHERE ("requests_enabled" = true);



CREATE INDEX "idx_tenants_slug" ON "public"."tenants" USING "btree" ("slug");



CREATE INDEX "idx_user_interests_interest" ON "public"."user_interests" USING "btree" ("interest_id");



CREATE INDEX "idx_user_interests_interest_id" ON "public"."user_interests" USING "btree" ("interest_id");



CREATE INDEX "idx_user_interests_user" ON "public"."user_interests" USING "btree" ("user_id");



CREATE INDEX "idx_user_interests_user_id" ON "public"."user_interests" USING "btree" ("user_id");



CREATE INDEX "idx_user_privacy_settings_user_id" ON "public"."user_privacy_settings" USING "btree" ("user_id");



CREATE INDEX "idx_user_skills_open_to_requests" ON "public"."user_skills" USING "btree" ("open_to_requests") WHERE ("open_to_requests" = true);



CREATE INDEX "idx_user_skills_skill" ON "public"."user_skills" USING "btree" ("skill_id");



CREATE INDEX "idx_user_skills_skill_id" ON "public"."user_skills" USING "btree" ("skill_id");



CREATE INDEX "idx_user_skills_user" ON "public"."user_skills" USING "btree" ("user_id");



CREATE INDEX "idx_user_skills_user_id" ON "public"."user_skills" USING "btree" ("user_id");



CREATE INDEX "idx_users_email_lower" ON "public"."users" USING "btree" ("lower"("email"));



CREATE INDEX "idx_users_family_unit_id" ON "public"."users" USING "btree" ("family_unit_id");



CREATE INDEX "idx_users_invite_token" ON "public"."users" USING "btree" ("invite_token");



CREATE INDEX "idx_users_lot_id" ON "public"."users" USING "btree" ("lot_id");



CREATE INDEX "idx_users_onboarding" ON "public"."users" USING "btree" ("onboarding_completed") WHERE ("role" = 'resident'::"text");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_tenant_id" ON "public"."users" USING "btree" ("tenant_id");



CREATE INDEX "idx_users_tenant_role" ON "public"."users" USING "btree" ("tenant_id", "role");



CREATE OR REPLACE TRIGGER "handle_updated_at_neighbor_lists" BEFORE UPDATE ON "public"."neighbor_lists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_check_event_unflagged" AFTER DELETE ON "public"."event_flags" FOR EACH ROW EXECUTE FUNCTION "public"."check_event_unflagged"();



CREATE OR REPLACE TRIGGER "trigger_check_exchange_listing_unflagged" AFTER DELETE ON "public"."exchange_flags" FOR EACH ROW EXECUTE FUNCTION "public"."check_exchange_listing_unflagged"();



CREATE OR REPLACE TRIGGER "trigger_set_event_flagged" AFTER INSERT ON "public"."event_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_event_flagged"();



CREATE OR REPLACE TRIGGER "trigger_set_exchange_listing_flagged" AFTER INSERT ON "public"."exchange_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_exchange_listing_flagged"();



CREATE OR REPLACE TRIGGER "trigger_update_exchange_listings_updated_at" BEFORE UPDATE ON "public"."exchange_listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_exchange_listings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_exchange_transactions_updated_at" BEFORE UPDATE ON "public"."exchange_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_exchange_transactions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_resident_requests_updated_at" BEFORE UPDATE ON "public"."resident_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_resident_requests_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_user_privacy_settings_updated_at" BEFORE UPDATE ON "public"."user_privacy_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_privacy_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_neighborhoods_updated_at" BEFORE UPDATE ON "public"."neighborhoods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reservations_updated_at" BEFORE UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."announcement_neighborhoods"
    ADD CONSTRAINT "announcement_neighborhoods_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_neighborhoods"
    ADD CONSTRAINT "announcement_neighborhoods_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_invites"
    ADD CONSTRAINT "check_in_invites_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_invites"
    ADD CONSTRAINT "check_in_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."check_in_invites"
    ADD CONSTRAINT "check_in_invites_family_unit_id_fkey" FOREIGN KEY ("family_unit_id") REFERENCES "public"."family_units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_invites"
    ADD CONSTRAINT "check_in_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_neighborhoods"
    ADD CONSTRAINT "check_in_neighborhoods_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_neighborhoods"
    ADD CONSTRAINT "check_in_neighborhoods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."check_in_neighborhoods"
    ADD CONSTRAINT "check_in_neighborhoods_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_rsvps"
    ADD CONSTRAINT "check_in_rsvps_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_rsvps"
    ADD CONSTRAINT "check_in_rsvps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_in_rsvps"
    ADD CONSTRAINT "check_in_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_changelog"
    ADD CONSTRAINT "document_changelog_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."document_changelog"
    ADD CONSTRAINT "document_changelog_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_reads"
    ADD CONSTRAINT "document_reads_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_reads"
    ADD CONSTRAINT "document_reads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."document_reads"
    ADD CONSTRAINT "document_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_flags"
    ADD CONSTRAINT "event_flags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_flags"
    ADD CONSTRAINT "event_flags_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_flags"
    ADD CONSTRAINT "event_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."event_images"
    ADD CONSTRAINT "event_images_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_family_unit_id_fkey" FOREIGN KEY ("family_unit_id") REFERENCES "public"."family_units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_neighborhoods"
    ADD CONSTRAINT "event_neighborhoods_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_neighborhoods"
    ADD CONSTRAINT "event_neighborhoods_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_categories"
    ADD CONSTRAINT "exchange_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_flags"
    ADD CONSTRAINT "exchange_flags_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_flags"
    ADD CONSTRAINT "exchange_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."exchange_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_flags"
    ADD CONSTRAINT "exchange_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_images"
    ADD CONSTRAINT "exchange_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."exchange_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_images"
    ADD CONSTRAINT "exchange_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."exchange_categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exchange_listings"
    ADD CONSTRAINT "exchange_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_neighborhoods"
    ADD CONSTRAINT "exchange_neighborhoods_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."exchange_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_neighborhoods"
    ADD CONSTRAINT "exchange_neighborhoods_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_neighborhoods"
    ADD CONSTRAINT "exchange_neighborhoods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_transactions"
    ADD CONSTRAINT "exchange_transactions_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_transactions"
    ADD CONSTRAINT "exchange_transactions_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_transactions"
    ADD CONSTRAINT "exchange_transactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."exchange_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exchange_transactions"
    ADD CONSTRAINT "exchange_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_relationships"
    ADD CONSTRAINT "family_relationships_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_relationships"
    ADD CONSTRAINT "family_relationships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_relationships"
    ADD CONSTRAINT "family_relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_units"
    ADD CONSTRAINT "family_units_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."family_units"
    ADD CONSTRAINT "family_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."neighbor_list_members"
    ADD CONSTRAINT "neighbor_list_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."neighbor_list_members"
    ADD CONSTRAINT "neighbor_list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."neighbor_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."neighbor_list_members"
    ADD CONSTRAINT "neighbor_list_members_neighbor_id_fkey" FOREIGN KEY ("neighbor_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."neighbor_lists"
    ADD CONSTRAINT "neighbor_lists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."neighbor_lists"
    ADD CONSTRAINT "neighbor_lists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."neighborhoods"
    ADD CONSTRAINT "neighborhoods_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."neighborhoods"
    ADD CONSTRAINT "neighborhoods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_exchange_listing_id_fkey" FOREIGN KEY ("exchange_listing_id") REFERENCES "public"."exchange_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_exchange_transaction_id_fkey" FOREIGN KEY ("exchange_transaction_id") REFERENCES "public"."exchange_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pets"
    ADD CONSTRAINT "pets_family_unit_id_fkey" FOREIGN KEY ("family_unit_id") REFERENCES "public"."family_units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pets"
    ADD CONSTRAINT "pets_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resident_interests"
    ADD CONSTRAINT "resident_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resident_interests"
    ADD CONSTRAINT "resident_interests_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_original_submitter_id_fkey" FOREIGN KEY ("original_submitter_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resident_requests"
    ADD CONSTRAINT "resident_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resident_skills"
    ADD CONSTRAINT "resident_skills_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resident_skills"
    ADD CONSTRAINT "resident_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_family_unit_id_fkey" FOREIGN KEY ("family_unit_id") REFERENCES "public"."family_units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_events"
    ADD CONSTRAINT "saved_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_events"
    ADD CONSTRAINT "saved_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_tenant_admin_id_fkey" FOREIGN KEY ("tenant_admin_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_family_unit_id_fkey" FOREIGN KEY ("family_unit_id") REFERENCES "public"."family_units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete check-ins in their tenant" ON "public"."check_ins" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_tenant_admin" = true)))));



CREATE POLICY "Admins can manage changelogs" ON "public"."document_changelog" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['tenant_admin'::"text", 'admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage documents" ON "public"."documents" USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['tenant_admin'::"text", 'admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Admins can manage exchange categories" ON "public"."exchange_categories" USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Admins can manage interests" ON "public"."interests" USING (true);



CREATE POLICY "Admins can manage skills" ON "public"."skills" USING (true);



CREATE POLICY "Admins can update check-ins in their tenant" ON "public"."check_ins" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_tenant_admin" = true))))) WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_tenant_admin" = true)))));



CREATE POLICY "Admins can view all document reads" ON "public"."document_reads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['tenant_admin'::"text", 'admin'::"text", 'super_admin'::"text"])) AND ("users"."tenant_id" = "document_reads"."tenant_id")))));



CREATE POLICY "Allow public read access to tenant basic info" ON "public"."tenants" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view check-in neighborhoods" ON "public"."check_in_neighborhoods" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Borrowers can create transactions" ON "public"."exchange_transactions" FOR INSERT WITH CHECK ((("borrower_id" = "auth"."uid"()) AND ("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "Borrowers can update their transactions" ON "public"."exchange_transactions" FOR UPDATE USING (("borrower_id" = "auth"."uid"()));



CREATE POLICY "Borrowers can view their transactions" ON "public"."exchange_transactions" FOR SELECT USING (("borrower_id" = "auth"."uid"()));



CREATE POLICY "Creators can delete their invites" ON "public"."check_in_invites" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete their neighborhoods" ON "public"."check_in_neighborhoods" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete their own check-ins" ON "public"."check_ins" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete their own exchange listings" ON "public"."exchange_listings" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can insert invites" ON "public"."check_in_invites" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can insert neighborhoods" ON "public"."check_in_neighborhoods" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can manage exchange images" ON "public"."exchange_images" USING (("listing_id" IN ( SELECT "exchange_listings"."id"
   FROM "public"."exchange_listings"
  WHERE ("exchange_listings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creators can manage exchange neighborhoods" ON "public"."exchange_neighborhoods" USING (("listing_id" IN ( SELECT "exchange_listings"."id"
   FROM "public"."exchange_listings"
  WHERE ("exchange_listings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creators can update their invites" ON "public"."check_in_invites" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update their neighborhoods" ON "public"."check_in_neighborhoods" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update their own check-ins" ON "public"."check_ins" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update their own exchange listings" ON "public"."exchange_listings" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can view their own check-ins" ON "public"."check_ins" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can view their own exchange listings" ON "public"."exchange_listings" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Event creators can delete their events" ON "public"."events" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Event creators can manage their event images" ON "public"."event_images" TO "authenticated" USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."created_by" = "auth"."uid"()))));



CREATE POLICY "Event creators can manage their event invites" ON "public"."event_invites" TO "authenticated" USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."created_by" = "auth"."uid"()))));



CREATE POLICY "Event creators can manage their event neighborhoods" ON "public"."event_neighborhoods" TO "authenticated" USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."created_by" = "auth"."uid"()))));



CREATE POLICY "Event creators can update their events" ON "public"."events" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Family members can update shared lists" ON "public"."neighbor_lists" FOR UPDATE USING ((("is_shared" = true) AND (EXISTS ( SELECT 1
   FROM ("public"."users" "u_owner"
     JOIN "public"."users" "u_me" ON (("u_owner"."family_unit_id" = "u_me"."family_unit_id")))
  WHERE (("u_owner"."id" = "neighbor_lists"."owner_id") AND ("u_me"."id" = "auth"."uid"()) AND ("u_owner"."family_unit_id" IS NOT NULL))))));



CREATE POLICY "Family members can view shared lists" ON "public"."neighbor_lists" FOR SELECT USING ((("is_shared" = true) AND (EXISTS ( SELECT 1
   FROM ("public"."users" "u_owner"
     JOIN "public"."users" "u_me" ON (("u_owner"."family_unit_id" = "u_me"."family_unit_id")))
  WHERE (("u_owner"."id" = "neighbor_lists"."owner_id") AND ("u_me"."id" = "auth"."uid"()) AND ("u_owner"."family_unit_id" IS NOT NULL))))));



CREATE POLICY "Lenders can update their transactions" ON "public"."exchange_transactions" FOR UPDATE USING (("lender_id" = "auth"."uid"()));



CREATE POLICY "Lenders can view their transactions" ON "public"."exchange_transactions" FOR SELECT USING (("lender_id" = "auth"."uid"()));



CREATE POLICY "Residents can create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Residents can delete pets in their family unit" ON "public"."pets" FOR DELETE TO "authenticated" USING (("family_unit_id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Residents can manage pets in their family unit" ON "public"."pets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'resident'::"text") AND ("users"."family_unit_id" = "pets"."family_unit_id")))));



CREATE POLICY "Residents can update pets in their family unit" ON "public"."pets" FOR UPDATE TO "authenticated" USING (("family_unit_id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK (("family_unit_id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Residents can update their own family unit" ON "public"."family_units" FOR UPDATE TO "authenticated" USING (("id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."family_unit_id" IS NOT NULL))))) WITH CHECK (("id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."family_unit_id" IS NOT NULL)))));



CREATE POLICY "Residents can view changelogs" ON "public"."document_changelog" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_changelog"."document_id") AND ("d"."tenant_id" = ( SELECT "users"."tenant_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))) AND ("d"."status" = 'published'::"text")))));



CREATE POLICY "Residents can view family_units in their tenant" ON "public"."family_units" FOR SELECT USING ((("public"."get_user_role"() = 'resident'::"text") AND ("public"."get_user_tenant_id"() = "tenant_id")));



CREATE POLICY "Residents can view lots in their tenant" ON "public"."lots" FOR SELECT USING ((("public"."get_user_role"() = 'resident'::"text") AND ("public"."get_user_tenant_id"() = "tenant_id")));



CREATE POLICY "Residents can view pets in their tenant" ON "public"."pets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."lots" "l"
     JOIN "public"."neighborhoods" "n" ON (("n"."id" = "l"."neighborhood_id")))
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "n"."tenant_id")))
  WHERE (("l"."id" = "pets"."lot_id") AND ("u"."id" = "auth"."uid"()) AND ("u"."role" = 'resident'::"text")))));



CREATE POLICY "Residents can view published documents" ON "public"."documents" FOR SELECT USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("status" = 'published'::"text")));



CREATE POLICY "Residents can view published exchange listings" ON "public"."exchange_listings" FOR SELECT USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("status" = 'published'::"text") AND ("cancelled_at" IS NULL)));



CREATE POLICY "Residents can view tenant event categories" ON "public"."event_categories" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Residents can view tenant exchange categories" ON "public"."exchange_categories" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Residents can view their tenant locations" ON "public"."locations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'resident'::"text") AND ("users"."tenant_id" = "locations"."tenant_id")))));



CREATE POLICY "Super admins have full access to family_relationships" ON "public"."family_relationships" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins have full access to family_units" ON "public"."family_units" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins have full access to locations" ON "public"."locations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins have full access to lots" ON "public"."lots" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins have full access to pets" ON "public"."pets" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins have full access to residents" ON "public"."residents" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'super_admin'::"text")))));



CREATE POLICY "Tenant admins can delete event categories" ON "public"."event_categories" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can delete exchange listings" ON "public"."exchange_listings" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "exchange_listings"."tenant_id") AND (("users"."is_tenant_admin" = true) OR ("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text")))))));



CREATE POLICY "Tenant admins can insert event categories" ON "public"."event_categories" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can manage exchange categories" ON "public"."exchange_categories" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can manage their tenant locations" ON "public"."locations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text") AND ("users"."tenant_id" = "locations"."tenant_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text") AND ("users"."tenant_id" = "locations"."tenant_id")))));



CREATE POLICY "Tenant admins can manage their tenant's family_relationships" ON "public"."family_relationships" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_tenant_admin" = true) AND ("users"."tenant_id" = "family_relationships"."tenant_id")))));



CREATE POLICY "Tenant admins can manage their tenant's family_units" ON "public"."family_units" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "family_units"."tenant_id") AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can manage their tenant's lots" ON "public"."lots" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "lots"."tenant_id") AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can manage their tenant's pets" ON "public"."pets" USING ((EXISTS ( SELECT 1
   FROM (("public"."lots" "l"
     JOIN "public"."neighborhoods" "n" ON (("n"."id" = "l"."neighborhood_id")))
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "n"."tenant_id")))
  WHERE (("l"."id" = "pets"."lot_id") AND ("u"."id" = "auth"."uid"()) AND ("u"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can remove any flags" ON "public"."event_flags" FOR DELETE TO "authenticated" USING (("event_id" IN ( SELECT "e"."id"
   FROM ("public"."events" "e"
     JOIN "public"."users" "u" ON (("u"."id" = "auth"."uid"())))
  WHERE (("e"."tenant_id" = "u"."tenant_id") AND ("u"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can remove any flags" ON "public"."exchange_flags" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "exchange_flags"."tenant_id") AND (("users"."is_tenant_admin" = true) OR ("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Tenant admins can update any event" ON "public"."events" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text"))))) WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can update event categories" ON "public"."event_categories" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text"))))) WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant admins can update exchange listings" ON "public"."exchange_listings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "exchange_listings"."tenant_id") AND (("users"."is_tenant_admin" = true) OR ("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Tenant admins can view all exchange listings" ON "public"."exchange_listings" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_tenant_admin" = true)))));



CREATE POLICY "Tenant admins can view all flags" ON "public"."event_flags" FOR SELECT TO "authenticated" USING (("event_id" IN ( SELECT "e"."id"
   FROM ("public"."events" "e"
     JOIN "public"."users" "u" ON (("u"."id" = "auth"."uid"())))
  WHERE (("e"."tenant_id" = "u"."tenant_id") AND ("u"."role" = 'tenant_admin'::"text")))));



CREATE POLICY "Tenant members can view interests of users in their tenant" ON "public"."user_interests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u1",
    "public"."users" "u2"
  WHERE (("u1"."id" = "auth"."uid"()) AND ("u2"."id" = "user_interests"."user_id") AND ("u1"."tenant_id" = "u2"."tenant_id") AND ("u1"."tenant_id" IS NOT NULL)))));



CREATE POLICY "Tenant members can view skills of users in their tenant" ON "public"."user_skills" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u1",
    "public"."users" "u2"
  WHERE (("u1"."id" = "auth"."uid"()) AND ("u2"."id" = "user_skills"."user_id") AND ("u1"."tenant_id" = "u2"."tenant_id") AND ("u1"."tenant_id" IS NOT NULL)))));



CREATE POLICY "Users can create check-ins" ON "public"."check_ins" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can create skills" ON "public"."skills" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create their own RSVPs" ON "public"."check_in_rsvps" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own lists" ON "public"."neighbor_lists" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) AND ("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own RSVPs" ON "public"."check_in_rsvps" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own lists" ON "public"."neighbor_lists" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can flag events" ON "public"."event_flags" FOR INSERT TO "authenticated" WITH CHECK (("flagged_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own read status" ON "public"."document_reads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage members of accessible lists" ON "public"."neighbor_list_members" USING ((EXISTS ( SELECT 1
   FROM "public"."neighbor_lists" "nl"
  WHERE (("nl"."id" = "neighbor_list_members"."list_id") AND (("nl"."owner_id" = "auth"."uid"()) OR (("nl"."is_shared" = true) AND (EXISTS ( SELECT 1
           FROM ("public"."users" "u_owner"
             JOIN "public"."users" "u_me" ON (("u_owner"."family_unit_id" = "u_me"."family_unit_id")))
          WHERE (("u_owner"."id" = "nl"."owner_id") AND ("u_me"."id" = "auth"."uid"()) AND ("u_owner"."family_unit_id" IS NOT NULL))))))))));



CREATE POLICY "Users can manage their own RSVPs" ON "public"."event_rsvps" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own RSVPs in their tenant" ON "public"."event_rsvps" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "event_rsvps"."tenant_id"))))));



CREATE POLICY "Users can manage their own family_relationships" ON "public"."family_relationships" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own interests" ON "public"."resident_interests" USING (true);



CREATE POLICY "Users can manage their own interests" ON "public"."user_interests" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own privacy settings" ON "public"."user_privacy_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own saved events" ON "public"."saved_events" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own skills" ON "public"."resident_skills" USING (true);



CREATE POLICY "Users can manage their own skills" ON "public"."user_skills" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their saved events" ON "public"."saved_events" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can remove their own flags" ON "public"."event_flags" FOR DELETE TO "authenticated" USING (("flagged_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own RSVPs" ON "public"."check_in_rsvps" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own lists" ON "public"."neighbor_lists" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own read status" ON "public"."document_reads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view RSVPs for events in their tenant" ON "public"."event_rsvps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "event_rsvps"."tenant_id")))));



CREATE POLICY "Users can view RSVPs in their tenant" ON "public"."check_in_rsvps" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view community check-ins" ON "public"."check_ins" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("visibility_scope" = 'community'::"text")));



CREATE POLICY "Users can view event images" ON "public"."event_images" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view event invites" ON "public"."event_invites" FOR SELECT TO "authenticated" USING ((("invitee_id" = "auth"."uid"()) OR ("family_unit_id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view event neighborhoods" ON "public"."event_neighborhoods" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view exchange images" ON "public"."exchange_images" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view exchange neighborhoods" ON "public"."exchange_neighborhoods" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view family_relationships in their tenant" ON "public"."family_relationships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "family_relationships"."tenant_id")))));



CREATE POLICY "Users can view interests for their tenant" ON "public"."interests" FOR SELECT USING (true);



CREATE POLICY "Users can view members of accessible lists" ON "public"."neighbor_list_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."neighbor_lists" "nl"
  WHERE (("nl"."id" = "neighbor_list_members"."list_id") AND (("nl"."owner_id" = "auth"."uid"()) OR (("nl"."is_shared" = true) AND (EXISTS ( SELECT 1
           FROM ("public"."users" "u_owner"
             JOIN "public"."users" "u_me" ON (("u_owner"."family_unit_id" = "u_me"."family_unit_id")))
          WHERE (("u_owner"."id" = "nl"."owner_id") AND ("u_me"."id" = "auth"."uid"()) AND ("u_owner"."family_unit_id" IS NOT NULL))))))))));



CREATE POLICY "Users can view neighborhood check-ins" ON "public"."check_ins" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("visibility_scope" = 'neighborhood'::"text") AND (EXISTS ( SELECT 1
   FROM (("public"."check_in_neighborhoods" "cin"
     JOIN "public"."users" "u" ON (("u"."id" = "auth"."uid"())))
     JOIN "public"."lots" "l" ON (("l"."id" = "u"."lot_id")))
  WHERE (("cin"."check_in_id" = "check_ins"."id") AND ("l"."neighborhood_id" = "cin"."neighborhood_id"))))));



CREATE POLICY "Users can view private check-ins" ON "public"."check_ins" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("visibility_scope" = 'private'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."check_in_invites"
  WHERE (("check_in_invites"."check_in_id" = "check_ins"."id") AND ("check_in_invites"."invitee_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."check_in_invites" "ci"
     JOIN "public"."users" "u" ON (("u"."id" = "auth"."uid"())))
  WHERE (("ci"."check_in_id" = "check_ins"."id") AND ("ci"."family_unit_id" = "u"."family_unit_id")))))));



CREATE POLICY "Users can view resident interests" ON "public"."resident_interests" FOR SELECT USING (true);



CREATE POLICY "Users can view resident skills" ON "public"."resident_skills" FOR SELECT USING (true);



CREATE POLICY "Users can view skills for their tenant" ON "public"."skills" FOR SELECT USING (true);



CREATE POLICY "Users can view their own RSVPs" ON "public"."event_rsvps" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own interests" ON "public"."user_interests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own invites" ON "public"."check_in_invites" FOR SELECT TO "authenticated" USING ((("invitee_id" = "auth"."uid"()) OR ("family_unit_id" IN ( SELECT "users"."family_unit_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own lists" ON "public"."neighbor_lists" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own privacy settings" ON "public"."user_privacy_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own read status" ON "public"."document_reads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own skills" ON "public"."user_skills" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their saved events" ON "public"."saved_events" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Verified residents can create exchange listings" ON "public"."exchange_listings" FOR INSERT WITH CHECK ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "admins_manage_announcement_neighborhoods" ON "public"."announcement_neighborhoods" USING (("announcement_id" IN ( SELECT "announcements"."id"
   FROM "public"."announcements"
  WHERE ("announcements"."tenant_id" IN ( SELECT "users"."tenant_id"
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND (("users"."is_tenant_admin" = true) OR ("users"."role" = ANY (ARRAY['tenant_admin'::"text", 'super_admin'::"text"])))))))));



CREATE POLICY "admins_manage_announcements" ON "public"."announcements" USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."is_tenant_admin" = true) OR ("users"."role" = ANY (ARRAY['tenant_admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "admins_update_requests" ON "public"."resident_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "resident_requests"."tenant_id") AND (("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text") OR ("users"."is_tenant_admin" = true))))));



CREATE POLICY "admins_view_all_requests" ON "public"."resident_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "resident_requests"."tenant_id") AND (("users"."role" = 'tenant_admin'::"text") OR ("users"."role" = 'super_admin'::"text") OR ("users"."is_tenant_admin" = true))))));



ALTER TABLE "public"."announcement_neighborhoods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcement_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_flag_listings" ON "public"."exchange_flags" FOR INSERT WITH CHECK ((("flagged_by" = "auth"."uid"()) AND ("auth"."uid"() IS NOT NULL)));



CREATE POLICY "authenticated_users_view_exchange_flags" ON "public"."exchange_flags" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."check_in_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_in_neighborhoods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_in_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_changelog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_neighborhoods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_neighborhoods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."neighbor_list_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."neighbor_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."neighborhoods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert_service" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



ALTER TABLE "public"."pets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resident_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resident_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resident_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."residents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "residents_can_view_privacy_settings_in_scope" ON "public"."user_privacy_settings" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'super_admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."users" "viewer_user"
     JOIN "public"."users" "target_user" ON (("target_user"."id" = "user_privacy_settings"."user_id")))
  WHERE (("viewer_user"."id" = "auth"."uid"()) AND ("viewer_user"."role" = 'tenant_admin'::"text") AND ("viewer_user"."tenant_id" = "target_user"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM (("public"."users" "viewer_user"
     JOIN "public"."tenants" "t" ON (("t"."id" = "viewer_user"."tenant_id")))
     JOIN "public"."users" "target_user" ON (("target_user"."id" = "user_privacy_settings"."user_id")))
  WHERE (("viewer_user"."id" = "auth"."uid"()) AND ("viewer_user"."role" = 'resident'::"text") AND ("target_user"."role" = 'resident'::"text") AND ("viewer_user"."tenant_id" = "target_user"."tenant_id") AND (("t"."resident_visibility_scope" = 'tenant'::"public"."resident_visibility_scope") OR (("t"."resident_visibility_scope" = 'neighborhood'::"public"."resident_visibility_scope") AND (EXISTS ( SELECT 1
           FROM ((("public"."users" "u1"
             JOIN "public"."lots" "l1" ON (("l1"."id" = "u1"."lot_id")))
             JOIN "public"."users" "u2" ON (("u2"."id" = "target_user"."id")))
             JOIN "public"."lots" "l2" ON (("l2"."id" = "u2"."lot_id")))
          WHERE (("u1"."id" = "viewer_user"."id") AND ("l1"."neighborhood_id" = "l2"."neighborhood_id")))))))))));



COMMENT ON POLICY "residents_can_view_privacy_settings_in_scope" ON "public"."user_privacy_settings" IS 'Allows residents to view privacy settings of other residents to respect their privacy preferences';



CREATE POLICY "residents_can_view_tenant_events" ON "public"."events" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "residents_create_requests" ON "public"."resident_requests" FOR INSERT WITH CHECK (("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "residents_insert_family_members" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'resident'::"text") AND ("tenant_id" = "public"."get_user_tenant_id"())));



CREATE POLICY "residents_same_tenant_read" ON "public"."users" FOR SELECT TO "authenticated" USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'resident'::"text") AND ("role" = 'resident'::"text")));



CREATE POLICY "residents_update_own_pending" ON "public"."resident_requests" FOR UPDATE USING (((("created_by" = "auth"."uid"()) OR ("original_submitter_id" = "auth"."uid"())) AND ("status" = 'pending'::"text")));



CREATE POLICY "residents_view_community_requests" ON "public"."resident_requests" FOR SELECT USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("request_type" = ANY (ARRAY['maintenance'::"text", 'safety'::"text"])) AND ("is_anonymous" = false)));



CREATE POLICY "residents_view_neighborhoods_in_tenant" ON "public"."neighborhoods" FOR SELECT USING ("public"."is_resident_of_tenant"("tenant_id"));



CREATE POLICY "residents_view_own_requests" ON "public"."resident_requests" FOR SELECT USING (((("created_by" = "auth"."uid"()) OR ("original_submitter_id" = "auth"."uid"())) AND ("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



CREATE POLICY "residents_view_published_and_archived_announcements" ON "public"."announcements" FOR SELECT USING ((("status" = ANY (ARRAY['published'::"public"."announcement_status", 'archived'::"public"."announcement_status"])) AND ("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())))));



ALTER TABLE "public"."saved_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_full_access" ON "public"."residents" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admins_all_neighborhoods" ON "public"."neighborhoods" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'super_admin'::"text")))));



CREATE POLICY "super_admins_all_tenants" ON "public"."tenants" USING (("public"."get_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'super_admin'::"text"));



CREATE POLICY "super_admins_all_users" ON "public"."users" USING (("public"."get_user_role"() = 'super_admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'super_admin'::"text"));



CREATE POLICY "tenant_admins_delete_neighborhoods" ON "public"."neighborhoods" FOR DELETE USING ("public"."is_tenant_admin_of_tenant"("tenant_id"));



CREATE POLICY "tenant_admins_delete_users" ON "public"."users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "admin_user"
  WHERE (("admin_user"."id" = "auth"."uid"()) AND ("admin_user"."role" = 'tenant_admin'::"text") AND ("admin_user"."tenant_id" = "users"."tenant_id")))));



CREATE POLICY "tenant_admins_insert_neighborhoods" ON "public"."neighborhoods" FOR INSERT WITH CHECK ("public"."is_tenant_admin_of_tenant"("tenant_id"));



CREATE POLICY "tenant_admins_insert_users" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "admin_user"
  WHERE (("admin_user"."id" = "auth"."uid"()) AND ("admin_user"."role" = 'tenant_admin'::"text") AND ("admin_user"."tenant_id" = "users"."tenant_id")))));



CREATE POLICY "tenant_admins_own_tenant" ON "public"."tenants" FOR SELECT USING ((("public"."get_user_role"() = 'tenant_admin'::"text") AND ("id" = "public"."get_user_tenant_id"())));



CREATE POLICY "tenant_admins_select_neighborhoods" ON "public"."neighborhoods" FOR SELECT USING ("public"."is_tenant_admin_of_tenant"("tenant_id"));



CREATE POLICY "tenant_admins_tenant_users" ON "public"."users" FOR SELECT USING ((("public"."get_user_role"() = 'tenant_admin'::"text") AND ("tenant_id" = "public"."get_user_tenant_id"())));



CREATE POLICY "tenant_admins_update_neighborhoods" ON "public"."neighborhoods" FOR UPDATE USING ("public"."is_tenant_admin_of_tenant"("tenant_id"));



CREATE POLICY "tenant_admins_update_users" ON "public"."users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "admin_user"
  WHERE (("admin_user"."id" = "auth"."uid"()) AND ("admin_user"."role" = 'tenant_admin'::"text") AND ("admin_user"."tenant_id" = "users"."tenant_id")))));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_privacy_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_mark_as_read" ON "public"."announcement_reads" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("announcement_id" IN ( SELECT "announcements"."id"
   FROM "public"."announcements"
  WHERE (("announcements"."status" = ANY (ARRAY['published'::"public"."announcement_status", 'archived'::"public"."announcement_status"])) AND ("announcements"."tenant_id" IN ( SELECT "users"."tenant_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))))))));



CREATE POLICY "users_own_data" ON "public"."users" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_remove_own_flags" ON "public"."exchange_flags" FOR DELETE USING (("flagged_by" = "auth"."uid"()));



CREATE POLICY "users_update_own_reads" ON "public"."announcement_reads" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_update_own_record" ON "public"."residents" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"())) WITH CHECK (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "users_view_announcement_neighborhoods" ON "public"."announcement_neighborhoods" FOR SELECT USING (("announcement_id" IN ( SELECT "announcements"."id"
   FROM "public"."announcements"
  WHERE (("announcements"."status" = 'published'::"public"."announcement_status") AND ("announcements"."tenant_id" IN ( SELECT "users"."tenant_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"())))))));



CREATE POLICY "users_view_own_reads" ON "public"."announcement_reads" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_record" ON "public"."residents" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."can_view_resident"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_resident"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_resident"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_event_unflagged"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_event_unflagged"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_event_unflagged"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_exchange_listing_unflagged"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_exchange_listing_unflagged"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_exchange_listing_unflagged"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_action_required_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_action_required_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_action_required_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_flag_count"("p_event_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_flag_count"("p_event_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_flag_count"("p_event_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exchange_listing_flag_count"("p_listing_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_full_name"("public"."users") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_full_name"("public"."users") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_full_name"("public"."users") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_sign_in"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_sign_in"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_sign_in"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_user_flagged_event"("p_event_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_user_flagged_event"("p_event_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_user_flagged_event"("p_event_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_user_flagged_exchange_listing"("p_listing_id" "uuid", "p_user_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_check_in_expired"("p_start_time" timestamp with time zone, "p_duration_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_resident_of_tenant"("check_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_resident_of_tenant"("check_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_resident_of_tenant"("check_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_event_flagged"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_event_flagged"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_event_flagged"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_exchange_listing_flagged"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_exchange_listing_flagged"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_exchange_listing_flagged"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exchange_listing_flagged_status"("p_listing_id" "uuid", "p_tenant_id" "uuid", "p_is_flagged" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exchange_listings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_exchange_listings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exchange_listings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exchange_transactions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_exchange_transactions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exchange_transactions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resident_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resident_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resident_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_privacy_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."check_ins" TO "anon";
GRANT ALL ON TABLE "public"."check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."check_ins" TO "service_role";



GRANT ALL ON TABLE "public"."active_check_ins" TO "anon";
GRANT ALL ON TABLE "public"."active_check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."active_check_ins" TO "service_role";



GRANT ALL ON TABLE "public"."announcement_neighborhoods" TO "anon";
GRANT ALL ON TABLE "public"."announcement_neighborhoods" TO "authenticated";
GRANT ALL ON TABLE "public"."announcement_neighborhoods" TO "service_role";



GRANT ALL ON TABLE "public"."announcement_reads" TO "anon";
GRANT ALL ON TABLE "public"."announcement_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."announcement_reads" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."check_in_invites" TO "anon";
GRANT ALL ON TABLE "public"."check_in_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."check_in_invites" TO "service_role";



GRANT ALL ON TABLE "public"."check_in_neighborhoods" TO "anon";
GRANT ALL ON TABLE "public"."check_in_neighborhoods" TO "authenticated";
GRANT ALL ON TABLE "public"."check_in_neighborhoods" TO "service_role";



GRANT ALL ON TABLE "public"."check_in_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."check_in_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."check_in_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."document_changelog" TO "anon";
GRANT ALL ON TABLE "public"."document_changelog" TO "authenticated";
GRANT ALL ON TABLE "public"."document_changelog" TO "service_role";



GRANT ALL ON TABLE "public"."document_reads" TO "anon";
GRANT ALL ON TABLE "public"."document_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."document_reads" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_flags" TO "anon";
GRANT ALL ON TABLE "public"."event_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."event_flags" TO "service_role";



GRANT ALL ON TABLE "public"."event_images" TO "anon";
GRANT ALL ON TABLE "public"."event_images" TO "authenticated";
GRANT ALL ON TABLE "public"."event_images" TO "service_role";



GRANT ALL ON TABLE "public"."event_invites" TO "anon";
GRANT ALL ON TABLE "public"."event_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."event_invites" TO "service_role";



GRANT ALL ON TABLE "public"."event_neighborhoods" TO "anon";
GRANT ALL ON TABLE "public"."event_neighborhoods" TO "authenticated";
GRANT ALL ON TABLE "public"."event_neighborhoods" TO "service_role";



GRANT ALL ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_categories" TO "anon";
GRANT ALL ON TABLE "public"."exchange_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_categories" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_flags" TO "anon";
GRANT ALL ON TABLE "public"."exchange_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_flags" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_images" TO "anon";
GRANT ALL ON TABLE "public"."exchange_images" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_images" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_listings" TO "anon";
GRANT ALL ON TABLE "public"."exchange_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_listings" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_neighborhoods" TO "anon";
GRANT ALL ON TABLE "public"."exchange_neighborhoods" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_neighborhoods" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_transactions" TO "anon";
GRANT ALL ON TABLE "public"."exchange_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."family_relationships" TO "anon";
GRANT ALL ON TABLE "public"."family_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."family_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."family_units" TO "anon";
GRANT ALL ON TABLE "public"."family_units" TO "authenticated";
GRANT ALL ON TABLE "public"."family_units" TO "service_role";



GRANT ALL ON TABLE "public"."interests" TO "anon";
GRANT ALL ON TABLE "public"."interests" TO "authenticated";
GRANT ALL ON TABLE "public"."interests" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."lots" TO "anon";
GRANT ALL ON TABLE "public"."lots" TO "authenticated";
GRANT ALL ON TABLE "public"."lots" TO "service_role";



GRANT ALL ON TABLE "public"."neighbor_list_members" TO "anon";
GRANT ALL ON TABLE "public"."neighbor_list_members" TO "authenticated";
GRANT ALL ON TABLE "public"."neighbor_list_members" TO "service_role";



GRANT ALL ON TABLE "public"."neighbor_lists" TO "anon";
GRANT ALL ON TABLE "public"."neighbor_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."neighbor_lists" TO "service_role";



GRANT ALL ON TABLE "public"."neighborhoods" TO "anon";
GRANT ALL ON TABLE "public"."neighborhoods" TO "authenticated";
GRANT ALL ON TABLE "public"."neighborhoods" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."pets" TO "anon";
GRANT ALL ON TABLE "public"."pets" TO "authenticated";
GRANT ALL ON TABLE "public"."pets" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."resident_interests" TO "anon";
GRANT ALL ON TABLE "public"."resident_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."resident_interests" TO "service_role";



GRANT ALL ON TABLE "public"."resident_requests" TO "anon";
GRANT ALL ON TABLE "public"."resident_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."resident_requests" TO "service_role";



GRANT ALL ON TABLE "public"."resident_skills" TO "anon";
GRANT ALL ON TABLE "public"."resident_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."resident_skills" TO "service_role";



GRANT ALL ON TABLE "public"."residents" TO "anon";
GRANT ALL ON TABLE "public"."residents" TO "authenticated";
GRANT ALL ON TABLE "public"."residents" TO "service_role";



GRANT ALL ON TABLE "public"."saved_events" TO "anon";
GRANT ALL ON TABLE "public"."saved_events" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_events" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "anon";
GRANT ALL ON TABLE "public"."skills" TO "authenticated";
GRANT ALL ON TABLE "public"."skills" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."user_interests" TO "anon";
GRANT ALL ON TABLE "public"."user_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interests" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_skills" TO "anon";
GRANT ALL ON TABLE "public"."user_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."user_skills" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































