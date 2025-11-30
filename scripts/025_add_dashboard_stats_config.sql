-- Add dashboard_stats_config column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS dashboard_stats_config JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.dashboard_stats_config IS 'Stores the user-specific configuration for dashboard stats (order, visibility)';
