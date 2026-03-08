-- Migration: Add is_public to resident_requests
-- Description: Allows residents to opt-in to community discussions on their requests.

-- 1. Add the column
ALTER TABLE "public"."resident_requests"
ADD COLUMN "is_public" boolean NOT NULL DEFAULT false;

-- 2. Add comment
COMMENT ON COLUMN "public"."resident_requests"."is_public" IS 'Whether other residents in the community can view and comment on this request';

-- 3. Update existing records based on the old implicit logic (maintenance & safety are public if not anonymous)
UPDATE "public"."resident_requests"
SET "is_public" = true
WHERE "request_type" IN ('maintenance', 'safety') AND "is_anonymous" = false;
