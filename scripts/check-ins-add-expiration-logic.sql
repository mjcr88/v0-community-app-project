-- Create a function to check if a check-in is expired
-- This calculates: start_time + duration_minutes < NOW()
CREATE OR REPLACE FUNCTION is_check_in_expired(
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) < NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a view that shows only active (non-expired) check-ins
-- This can be queried instead of the check_ins table directly
CREATE OR REPLACE VIEW active_check_ins AS
SELECT *
FROM check_ins
WHERE status = 'active'
  AND NOT is_check_in_expired(start_time, duration_minutes);

-- Add a computed column helper (optional, for easier queries)
-- Note: This won't persist in the table, just makes queries easier
COMMENT ON FUNCTION is_check_in_expired IS 'Returns true if check-in has passed its end time (start_time + duration_minutes)';
