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
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- 2. USER_INTERESTS TABLE: Harden RLS (was overly permissive)
-- =============================================================================
-- The existing "Users can manage their own interests" policy uses FOR ALL 
-- with USING(true), allowing any user to modify another user's interest links.
-- Replace with scoped policies.

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
