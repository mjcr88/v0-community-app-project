-- Migration: Allow resident interest creation & harden user_interests RLS
-- Issue: #100 — Resident Interest Creation & Directory Search Fix
-- 
-- Changes:
-- 1. interests: Maintain existing policies (mutations via Server Actions/Service Role)
-- 2. user_interests: Add tenant-scoped SELECT policy for directory features

-- =============================================================================
-- 1. INTERESTS TABLE: Backend-First hardening
-- =============================================================================
-- Existing policies (from clean_schema_final.sql):
--   "Users can view interests for their tenant" (SELECT, USING true)
--   "Admins can manage interests" (ALL, USING true)
-- 
-- Note: Resident creation of interests is handled via Server Actions 
-- using the Service Role key to enforce Backend-First security protocols.
-- No client-side INSERT policy is required or allowed (Zero Policy Breach).

-- =============================================================================
-- 2. USER_INTERESTS TABLE: Harden RLS & Enable Directory Search
-- =============================================================================
-- The existing "Users can manage their own interests" policy uses FOR ALL
-- with USING (auth.uid() = user_id).
-- Under Backend-First architecture, we replace this with:
-- 1. Service Role access for INSERT/DELETE (Server Actions)
-- 2. Scoped SELECT policy allowing users to see interests within their tenant

-- Drop old blanket policy
DROP POLICY IF EXISTS "Users can manage their own interests" ON user_interests;

-- Users can view interests of any neighbor within their same tenant
-- (Required for Directory search, filtering, and popularity counts)
CREATE POLICY "Users can view interests in their tenant"
  ON user_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.tenant_id = u2.tenant_id
      WHERE u1.id = auth.uid()
        AND u2.id = user_interests.user_id
    )
  );

