-- Check the exact schema of the locations table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;
