-- Migration 050: Clear community boundary coordinates from tenants table
-- This field will be deprecated in favor of boundary-type locations

UPDATE tenants
SET map_boundary_coordinates = NULL
WHERE map_boundary_coordinates IS NOT NULL;
