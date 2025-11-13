-- Check the actual data for the location referenced by your check-in
-- Replace the UUID with the actual location_id from your check-in
SELECT 
  id,
  name,
  type,
  coordinates,
  -- If coordinates field doesn't exist, this will error and we'll know
  -- Also check for alternative field names:
  CASE 
    WHEN coordinates IS NOT NULL THEN 'coordinates exists'
    ELSE 'coordinates is NULL'
  END as coordinate_status
FROM locations
WHERE id = (
  SELECT location_id 
  FROM check_ins 
  WHERE title = 'Working remotely'
  LIMIT 1
);
