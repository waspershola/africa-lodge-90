-- Temporarily create a bypass policy to test if RLS is the issue
-- This will help us isolate whether the problem is JWT claims or something else
CREATE POLICY "Temporary bypass for debugging" 
ON public.tenants 
FOR SELECT 
TO authenticated 
USING (true);

-- Also check if we can query the database directly to verify JWT
-- Let's see what happens when we query with current JWT