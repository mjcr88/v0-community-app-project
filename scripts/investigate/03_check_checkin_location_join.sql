-- Simulate the exact query that getActiveCheckIns() runs
SELECT 
  ci.id,
  ci.title,
  ci.location_id,
  ci.location_type,
  ci.custom_location_coordinates,
  -- Try to get location data
  l.id as location_join_id,
  l.name as location_name,
  l.coordinates as location_coordinates,
  l.type as location_type_name,
  -- Check what's NULL
  CASE WHEN ci.location_id IS NULL THEN 'location_id is NULL' ELSE 'location_id exists' END as location_id_status,
  CASE WHEN l.id IS NULL THEN 'location join failed' ELSE 'location joined successfully' END as join_status,
  CASE WHEN l.coordinates IS NULL THEN 'coordinates is NULL' ELSE 'coordinates exists' END as coordinates_status
FROM check_ins ci
LEFT JOIN locations l ON l.id = ci.location_id
WHERE ci.title = 'Working remotely';
