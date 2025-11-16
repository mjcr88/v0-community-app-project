-- Query to check coordinates for specific locations

-- Check "Espavel Common Area"
SELECT 
  id,
  name,
  type,
  coordinates,
  jsonb_typeof(coordinates) as coordinates_type,
  CASE 
    WHEN coordinates IS NULL THEN 'NULL'
    WHEN jsonb_typeof(coordinates) = 'object' THEN 
      'Has data: ' || coordinates::text
    ELSE 'Unknown format'
  END as coordinates_info
FROM locations
WHERE name ILIKE '%espavel%common%'
  OR name ILIKE '%espavel%';

-- Check all common areas in the tenant
SELECT 
  id,
  name,
  type,
  CASE 
    WHEN coordinates IS NULL THEN 'NULL'
    WHEN coordinates IS NOT NULL THEN 'HAS COORDINATES'
  END as has_coords,
  coordinates
FROM locations
WHERE name ILIKE '%common%area%'
ORDER BY name;

-- Check the custom location from the listing "In the woods"
SELECT 
  el.id as listing_id,
  el.title,
  el.custom_location_name,
  el.custom_location_lat,
  el.custom_location_lng,
  el.location_id,
  l.name as community_location_name,
  l.coordinates as community_location_coordinates
FROM exchange_listings el
LEFT JOIN locations l ON el.location_id = l.id
WHERE el.custom_location_name ILIKE '%woods%'
  OR l.name ILIKE '%espavel%'
ORDER BY el.created_at DESC
LIMIT 10;
