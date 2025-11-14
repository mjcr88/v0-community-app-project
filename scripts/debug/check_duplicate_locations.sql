-- Check for duplicate Espavel Common Area records
SELECT 
  id,
  name,
  type,
  coordinates,
  created_at
FROM locations
WHERE name ILIKE '%espavel%'
ORDER BY name, created_at;

-- Check ALL common areas to see which have coordinates
SELECT 
  id,
  name,
  type,
  coordinates,
  CASE 
    WHEN coordinates IS NULL THEN 'NO COORDINATES'
    ELSE 'HAS COORDINATES'
  END as coord_status
FROM locations
WHERE type = 'common_area'
ORDER BY name;

-- Check what location ID the working community map is using
SELECT 
  id,
  name,
  type,
  coordinates
FROM locations
WHERE type = 'common_area'
  AND coordinates IS NOT NULL
ORDER BY name;
