-- Add RLS policies to allow tenant admins to manage users in their tenant

-- Allow tenant admins to update users in their tenant
CREATE POLICY "tenant_admins_update_users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users AS admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'tenant_admin'
    AND admin_user.tenant_id = users.tenant_id
  )
);

-- Allow tenant admins to delete users in their tenant
CREATE POLICY "tenant_admins_delete_users"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users AS admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'tenant_admin'
    AND admin_user.tenant_id = users.tenant_id
  )
);

-- Allow tenant admins to insert users in their tenant
CREATE POLICY "tenant_admins_insert_users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users AS admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'tenant_admin'
    AND admin_user.tenant_id = users.tenant_id
  )
);
