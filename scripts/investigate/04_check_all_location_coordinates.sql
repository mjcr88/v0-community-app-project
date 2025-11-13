-- Check if ANY locations have coordinates
SELECT 
  id,
  name,
  type,
  coordinates,
  CASE 
    WHEN coordinates IS NOT NULL THEN 'HAS COORDS'
    ELSE 'NO COORDS'
  END as status
FROM locations
LIMIT 20;
