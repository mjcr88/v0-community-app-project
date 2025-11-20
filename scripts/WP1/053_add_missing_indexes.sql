-- WP1: Add Performance and Privacy Indexes
-- Purpose: Add missing indexes for foreign keys, privacy settings, and common query patterns
-- Run this after RLS audit is complete

BEGIN;

-- ============================================================================
-- JUNCTION TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id 
  ON user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id 
  ON user_interests(interest_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id 
  ON user_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id 
  ON user_skills(skill_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_open_to_requests 
  ON user_skills(open_to_requests) WHERE open_to_requests = true;

-- ============================================================================
-- CORE TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_tenant_id 
  ON locations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_locations_type 
  ON locations(type);

CREATE INDEX IF NOT EXISTS idx_locations_neighborhood_id 
  ON locations(neighborhood_id);

CREATE INDEX IF NOT EXISTS idx_events_tenant_id 
  ON events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_events_start_date 
  ON events(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id 
  ON notifications(recipient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id 
  ON notifications(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(is_read) WHERE is_read = false;

-- ============================================================================
-- POLYMORPHIC NOTIFICATION INDEXES (PARTIAL)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_exchange_transaction 
  ON notifications(exchange_transaction_id) 
  WHERE exchange_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_event 
  ON notifications(event_id) 
  WHERE event_id IS NOT NULL;

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_role 
  ON users(tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_events_tenant_date 
  ON events(tenant_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_locations_tenant_type 
  ON locations(tenant_id, type);

-- ============================================================================
-- PRIVACY SETTINGS INDEXES (NEW - FROM VALIDATION)
-- ============================================================================
-- Note: Only create these if user_privacy_settings table exists in your schema
-- If table doesn't exist yet, skip this section

-- Check if table exists first:
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'user_privacy_settings'
-- );

-- If table exists, run these:
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id 
  ON user_privacy_settings(user_id);

-- Note: Only create this index if these columns exist
-- CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_visibility 
--   ON user_privacy_settings(profile_visibility, contact_visibility, location_visibility);

-- ============================================================================
-- CHECK-IN VISIBILITY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_check_ins_visibility_scope 
  ON check_ins(visibility_scope);

CREATE INDEX IF NOT EXISTS idx_check_ins_creator_tenant 
  ON check_ins(created_by, tenant_id);

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify indexes were created:

-- Check all new indexes exist
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Get total index count
SELECT 
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- Check index sizes (should be reasonable, <1GB total)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
