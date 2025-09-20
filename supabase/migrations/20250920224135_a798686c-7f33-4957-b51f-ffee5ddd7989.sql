-- Fix RLS policies for tenants table to allow super admin to view all tenants
DROP POLICY IF EXISTS "Super admin can view all tenants" ON tenants;

CREATE POLICY "Super admin can view all tenants" ON tenants
FOR SELECT
USING (is_super_admin());

-- Ensure owners can view their own tenant
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;

CREATE POLICY "Users can view own tenant" ON tenants  
FOR SELECT
USING (get_user_tenant_id() = tenant_id OR is_super_admin());