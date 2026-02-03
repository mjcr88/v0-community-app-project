-- Fix: Allow users to view their own profile so login checks pass
CREATE POLICY "Users can view own profile" 
ON "public"."users" 
FOR SELECT 
TO authenticated 
USING ( (select auth.uid()) = id );
