-- Migration: Allow resident interest creation & harden user_interests RLS
-- Issue: #100 — Resident Interest Creation & Directory Search Fix
-- 
-- Changes:
-- 1. interests: Add INSERT policy for authenticated users
-- 2. user_interests: Replace permissive FOR ALL with scoped INSERT/DELETE policies

-- =============================================================================
-- 1. INTERESTS TABLE: Allow authenticated users to create interests
-- =============================================================================
-- Existing policies:
--   "Users can view interests for their tenant" (SELECT, USING true)
--   "Admins can manage interests" (ALL, USING true)
-- Adding:
--   INSERT policy so residents can create new interests (mirroring skills table)

CREATE POLICY "Users can create interests"
  ON interests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT u.tenant_id FROM users u WHERE u.id = auth.uid()
    )
  );

-- =============================================================================
-- 2. USER_INTERESTS TABLE: Harden RLS
-- =============================================================================
-- The existing "Users can manage their own interests" policy uses FOR ALL
-- with USING(auth.uid() = user_id). Replacing with explicit INSERT/DELETE/SELECT
-- policies provides clearer intent and matches the skills table pattern.

-- Drop old blanket policy
DROP POLICY IF EXISTS "Users can manage their own interests" ON user_interests;

-- Users can only link interests to themselves
CREATE POLICY "Users can insert own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only unlink their own interests
CREATE POLICY "Users can delete own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own interests
CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);
