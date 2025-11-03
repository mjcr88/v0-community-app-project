-- Allow public read access to tenants table for login page
-- This enables unauthenticated users to verify tenant exists before logging in

-- Enable RLS on tenants table if not already enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read basic tenant info (for login page validation)
CREATE POLICY "Allow public read access to tenant basic info"
ON tenants
FOR SELECT
TO anon, authenticated
USING (true);
