-- Fix audit log RLS policies to handle Super Admin (tenant_id = null)
DROP POLICY IF EXISTS "System can create audit entries" ON public.audit_log;
DROP POLICY IF EXISTS "Users can view audit logs in own tenant" ON public.audit_log;

-- Create updated RLS policies for audit_log
CREATE POLICY "System can create audit entries" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (
  -- Super admin can create any audit log
  is_super_admin() OR 
  -- Users can create audit logs for their tenant
  can_access_tenant(tenant_id)
);

CREATE POLICY "Users can view audit logs in own tenant" 
ON public.audit_log 
FOR SELECT 
USING (
  -- Super admin can see all audit logs
  is_super_admin() OR 
  -- Users can see audit logs for their tenant
  can_access_tenant(tenant_id)
);