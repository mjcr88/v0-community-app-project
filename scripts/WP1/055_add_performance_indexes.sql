-- Add Performance Indexes
-- Run this in Supabase SQL Editor

-- Events
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Users (Residents)
-- Note: Residents are stored in the 'users' table
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Exchange Listings
CREATE INDEX IF NOT EXISTS idx_exchange_listings_tenant_id ON exchange_listings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_created_by ON exchange_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_status ON exchange_listings(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Check-ins
CREATE INDEX IF NOT EXISTS idx_check_ins_tenant_id ON check_ins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_by ON check_ins(created_by);
CREATE INDEX IF NOT EXISTS idx_check_ins_location_id ON check_ins(location_id);
