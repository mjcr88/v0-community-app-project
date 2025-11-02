-- Update specific user to super_admin role
-- User ID: 71702f0a-f562-4a1b-a4a8-28456b78f4a0

UPDATE public.users
SET 
  role = 'super_admin',
  updated_at = now()
WHERE id = '71702f0a-f562-4a1b-a4a8-28456b78f4a0';

-- Verify the update
SELECT id, email, name, role, created_at
FROM public.users
WHERE id = '71702f0a-f562-4a1b-a4a8-28456b78f4a0';
