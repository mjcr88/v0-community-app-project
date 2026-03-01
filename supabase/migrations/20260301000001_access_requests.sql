-- Migration: access_requests table + feature flag
-- Issue: #99 — Request Access on Login Page

-- 1. Add feature flag to tenants
ALTER TABLE "public"."tenants"
  ADD COLUMN IF NOT EXISTS "access_requests_enabled" boolean DEFAULT true;

COMMENT ON COLUMN "public"."tenants"."access_requests_enabled"
  IS 'Enable/disable the public access request form for this tenant';

-- 2. Create access_requests table
CREATE TABLE IF NOT EXISTS "public"."access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "family_name" "text",
    "lot_id" "uuid",
    "in_costa_rica" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "access_requests_status_check" CHECK (
        "status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])
    )
);

ALTER TABLE "public"."access_requests" OWNER TO "postgres";

COMMENT ON TABLE "public"."access_requests"
  IS 'Stores access requests from prospective residents submitted via public form';

COMMENT ON COLUMN "public"."access_requests"."in_costa_rica"
  IS 'Temporary column: whether requester is currently in Costa Rica (for rollout prioritization)';

COMMENT ON COLUMN "public"."access_requests"."reviewed_by"
  IS 'Admin user who approved or rejected this request';

-- 3. Primary key
ALTER TABLE "public"."access_requests"
  ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id");

-- 4. Foreign keys
ALTER TABLE "public"."access_requests"
  ADD CONSTRAINT "access_requests_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

ALTER TABLE "public"."access_requests"
  ADD CONSTRAINT "access_requests_lot_id_fkey"
  FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;

ALTER TABLE "public"."access_requests"
  ADD CONSTRAINT "access_requests_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX "idx_access_requests_tenant_status_cr"
  ON "public"."access_requests" ("tenant_id", "status", "in_costa_rica");

CREATE UNIQUE INDEX "idx_access_requests_tenant_email_pending"
  ON "public"."access_requests" ("tenant_id", (lower("email")))
  WHERE "status" = 'pending';

-- 6. Enable RLS
ALTER TABLE "public"."access_requests" ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Anonymous INSERT: The API route handles auth/rate-limiting; RLS allows the insert
-- since the route uses service_role which bypasses RLS anyway.
-- We still define policies for defense-in-depth.

-- Admin can read access requests for their tenant
CREATE POLICY "access_requests_admin_select" ON "public"."access_requests"
  FOR SELECT TO authenticated
  USING (
    "tenant_id" IN (
      SELECT "tenant_id" FROM "public"."users"
      WHERE "id" = auth.uid()
        AND ("role" = 'tenant_admin' OR "role" = 'super_admin')
    )
  );

-- Admin can update (approve/reject) access requests for their tenant
CREATE POLICY "access_requests_admin_update" ON "public"."access_requests"
  FOR UPDATE TO authenticated
  USING (
    "tenant_id" IN (
      SELECT "tenant_id" FROM "public"."users"
      WHERE "id" = auth.uid()
        AND ("role" = 'tenant_admin' OR "role" = 'super_admin')
    )
  )
  WITH CHECK (
    "tenant_id" IN (
      SELECT "tenant_id" FROM "public"."users"
      WHERE "id" = auth.uid()
        AND ("role" = 'tenant_admin' OR "role" = 'super_admin')
    )
  );

-- 8. Updated_at trigger (reuse pattern from other tables)
CREATE OR REPLACE FUNCTION "public"."update_access_requests_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_access_requests_updated_at"
  BEFORE UPDATE ON "public"."access_requests"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_access_requests_updated_at"();
