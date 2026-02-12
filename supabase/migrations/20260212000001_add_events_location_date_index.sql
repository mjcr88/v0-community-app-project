CREATE INDEX IF NOT EXISTS idx_events_location_dates
ON events (location_id, start_date, end_date)
WHERE location_id IS NOT NULL AND status = 'published';
